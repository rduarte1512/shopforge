import { validChange, changeConfig, getHeroTitle, CHANGE_LABELS, type ChangeInput } from './forgepilot-pro';
import { safeConfig } from './forgepilot-engine';

export type BatchPlan = {summary:string; changes:ChangeInput[]};
export type BatchItem = {input:ChangeInput;label:string;before:string;after:string;rawBefore:unknown;rawAfter:unknown};
export type BatchPreview = {version:string;items:Omit<BatchItem,'rawBefore'|'rawAfter'>[]};
export function validateBatch(input:unknown):ChangeInput[] {
  if(!Array.isArray(input)||input.length<1||input.length>6)throw Error('Escolhe entre uma e seis alterações.');
  const changes=input.map(validChange);
  const keys=new Set<string>();
  for(const c of changes){
    const key=c.kind+':'+(c.targetId||'');
    if(keys.has(key))throw Error('A proposta contém alterações duplicadas.');
    keys.add(key);
  }
  return changes;
}
export function parseBatchPlan(raw:string):BatchPlan {
  const parsed=JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));
  if(!parsed||typeof parsed.summary!=='string'||!parsed.summary.trim()||parsed.summary.length>600)throw Error('Resumo inválido.');
  return {summary:parsed.summary.trim(),changes:validateBatch(parsed.changes)};
}
export function buildBatch(store:any,products:any[],input:unknown):BatchItem[] {
  const changes=validateBatch(input);
  let config=safeConfig(store.customization);
  const known=new Map(products.map(p=>[String(p.id),p]));
  return changes.map(c=>{
    let rawBefore:unknown,rawAfter:unknown,before:string,label=CHANGE_LABELS[c.kind];
    if(c.kind==='hero'||c.kind==='accent'){
      rawBefore=config;
      before=c.kind==='hero'?getHeroTitle({...store,customization:config}):String(config.colors?.accent||'Não definida');
      config=changeConfig({...store,customization:config},c);
      rawAfter=config;
    }else{
      const p=known.get(String(c.targetId));
      if(!p)throw Error('Um produto não pertence a esta loja.');
      rawBefore=(c.kind==='product-name'?p.name:p.description)??null;
      rawAfter=c.value;
      before=String(rawBefore??'');
      label+=' · '+String(p.name);
    }
    if(before===c.value)throw Error('A proposta contém um valor igual ao atual: '+label);
    return {input:c,label,before,after:c.value,rawBefore,rawAfter};
  });
}
