'use server';

import { prisma } from '@/lib/db';
import { Prisma } from '@repo/database';
import { revalidatePath } from 'next/cache';
import { requireAdmin, getCurrentUser } from '@/actions/auth';

export type ProtocolWithAllowedCreators = Prisma.ProtocolGetPayload<{
  include: {
    allowedCreators: { select: { id: true } },
    _count: { select: { items: true } }
  }
}>;

export async function getProtocols(unrestricted = false): Promise<ProtocolWithAllowedCreators[]> {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) return []; // Or throw

  const protocols = await prisma.protocol.findMany({
    where: { organizationId: user.organizationId }, // Filter by Org
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { items: true },
      },
      allowedCreators: { select: { id: true } } // Include to check permissions
    },
  });

  // Filter based on allowedCreators
  // If unrestricted is true -> Return all (useful for dashboard filters)
  // If allowedCreators is empty -> Everyone can see
  // If populated -> Only those in the list OR Admins can see
  return protocols.filter(p => {
    if (unrestricted) return true;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
    if (p.allowedCreators.length === 0) return true;
    return p.allowedCreators.some(creator => creator.id === user.id);
  });
}

import { ProtocolSchema, ProtocolItemSchema, FormTemplateSchema } from '@/lib/validation';

export async function createProtocol(formData: FormData) {
  const user = await requireAdmin();
  if (!user.organizationId) throw new Error('No Organization selected');

  const rawData = {
    name: formData.get('name'),
    description: formData.get('description'),
    allowedCreatorIds: formData.getAll('allowedCreatorIds').map(String).filter(Boolean),
  };

  const validated = ProtocolSchema.parse({
    name: rawData.name,
    description: rawData.description
  });

  await prisma.protocol.create({
    data: {
      name: validated.name,
      description: validated.description,
      organizationId: user.organizationId,
      allowedCreators: rawData.allowedCreatorIds.length > 0
        ? { connect: rawData.allowedCreatorIds.map(id => ({ id })) }
        : undefined
    },
  });

  revalidatePath('/admin/protocols');
}

export type ProtocolWithDetails = Prisma.ProtocolGetPayload<{
  include: {
    items: {
      include: {
        dependsOn: true;
        requiredBy: true;
        defaultAssignee: true;
        defaultAssignees: true;
        children: {
          include: {
            defaultAssignee: true;
            defaultAssignees: true;
            allowedFileViewers: true;
          }
        };
        allowedFileViewers: true;
      };
    };
  };
}>;

export async function getProtocolById(id: string): Promise<ProtocolWithDetails | null> {
  const user = await getCurrentUser();
  if (!user || !user.organizationId) return null;

  // 1. Fetch Protocol Basic Info
  const protocol = await prisma.protocol.findUnique({
    where: { id, organizationId: user.organizationId }, // Scope by Org
    include: { allowedCreators: true }
  });

  if (!protocol) {
    return null;
  }

  // 2. Fetch All Items (including subtasks via children relation)
  const items = await prisma.protocolItem.findMany({
    where: { protocolId: id },
    include: {
      defaultAssignee: true,
      defaultAssignees: true,
      allowedFileViewers: true,
      children: {
        include: {
          defaultAssignee: true,
          defaultAssignees: true,
          allowedFileViewers: true
        }
      }
    },
    orderBy: [
      { order: 'asc' },
      { title: 'asc' }
    ]
  });

  const itemIds = items.map(i => i.id);

  // 3. Batch Fetch Dependencies (Both directions)
  const [dependsOn, requiredBy] = await Promise.all([
    prisma.protocolDependency.findMany({
      where: { itemId: { in: itemIds } },
    }),
    prisma.protocolDependency.findMany({
      where: { prerequisiteId: { in: itemIds } },
    })
  ]);

  // 4. Stitch Data via Map
  const optimizedItems = items.map(item => {
    return {
      ...item,
      dependsOn: dependsOn.filter(d => d.itemId === item.id),
      requiredBy: requiredBy.filter(d => d.prerequisiteId === item.id)
    };
  });

  return {
    ...protocol,
    items: optimizedItems
  };
}

