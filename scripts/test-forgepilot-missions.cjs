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
