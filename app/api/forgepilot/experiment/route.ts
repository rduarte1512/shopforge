import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { experimentVariant } from '@/lib/forgepilot-pro';

export const dynamic='force-dynamic';
const domainPattern=/^[a-z0-9-]+(?:\.[a-z0-9.-]+)?$/i;
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request:Request) {
  const domain=new URL(request.url).searchParams.get('domain')||'';
  if(domain.length>100||!domainPattern.test(domain))return json({experiment:null},400);
  try {
    const {rows}=await sql.query("SELECT x.id,x.original_title,x.variant_title FROM forgepilot_experiments x JOIN stores s ON s.id=x.store_id WHERE s.domain=$1 AND x.ended_at IS NULL AND x.started_at>now()-interval '30 days' AND s.customization->>'layoutEngine'='adaptive-v1' LIMIT 1",[domain]);
    const x=rows[0];
    return json({experiment:x?{id:String(x.id),a:String(x.original_title),b:String(x.variant_title)}:null});
  }catch{return json({experiment:null});}
}
export async function POST(request:Request) {
  if(request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Origem inválida'},403);
  try{
    const origin=request.headers.get('origin');
    if(origin&&new URL(origin).host!==new URL(request.url).host)return json({error:'Origem inválida'},403);
    if(Number(request.headers.get('content-length')||0)>1000)return json({error:'Pedido demasiado grande'},413);
    const body=await request.text();if(body.length>1000)return json({error:'Pedido demasiado grande'},413);
    const {domain,visitorId,experimentId}=JSON.parse(body);
    if(typeof domain!=='string'||domain.length>100||!domainPattern.test(domain)||typeof visitorId!=='string'||!uuidPattern.test(visitorId)||typeof experimentId!=='string'||!uuidPattern.test(experimentId))return json({error:'Pedido inválido'},400);
    // Require an existing consented traffic session for this pseudonym.
    // A visitor is assigned once, deterministically, never by a client-supplied group.
    await sql.query("INSERT INTO forgepilot_exposures(experiment_id,visitor_id,variant) SELECT x.id,$2,$3 FROM forgepilot_experiments x JOIN stores s ON s.id=x.store_id WHERE x.id=$1 AND s.domain=$4 AND x.ended_at IS NULL AND x.started_at>now()-interval '30 days' AND EXISTS(SELECT 1 FROM store_traffic_sessions t WHERE t.store_id=s.id AND t.visitor_id=$2 AND t.last_seen>=now()-interval '1 day') ON CONFLICT DO NOTHING",[experimentId,visitorId,experimentVariant(visitorId),domain]);
    return json({ok:true});
  }catch{return json({error:'Não foi possível registar'},400);}
}