export async function addProtocolItem(protocolId: string, formData: FormData) {
  const user = await requireAdmin();

  // Verify Ownership
  const protocol = await prisma.protocol.findFirst({
    where: { id: protocolId, organizationId: user.organizationId || '' }
  });
  if (!protocol) throw new Error('Protocol not found or unauthorized');

  const rawData = {
    title: formData.get('title'),
    duration: formData.get('duration'),
    defaultAssigneeId: formData.get('defaultAssigneeId') === "" ? null : formData.get('defaultAssigneeId'),
    defaultAssigneeIds: formData.getAll('defaultAssigneeIds').map(String).filter(Boolean),
    type: formData.get('type'),
    description: formData.get('description'),
    parentId: formData.get('parentId'),
    requireAttachment: formData.get('requireAttachment') === 'true', // Handle checkbox value
    fileAccess: formData.get('fileAccess') || 'PUBLIC',
    allowedFileViewerIds: formData.getAll('allowedFileViewerIds').map(String).filter(Boolean),
    color: formData.get('color')
  };

  const validated = ProtocolItemSchema.parse(rawData);

  // Determine next order
  const lastItem = await prisma.protocolItem.findFirst({
    where: { protocolId },
    orderBy: { order: 'desc' },
    select: { order: true }
  });
  const nextOrder = lastItem ? lastItem.order + 1 : 0;

  await prisma.protocolItem.create({
    data: {
      title: validated.title,
      duration: validated.duration,
      role: 'STAFF',
      protocolId,
      order: nextOrder,
      type: validated.type,
      description: validated.description,
      parentId: validated.parentId,
      requireAttachment: validated.requireAttachment,
      fileAccess: validated.fileAccess,
      defaultAssigneeId: validated.defaultAssigneeId,
      defaultAssignees: validated.defaultAssigneeIds && validated.defaultAssigneeIds.length > 0
        ? { connect: validated.defaultAssigneeIds.map(id => ({ id })) }
        : undefined,
      allowedFileViewers: validated.allowedFileViewerIds && validated.allowedFileViewerIds.length > 0
        ? { connect: validated.allowedFileViewerIds.map(id => ({ id })) }
        : undefined,
      color: validated.color
    }
  });

  revalidatePath(`/admin/protocols/${protocolId}`);
}

// Helper to check for cycles using DFS
async function detectCycle(itemId: string, prerequisiteId: string): Promise<boolean> {
  const item = await prisma.protocolItem.findUnique({
    where: { id: itemId },
    select: { protocolId: true }
  });

  if (!item) return false;

  const protocolItems = await prisma.protocolItem.findMany({
    where: { protocolId: item.protocolId },
    include: { dependsOn: true }
  });

  const graph = new Map<string, string[]>();
  protocolItems.forEach(i => {
    const edges = i.dependsOn.map(d => d.prerequisiteId);
    graph.set(i.id, edges);
  });

  const visited = new Set<string>();
  const stack = [prerequisiteId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === itemId) return true;

    if (!visited.has(current)) {
      visited.add(current);
      const neighbors = graph.get(current) || [];
      for (const neighbor of neighbors) {
        stack.push(neighbor);
      }
    }
  }

  return false;
}

export async function addDependency(itemId: string, prerequisiteId: string) {
  const user = await requireAdmin();

  // Validate Ownership via Protocol
  const item = await prisma.protocolItem.findFirst({
    where: {
      id: itemId,
      protocol: { organizationId: user.organizationId || '' }
    }
  });
  if (!item) throw new Error('Item not found or unauthorized');

  if (itemId === prerequisiteId) {
    throw new Error('Cannot depend on self');
  }

  const isCycle = await detectCycle(itemId, prerequisiteId);
  if (isCycle) {
    throw new Error('Cycle detected: This dependency would create an infinite loop.');
  }

  await prisma.protocolDependency.create({
    data: {
      itemId,
      prerequisiteId,
    },
  });

  revalidatePath(`/admin/protocols/${item.protocolId}`);
}

export async function deleteProtocolDependency(dependencyId: string) {
  const user = await requireAdmin();
  const dep = await prisma.protocolDependency.findFirst({
    where: {
      id: dependencyId,
      item: { protocol: { organizationId: user.organizationId || '' } }
    },
    include: { item: true }
  });

  if (dep) {
    await prisma.protocolDependency.delete({ where: { id: dependencyId } });
    revalidatePath(`/admin/protocols/${dep.item.protocolId}`);
  }
}

export async function deleteProtocolItem(itemId: string) {
  const user = await requireAdmin();
  const item = await prisma.protocolItem.findFirst({
    where: {
      id: itemId,
      protocol: { organizationId: user.organizationId || '' }
    }
  });
  if (!item) return;

  await prisma.protocolItem.delete({ where: { id: itemId } });
  revalidatePath(`/admin/protocols/${item.protocolId}`);
}

