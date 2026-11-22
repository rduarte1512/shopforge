/* Growth Lab regression tests: no network, no Neon connection, no customer data. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function compile(file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const r = ts.transpileModule(source, {
    fileName: file, reportDiagnostics: true,
    compilerOptions: { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const errors = (r.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, errors.map(e => ts.flattenDiagnosticMessageText(e.messageText, '\n')).join('\n'));
  return r.outputText;
}
const files = [
  'lib/store-traffic.ts', 'lib/traffic-insights.ts',
  'app/api/analytics/track/route.ts', 'app/api/dashboard/traffic/route.ts',
  'app/api/cron/prune-traffic/route.ts', 'components/storefront/StoreTrafficTracker.tsx',
  'components/dashboard/ForgePilotGrowthLab.tsx', 'components/dashboard/TrafficPulse.tsx',
  'components/dashboard/ForgePilotClient.tsx', 'app/s/[domain]/layout.tsx',
];
for (const file of files) compile(file);

const serverAnalytics = { exports: {}, require: id => {
  if (id === '@vercel/postgres') return { sql: async () => ({ rows: [] }) };
  throw Error('unexpected dependency: ' + id);
}, console, Date };
vm.runInNewContext(compile('lib/store-traffic.ts'), serverAnalytics);
const { meaningfulRate, daysBack } = serverAnalytics.exports;
assert.equal(meaningfulRate(4, 20), 20);
assert.equal(meaningfulRate(0, 0), null);
assert.match(daysBack(7, new Date('2026-11-22T12:00:00Z')), /^2026-11-15/);

const insightsEnv = { exports: {}, require: () => ({}), console };
vm.runInNewContext(compile('lib/traffic-insights.ts'), insightsEnv);
const suggest = insightsEnv.exports.buildGrowthRecommendations;
const fakeData = { available: true, summary: { visitors: 100, pageViews: 200, productViewers: 30, cartVisitors: 2, checkoutVisitors: 1 } };
const advice = suggest(fakeData);
assert(advice.some(a => /produtos em destaque/i.test(a.title)));
assert(suggest({ ...fakeData, summary: { ...fakeData.summary, visitors: 5 } })[0].level === 'insight');

let writes = 0;
const sql = async (parts, ...params) => {
  const query = parts.join('?');
  if (query.includes('SELECT id FROM stores')) return { rows: [{ id: '00000000-0000-4000-8000-000000000001' }] };
  if (query.includes('SELECT id FROM products')) return { rows: params[0] === '00000000-0000-4000-8000-000000000002' ? [{ id: params[0] }] : [] };
  if (query.includes('WITH accepted AS')) { writes++; return { rows: [{ processed: 1 }] }; }
  if (query.includes('UPDATE store_traffic_sessions')) { writes++; return { rows: [] }; }
  throw Error('Unexpected SQL statement: ' + query.slice(0, 70));
};
const route = { exports: {}, require: name => {
  if (name === 'next/server') return { NextResponse: { json: (body, config = {}) => ({ body, status: config.status || 200 }) } };
  if (name === '@vercel/postgres') return { sql };
  throw Error(name);
}, console, URL };
vm.runInNewContext(compile('app/api/analytics/track/route.ts'), route);
const uuid = {
  visitorId: '00000000-0000-4000-8000-000000000012',
  sessionId: '00000000-0000-4000-8000-000000000013',
  eventId: '00000000-0000-4000-8000-000000000014',
};
const request = (value, origin = 'https://shopforge.example') =>
  new Request('https://shopforge.example/api/analytics/track', {
    method: 'POST', headers: { origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain: 'store-alpha', ...uuid, eventType: 'page_view', pageKind: 'home', ...value }),
  });

async function main() {
  assert.equal((await route.exports.POST(request({}))).status, 200);
  assert.equal(writes, 1);
  assert.equal((await route.exports.POST(request({}, 'https://evil.example'))).status, 403);
  assert.equal(writes, 1, 'Cross-origin events must never be written');
  assert.equal((await route.exports.POST(request({ visitorId: 'guess' }))).status, 400);
  assert.equal((await route.exports.POST(request({ eventType: 'purchase_completed' }))).status, 400);
  assert.equal((await route.exports.POST(request({ eventType: 'product_view', productId: '00000000-0000-4000-8000-000000000099' }))).status, 404);
  assert.equal(writes, 1, 'Invalid events cannot be inserted');
  assert.equal((await route.exports.POST(request({ eventType: 'product_view', pageKind: 'product', productId: '00000000-0000-4000-8000-000000000002' }))).status, 200);
  assert.equal((await route.exports.POST(request({ eventType: 'heartbeat' }))).status, 200);
  assert.equal(writes, 3);

  const tracker = fs.readFileSync(path.join(root, 'components/storefront/StoreTrafficTracker.tsx'), 'utf8');
  assert(tracker.includes("choice !== 'granted'"), 'Explicit consent is mandatory');
  assert(tracker.includes("navigator.doNotTrack"), 'Respect DNT');
  assert(tracker.includes("Preferências de privacidade") || fs.readFileSync(path.join(root, 'app/s/[domain]/layout.tsx'), 'utf8').includes('Preferências de privacidade'));
  const migration = fs.readFileSync(path.join(root, 'migrations/20261122_forgepilot_growth_lab.sql'), 'utf8');
  assert(/90 days/.test(migration));
  assert(!/^\s*(ip_address|email|user_agent)\s+/im.test(migration));
  console.log('PASS: Growth Lab — consentimento, DNT, eventos válidos, origem, limites, agregados, sugestões e migração.');
}
main().catch(err => { console.error(err); process.exitCode = 1; });
