import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { reasons } from '@/components/landing/reasons';
import { WhyDetail } from '@/components/landing/WhyShopForge';

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams(){return reasons.map(r=>({slug:r.slug}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params;const reason=reasons.find(r=>r.slug===slug);
  return reason?{title:reason.title+' | ShopForge',description:reason.description}:{title:'ShopForge'};
}
export default async function Page({params}:Props){
  const {slug}=await params;const reason=reasons.find(r=>r.slug===slug);
  if(!reason)notFound();
  return <WhyDetail reason={reason}/>;
}
