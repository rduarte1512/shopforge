export type ForecastInput={budget:number;days:number;cpm:number;ctr:number;conversion:number;frequency:number;orderValue:number;margin:number};
export function forecast(v:ForecastInput){
 const spend=v.budget*v.days;
 const cases=[{name:'Conservador',cost:1.3,ctr:.75,cv:.7},{name:'Base',cost:1,ctr:1,cv:1},{name:'Otimista',cost:.8,ctr:1.2,cv:1.3}];
 return cases.map(s=>{const impressions=spend/(v.cpm*s.cost)*1000;const reach=impressions/Math.max(1,v.frequency);const clicks=impressions*Math.min(100,v.ctr*s.ctr)/100;const orders=clicks*Math.min(100,v.conversion*s.cv)/100;const revenue=orders*v.orderValue;return {name:s.name,spend,impressions,reach,clicks,orders,revenue,roas:spend?revenue/spend:0,cpa:orders?spend/orders:null,profit:revenue*v.margin/100-spend}});
}
export function csvCell(v:unknown){let s=String(v??'');if(/^[\s]*[=+\-@]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}
export function csv(rows:unknown[][]){return '\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')}
export function trackingUrl(value:string,provider:string,campaign:string){try{const u=new URL(value);if(u.protocol!=='https:')return '';u.searchParams.set('utm_source',provider==='meta'?'meta':'google');u.searchParams.set('utm_medium',provider==='meta'?'paid_social':'cpc');u.searchParams.set('utm_campaign',campaign.trim().toLowerCase().replace(/\s+/g,'-'));return u.toString()}catch{return ''}}
export function parseCSV(input:string):string[][] {
 const s=input.replace(/^\uFEFF/,'');const first=s.split(/\r?\n/)[0];const delim=first.includes(';')&&!first.includes(',')?';':',';const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(quoted&&s[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(c===delim&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&s[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=''}else cell+=c}
 if(quoted)throw Error('CSV com aspas inválidas.');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows;
}
export function reportNumber(s:string){const v=s.trim().replace(/[€$£\s]/g,'');if(!v)return 0;const n=Number(v.includes(',')&&v.includes('.')?(v.lastIndexOf(',')>v.lastIndexOf('.')?v.replace(/\./g,'').replace(',','.'):v.replace(/,/g,'')):v.replace(',','.'));if(!Number.isFinite(n)||n<0)throw Error('Valor inválido: '+s.slice(0,30));return n}
