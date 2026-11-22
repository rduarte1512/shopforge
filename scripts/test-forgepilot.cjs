/* ForgePilot regressions, without DB, Clerk or Gemini network access. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');
const root = path.join(__dirname, '..');

function compile(file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const result = ts.transpileModule(source, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  });
  const errors = (result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, file + ': ' + errors.map(e => ts.flattenDiagnosticMessageText(e.messageText, '\n')).join('; '));
  return result.outputText;
}
for (const file of ['lib/forgepilot-engine.ts', 'lib/forgepilot-actions.ts', 'components/dashboard/ForgePilotClient.tsx', 'app/dashboard/forgepilot/page.tsx']) compile(file);

const pure = { exports: {}, console, Date };
vm.runInNewContext(compile('lib/forgepilot-engine.ts'), pure, { filename: 'lib/forgepilot-engine.ts' });
const { auditStore, inferBrand, applyImprovement, contrastRatio, safeConfig } = pure.exports;
const products = [
  { id: 'a', name: 'Cana de Pesca', category: 'Canas', price: 34.90, image_url: 'https://example.com/1.jpg' },
  { id: 'b', name: 'Carreto', category: 'Pesca', price: 12.90, image_url: 'https://example.com/2.jpg' },
  { id: 'c', name: 'Linha de Pesca', category: 'Pesca', price: 4.90, image_url: 'https://example.com/3.jpg' },
];
const original = {
  layoutEngine: 'adaptive-v1',
  colors: { text: '#0f172a', background: '#ffffff', accent: '#008060' },
  sections: [
    { id: 'hero', type: 'hero', content: { title: 'Loja de Pesca', subtitle: 'Canas e carretos da nossa loja', buttonText: 'Ver produtos' }, styles: { variant: 'split' } },
    { id: 'products', type: 'products', content: { title: 'Os nossos produtos' }, styles: { columns: 4 } },
  ],
};
const store = { id: 's1', name: 'Loja de Pesca', description: 'Equipamento de pesca, canas e carretos para pescadores exigentes.', domain: 'loja', customization: original };
assert(contrastRatio('#0f172a', '#ffffff') > 4.5);
assert(contrastRatio('#dddddd', '#ffffff') < 4.5);
assert.equal(inferBrand(store, products).tone, 'Prático e especializado');
assert.equal(safeConfig(null).sections, undefined);
const initial = auditStore(store, products, []);
assert.equal(initial.score, 84);
assert(initial.recommendations.some(item => item.id === 'trust-section'));
assert(initial.recommendations.some(item => item.id === 'faq-section'));
const withTrust = applyImprovement(original, 'trust-section', store, products);
const withFaq = applyImprovement(withTrust, 'faq-section', store, products);
assert.equal(auditStore({ ...store, customization: withFaq }, products, []).score, 100);
assert(!original.sections.some(section => section.type === 'trust'), 'Mutation of live config');
assert.equal(applyImprovement(withTrust, 'trust-section', store, products).sections.filter(s => s.type === 'trust').length, 1);
const unreadable = { ...original, colors: { text: '#dddddd', background: '#ffffff' } };
const fixed = applyImprovement(unreadable, 'contrast', store, products);
assert(contrastRatio(fixed.colors.text, fixed.colors.background) >= 4.5);
const moved = applyImprovement({ ...original, sections: [{ id: 'hero', type: 'hero', content: { title: 'Loja' } }, { id: 'story', type: 'story' }, { id: 'faq', type: 'faq' }, { id: 'products', type: 'products' }] }, 'product-placement', store, products);
assert.equal(moved.sections[1].type, 'products');
assert.throws(() => applyImprovement(original, 'unsafe-code', store, products));
assert(auditStore(store, [], []).recommendations.some(r => r.manualHref === '/dashboard/products'));

let state = { ...store, customization: JSON.parse(JSON.stringify(original)) };
const sql = async (strings, ...params) => {
  const query = strings.join('?').replace(/\s+/g, ' ');
  if (query.includes('SELECT * FROM stores WHERE id')) {
    return { rows: params[0] === 's1' && params[1] === 'owner' ? [{ ...state, customization: JSON.parse(JSON.stringify(state.customization)) }] : [] };
  }
  if (query.includes('SELECT * FROM stores WHERE user_id')) return { rows: [state] };
  if (query.includes('COUNT(*)')) return { rows: [{ total: 2 }] };
  if (query.includes('UPDATE stores')) {
    assert.equal(params[1], 's1');
    assert.equal(params[2], 'owner');
    if (JSON.stringify(state.customization) !== JSON.stringify(JSON.parse(params[3]))) return { rows: [] };
    state = { ...state, customization: JSON.parse(params[0]) };
    return { rows: [{ id: 's1' }] };
  }
  throw Error('Unexpected query: ' + query);
};
const validBrandJson = JSON.stringify({
  audience: 'Pescadores amadores e experientes',
  positioning: 'Equipamento para quem gosta de pesca',
  tone: 'Profissional e próximo',
  tagline: 'Tudo para a próxima captura',
});
const responses = [];
let aiCalls = 0;
const server = { exports: {}, console, process: { env: { GEMINI_API_KEY: 'test-key' } }, require: id => {
  if (id === '@google/generative-ai') return { GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent: async () => {
        aiCalls++;
        const response = responses.length ? responses.shift() : validBrandJson;
        if (response instanceof Error) throw response;
        return { response: { text: () => response } };
      } };
    }
  } };
  if (id === '@clerk/nextjs/server') return { auth: async () => ({ userId: 'owner' }) };
  if (id === '@vercel/postgres') return { sql };
  if (id === 'next/cache') return { revalidatePath: () => {} };
  if (id === 'node:crypto') return crypto;
  if (id === './db') return { getProducts: async () => products };
  if (id === './forgepilot-engine') return pure.exports;
  throw Error('Unexpected dependency: ' + id);
}};
vm.runInNewContext(compile('lib/forgepilot-actions.ts'), server, { filename: 'lib/forgepilot-actions.ts' });
async function run() {
  const overview = await server.exports.getForgePilotOverviewAction('s1');
  assert.equal(overview.audit.orderCount, 2);
  assert.equal(overview.audit.score, 84);
  assert.equal(overview.history.length, 0);
  const suggestion = await server.exports.previewForgePilotImprovementAction('s1', 'trust-section');
  assert.equal(state.customization.sections.length, 2, 'Preview should not save changes');
  assert.equal(suggestion.customization.sections.length, 3);
  await server.exports.applyForgePilotImprovementAction('s1', 'trust-section', overview.version);
  assert.equal(state.customization.sections.length, 3);
  assert.equal(state.customization.forgepilotHistory.length, 1);
  await assert.rejects(server.exports.applyForgePilotImprovementAction('s1', 'faq-section', overview.version), /alterada/);
  const after = await server.exports.getForgePilotOverviewAction('s1');
  await server.exports.restoreForgePilotHistoryAction('s1', after.history[0].id, after.version);
  assert.equal(state.customization.sections.length, 2);
  const brandView = await server.exports.getForgePilotOverviewAction('s1');
  const brand = { audience: 'Amantes de pesca', positioning: 'Equipamentos selecionados', tone: 'Objetivo e claro', tagline: 'Pescar mais e melhor' };
  await server.exports.saveForgePilotBrandAction('s1', brand, brandView.version);
  assert.equal(state.customization.forgepilot.brand.tagline, brand.tagline);
  const aiBrandSuggestion = await server.exports.suggestForgePilotBrandWithAIAction('s1');
  assert.equal(aiBrandSuggestion.source, 'ai');
  assert.equal(aiBrandSuggestion.brand.tagline, 'Tudo para a próxima captura');

  // Teste do erro real: resposta Gemini interrompida a meio de uma string JSON.
  const truncated = '{"audience":"Pescadores apaixonados por';
  responses.push(truncated, validBrandJson);
  const callsBeforeRetry = aiCalls;
  const retriedSuggestion = await server.exports.suggestForgePilotBrandWithAIAction('s1');
  assert.equal(retriedSuggestion.source, 'ai');
  assert.equal(retriedSuggestion.brand.tagline, 'Tudo para a próxima captura');
  assert.equal(aiCalls, callsBeforeRetry + 2, 'Malformed JSON must retry once');

  // Se os dois modelos falharem, o utilizador recebe uma proposta realista,
  // em vez do erro Server Components sem detalhes.
  responses.push(truncated, truncated);
  const fallbackSuggestion = await server.exports.suggestForgePilotBrandWithAIAction('s1');
  assert.equal(fallbackSuggestion.source, 'fallback');
  assert.equal(fallbackSuggestion.brand.tone, 'Prático e especializado');
  assert.match(fallbackSuggestion.notice, /indisponível/);

  server.process.env.GEMINI_API_KEY = '';
  const unavailableSuggestion = await server.exports.suggestForgePilotBrandWithAIAction('s1');
  assert.equal(unavailableSuggestion.source, 'fallback');
  assert.match(unavailableSuggestion.notice, /não está configurada/);
  server.process.env.GEMINI_API_KEY = 'test-key';
  assert.equal(state.customization.forgepilot.brand.tagline, brand.tagline, 'AI suggestions and fallback must not auto-save');

  const trafficSql = fs.readFileSync(path.join(root, 'lib/store-traffic.ts'), 'utf8');
  assert(trafficSql.includes('AS returning_visitors'), 'SQL cannot alias a subquery with a reserved word');
  assert(!trafficSql.includes('AS returning`'), 'Reserved alias must not be reintroduced');
  await assert.rejects(server.exports.saveForgePilotBrandAction('s2', brand, brandView.version), /acesso/);
  console.log('PASS: ForgePilot — scoring real, previews sem escrita, alterações reversíveis, versões concorrentes, Brand DNA por IA com confirmação explícita e acesso por proprietário.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
