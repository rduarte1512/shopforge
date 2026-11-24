import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';
import { effectiveForgePlan, hasFeature, FEATURE_MINIMUM, FEATURE_LABELS, getPlan, type PlanFeature } from './plans';
export async function accountPlan(userId:string){
 const {rows}=await sql.query('SELECT subscription_tier,subscription_status FROM profiles WHERE id=$1',[userId]);
 const p=rows[0];return effectiveForgePlan(p?.subscription_tier,p?.subscription_status);
}
export async function requireFeature(feature:PlanFeature,userId?:string){
 const id=userId??(await auth()).userId;
 if(!id)throw Error('Inicia sessão.');
 const plan=await accountPlan(id);
 if(!hasFeature(plan.id,'active',feature))throw Error(FEATURE_LABELS[feature]+' disponível a partir do plano '+getPlan(FEATURE_MINIMUM[feature])?.name+'.');
 return {userId:id,plan};
}
export async function requireOwnedStore(userId:string,storeId:string){
 const {rows}=await sql.query('SELECT id FROM stores WHERE id=$1 AND user_id=$2',[storeId,userId]);
 if(!rows.length)throw Error('Não tens acesso a esta loja.');
}
