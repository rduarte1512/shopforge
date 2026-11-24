import { sql } from '@vercel/postgres';
import { randomUUID } from 'node:crypto';
import { effectiveForgePlan, FORGE_TOKEN_COSTS, FORGE_OPERATION_FEATURE, hasFeature, type ForgeOperation } from './plans';

export class ForgeTokenError extends Error {
  constructor(message:string){super(message);this.name='ForgeTokenError';}
}
const periodSql="date_trunc('month',now() at time zone 'UTC')::date";
async function reserve(userId:string,operation:ForgeOperation){
  const client=await sql.connect();
  const id=randomUUID();
  try{
    await client.query('BEGIN');
    // Lock the account across stores and concurrent requests. Profile changes use the same row lock.
    const profile=(await client.query('SELECT subscription_tier,subscription_status FROM profiles WHERE id=$1 FOR UPDATE',[userId])).rows[0];
    if(!profile)throw new ForgeTokenError('Abre a tua conta antes de usar o ForgePilot.');
    const plan=effectiveForgePlan(profile.subscription_tier,profile.subscription_status);
    const feature=FORGE_OPERATION_FEATURE[operation];
    if(feature&&!hasFeature(plan.id,'active',feature))throw new ForgeTokenError('Esta geração requer um plano superior. Consulta os planos ShopForge.');
    const cost=FORGE_TOKEN_COSTS[operation];
    const {rows}=await client.query("SELECT coalesce(sum(tokens) FILTER (WHERE period_start="+periodSql+" AND status <> 'refunded'),0)::int AS used,count(*) FILTER (WHERE created_at>=now()-interval '24 hours')::int AS attempts FROM forgepilot_token_ledger WHERE user_id=$1 AND (period_start="+periodSql+" OR created_at>=now()-interval '24 hours')",[userId]);
    if(Number(rows[0].used)+cost>plan.tokens)throw new ForgeTokenError('Tokens insuficientes. Consulta o saldo ou escolhe um plano com mais tokens.');
    if(Number(rows[0].attempts)>=250)throw new ForgeTokenError('Limite de segurança de 250 tentativas em 24 horas atingido. Tenta mais tarde.');
    await client.query("INSERT INTO forgepilot_token_ledger(id,user_id,period_start,operation,tokens,status) VALUES($1,$2,"+periodSql+",$3,$4,'reserved')",[id,userId,operation,cost]);
    await client.query('COMMIT');
    return id;
  }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
}
async function settle(id:string,status:'spent'|'refunded'){
  await sql.query("UPDATE forgepilot_token_ledger SET status=$2,settled_at=now() WHERE id=$1 AND status='reserved'",[id,status]);
}
export async function withForgeTokens<T>(userId:string,operation:ForgeOperation,generate:()=>Promise<T>):Promise<T>{
  const id=await reserve(userId,operation);
  let value:T;
  try{value=await generate();}catch(e){
    await settle(id,'refunded');throw e;
  }
  // A failed settlement retains the reservation rather than allowing free unlimited calls.
  await settle(id,'spent');
  return value;
}
export async function getForgeTokenWallet(userId:string){
  const {rows}=await sql.query("SELECT p.subscription_tier,p.subscription_status,coalesce((SELECT sum(tokens) FROM forgepilot_token_ledger WHERE user_id=p.id AND period_start="+periodSql+" AND status <> 'refunded'),0)::int AS used,(date_trunc('month',now() at time zone 'UTC')+interval '1 month')::date::text AS renews FROM profiles p WHERE p.id=$1",[userId]);
  if(!rows[0])throw new ForgeTokenError('Perfil indisponível.');
  const row=rows[0];const plan=effectiveForgePlan(row.subscription_tier,row.subscription_status);
  const recent=await sql.query("SELECT id,operation,tokens,status,created_at FROM forgepilot_token_ledger WHERE user_id=$1 AND period_start="+periodSql+" ORDER BY created_at DESC LIMIT 12",[userId]);
  return {tier:plan.id,plan:plan.name,limit:plan.tokens,used:Number(row.used),remaining:Math.max(0,plan.tokens-Number(row.used)),renews:String(row.renews),recent:recent.rows.map(r=>({id:String(r.id),operation:r.operation as ForgeOperation,tokens:Number(r.tokens),status:String(r.status),date:new Date(r.created_at).toISOString()}))};
}
