/* Command Center regressions, without live Gemini or customer data. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname,'..');
function compile(file) {
  const code = fs.readFileSync(path.join(root,file),'utf8');
  const out = ts.transpileModule(code,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2021,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});
  const errors=(out.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
  assert.equal(errors.length,0,file+': '+errors.map(e=>ts.flattenDiagnosticMessageText(e.messageText,'\n')).join('; '));
  return out.outputText;
}
const engine={exports:{},console,Date};
vm.runInNewContext(compile('lib/forgepilot-engine.ts'),engine);
const shared={exports:{},console,Date,require:name=>{assert.equal(name,'./forgepilot-engine');return engine.exports;}};
vm.runInNewContext(compile('lib/forgepilot-pro.ts'),shared);
const {validChange,changeConfig,advancedDiagnostics,experimentVariant,experimentResult,safeExpenses}=shared.exports;
const storeId='00000000-0000-4000-8000-000000000001';
const productId='00000000-0000-4000-8000-000000000002';
let store={id:storeId,name:'Loja',description:'Descrição curta',domain:'loja',base_currency:'EUR',customization:{layoutEngine:'adaptive-v1',colors:{background:'#ffffff',text:'#000000',accent:'#008060'},sections:[{id:'hero',type:'hero',content:{title:'Original',subtitle:'Texto',buttonText:'Ver produtos'}},{id:'products',type:'products',content:{}}]}};
assert.throws(()=>validChange({kind:'__proto__',value:'x'}));
assert.throws(()=>validChange({kind:'accent',value:'url(https://example.com)'}));
assert.throws(()=>validChange({kind:'product-name',targetId:'unknown',value:'Novo'}));
assert.throws(()=>validChange({kind:'hero',value:'<script>alert(1)</script>'}));
const next=changeConfig(store,{kind:'hero',value:'Novo título'});
assert.equal(next.sections[0].content.title,'Novo título');
assert.equal(store.customization.sections[0].content.title,'Original','Preview must not mutate original');
assert.equal(changeConfig(store,{kind:'accent',value:'#112233'}).colors.accent,'#112233');
const diagnosis=advancedDiagnostics(store,[{name:'Produto',description:'Curta',stock:3,price:20,image_url:''}]);
assert.equal(diagnosis.find(d=>d.name==='Experiência mobile').score,null);
assert.equal(diagnosis.find(d=>d.name==='Performance técnica').score,null);
assert.equal(experimentVariant('00000000-0000-4000-8000-000000000002'),'A');
assert.equal(experimentVariant('00000000-0000-4000-8000-000000000003'),'B');
assert.equal(experimentResult({exposed:12,converted:3},{exposed:15,converted:10}).signal,'Amostra insuficiente');
assert.equal(experimentResult({exposed:0,converted:0},{exposed:10,converted:3}).a,null);
assert.match(experimentResult({exposed:500,converted:100},{exposed:500,converted:180}).signal,/indicativa/);
assert.equal(safeExpenses({ads:10.129,shipping:0,fees:4,other:0}).ads,10.13);
assert.throws(()=>safeExpenses({ads:-1,shipping:0,fees:0,other:0}));
assert.throws(()=>safeExpenses({ads:10,shipping:0,fees:0}));
for(const file of ['lib/forgepilot-pro-actions.ts','lib/forgepilot-monitoring.ts','components/dashboard/ForgePilotCommand.tsx','components/dashboard/ForgePilotClient.tsx','components/dashboard/ForgePilotCopilot.tsx','app/api/forgepilot/experiment/route.ts','hooks/useForgePilotExperiment.ts','app/s/[domain]/page.tsx','app/api/cron/prune-traffic/route.ts','middleware.ts'])compile(file);
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
assert.match(read('hooks/useForgePilotExperiment.ts'),/navigator\.doNotTrack/);
assert.match(read('hooks/useForgePilotExperiment.ts'),/shopforge-traffic-consent-/);
assert.match(read('app/api/forgepilot/experiment/route.ts'),/EXISTS\(SELECT 1 FROM store_traffic_sessions/);
assert.match(read('app/api/forgepilot/experiment/route.ts'),/ON CONFLICT DO NOTHING/);
assert.match(read('lib/forgepilot-pro-actions.ts'),/WHERE id=\$1 AND user_id=\$2/);
assert.match(read('lib/forgepilot-pro-actions.ts'),/WITH changed AS/);
assert.match(read('lib/forgepilot-pro-actions.ts'),/version!==preview.version/);
assert.match(read('lib/forgepilot-pro-actions.ts'),/GROUP BY o.currency/);
assert.match(read('app/api/cron/prune-traffic/route.ts'),/CRON_SECRET/);

let writes=0;
const state={exports:{},console,Date,process:{env:{}},require:name=>{
  if(name==='@clerk/nextjs/server')return {auth:async()=>({userId:'owner'})};
  if(name==='@vercel/postgres')return {sql:{query:async(q,p)=>{
    if(q.startsWith('SELECT id,name,description,domain'))return {rows:p[0]===storeId&&p[1]==='owner'?[store]:[]};
    if(q.startsWith('SELECT id,name,description FROM products'))return {rows:p[0]===productId&&p[1]===storeId?[{id:productId,name:'Produto',description:'Descrição'}]:[]};
    if(q.startsWith('WITH changed AS')){writes++;return {rows:[{id:'changed'}]};}
    throw Error('Unexpected SQL: '+q);
  }}};
  if(name==='node:crypto')return require('node:crypto');
  if(name==='next/cache')return {revalidatePath:()=>{}};
  if(name==='@google/generative-ai')return {GoogleGenerativeAI:class{}};
  if(name==='./forgepilot-engine')return engine.exports;
  if(name==='./forgepilot-pro')return shared.exports;
  if(name==='./forgepilot-monitoring')return {refreshForgePilotMonitoring:async()=>1};
  if(name==='./store-traffic')return {getStoreTrafficOverview:async()=>({available:false})};
  throw Error(name);
}};
vm.runInNewContext(compile('lib/forgepilot-pro-actions.ts'),state);
const api={exports:{},console,URL,require:name=>{
  if(name==='next/server')return {NextResponse:{json:(body,config)=>({body,status:config.status})}};
  if(name==='@vercel/postgres')return {sql:{query:async(q,p)=>{assert.match(q,/EXISTS\(SELECT 1 FROM store_traffic_sessions/);assert.equal(p[2],'B');writes++;return {rows:[]};}}};
  if(name==='@/lib/forgepilot-pro')return shared.exports;
  throw Error(name);
}};
vm.runInNewContext(compile('app/api/forgepilot/experiment/route.ts'),api);
async function run(){
  const change={kind:'product-description',targetId:productId,value:'Uma descrição detalhada'};
  const preview=await state.exports.previewForgePilotChangeAction(storeId,change);
  assert.equal(preview.before,'Descrição');assert.equal(writes,0);
  await assert.rejects(state.exports.applyForgePilotChangeAction(storeId,change,'wrong'),/alterada/);
  assert.equal(writes,0);
  await state.exports.applyForgePilotChangeAction(storeId,change,preview.version);
  assert.equal(writes,1);
  await assert.rejects(state.exports.previewForgePilotChangeAction('00000000-0000-4000-8000-000000000009',change),/acesso/);
  await assert.rejects(state.exports.previewForgePilotChangeAction(storeId,{...change,targetId:'00000000-0000-4000-8000-000000000099'}),/não pertence/);
  const body={domain:'loja',visitorId:'00000000-0000-4000-8000-000000000003',experimentId:'00000000-0000-4000-8000-000000000004'};
  const req=(data,origin)=>new Request('https://shopforge.example/api/forgepilot/experiment',{method:'POST',headers:{origin},body:JSON.stringify(data)});
  assert.equal((await api.exports.POST(req(body,'https://evil.example'))).status,403);
  assert.equal((await api.exports.POST(req({...body,visitorId:'invalid'},'https://shopforge.example'))).status,400);
  assert.equal(writes,1);
  assert.equal((await api.exports.POST(req(body,'https://shopforge.example'))).status,200);
  assert.equal(writes,2);
  console.log('PASS: Command Center — permissões, aprovação, alterações seguras, diagnóstico, experiências, custos e consentimento.');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
