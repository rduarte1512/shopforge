import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import {
  activateSubscription,
  getServerPlan,
  isValidSubscriptionTier,
  mapProfileRowToAuthUser,
} from '@/lib/subscription-db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-04-22.dahlia',
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { sessionId } = await request.json();

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Sessão Stripe inválida.' }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY não está configurada.' }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    const sessionUserId = session.client_reference_id ?? session.metadata?.userId;

    if (sessionUserId !== userId) {
      return NextResponse.json({ error: 'Esta sessão não pertence ao utilizador autenticado.' }, { status: 403 });
    }

    if (session.status !== 'complete') {
      return NextResponse.json({ error: 'O checkout ainda não foi concluído.' }, { status: 402 });
    }

    if (!['paid', 'no_payment_required'].includes(session.payment_status)) {
      return NextResponse.json({ error: 'O pagamento ainda não está confirmado.' }, { status: 402 });
    }

    const planId = session.metadata?.planId;

    if (!isValidSubscriptionTier(planId)) {
      return NextResponse.json({ error: 'Plano recebido da Stripe é inválido.' }, { status: 400 });
    }

    const plan = getServerPlan(planId);

    if (!plan || plan.id === 'STARTER') {
      return NextResponse.json({ error: 'Plano recebido da Stripe não pode ser ativado.' }, { status: 400 });
    }

    const clerkUser = await currentUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress ?? clerkUser?.emailAddresses?.[0]?.emailAddress ?? session.customer_details?.email ?? undefined;
    const name = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') || clerkUser?.username || session.customer_details?.name || undefined;

    const profile = await activateSubscription({
      userId,
      email,
      name,
      tier: plan.id,
    });

    return NextResponse.json({
      ok: true,
      plan,
      user: mapProfileRowToAuthUser(profile),
    });
  } catch (error: any) {
    console.error('Stripe confirmation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Não foi possível confirmar o pagamento.' },
      { status: 500 }
    );
  }
}
