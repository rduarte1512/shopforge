/* ForgePilot Missions and Copilot: offline regression tests. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');

function compile(file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const output = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const errors = (output.diagnostics || []).filter(entry => entry.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, file + ': ' + errors.map(e => ts.flattenDiagnosticMessageText(e.messageText, '\n')).join('; '));
  return output.outputText;
}
const pure = { exports: {}, console, Date };
vm.runInNewContext(compile('lib/forgepilot-engine.ts'), pure, { filename: 'lib/forgepilot-engine.ts' });
const missions = { exports: {}, console, Date };
vm.runInNewContext(compile('lib/forgepilot-missions.ts'), missions, { filename: 'lib/forgepilot-missions.ts' });
for (const file of ['lib/forgepilot-copilot-actions.ts', 'components/dashboard/ForgePilotCopilot.tsx', 'components/dashboard/ForgePilotClient.tsx']) compile(file);

const { auditStore, applyImprovement } = pure.exports;
const { planForgePilotMission, detectForgePilotMission, isForgePilotMissionId, forgePilotAuditDimensions } = missions.exports;
const store = {
  name: 'Pesca Atlântica',
  description: 'Canas de pesca, carretos e acessórios para pescadores em Portugal.',
  customization: {
    layoutEngine: 'adaptive-v1',
    colors: { background: '#ffffff', text: '#111827' },
    sections: [
      { id: 'hero', type: 'hero', content: { title: 'Pesca Atlântica', subtitle: 'Equipamento para a pesca', buttonText: 'Comprar' } },
      { id: 'products', type: 'products', content: { title: 'Canas de pesca' } },
    ],
  },
};
const products = [
  { name: 'Cana de pesca', category: 'Pesca', image_url: 'https://example.com/cana.jpg', price: 29 },
  { name: 'Carreto', category: 'Pesca', image_url: 'https://example.com/carreto.jpg', price: 18 },
  { name: 'Anzóis', category: 'Pesca', image_url: 'https://example.com/anzol.jpg', price: 5 },
];
const audit = auditStore(store, products, []);
assert.equal(detectForgePilotMission('Preciso de mais visitantes e analytics'), 'traffic');
assert.equal(detectForgePilotMission('Melhorar o aspeto do design'), 'design');
assert.equal(detectForgePilotMission('Como melhorar fotografias de produtos?'), 'catalog');
assert.equal(detectForgePilotMission('Quero vender melhor'), 'conversion');
assert.equal(isForgePilotMissionId('evil-script'), false);
assert.equal(isForgePilotMissionId('conversion'), true);
const initial = planForgePilotMission('conversion', audit);
assert(initial.steps.some(step => step.id === 'trust-section' && step.status === 'todo' && step.action === 'trust-section'));
assert(initial.steps.every(step => !step.manualHref || step.manualHref.startsWith('/dashboard/')));
assert.equal(initial.completed + initial.steps.filter(s => s.status === 'todo').length, initial.total);
const improved = applyImprovement(store.customization, 'trust-section', store, products);
const after = planForgePilotMission('conversion', auditStore({ ...store, customization: improved }, products, []));
assert(after.completed > initial.completed);
const noTraffic = planForgePilotMission('traffic', audit);
assert.match(noTraffic.evidence, /dados/);
assert(noTraffic.steps.some(step => step.status === 'info'));
const smallSample = planForgePilotMission('traffic', audit, { available: true, summary: { visitors: 4, productViewers: 3, cartVisitors: 2 } });
assert.match(smallSample.evidence, /Menos de 20/);
const enoughTraffic = planForgePilotMission('traffic', audit, { available: true, summary: { visitors: 100, productViewers: 50, cartVisitors: 12 } });
assert.match(enoughTraffic.evidence, /100 visitantes/);
const dimensions = forgePilotAuditDimensions(audit);
assert.equal(dimensions.length, 5);
assert.equal(dimensions.reduce((sum, d) => sum + d.achieved, 0), audit.score);
const server = fs.readFileSync(path.join(root, 'lib/forgepilot-copilot-actions.ts'), 'utf8');
assert(server.includes('AND user_id = $2'), 'Historical reads must scope by user and store');
assert(server.includes('AND user_id = $3'), 'Mission updates must check the store owner');
assert(server.includes('COALESCE(customization'), 'Optimistic locking must prevent overwriting manual edits');
assert(server.includes('getStoreTrafficOverview(storeId, 7)'), 'Copilot must use actual Growth Lab evidence');
assert(server.includes('40 perguntas'), 'API must include a usage limit');
console.log('PASS: ForgePilot 2.0 - missões específicas, progresso, amostras, ações permitidas, permissões e UI compilável.');


// Exercise the actual server action (network and database mocked).
async function testCopilotConversation() {
  const storeId = 'a1b2c3d4-1111-4444-8888-123456789abc';
  const requests = [];
  const messages = [];
  const warnings = [];
  let answers = [];
  const state = {
    exports: {},
    console: { ...console, warn: (...args) => warnings.push(args) },
    process: { env: { GEMINI_API_KEY: 'test-key' } },
    Date,
    require: name => {
      if (name === '@clerk/nextjs/server') return { auth: async () => ({ userId: 'owner' }) };
      if (name === '@vercel/postgres') return { sql: { query: async (query, params) => {
        if (query.includes('SELECT id, customization FROM stores')) return { rows: params[0] === storeId && params[1] === 'owner' ? [{ customization: store.customization }] : [] };
        if (query.includes('SELECT COUNT(*)')) return { rows: [{ total: 0 }] };
        if (query.includes('SELECT role, content')) return { rows: messages.slice().reverse() };
        if (query.includes('INSERT INTO forgepilot_chat_messages')) {
          assert.equal(params[0], storeId); assert.equal(params[1], 'owner');
          messages.push({ role: params[2], content: params[3] });
          return { rows: [] };
        }
        throw Error('Unexpected query: ' + query);
      } } };
      if (name === '@google/generative-ai') return { GoogleGenerativeAI: class {
        getGenerativeModel(config) {
          return { generateContent: async (prompt) => {
            requests.push({ config, prompt });
            const next = answers.shift();
            if (next instanceof Error) throw next;
            return { response: { candidates: [{ finishReason: next?.finishReason || 'STOP' }], text: () => next?.text || '' } };
          } };
        }
      } };
      if (name === 'node:crypto') return require('node:crypto');
      if (name === 'next/cache') return { revalidatePath: () => {} };
      if (name === './forgepilot-actions') return { getForgePilotOverviewAction: async () => ({
        store, products, audit, brand: { audience: 'Pescadores', positioning: 'Equipamento selecionado', tone: 'Prático', tagline: 'Pescar melhor' }
      }) };
      if (name === './store-traffic') return { getStoreTrafficOverview: async () => ({
        available: true, summary: { visitors: 23, productViewers: 12, cartVisitors: 3, paidOrders: 1 },
        topProducts: [{ name: 'Cana de pesca', views: 8, addToCarts: 2 }], note: 'Visitas com consentimento'
      }) };
      if (name === './forgepilot-missions') return missions.exports;
      throw Error('Unexpected import: ' + name);
    }
  };
  vm.runInNewContext(compile('lib/forgepilot-copilot-actions.ts'), state, { filename: 'lib/forgepilot-copilot-actions.ts' });
  const ask = state.exports.runForgePilotCopilotAction;
  answers = [{ text: 'O catálogo tem três artigos. Eu começaria por explicar melhor as condições de compra.' }];
  const first = await ask(storeId, 'O que achas que está mal na minha loja?');
  assert.equal(first.source, 'ai');
  assert.match(first.answer, /três artigos/);
  assert.equal(requests[0].config.generationConfig.responseMimeType, undefined, 'Chat must accept natural language');
  assert.match(requests[0].prompt, /Cana de pesca/);
  assert.match(requests[0].prompt, /"visitors":23/);
  assert.match(requests[0].prompt, /PERGUNTA ATUAL/);
  answers = [Object.assign(Error('503 overloaded'), { status: 503 }), { text: 'Na fotografia das canas, mostra detalhes do punho e do carreto.' }];
  const second = await ask(storeId, 'Como melhoro as fotografias dos produtos?');
  assert.equal(second.source, 'ai');
  assert.equal(second.mission.id, 'catalog');
  assert.match(second.answer, /punho/);
  assert.notEqual(first.answer, second.answer);
  assert.equal(requests[2].config.model, 'gemini-2.5-flash-lite');
  assert.match(requests[2].prompt, /O catálogo tem três artigos/);
  answers = [{ text: '{"answer":"truncado' }, { text: 'Resposta recuperada após uma tentativa inválida.' }];
  assert.equal((await ask(storeId, 'E agora?')).source, 'ai');
  answers = [Object.assign(Error('429 quota'), { status: 429 }), Object.assign(Error('429 quota'), { status: 429 })];
  const unavailable = await ask(storeId, 'Que campanha devo fazer?');
  assert.equal(unavailable.source, 'guided');
  assert.match(unavailable.notice, /quota/);
  assert.match(unavailable.answer, /não uma resposta gerada/);
  assert(!unavailable.answer.includes('começaria por estas prioridades'));
  state.process.env.GEMINI_API_KEY = '';
  const missing = await ask(storeId, 'Olá, podes ajudar-me?');
  assert.equal(missing.source, 'guided');
  assert.match(missing.notice, /GEMINI_API_KEY/);
  await assert.rejects(ask('a1b2c3d4-1111-4444-8888-123456789abd', 'Quero ver outra loja'), /acesso/);
  assert(warnings.length >= 3);
  console.log('PASS: Copilot chat real — texto livre, contexto do catálogo, tráfego, continuidade, troca de modelo, quota e ausência de chave.');
}
testCopilotConversation().catch(error => { console.error(error); process.exitCode = 1; });
