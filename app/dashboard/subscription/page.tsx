'use client';

import { useState } from 'react';
import { Check, Zap, Star, Crown, Rocket, Building2, ShieldCheck, ArrowRight, Sparkles, Globe, Headphones, BarChart3, BadgePercent, CreditCard, LockKeyhole } from 'lucide-react';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (tier === user?.subscriptionTier) return;
    router.push(`/dashboard/subscription/checkout?plan=${tier}&billing=${billingCycle}`);
  };

  const getIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'STARTER': return <Rocket className="w-6 h-6" />;
      case 'GROWTH': return <Zap className="w-6 h-6" />;
      case 'PRO': return <Star className="w-6 h-6" />;
      case 'BUSINESS': return <Building2 className="w-6 h-6" />;
      case 'ENTERPRISE': return <Crown className="w-6 h-6" />;
      default: return <Rocket className="w-6 h-6" />;
    }
  };

  const getColors = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'STARTER': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'GROWTH': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'PRO': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'BUSINESS': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'ENTERPRISE': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 py-10 space-y-14 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-emerald-200/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-40 right-0 w-72 h-72 bg-blue-200/30 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative bg-slate-950 rounded-[44px] p-8 md:p-14 text-white overflow-hidden shadow-2xl shadow-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.28),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_30%)]" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-8 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-emerald-300 border border-white/10 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Planos flexíveis ShopForge</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-[950] tracking-tight leading-[1.02]"
            >
              Desbloqueia as ferramentas certas para vender mais.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-300 font-medium max-w-2xl leading-relaxed"
            >
              Escolhe o plano, paga com Stripe Checkout e quando voltares ao painel o teu plano fica ativado automaticamente na tua conta.
            </motion.p>

            <div className="flex flex-wrap gap-3 pt-2">
              {[
                ['Stripe seguro', CreditCard],
                ['Plano ativado após pagamento', LockKeyhole],
                ['Cancela quando quiseres', ShieldCheck],
              ].map(([label, Icon]) => (
                <div key={label as string} className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 text-sm font-bold text-slate-200">
                  <Icon className="w-4 h-4 text-emerald-300" />
                  {label as string}
                </div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="lg:col-span-4 bg-white/10 border border-white/10 backdrop-blur-xl rounded-[32px] p-6 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center">
                <BadgePercent className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-300 font-bold">Faturação</p>
                <p className="text-xl font-black">Poupa 20% no anual</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-950/60 rounded-2xl p-2 border border-white/10">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`py-3 rounded-xl font-black text-sm transition-all border-none cursor-pointer ${billingCycle === 'monthly' ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`py-3 rounded-xl font-black text-sm transition-all border-none cursor-pointer ${billingCycle === 'yearly' ? 'bg-emerald-400 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                Anual -20%
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              O checkout vai abrir na Stripe. Depois do pagamento, validamos a sessão no servidor e atualizamos o teu plano na base de dados.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        {SUBSCRIPTION_PLANS.map((plan, index) => {
          const isCurrent = user?.subscriptionTier === plan.id;
          const isPro = plan.id === 'PRO';
          const displayedPrice = billingCycle === 'yearly' ? Math.round(plan.price * 0.8) : plan.price;
          const yearlyTotal = Math.round(plan.price * 12 * 0.8);
          const isFree = plan.id === 'STARTER';

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`relative flex flex-col bg-white/90 backdrop-blur rounded-[34px] p-7 border transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-200/70 ${
                isPro ? 'border-emerald-400 shadow-xl ring-8 ring-emerald-50 z-10' : 'border-slate-100'
              }`}
            >
              {isPro && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-950 text-white px-5 py-2 rounded-full text-[10px] font-black tracking-widest uppercase shadow-xl whitespace-nowrap">
                  Mais recomendado
                </div>
              )}

              {isCurrent && (
                <div className="absolute top-5 right-5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                  Atual
                </div>
              )}

              <div className="space-y-6 flex-1">
                <div className="space-y-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${getColors(plan.id)}`}>
                    {getIcon(plan.id)}
                  </div>
                  <div>
                    <h3 className="text-xl font-[900] text-slate-950">{plan.name}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1 leading-relaxed">{plan.description}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-950">€{displayedPrice}</span>
                    <span className="text-slate-400 text-sm font-black">/mês</span>
                  </div>
                  {billingCycle === 'yearly' && !isFree && (
                    <p className="text-[11px] text-emerald-600 font-black">Cobrado €{yearlyTotal}/ano</p>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 bg-emerald-500 rounded-full p-0.5 flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-bold text-slate-600 leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isCurrent || isFree}
                className={`w-full mt-8 py-4 rounded-2xl font-black text-[14px] transition-all flex items-center justify-center gap-2 border-none cursor-pointer group ${
                  isCurrent
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : isFree
                    ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                    : isPro
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:scale-[1.02] active:scale-95'
                    : 'bg-slate-950 text-white hover:bg-slate-800'
                }`}
              >
                {isCurrent ? 'Plano atual' : isFree ? 'Incluído grátis' : (
                  <>
                    Selecionar {plan.name}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="relative bg-slate-950 rounded-[44px] p-8 md:p-12 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full -ml-48 -mb-48" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Globe className="w-6 h-6 text-emerald-400" />
            </div>
            <h4 className="font-bold text-lg">Presença Global</h4>
            <p className="text-slate-400 text-sm leading-relaxed">Infraestrutura otimizada para carregamento ultra-rápido.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="font-bold text-lg">Segurança Máxima</h4>
            <p className="text-slate-400 text-sm leading-relaxed">SSL incluído, sessão validada no backend e checkout seguro.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <h4 className="font-bold text-lg">Data-Driven</h4>
            <p className="text-slate-400 text-sm leading-relaxed">Analytics e dados para escalar decisões comerciais.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Headphones className="w-6 h-6 text-amber-400" />
            </div>
            <h4 className="font-bold text-lg">Suporte de Elite</h4>
            <p className="text-slate-400 text-sm leading-relaxed">Ajuda para configurar, vender e otimizar a loja.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
