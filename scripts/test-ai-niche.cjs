/* Regression checks for ShopForge product niche generation.
 * Runs against the real TypeScript source with a mocked Gemini SDK.
 * No network calls or real API keys are needed.
 */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');

const source = fs.readFileSync(require('node:path').join(__dirname, '../lib/ai-actions.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
}).outputText;

const product = (name, category) => ({
  name, category, price: 29.9, stock: 12, description: name, imageKeyword: name,
});
const fishing = [
  product('Cana de pesca Spinning 2,40 m', 'Canas de pesca'),
  product('Carreto Spinning 4000', 'Carretos'),
  product('Anzóis de pesca resistentes', 'Acessórios de pesca'),
  product('Linha de pesca fluorocarbono', 'Linhas de pesca'),
];
const coffee = [
  product('Café Arábica Especial', 'Café'),
  product('Café Espresso Torrado', 'Café'),
  product('Chá Verde Premium', 'Bebidas'),
  product('Cookie de Café', 'Café'),
];
const backpacks = [
  product('Mochila de Montanha 30L', 'Mochilas'),
  product('Mochila de Caminhada 45L', 'Mochilas'),
  product('Mochila Impermeável 20L', 'Mochilas'),
  product('Mochila Compacta de Trilho', 'Mochilas'),
];

function loadWithGeminiOutputs(outputs) {
  const captured = [];
  const models = [];
  const context = {
    exports: {},
    console: { error: () => {}, warn: () => {} },
    process: { env: { GEMINI_API_KEY: 'mock-not-a-real-key' } },
    require: (id) => {
      if (id === './ai-designer-engine') return { planLocalDesignerEdit: () => null, applyDesignerOperations: () => ({config:{}, changes:[]}) };
      if (id !== '@google/generative-ai') throw new Error('Unexpected import ' + id);
      return {
        GoogleGenerativeAI: class {
          getGenerativeModel(options) {
            return {
              generateContent: async (prompt) => {
                captured.push(String(prompt));
                models.push(options.model);
                const chosen = outputs[Math.min(captured.length - 1, outputs.length - 1)];
                if (chosen && chosen.__error) {
                  throw Object.assign(new Error(chosen.__error), { status: chosen.status });
                }
                return { response: { text: () => JSON.stringify(chosen) } };
              },
            };
          }
        }
      };
    },
  };
  vm.runInNewContext(compiled, context, { filename: 'ai-actions.ts', timeout: 3000 });
  return { api: context.exports, captured, models };
}

async function main() {
  const good = loadWithGeminiOutputs([fishing]);
  const generated = await good.api.generateMultipleProducts('Cria uma loja de canas de pesca', 4);
  assert.equal(generated.length, 4);
  assert.equal(generated[0].name, fishing[0].name);
  assert.match(good.captured[0], /Setor identificado: equipamento de pesca/);

  const rejected = loadWithGeminiOutputs([coffee, coffee]);
  await assert.rejects(
    () => rejected.api.generateMultipleProducts('Cria uma loja de canas de pesca', 4),
    /Não foi possível gerar produtos corretos/
  );
  assert.equal(rejected.captured.length, 2);

  const custom = loadWithGeminiOutputs([backpacks]);
  const result = await custom.api.generateMultipleProducts('Cria uma loja de mochilas para caminhadas', 4);
  assert.equal(result.length, 4);
  assert.match(custom.captured[0], /Setor identificado: mochilas para caminhadas/);
  assert.doesNotMatch(custom.captured[0], /Setor identificado: café boutique/);

  const store = loadWithGeminiOutputs([{
    name: 'Pesca Azul', domain: 'pesca-azul', description: 'Equipamento de pesca',
    theme: 'light', primaryColor: '#007970', products: coffee,
    customization: { sections: [{ id: 'hero', type: 'hero', content: { title: 'Pesca Azul', subtitle: 'Canas e carretos' } }] },
  }]);
  const proposal = await store.api.generateStoreConfig('Cria um site de canas de pesca', false);
  assert.equal(proposal.products.length, 0);
  assert.equal(proposal.name, 'Pesca Azul');


  const busy = { __error: '503 Service Unavailable - This model is currently experiencing high demand', status: 503 };
  const failover = loadWithGeminiOutputs([busy, fishing]);
  const recovered = await failover.api.generateMultipleProductsForStore('Cria uma loja de canas de pesca', 4);
  assert.equal(recovered.ok, true);
  assert.equal(recovered.products.length, 4);
  assert.deepEqual(failover.models, ['gemini-2.5-flash', 'gemini-2.5-flash-lite']);

  const unavailable = loadWithGeminiOutputs([busy, busy]);
  const unavailableResponse = await unavailable.api.generateMultipleProductsForStore('Cria uma loja de canas de pesca', 4);
  assert.equal(unavailableResponse.ok, false);
  assert.match(unavailableResponse.error, /temporariamente sobrecarregado/);
  assert.equal(unavailableResponse.products, undefined);
  assert.doesNotMatch(unavailableResponse.error, /GoogleGenerativeAI|Service Unavailable/);

  const quota = loadWithGeminiOutputs([{ __error: '429 quota exceeded', status: 429 }, fishing]);
  const quotaResponse = await quota.api.generateMultipleProductsForStore('Cria uma loja de canas de pesca', 4);
  assert.equal(quotaResponse.ok, false);
  assert.match(quotaResponse.error, /limite de pedidos/);
  assert.equal(quota.captured.length, 1);

  process.stdout.write('PASS: pesca, rejeição de café, nichos novos, Gemini 503 com failover e erro seguro no formulário.\\n');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
