const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const crypto=require('node:crypto');
function load(file,deps={}){
 const result=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},reportDiagnostics:true});
 assert.equal((result.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,file);
 const ctx={exports:{},console,Intl,Date,require:name=>{if(name in deps)return deps[name];if(name==='node:crypto')return crypto;throw Error(name);}};
 vm.runInNewContext(result.outputText,ctx,{filename:file});
 return ctx.exports;
}
const plans=load('lib/plans.ts');
assert.equal(plans.SUBSCRIPTION_PLANS.length,5);
assert.equal(plans.effectiveForgePlan('PRO','expired').tokens,100);
assert.equal(plans.effectiveForgePlan('PRO','active').tokens,3500);
assert(plans.SUBSCRIPTION_PLANS.every(p=>Number.isInteger(p.price*.8)));
const rows=[];let tier='STARTER',status='active',commits=0,rollbacks=0,generated=0,locked=false;
const sql={connect:async()=>({release(){},query:async(q,p)=>{
 if(q==='BEGIN')return {rows:[]};
 if(q.includes('FOR UPDATE')){locked=true;return {rows:[{subscription_tier:tier,subscription_status:status}]};}
 if(q.includes('AS attempts')){assert(locked);return {rows:[{used:rows.filter(r=>r.status!=='refunded').reduce((n,r)=>n+r.tokens,0),attempts:rows.length}]};}
 if(q.startsWith('INSERT INTO')){assert(locked);rows.push({id:p[0],operation:p[2],tokens:p[3],status:'reserved'});return {rows:[]};}
 if(q==='COMMIT'){commits++;locked=false;return {rows:[]};}
 if(q==='ROLLBACK'){rollbacks++;locked=false;return {rows:[]};}
 throw Error(q);
}}),query:async(q,p)=>{
 if(q.startsWith('UPDATE forgepilot_token_ledger')){rows.find(r=>r.id===p[0]).status=p[1];return {rows:[]};}
 throw Error(q);
}};
const {withForgeTokens}=load('lib/forgepilot-tokens.ts',{'@vercel/postgres':{sql},'./plans':plans});
(async()=>{
 const generate=async()=>{generated++;return 'ok';};
 assert.equal(await withForgeTokens('owner','batch',generate),'ok');assert.equal(rows[0].tokens,30);assert.equal(rows[0].status,'spent');
 await assert.rejects(withForgeTokens('owner','draft',async()=>{throw Error('provider failed');}),/provider failed/);assert.equal(rows[1].status,'refunded');
 await withForgeTokens('owner','batch',generate);await withForgeTokens('owner','batch',generate);await withForgeTokens('owner','brand',generate);
 assert.equal(rows.filter(r=>r.status==='spent').reduce((n,r)=>n+r.tokens,0),100);
 await assert.rejects(withForgeTokens('owner','chat',generate),/Tokens insuficientes/);assert.equal(generated,4);assert.equal(rollbacks,1);
 tier='GROWTH';await withForgeTokens('owner','chat',generate);assert.equal(generated,5);assert.equal(commits,6);
 assert.equal(rows.filter(r=>r.status==='spent').reduce((n,r)=>n+r.tokens,0),105);
 console.log('PASS: shared plan quotas, credit reserve/settle/refund, quota rejection before generation, plan change.');
})().catch(e=>{console.error(e);process.exitCode=1;});
