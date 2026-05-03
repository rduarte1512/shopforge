const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

// Tentar carregar variáveis de ambiente do .env.local
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) return;
      
      const match = trimmedLine.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  // Silencioso
}

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51TSemzKHEPeRm4mFStz2UUW6nbXuZn8ISM40ursIwDCgHS9tv2FKLqzXqN9L8XyJ6aREAno9j3wKSFtKixXlCg1D005AZS3B1N';

if (!stripeKey) {
  console.error('ERRO: STRIPE_SECRET_KEY não encontrada.');
  process.exit(1);
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2026-04-22.dahlia',
});

const CUSTOMER_NAMES = [
  'Ana Silva', 'João Santos', 'Maria Costa', 'Pedro Almeida', 
  'Sofia Oliveira', 'Miguel Rodrigues', 'Beatriz Ferreira', 
  'Tiago Pereira', 'Carolina Gomes', 'Rui Marques',
  'Ricardo Pais', 'Helena Sousa', 'Gabriel Lima', 'Daniela Cruz'
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function createStripeSale() {
  const customerName = getRandomElement(CUSTOMER_NAMES);
  const email = `${customerName.toLowerCase().replace(' ', '.')}@example.com`;
  
  // Valor aleatório entre €15 e €250
  const amount = getRandomInt(1500, 25000);

  try {
    const customer = await stripe.customers.create({
      name: customerName,
      email: email,
    });

    await stripe.paymentIntents.create({
      amount: amount,
      currency: 'eur',
      customer: customer.id,
      payment_method: 'pm_card_visa',
      description: 'Venda de Teste (Simulador)',
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    });

    console.log(`✅ Stripe: €${(amount / 100).toFixed(2)} - ${customerName}`);
  } catch (error) {
    console.error(`❌ Erro Stripe (${customerName}):`, error.message);
  }
}

async function simulateSalesBatch() {
  const numberOfSales = getRandomInt(3, 15);
  console.log(`\n[${new Date().toLocaleTimeString()}] 🚀 Gerando lote de ${numberOfSales} vendas...`);
  
  for (let i = 0; i < numberOfSales; i++) {
    await createStripeSale();
    // Pequeno atraso entre vendas para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  
  console.log(`--- Lote finalizado. Próximo em 15 min. ---`);
}

async function run() {
  // Executa o primeiro lote imediatamente
  await simulateSalesBatch();
  
  // Se estiver rodando no GitHub Actions, finaliza após o primeiro lote
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.log('\n✅ Simulação concluída no GitHub Actions.');
    process.exit(0);
  }
  
  // Configura o intervalo de 15 minutos
  const INTERVAL_MS = 15 * 60 * 1000;
  setInterval(simulateSalesBatch, INTERVAL_MS);
  
  console.log('\n🌟 Simulador de Vendas Stripe Ativo!');
  console.log('Frequência: 3-15 vendas a cada 15 minutos.');
}

run();
