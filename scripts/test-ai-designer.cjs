/* Regression tests for the real AI Designer engine and Server Action, without network/API keys. */
const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict'),ts=require('typescript'),path=require('node:path');
const root=path.join(__dirname,'..');
const transpile=(filename)=>ts.transpileModule(fs.readFileSync(path.join(root,filename),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021}}).outputText;
const pure={exports:{},Date,console};
vm.runInNewContext(transpile('lib/ai-designer-engine.ts'),pure,{filename:'lib/ai-designer-engine.ts'});
const {planLocalDesignerEdit,applyDesignerOperations}=pure.exports;
const base={layoutEngine:'adaptive-v1',templateId:'ai-custom',colors:{accent:'#008060',background:'#ffffff',text:'#152432',primary:'#008060'},fonts:{heading:'Inter',body:'Inter'},hero:{title:'Loja demo'},products:{columns:4},sections:[
 {id:'hero-1',type:'hero',content:{title:'Loja demo',subtitle:'Os nossos artigos',buttonText:'Comprar'},styles:{variant:'split',height:500}},
 {id:'products-1',type:'products',content:{title:'Coleção'},styles:{variant:'cards',columns:4}},
 {id:'faq-1',type:'faq',content:{title:'Perguntas'},styles:{}},
]};
async function run(){
 const question=planLocalDesignerEdit(base,'o que consegues fazer');
 assert.equal(question.status,'answer');
 assert.equal(question.customization,undefined);
 const clarify=planLocalDesignerEdit(base,'muda a cor do banner');
 assert.equal(clarify.status,'clarification');
 assert.match(clarify.message,/Para que cor/i);
 const color=planLocalDesignerEdit(base,'muda a cor do banner para azul escuro');
 assert.equal(color.status,'updated');
 assert.equal(color.customization.sections[0].styles.backgroundColor,'#172554');
 assert.equal(base.sections[0].styles.backgroundColor,undefined);
 assert.equal(color.customization.colors.accent,'#008060');
 const shortColor=planLocalDesignerEdit(base,'muda o banner para azul');
 assert.equal(shortColor.status,'updated');
 assert.equal(shortColor.customization.sections[0].styles.backgroundColor,'#2563eb');
 const text=planLocalDesignerEdit(base,'altera o título do banner para Novidades de Outono');
 assert.equal(text.status,'updated');
 assert.equal(text.customization.sections[0].content.title,'Novidades de Outono');
 const noOp=planLocalDesignerEdit({...base,sections:[{...base.sections[0],styles:{...base.sections[0].styles,backgroundColor:'#2563eb'}},...base.sections.slice(1)]},'muda a cor do banner para azul');
 assert.notEqual(noOp.status,'updated');
 const invalid=applyDesignerOperations(base,[
  {type:'color',target:'hero',value:'javascript:alert(1)'},
  {type:'text',target:'__proto__.constructor',value:'invalid'},
  {type:'remove-section',value:'hero'},
  {type:'hero-variant',value:'malicious'},
 ]);
 assert.equal(invalid.changes.length,0);
 assert.equal(invalid.config.sections.length,3);
 const complex=applyDesignerOperations(base,[
  {type:'hero-variant',value:'full-bleed'},
  {type:'product-variant',value:'editorial'},
  {type:'move-section',target:'products',position:'first'},
  {type:'add-section',value:'trust'},
 ]);
 assert.equal(JSON.stringify(complex.config.sections.map(s=>s.type)),JSON.stringify(['products','hero','faq','trust']));
 assert.equal(complex.config.sections.find(s=>s.type==='hero').styles.variant,'full-bleed');
 assert.equal(complex.config.layoutEngine,'adaptive-v1');

 const outputs=[{__error:'503 Service Unavailable',status:503}, {intent:'edit',operations:[{type:'color',target:'hero',value:'#f97316'}]}];
 const called=[];
 const server={exports:{},Date,console:{warn:()=>{},error:()=>{}},process:{env:{GEMINI_API_KEY:'fake-test-key'}},require:(id)=>{
   if(id==='./ai-designer-engine')return pure.exports;
   if(id==='@google/generative-ai')return {GoogleGenerativeAI:class{
     getGenerativeModel(options){return {generateContent:async()=>{called.push(options.model);const next=outputs.shift();if(next.__error)throw Object.assign(new Error(next.__error),{status:next.status});return{response:{text:()=>JSON.stringify(next)}}}}}
   }};
   throw Error('Unexpected import '+id);
 }};
 vm.runInNewContext(transpile('lib/ai-actions.ts'),server,{filename:'lib/ai-actions.ts'});
 const updated=await server.exports.updateStoreCustomizationWithAI(base,'quero uma cor quente para o hero');
 assert.equal(updated.status,'updated');
 assert.equal(updated.customization.sections[0].styles.backgroundColor,'#f97316');
 assert.deepEqual(called,['gemini-2.5-flash','gemini-2.5-flash-lite']);
 const callsBefore=called.length;
 const local=await server.exports.updateStoreCustomizationWithAI(base,'muda o banner para azul');
 assert.equal(local.status,'updated');
 assert.equal(called.length,callsBefore);
 const malformed=[];const broken={exports:{},Date,console:{warn:()=>{},error:()=>{}},process:{env:{GEMINI_API_KEY:'fake-test-key'}},require:(id)=>{
   if(id==='./ai-designer-engine')return pure.exports;
   if(id==='@google/generative-ai')return {GoogleGenerativeAI:class{getGenerativeModel(){return{generateContent:async()=>({response:{text:()=>'{ "intent": "edit" , "operations": ['}})}}}};
   throw Error(id);
 }};
 vm.runInNewContext(transpile('lib/ai-actions.ts'),broken,{filename:'lib/ai-actions.ts'});
 const failed=await broken.exports.updateStoreCustomizationWithAI(base,'melhora a estrutura do site');
 assert.equal(failed.status,'error');
 assert.equal(failed.customization,undefined);
 assert.equal(base.sections[0].styles.backgroundColor,undefined);
 console.log('PASS: IA Designer — ajuda, esclarecimento, cor do banner, título, operações seguras, fallback Gemini e JSON inválido.');
}
run().catch(err=>{console.error(err);process.exitCode=1});
