'use server';

import { getCurrentUser } from './auth';
import { checkSubscription } from '@/lib/crediblemark';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function syncSubscriptionAction() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.email || !user.organizationId) {
      return { error: 'Not authenticated' };
    }

    const result = await checkSubscription(user.email);
    
    // Update database based on check results
    const status = result.active ? 'ACTIVE' : (user.organization?.subscriptionStatus === 'ACTIVE' ? 'EXPIRED' : user.organization?.subscriptionStatus || 'TRIAL');
    
    await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        subscriptionStatus: status,
        planName: result.productName || null,
        subscriptionPrice: result.price || null,
        subscriptionCurrency: result.currency || null,
        subscriptionInterval: result.interval || null,
        subscriptionEndsAt: result.expiresAt ? new Date(result.expiresAt) : null,
      }
    });

    revalidatePath('/billing');
    return { success: true, status, details: result };
  } catch (error) {
    console.error('Sync error:', error);
    return { error: 'Failed to sync subscription' };
  }
}
