const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

// Tentar carregar variáveis de ambiente do .env.local
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remover aspas caso existam
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
} catch (e) {
  console.log('Aviso: Ficheiro .env.local não encontrado ou sem acesso.');
}

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51TSemzKHEPeRm4mFStz2UUW6nbXuZn8ISM40ursIwDCgHS9tv2FKLqzXqN9L8XyJ6aREAno9j3wKSFtKixXlCg1D005AZS3B1N';

if (!stripeKey) {
  console.error('ERRO: STRIPE_SECRET_KEY não encontrada.');
  process.exit(1);
}

const stripe = new Stripe(stripeKey, {
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

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function createSimulatedSale() {
  const plan = getRandomElement(PLANS.filter(p => p.price > 0)); // Evitar plano grátis
  const customerName = getRandomElement(CUSTOMER_NAMES);
  const email = `${customerName.toLowerCase().replace(' ', '.')}@example.com`;

  try {
    // Passo 1: Criar um cliente
    const customer = await stripe.customers.create({
      name: customerName,
      email: email,
      description: 'Cliente Simulado',
    });

    // Passo 2: Criar e confirmar um PaymentIntent com cartão de teste aprovado
    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.price * 100, // em cêntimos
      currency: 'eur',
      customer: customer.id,
      payment_method: 'pm_card_visa', // Método de teste Stripe (Succeeds)
      description: `Subscrição Simulada - Plano ${plan.name}`,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
    });

    console.log(`✅ Venda simulada gerada: ${customerName} comprou ${plan.name} (€${plan.price}) - ID: ${paymentIntent.id}`);
  } catch (error) {
    console.error(`❌ Erro ao simular venda para ${customerName}:`, error.message);
  }
}

async function simulateSalesBatch() {
  const numberOfSales = getRandomInt(5, 20);
  console.log(`\n--- A iniciar lote de ${numberOfSales} vendas simuladas às ${new Date().toLocaleTimeString()} ---`);
  
  const promises = [];
  for (let i = 0; i < numberOfSales; i++) {
    // Pequeno atraso entre criações para não sobrecarregar a API no mesmo milissegundo
    const delay = i * 500;
    promises.push(
      new Promise(resolve => setTimeout(() => resolve(createSimulatedSale()), delay))
    );
  }
  
  await Promise.all(promises);
  console.log(`--- Lote terminado. Próximo lote em 5 minutos. ---\n`);
}

// Executar o primeiro lote imediatamente
simulateSalesBatch();

// Configurar intervalo para executar a cada 5 minutos (300000 ms)
const INTERVAL_MS = 5 * 60 * 1000;
const intervalId = setInterval(simulateSalesBatch, INTERVAL_MS);

console.log('🚀 Simulador de Vendas Stripe Ativo!');
console.log('Pode parar a simulação a qualquer momento pressionando Ctrl+C');

// Para garantir que o processo encerra de forma limpa quando necessário
process.on('SIGINT', () => {
  console.log('\n🛑 A parar o simulador de vendas...');
  clearInterval(intervalId);
  process.exit(0);
});
