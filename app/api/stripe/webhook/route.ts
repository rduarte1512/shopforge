import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { activateSubscription, getServerPlan, isValidSubscriptionTier, setSubscriptionStatus } from '@/lib/subscription-db';
import { syncClerkSubscriptionMetadata } from '@/lib/clerk-metadata';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_missing', {
  apiVersion: '2026-04-22.dahlia',
});

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe webhook is not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id || session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (userId && isValidSubscriptionTier(planId) && ['paid', 'no_payment_required'].includes(String(session.payment_status))) {
      const plan = getServerPlan(planId);
      if (plan && plan.id !== 'STARTER') {
        const profile = await activateSubscription({
          userId,
          email: session.customer_details?.email,
          name: session.customer_details?.name,
          tier: plan.id,
        });
        await syncClerkSubscriptionMetadata({
          userId,
          subscriptionTier: profile.subscription_tier,
          subscriptionStatus: profile.subscription_status,
          role: profile.role,
        });
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;
    if (userId) await setSubscriptionStatus(userId, 'expired');
  }

  return NextResponse.json({ received: true });
}
