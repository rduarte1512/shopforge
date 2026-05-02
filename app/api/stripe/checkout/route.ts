import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(request: Request) {
  try {
    const { planId, price, planName, interval } = await request.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Plano ${planName}`,
              description: `Subscrição ${interval === 'yearly' ? 'Anual' : 'Mensal'} do plano ${planName}`,
            },
            unit_amount: price * 100, // Stripe expects amounts in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // using payment for simulation, for subscriptions it would be 'subscription'
      success_url: `${request.headers.get('origin')}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
      cancel_url: `${request.headers.get('origin')}/dashboard/subscription/checkout?plan=${planId}`,
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
