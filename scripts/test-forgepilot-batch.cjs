/* Regression suite: batch validation, no writes during preview, atomic commit and rollback. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
function compile(file){
 const result=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2021,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});
 assert.equal((result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,file);
 return result.outputText;
}
function load(file,deps={}){
 const ctx={exports:{},console,Date,process:{env:{}},require:name=>{if(name in deps)return deps[name];if(name==='node:crypto')return require(name);throw Error('Unexpected '+name);}};
 vm.runInNewContext(compile(file),ctx);return ctx.exports;
}
const engine=load('lib/forgepilot-engine.ts');
const pro=load('lib/forgepilot-pro.ts',{'./forgepilot-engine':engine});
const batch=load('lib/forgepilot-batch.ts',{'./forgepilot-engine':engine,'./forgepilot-pro':pro});
const storeId='00000000-0000-4000-8000-000000000001';
const pid='00000000-0000-4000-8000-000000000002';
const store={id:storeId,name:'Loja',domain:'loja',customization:{layoutEngine:'adaptive-v1',colors:{accent:'#008060'},sections:[{type:'hero',content:{title:'Original'}}]}};
const products=[{id:pid,name:'Produto',description:'Descrição antiga'}];
const changes=[{kind:'hero',value:'Título novo'},{kind:'accent',value:'#112233'},{kind:'product-description',targetId:pid,value:'Descrição nova'}];
assert.throws(()=>batch.validateBatch([]));
assert.throws(()=>batch.validateBatch([...changes,changes[0]]),/duplicadas/);
assert.throws(()=>batch.validateBatch([{kind:'price',value:'100'}]));
assert.throws(()=>batch.buildBatch(store,products,[{kind:'product-name',targetId:storeId,value:'Novo'}]),/não pertence/);
const result=batch.buildBatch(store,products,changes);
assert.equal(result.length,3);
assert.equal(result[1].rawBefore.sections[0].content.title,'Título novo');
assert.equal(result[1].rawAfter.colors.accent,'#112233');
assert.equal(store.customization.sections[0].content.title,'Original');
assert.equal(batch.parseBatchPlan(JSON.stringify({summary:'Plano',changes})).changes.length,3);
assert.throws(()=>batch.parseBatchPlan('not json'));
let calls=[], fail=false, changed=false;
const db=async(q,p=[])=>{
 calls.push(q);
 if(q.startsWith('SELECT id,name,description,domain'))return {rows:p[0]===storeId&&p[1]==='owner'?[changed?{...store,customization:{...store.customization,colors:{accent:'#123456'}}}:store]:[]};
 if(q.startsWith('SELECT id,name,description,category'))return {rows:products};
 if(q.startsWith('SELECT id FROM forgepilot_experiments'))return {rows:[]};
 if(q.startsWith('UPDATE products')&&fail)return {rows:[]};
 if(q.startsWith('UPDATE'))return {rows:[{id:storeId}]};
 return {rows:[]};
};
const actions=load('lib/forgepilot-batch-actions.ts',{'@clerk/nextjs/server':{auth:async()=>({userId:'owner'})},'@vercel/postgres':{sql:{query:db,connect:async()=>({query:db,release:()=>{calls.push('RELEASE');}})}},'next/cache':{revalidatePath:()=>{}},'@google/generative-ai':{},'./plan-access':{requireFeature:async()=>({userId:'owner',plan:{id:'ENTERPRISE'}}),accountPlan:async()=>({id:'ENTERPRISE'})},'./forgepilot-tokens':{withForgeTokens:async(_user,_op,generate)=>generate(),ForgeTokenError:class extends Error{}},'./forgepilot-batch':batch,'./forgepilot-engine':engine,'./forgepilot-pro':pro});
async function run(){
 const p=await actions.previewForgePilotBatchAction(storeId,changes);
 assert.equal(p.items.length,3);
 assert(!calls.some(q=>q.startsWith('UPDATE')||q.startsWith('INSERT')));
 assert.equal(p.items[0].rawBefore,undefined);
 calls=[];await assert.rejects(actions.applyForgePilotBatchAction(storeId,changes,'incorrect'),/alterada/);
 assert(calls.includes('ROLLBACK'));assert(!calls.includes('COMMIT'));
 calls=[];changed=true;await assert.rejects(actions.applyForgePilotBatchAction(storeId,changes,p.version),/alterada/);changed=false;
 assert(calls.includes('ROLLBACK'));
 calls=[];fail=true;await assert.rejects(actions.applyForgePilotBatchAction(storeId,changes,p.version),/concorrente/);fail=false;
 assert(calls.includes('ROLLBACK'));assert(!calls.includes('COMMIT'));assert(calls.includes('RELEASE'));
 calls=[];const r=await actions.applyForgePilotBatchAction(storeId,changes,p.version);
 assert.equal(r.count,3);assert(calls.includes('COMMIT'));assert(!calls.includes('ROLLBACK'));assert.equal(calls.filter(q=>q.startsWith('INSERT INTO forgepilot_changes')).length,3);
 await assert.rejects(actions.previewForgePilotBatchAction(pid,changes),/acesso/);
 for(const file of ['components/dashboard/ForgePilotBatch.tsx','components/dashboard/ForgePilotBrowserAudit.tsx','components/dashboard/ForgePilotCommand.tsx','components/dashboard/ForgePilotClient.tsx','lib/forgepilot-copilot-actions.ts','components/storefront/StoreTrafficTracker.tsx','hooks/useForgePilotExperiment.ts'])compile(file);
 const read=f=>fs.readFileSync(path.join(root,f),'utf8');
 assert.match(read('components/dashboard/ForgePilotBrowserAudit.tsx'),/forgepilot-audit=1/);
 assert.match(read('components/storefront/StoreTrafficTracker.tsx'),/forgepilot-audit/);
 assert.match(read('hooks/useForgePilotExperiment.ts'),/forgepilot-audit/);
 console.log('PASS: ForgePilot batch — preview, ownership, version, atomic commit and rollback, audit exclusions.');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
