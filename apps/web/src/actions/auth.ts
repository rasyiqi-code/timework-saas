'use server';

import { prisma } from '@/lib/db';
import { stackServerApp } from '@/stack';




import { cache } from 'react';

// ... existing imports ...

// Internal implementation
// Internal implementation
const getCurrentUserImpl = async () => {
    // 1. Get Stack User
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) return null;

    const email = stackUser.primaryEmail;
    if (!email) return null;

    // 2. Determine Expected Role & Org ID
    const selectedTeam = stackUser.selectedTeam;
    let expectedRole: 'STAFF' | 'ADMIN' | 'SUPER_ADMIN' = 'STAFF';
    const expectedOrganizationId = selectedTeam?.id || null;

    // Determine Role
    if (selectedTeam) {
        try {
            const permissions = await stackUser.listPermissions(selectedTeam);
            const hasAdminPermission = permissions.some(p =>
                p.id === 'update_team' ||
                p.id.includes('delete') ||
                p.id.includes('manage') ||
                p.id === 'admin'
            );
            if (hasAdminPermission) expectedRole = 'ADMIN';
        } catch (e) {
            console.warn("Auth: Failed to check Stack permissions", e);
        }
    }

    // Super Admin Check
    if (process.env.SUPER_ADMIN_EMAIL && email === process.env.SUPER_ADMIN_EMAIL) {
        expectedRole = 'SUPER_ADMIN';
    }

    try {
        // 3. Sync Organization if needed (Must be first for FK integrity)
        if (selectedTeam) {
            const org = await prisma.organization.upsert({
                where: { id: selectedTeam.id },
                create: {
                    id: selectedTeam.id,
                    name: selectedTeam.displayName || 'Organization',
                    slug: ('slug' in selectedTeam ? (selectedTeam as { slug?: string }).slug : undefined) || undefined,
                    trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
                    subscriptionStatus: 'TRIAL'
                },
                update: {
                    name: selectedTeam.displayName || 'Organization'
                }
            });

            // If trial ended and not active, verify with Crediblemark
            if (org.subscriptionStatus === 'TRIAL' && org.trialEndsAt < new Date()) {
                const { checkSubscription } = await import('@/lib/crediblemark');
                const isActive = await checkSubscription(email);
                if (isActive) {
                    await prisma.organization.update({
                        where: { id: org.id },
                        data: { subscriptionStatus: 'ACTIVE' }
                    });
                } else {
                    await prisma.organization.update({
                        where: { id: org.id },
                        data: { subscriptionStatus: 'EXPIRED' }
                    });
                }
            }
        }

        // 4. Atomic User Sync
        const finalDbUser = await prisma.user.upsert({
            where: { email },
            update: {
                organizationId: expectedOrganizationId,
                role: expectedRole,
                name: stackUser.displayName || email.split('@')[0],
            },
            create: {
                email,
                name: stackUser.displayName || email.split('@')[0],
                role: expectedRole,
                organizationId: expectedOrganizationId
            },
            include: { 
                organization: true,
                memberships: {
                    where: { organizationId: expectedOrganizationId || '' }
                }
            }
        });

        // 5. Sync Membership (Persistent Record)
        if (expectedOrganizationId && finalDbUser) {
            await prisma.organizationMember.upsert({
                where: {
                    userId_organizationId: {
                        userId: finalDbUser.id,
                        organizationId: expectedOrganizationId
                    }
                },
                create: {
                    userId: finalDbUser.id,
                    organizationId: expectedOrganizationId,
                    role: expectedRole
                },
                update: {
                    role: expectedRole
                }
            });
        }

        return finalDbUser;
    } catch (error) {
        console.error('Auth: Error syncing user', error);
        return null;
    }
};

// Cached version for Request Memoization
const getCurrentUserCached = cache(getCurrentUserImpl);

export async function getCurrentUser() {
    return getCurrentUserCached();
}

export async function requireAdmin() {
    const user = await getCurrentUser();

    // Check if user exists and has ADMIN role
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        // In a real app we might redirect to a friendly "Unauthorized" page
        throw new Error('Unauthorized: Admin access required');
    }
    return user;
}

export async function requireSuperAdmin() {
    const user = await getCurrentUser();

    if (!user || user.role !== 'SUPER_ADMIN') {
        throw new Error('Unauthorized: Super Admin access required');
    }
    return user;
}
