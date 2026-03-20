import { getCurrentUser } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { BillingContent } from './BillingContent';

export default async function BillingPage() {
    const user = await getCurrentUser();
    
    if (!user || !user.organizationId) {
        redirect('/handler/sign-in');
    }

    const { prisma } = await import('@/lib/db');
    const org = await prisma.organization.findUnique({
        where: { id: user.organizationId }
    });

    if (!org) {
        return <div className="p-10 text-center text-slate-500">Organization not found.</div>;
    }

    // Serialize dates for client component
    const serializedOrg = {
        ...org,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
        trialEndsAt: org.trialEndsAt.toISOString(),
        subscriptionEndsAt: org.subscriptionEndsAt?.toISOString() || null,
    };

    return <BillingContent user={user} org={serializedOrg} />;
}