export async function deleteProtocol(id: string) {
  const user = await requireAdmin();
  // Ensure protocol belongs to user's org
  const existing = await prisma.protocol.findFirst({
    where: { id, organizationId: user.organizationId || '' }
  });
  if (!existing) throw new Error('Unauthorized or not found');

  await prisma.protocol.delete({ where: { id } });
  revalidatePath('/admin/protocols');
}

export async function updateProtocol(id: string, formData: FormData) {
  const user = await requireAdmin();

  const rawData = {
    name: formData.get('name'),
    description: formData.get('description'),
    allowedCreatorIds: formData.getAll('allowedCreatorIds').map(String).filter(Boolean),
  };

  const validated = ProtocolSchema.parse({
    name: rawData.name,
    description: rawData.description
  });

  // Validate Ownership
  const existing = await prisma.protocol.findFirst({
    where: { id, organizationId: user.organizationId || '' }
  });
  if (!existing) throw new Error('Unauthorized or not found');

  await prisma.protocol.update({
    where: { id },
    data: {
      name: validated.name,
      description: validated.description,
      allowedCreators: {
        set: rawData.allowedCreatorIds.map(uid => ({ id: uid }))
      }
    }
  });

  revalidatePath(`/admin/protocols/${id}`);
}

export async function updateProtocolItem(itemId: string, formData: FormData) {
  const user = await requireAdmin();

  const rawData = {
    title: formData.get('title'),
    duration: formData.get('duration') ? parseInt(formData.get('duration') as string) : 0,
    defaultAssigneeId: formData.get('defaultAssigneeId') === "" ? null : formData.get('defaultAssigneeId'),
    defaultAssigneeIds: formData.getAll('defaultAssigneeIds').map(String).filter(Boolean),
    type: formData.get('type') || 'TASK',
    description: formData.get('description'),
    parentId: formData.get('parentId') || null,
    requireAttachment: formData.get('requireAttachment') === 'true',
    fileAccess: formData.get('fileAccess') || 'PUBLIC',
    allowedFileViewerIds: formData.getAll('allowedFileViewerIds').map(String).filter(Boolean),
    color: formData.get('color'),
    metadata: formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : undefined
  };

  const validated = ProtocolItemSchema.parse(rawData);

  // Verify Ownership
  const item = await prisma.protocolItem.findFirst({
    where: {
      id: itemId,
      protocol: { organizationId: user.organizationId || '' }
    }
  });
  if (!item) throw new Error('Item not found or unauthorized');

  await prisma.protocolItem.update({
    where: { id: itemId },
    data: {
      title: validated.title,
      duration: validated.duration,
      description: validated.description,
      type: validated.type,
      requireAttachment: validated.requireAttachment,
      fileAccess: validated.fileAccess,
      defaultAssigneeId: validated.defaultAssigneeId,
      defaultAssignees: validated.defaultAssigneeIds
        ? { set: validated.defaultAssigneeIds.map(id => ({ id })) }
        : undefined,
      allowedFileViewers: validated.allowedFileViewerIds
        ? { set: validated.allowedFileViewerIds.map(id => ({ id })) }
        : undefined,
      color: validated.color,
      metadata: validated.metadata
    }
  });

  revalidatePath(`/admin/protocols/${item.protocolId}`);
}

export async function moveProtocolItem(itemId: string, direction: 'UP' | 'DOWN') {
  const user = await requireAdmin();

  const item = await prisma.protocolItem.findFirst({
    where: {
      id: itemId,
      protocol: { organizationId: user.organizationId || '' }
    },
    select: { id: true, protocolId: true, order: true }
  });

  if (!item) throw new Error('Item not found or unauthorized');

  // Find adjacent item
  const adjacentItem = await prisma.protocolItem.findFirst({
    where: {
      protocolId: item.protocolId,
      order: direction === 'UP'
        ? { lt: item.order }
        : { gt: item.order }
    },
    orderBy: {
      order: direction === 'UP' ? 'desc' : 'asc'
    }
  });

  if (!adjacentItem) {
    return;
  }

  // Swap orders
  await prisma.$transaction([
    prisma.protocolItem.update({
      where: { id: item.id },
      data: { order: adjacentItem.order }
    }),
    prisma.protocolItem.update({
      where: { id: adjacentItem.id },
      data: { order: item.order }
    })
  ]);

  revalidatePath(`/admin/protocols/${item.protocolId}`);
}

