import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
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
  'Tiago Pereira', 'Carolina Gomes', 'Rui Marques',
  'Carlos Martins', 'Inês Fernandes', 'Rui Ribeiro', 'Marta Carvalho'
];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function GET(request: Request) {
  try {
    // 1. Verificar no Stripe se o "Interruptor" está ligado
    // Procuramos um Produto com o nome exato "Simulador Switch"
    const products = await stripe.products.search({
      query: 'name:"Simulador Switch"',
      limit: 1,
    });

    // Se o produto não existir, ou se existir mas estiver "Arquivado" (active: false), não geramos vendas
    if (products.data.length === 0 || !products.data[0].active) {
      return NextResponse.json({ 
        status: 'stopped', 
        message: 'O simulador está parado. Para ativar, crie um Produto no Stripe chamado "Simulador Switch" e garanta que está "Ativo". Para parar, basta Arquivar o produto.' 
      });
    }

    // 2. Se o interruptor estiver ligado, gerar entre 5 e 20 vendas
    const numberOfSales = getRandomInt(5, 20);
    
    // Gerar as vendas em paralelo para respeitar o tempo limite de execução (timeout)
    const salePromises = Array.from({ length: numberOfSales }).map(async () => {
      const plan = getRandomElement(PLANS.filter(p => p.price > 0));
      const customerName = getRandomElement(CUSTOMER_NAMES);
      const email = `${customerName.toLowerCase().replace(/ /g, '.')}@example.com`;

      const customer = await stripe.customers.create({
        name: customerName,
        email: email,
        description: 'Cliente Simulado (Cloud)',
      });

      const paymentIntent = await stripe.paymentIntents.create({
        amount: plan.price * 100, // cêntimos
        currency: 'eur',
        customer: customer.id,
        payment_method: 'pm_card_visa', // Cartão de teste que aprova sempre
        description: `Subscrição Simulada - Plano ${plan.name}`,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
      });

      return { customerName, plan: plan.name, amount: plan.price, paymentIntentId: paymentIntent.id };
    });

    const sales = await Promise.all(salePromises);

    return NextResponse.json({ 
      status: 'success', 
      message: `Simulação ativa! ${numberOfSales} vendas foram criadas com sucesso.`,
      sales 
    });

  } catch (error: any) {
    console.error('Erro no cron job:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}
