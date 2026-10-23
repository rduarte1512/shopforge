/* Teste do compositor de temas sem rede nem API Gemini. */
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict'),path=require('node:path');
const js=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/store-templates.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021}}).outputText;
const context={exports:{},require:(id)=>{if(id==='./smart-images')return {getBannerSmartImage:()=> 'https://images.unsplash.com/photo-1441986300917-64674bd600d8',isRandomPlaceholderImage:()=>false};throw Error(id)}};
vm.runInNewContext(js,context);
const {STORE_TEMPLATES,buildTemplateCustomization,buildAdaptiveAiCustomization}=context.exports;
assert.equal(STORE_TEMPLATES.length,6);
const designs=STORE_TEMPLATES.map(t=>buildTemplateCustomization({name:'Demo',description:'Cana de pesca',enableAccounts:true},t.id,t.accent));
assert.equal(new Set(designs.map(x=>x.heroVariant)).size,5);
assert.equal(new Set(designs.map(x=>x.sections.map(s=>s.type).join('|'))).size,6);
for(const d of designs){
 assert.equal(d.layoutEngine,'adaptive-v1');
 assert(d.sections.some(s=>s.type==='products'));
 assert(d.sections.some(s=>s.type==='hero'));
}
const fromAI=buildAdaptiveAiCustomization({
 heroVariant:'full-bleed',productVariant:'bordered',
 sections:[
  {type:'products',content:{title:'Canas de pesca',limit:6},styles:{columns:3,variant:'bordered'}},
  {type:'trust',content:{items:['Atendimento','Acompanhamento','Compra simples']}},
  {type:'hero',content:{title:'A melhor pesca',subtitle:'Canas, carretes e outros acessórios'},styles:{variant:'full-bleed'}},
  {type:'categories',content:{title:'Pesca por categoria'}},
  {type:'faq',content:{title:'Questões',items:[{question:'Como comprar?',answer:'No carrinho.'}]}},
 ],colors:{accent:'#087e8b'}
},{name:'Maré Azul',description:'Equipamento de pesca',primary_color:'#087e8b'},'Loja de canas de pesca');
assert.equal(fromAI.layoutEngine,'adaptive-v1');
assert.equal(fromAI.templateId,'ai-custom');
assert.equal(fromAI.sections[0].type,'products');
assert.equal(fromAI.sections[2].type,'hero');
assert.equal(fromAI.sections[2].styles.variant,'full-bleed');
assert.equal(fromAI.colors.accent,'#087e8b');
const malformed=buildAdaptiveAiCustomization({heroVariant:'unsafe',sections:[{type:'script',content:{url:'javascript:alert(1)'}},{type:'image',content:{url:'https://evil.example/banner.png'}}]},{name:'Teste',description:'Pesca'},'Pesca');
assert(!malformed.sections.some(s=>s.type==='script'));
assert(malformed.sections.some(s=>s.type==='hero'));
assert(malformed.sections.some(s=>s.type==='products'));
assert(!malformed.sections.some(s=>s.type==='image' && s.content.url.includes('evil.example')));
console.log('PASS: 6 layouts distintos, secções IA ordenadas, variantes visuais e validação de blocos.');