export async function reorderProtocolItems(protocolId: string, newOrderIds: string[]) {
  const user = await requireAdmin();

  // Validate Protocol Ownership
  const protocol = await prisma.protocol.findFirst({
    where: { id: protocolId, organizationId: user.organizationId || '' }
  });
  if (!protocol) throw new Error('Protocol not found or unauthorized');

  // Validate all items belong to this protocol (Implicitly checks ownership if protocol is owned)
  // Actually, for maximum security, we should check items. But checking protocol is good enough as items are scoped to protocol.
  // HOWEVER, a user could theoretically pass OrderIds from another protocol?
  // Prisma update { where: { id } } will work globally.
  // We MUST ensure the IDs in `newOrderIds` actually belong to `protocolId`.

  const count = await prisma.protocolItem.count({
    where: {
      id: { in: newOrderIds },
      protocolId: protocolId
    }
  });

  if (count !== newOrderIds.length) {
    throw new Error('Invalid Item IDs provided for reorder');
  }

  const moves = newOrderIds.map((id, index) =>
    prisma.protocolItem.update({
      where: { id },
      data: { order: index }
    })
  );

  await prisma.$transaction(moves);
  revalidatePath(`/admin/protocols/${protocolId}`);
}

export async function updateProtocolForm(protocolId: string, formFields: unknown[], titleFormat?: string | null) {
  const user = await requireAdmin();

  // Validate Ownership
  const protocol = await prisma.protocol.findFirst({
    where: { id: protocolId, organizationId: user.organizationId || '' }
  });
  if (!protocol) throw new Error('Unauthorized or not found');

  // Validate Input
  const validated = FormTemplateSchema.parse({ fields: formFields });

  await prisma.protocol.update({
    where: { id: protocolId },
    data: {
      formFields: validated.fields as Prisma.InputJsonValue,
      titleFormat: titleFormat
    }
  });

  revalidatePath(`/admin/protocols/${protocolId}`);
}

import type { ProtocolGenerationData } from '@/lib/ai-schema';

export async function createProtocolFromAI(data: ProtocolGenerationData) {
  const user = await requireAdmin();
  if (!user.organizationId) throw new Error('No Organization selected');

  // 1. Create the Protocol
  const protocol = await prisma.protocol.create({
    data: {
      name: data.protocolName,
      description: data.protocolDescription || '',
      organizationId: user.organizationId,
      allowedCreators: { connect: [{ id: user.id }] }, // Allow the creator to use it immediately
      formFields: data.formFields ? (data.formFields as Prisma.InputJsonValue) : undefined,
      titleFormat: data.titleFormat || undefined
    }
  });

  const protocolId = protocol.id;
  const idMap = new Map<string, string>(); // Maps AI temporary ID to real DB UUID

  // 2. Create all items first to generate their real UUIDs
  for (let i = 0; i < data.items.length; i++) {
    const aiItem = data.items[i];
    const createdItem = await prisma.protocolItem.create({
      data: {
        protocolId,
        title: aiItem.title,
        description: aiItem.description,
        type: aiItem.type as import('@repo/database').ProtocolItemType,
        color: aiItem.color,
        requireAttachment: aiItem.requireAttachment,
        order: i,
        role: 'STAFF', 
      }
    });
    idMap.set(aiItem.id, createdItem.id);
  }

  // 3. Establish dependencies and parent-child relationships
  for (const aiItem of data.items) {
    const realId = idMap.get(aiItem.id);
    if (!realId) continue;

    // Set parentId if it was in a group
    if (aiItem.parentId && idMap.has(aiItem.parentId)) {
      await prisma.protocolItem.update({
        where: { id: realId },
        data: { parentId: idMap.get(aiItem.parentId) }
      });
    }

    // Create dependencies
    if (aiItem.dependencies && aiItem.dependencies.length > 0) {
      const depPromises = aiItem.dependencies.map(depId => {
        const realDepId = idMap.get(depId);
        if (!realDepId) return null;
        return prisma.protocolDependency.create({
          data: {
            itemId: realId,
            prerequisiteId: realDepId
          }
        });
      });

      await Promise.all(depPromises.filter(Boolean));
    }
  }

  revalidatePath('/admin/protocols');
  return { success: true, protocolId };
}
