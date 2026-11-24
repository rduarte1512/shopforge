import Link from 'next/link';
import { LockKeyhole,ArrowRight } from 'lucide-react';
import { FEATURE_LABELS,FEATURE_MINIMUM,getPlan,type PlanFeature } from '@/lib/plans';
export default function PlanUpgrade({feature}:{feature:PlanFeature}){
 const plan=getPlan(FEATURE_MINIMUM[feature])!;
 return <section className="rounded-2xl border border-border bg-card-bg p-8 text-center sm:p-12"><div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600"><LockKeyhole size={25}/></div><p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Disponível no {plan.name} e superiores</p><h2 className="mt-3 text-2xl font-bold">{FEATURE_LABELS[feature]}</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-text-secondary">O teu plano atual não inclui esta ferramenta. Continua a gerir a tua loja normalmente ou consulta as subscrições para desbloquear mais funcionalidades.</p><Link href="/dashboard/subscription" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white">Comparar planos <ArrowRight size={16}/></Link></section>;
}
