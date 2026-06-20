import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import {
  ensureProfileFromAuth,
  getCheckoutAmountCents,
  getServerPlan,
  normalizeBillingCycle,
} from '@/lib/subscription-db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_missing', {
  apiVersion: '2026-04-22.dahlia',
});

type CheckoutPaymentMethod = 'card' | 'paypal' | 'revolut';

function normalizePaymentMethod(value: unknown): CheckoutPaymentMethod {
  if (value === 'paypal' || value === 'revolut') return value;
  return 'card';
}

function getPaymentMethodTypes(paymentMethod: CheckoutPaymentMethod) {
  if (paymentMethod === 'paypal') return ['paypal'];
  if (paymentMethod === 'revolut') return ['revolut_pay'];
  return ['card'];
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Precisa de iniciar sessão para subscrever um plano.' }, { status: 401 });
    }

    const { planId, interval, paymentMethod } = await request.json();
    const plan = getServerPlan(planId);
    const billingCycle = normalizeBillingCycle(interval);
    const selectedPaymentMethod = normalizePaymentMethod(paymentMethod);

    if (!plan || plan.id === 'STARTER') {
      return NextResponse.json({ error: 'Plano inválido para checkout.' }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY não está configurada.' }, { status: 500 });
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress ?? clerkUser?.emailAddresses?.[0]?.emailAddress ?? undefined;
    const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || clerkUser?.username || undefined;

    await ensureProfileFromAuth({ userId, email, name });

    const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const amountCents = getCheckoutAmountCents(plan, billingCycle);
    const stripeInterval = billingCycle === 'yearly' ? 'year' : 'month';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      client_reference_id: userId,
      payment_method_types: getPaymentMethodTypes(selectedPaymentMethod) as any,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: amountCents,
            recurring: {
              interval: stripeInterval,
            },
            product_data: {
              name: `ShopForge ${plan.name}`,
              description: `${plan.description} Pagamento ${billingCycle === 'yearly' ? 'anual' : 'mensal'}.`,
            },
          },
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      metadata: {
        userId,
        planId: plan.id,
        planName: plan.name,
        billingCycle,
        selectedPaymentMethod,
      },
      subscription_data: {
        metadata: {
          userId,
          planId: plan.id,
          planName: plan.name,
          billingCycle,
        },
      },
      success_url: `${origin}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan.id}`,
      cancel_url: `${origin}/dashboard/subscription/checkout?plan=${plan.id}&billing=${billingCycle}`,
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao criar checkout Stripe.' }, { status: 500 });
  }
}
