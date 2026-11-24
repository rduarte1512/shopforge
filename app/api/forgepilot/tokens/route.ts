import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getForgeTokenWallet } from '@/lib/forgepilot-tokens';
export const dynamic='force-dynamic';
export async function GET(){
 const {userId}=await auth();
 if(!userId)return NextResponse.json({error:'Não autenticado.'},{status:401});
 try{return NextResponse.json(await getForgeTokenWallet(userId),{headers:{'Cache-Control':'private, no-store'}});}
 catch{return NextResponse.json({error:'Não foi possível consultar os tokens.'},{status:503});}
}
