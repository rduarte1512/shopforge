import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

const PLANS = [
  { name: 'Starter', price: 0 },
  { name: 'Growth', price: 19 },
  { name: 'Professional', price: 49 },
  { name: 'Business', price: 99 },
  { name: 'Enterprise', price: 249 }
];

const CUSTOMER_NAMES = [
  'Ana Silva', 'João Santos', 'Maria Costa', 'Pedro Almeida', 
  'Sofia Oliveira', 'Miguel Rodrigues', 'Beatriz Ferreira', 
  'Tiago Pereira', 'Carolina Gomes', 'Rui Marques'
];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function createSimulatedSale() {
  const plan = getRandomElement(PLANS.filter(p => p.price > 0));
  const customerName = getRandomElement(CUSTOMER_NAMES);
  const email = `${customerName.toLowerCase().replace(' ', '.')}@example.com`;

  try {
    const customer = await stripe.customers.create({
      name: customerName,
      email: email,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.price * 100,
      currency: 'eur',
      customer: customer.id,
      payment_method: 'pm_card_visa',
      description: plan.name,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
    });

    return { success: true, customer: customerName, plan: plan.name, id: paymentIntent.id };
  } catch (error: any) {
    console.error(`❌ Erro ao simular venda:`, error.message);
    return { success: false, error: error.message };
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Verificação de segurança simples para evitar que qualquer pessoa dispare vendas
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Se houver um CRON_SECRET definido no .env, validar contra o header ou query param
  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && searchParams.get('key') !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const numberOfSales = getRandomInt(1, 3); // Reduzi para 1-3 por chamada para ser mais rápido na API
  const results = [];

  for (let i = 0; i < numberOfSales; i++) {
    results.push(await createSimulatedSale());
  }

  return NextResponse.json({
    message: `Simulação concluída: ${results.filter(r => r.success).length} vendas geradas.`,
    results
  });
}
