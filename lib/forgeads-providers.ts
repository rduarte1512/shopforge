
import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
export type Provider='meta'|'google';
export type Credentials={access:string;refresh?:string;expires:number};
export type AdAccount={id:string;name:string;currency?:string};
export type RemoteCampaign={id:string;name:string;status:string;type:string;currency:string;cost:number|null;impressions:number|null;clicks:number|null};
export function isProvider(v:unknown):v is Provider{return v==='meta'||v==='google'}
function key(){const k=process.env.ADS_ENCRYPTION_KEY||'';if(!/^[a-f0-9]{64}$/i.test(k))throw Error('Configura a chave de encriptação ForgeAds.');return Buffer.from(k,'hex')}
export function seal(value:unknown,scope:string){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key(),iv);c.setAAD(Buffer.from(scope));return [iv.toString('hex'),Buffer.concat([c.update(JSON.stringify(value),'utf8'),c.final()]).toString('hex'),c.getAuthTag().toString('hex')].join('.')}
export function open<T>(value:string,scope:string):T{const [iv,data,tag]=value.split('.');const c=createDecipheriv('aes-256-gcm',key(),Buffer.from(iv,'hex'));c.setAAD(Buffer.from(scope));c.setAuthTag(Buffer.from(tag,'hex'));return JSON.parse(Buffer.concat([c.update(Buffer.from(data,'hex')),c.final()]).toString('utf8'))}
export function appOrigin(){const v=new URL(process.env.ADS_APP_URL||'');if(v.protocol!=='https:'&&v.hostname!=='localhost')throw Error('URL ForgeAds inválido.');return v.origin}
export function callback(p:Provider){return appOrigin()+'/api/ads/'+p+'/callback'}
function metaVersion(){const v=process.env.META_ADS_API_VERSION||'v27.0';if(!/^v\d+\.\d+$/.test(v))throw Error('Versão Meta inválida.');return v}
function googleVersion(){const v=process.env.GOOGLE_ADS_API_VERSION||'v26';if(!/^v\d+$/.test(v))throw Error('Versão Google inválida.');return v}
export function configured(p:Provider){try{key();appOrigin();return p==='meta'?Boolean(process.env.META_ADS_APP_ID&&process.env.META_ADS_APP_SECRET):Boolean(process.env.GOOGLE_ADS_CLIENT_ID&&process.env.GOOGLE_ADS_CLIENT_SECRET)}catch{return false}}
export function authorization(p:Provider,state:string,challenge:string){
 if(!configured(p))throw Error('Integração por configurar.');
 const url=new URL(p==='meta'?'https://www.facebook.com/'+metaVersion()+'/dialog/oauth':'https://accounts.google.com/o/oauth2/v2/auth');
 const params:Record<string,string>=p==='meta'?{client_id:process.env.META_ADS_APP_ID!,scope:'ads_read'}:{client_id:process.env.GOOGLE_ADS_CLIENT_ID!,scope:'https://www.googleapis.com/auth/adwords',access_type:'offline',prompt:'consent',code_challenge:challenge,code_challenge_method:'S256'};
 for(const [k,v] of Object.entries({...params,state,redirect_uri:callback(p),response_type:'code'}))url.searchParams.set(k,v);
 return url;
}
async function request(url:string,init:RequestInit={}){const res=await fetch(url,{...init,cache:'no-store',signal:AbortSignal.timeout(15000)});if(!res.ok)throw Error('A plataforma recusou o pedido (HTTP '+res.status+'). Confirma as permissões e a ligação.');return res.json()}
async function googleToken(params:Record<string,string>){return request('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({...params,client_id:process.env.GOOGLE_ADS_CLIENT_ID!,client_secret:process.env.GOOGLE_ADS_CLIENT_SECRET!})})}
export async function exchange(p:Provider,code:string,verifier:string):Promise<Credentials>{
 let d:any;
 if(p==='google')d=await googleToken({code,code_verifier:verifier,grant_type:'authorization_code',redirect_uri:callback(p)});
 else{const u='https://graph.facebook.com/'+metaVersion()+'/oauth/access_token';const q=new URLSearchParams({client_id:process.env.META_ADS_APP_ID!,client_secret:process.env.META_ADS_APP_SECRET!,redirect_uri:callback(p),code});d=await request(u+'?'+q);
 if(d.access_token){const long=new URLSearchParams({grant_type:'fb_exchange_token',client_id:process.env.META_ADS_APP_ID!,client_secret:process.env.META_ADS_APP_SECRET!,fb_exchange_token:d.access_token});d=await request(u+'?'+long)}}
 if(!d.access_token)throw Error('A plataforma não devolveu autorização.');
 return {access:d.access_token,refresh:d.refresh_token,expires:Date.now()+Number(d.expires_in||3600)*1000};
}
export async function fresh(p:Provider,c:Credentials):Promise<Credentials>{if(c.expires>Date.now()+60000)return c;if(p==='google'&&c.refresh){const d=await googleToken({grant_type:'refresh_token',refresh_token:c.refresh});if(!d.access_token)throw Error('Volta a ligar a conta.');return {...c,access:d.access_token,expires:Date.now()+Number(d.expires_in||3600)*1000}}throw Error('A ligação expirou. Volta a ligar a conta.')}
function graph(path:string,params:Record<string,string>,access:string){return request('https://graph.facebook.com/'+metaVersion()+'/'+path+'?'+new URLSearchParams(params),{headers:{Authorization:'Bearer '+access}})}
function google(path:string,access:string,body?:object){const headers:Record<string,string>={Authorization:'Bearer '+access,'Content-Type':'application/json'};if(process.env.GOOGLE_ADS_DEVELOPER_TOKEN)headers['developer-token']=process.env.GOOGLE_ADS_DEVELOPER_TOKEN;return request('https://googleads.googleapis.com/'+googleVersion()+'/'+path,{headers,...(body?{method:'POST',body:JSON.stringify(body)}:{})})}
export async function accounts(p:Provider,access:string):Promise<AdAccount[]>{
 if(p==='meta'){const d=await graph('me/adaccounts',{fields:'id,name,currency',limit:'100'},access);return (d.data||[]).filter((x:any)=>/^act_\d+$/.test(x.id)).map((x:any)=>({id:x.id,name:x.name||x.id,currency:x.currency}))}
 const d=await google('customers:listAccessibleCustomers',access);return (d.resourceNames||[]).map((x:string)=>x.split('/')[1]).filter((x:string)=>/^\d{10}$/.test(x)).map((id:string)=>({id,name:'Conta '+id}));
}
const numberOrNull=(v:unknown)=>v===undefined||v===null||v===''?null:Number.isFinite(Number(v))?Number(v):null;
export async function campaigns(p:Provider,access:string,account:AdAccount):Promise<RemoteCampaign[]>{
 if(p==='meta'){const d=await graph(account.id+'/campaigns',{fields:'id,name,effective_status,objective,insights.date_preset(last_30d){spend,impressions,clicks}',limit:'100'},access);return (d.data||[]).map((x:any)=>({id:x.id,name:x.name,status:x.effective_status,type:x.objective,currency:account.currency||'',cost:numberOrNull(x.insights?.data?.[0]?.spend),impressions:numberOrNull(x.insights?.data?.[0]?.impressions),clicks:numberOrNull(x.insights?.data?.[0]?.clicks)}))}
 const d=await google('customers/'+account.id+'/googleAds:searchStream',access,{query:"SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, customer.currency_code, metrics.cost_micros, metrics.impressions, metrics.clicks FROM campaign WHERE segments.date DURING LAST_30_DAYS LIMIT 100"});return (Array.isArray(d)?d:[]).flatMap((x:any)=>x.results||[]).map((x:any)=>({id:x.campaign.id,name:x.campaign.name,status:x.campaign.status,type:x.campaign.advertisingChannelType,currency:x.customer?.currencyCode||'',cost:x.metrics?.costMicros==null?null:Number(x.metrics.costMicros)/1e6,impressions:numberOrNull(x.metrics?.impressions),clicks:numberOrNull(x.metrics?.clicks)}))
}
