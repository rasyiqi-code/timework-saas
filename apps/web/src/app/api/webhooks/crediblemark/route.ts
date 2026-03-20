import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, data } = body;

    console.log(`Webhook received: ${event}`, JSON.stringify(data, null, 2));

    if (event === 'subscription.activated') {
      const { email, orderId } = data;

      // Find organization by user email
      const user = await prisma.user.findUnique({
        where: { email },
        include: { organization: true }
      });

      if (user && user.organizationId) {
        await prisma.organization.update({
          where: { id: user.organizationId },
          data: {
            subscriptionStatus: 'ACTIVE',
            subscriptionId: orderId,
          }
        });
        console.log(`✅ Subscription activated for organization: ${user.organizationId} (User: ${email})`);
      } else {
        console.warn(`⚠️ Webhook received for email ${email} but no linked organization found in database.`);
      }
    } else {
        console.log(`ℹ️ Event ${event} received but not handled.`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed', details: (error as Error).message }, { status: 500 });
  }
}
