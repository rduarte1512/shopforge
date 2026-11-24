
import {NextRequest,NextResponse} from 'next/server';
import {randomBytes,createHash} from 'node:crypto';
import {sql} from '@vercel/postgres';
import {requireFeature,requireOwnedStore} from '@/lib/plan-access';
import {appOrigin,authorization,exchange,isProvider,open,seal,type Provider} from '@/lib/forgeads-providers';
export const runtime='nodejs';
type State={nonce:string;verifier:string;storeId:string;userId:string;provider:Provider;until:number};
const cookie='__Host-forgeads-state';
export async function GET(req:NextRequest,{params}:{params:Promise<{provider:string;operation:string}>}){
 const {provider,operation}=await params;if(!isProvider(provider)||!['connect','callback'].includes(operation))return new NextResponse('Not found',{status:404});
 let origin:string;try{origin=appOrigin()}catch{return new NextResponse('ForgeAds por configurar.',{status:503})}
 const back=(status:string)=>{const r=NextResponse.redirect(origin+'/dashboard/ads?connection='+status);r.cookies.set(cookie,'',{path:'/',secure:true,httpOnly:true,maxAge:0,sameSite:'lax'});return r};
 try{
 const {userId}=await requireFeature('ads');
 if(operation==='connect'){const storeId=req.nextUrl.searchParams.get('store')||'';await requireOwnedStore(userId,storeId);const nonce=randomBytes(32).toString('base64url'),verifier=randomBytes(48).toString('base64url');const state:State={nonce,verifier,storeId,userId,provider,until:Date.now()+600000};const r=NextResponse.redirect(authorization(provider,nonce,createHash('sha256').update(verifier).digest('base64url')));r.cookies.set(cookie,seal(state,'oauth-state'),{path:'/',httpOnly:true,secure:true,sameSite:'lax',maxAge:600});return r}
 const state=open<State>(req.cookies.get(cookie)?.value||'','oauth-state');if(state.userId!==userId||state.provider!==provider||state.until<Date.now()||state.nonce!==req.nextUrl.searchParams.get('state'))return back('invalid');
 await requireOwnedStore(userId,state.storeId);const code=req.nextUrl.searchParams.get('code');if(!code)return back('cancelled');const c=await exchange(provider,code,state.verifier);
 await sql.query('INSERT INTO forgeads_connections(store_id,user_id,provider,secret) VALUES($1,$2,$3,$4) ON CONFLICT(store_id,provider) DO UPDATE SET user_id=excluded.user_id,secret=excluded.secret,updated_at=now()',[state.storeId,userId,provider,seal(c,state.storeId+':'+userId+':'+provider)]);return back('success');
 }catch{return back('error')}
}
