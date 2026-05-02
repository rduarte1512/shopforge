import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  // @ts-ignore - Stripe type definitions might be outdated compared to the required version in some environments
  apiVersion: '2026-04-22.dahlia',
});

const CUSTOMER_NAMES = [
  'Ana Silva', 'João Santos', 'Maria Costa', 'Pedro Almeida', 
  'Sofia Oliveira', 'Miguel Rodrigues', 'Beatriz Ferreira', 
  'Tiago Pereira', 'Carolina Gomes', 'Rui Marques',
  'Ricardo Pais', 'Helena Sousa', 'Gabriel Lima', 'Daniela Cruz'
];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function createSimulatedSale() {
  const customerName = getRandomElement(CUSTOMER_NAMES);
  const email = `${customerName.toLowerCase().replace(' ', '.')}@example.com`;
  const amount = getRandomInt(1500, 25000); // €15 a €250

  try {
    const customer = await stripe.customers.create({
      name: customerName,
      email: email,
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'eur',
      customer: customer.id,
      payment_method: 'pm_card_visa',
      description: 'Venda de Teste (Cron)',
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
    });

    return { success: true, customer: customerName, amount: amount / 100, id: paymentIntent.id };
  } catch (error: any) {
    console.error(`❌ Erro ao simular venda:`, error.message);
    return { success: false, error: error.message };
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && searchParams.get('key') !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const numberOfSales = getRandomInt(2, 5);
  const results = [];

  for (let i = 0; i < numberOfSales; i++) {
    results.push(await createSimulatedSale());
  }

  return NextResponse.json({
    message: `Simulação concluída: ${results.filter(r => r.success).length} vendas geradas na Stripe.`,
    results
  });
}
