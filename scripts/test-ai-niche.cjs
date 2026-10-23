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
  const context = {
    exports: {},
    console: { error: () => {}, warn: () => {} },
    process: { env: { GEMINI_API_KEY: 'mock-not-a-real-key' } },
    require: (id) => {
      if (id !== '@google/generative-ai') throw new Error('Unexpected import ' + id);
      return {
        GoogleGenerativeAI: class {
          getGenerativeModel() {
            return {
              generateContent: async (prompt) => {
                captured.push(String(prompt));
                const chosen = outputs[Math.min(captured.length - 1, outputs.length - 1)];
                return { response: { text: () => JSON.stringify(chosen) } };
              },
            };
          }
        }
      };
    },
  };
  vm.runInNewContext(compiled, context, { filename: 'ai-actions.ts', timeout: 3000 });
  return { api: context.exports, captured };
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

  process.stdout.write('PASS: pesca, rejeição de café, nichos novos e loja sem produtos.\n');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
