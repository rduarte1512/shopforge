'use client';

import { useState } from 'react';
import { Check, Zap, Star, Crown, Rocket, Building2, ShieldCheck, ArrowRight, Sparkles, Globe, Headphones, BarChart3 } from 'lucide-react';
import { useMockDB, SUBSCRIPTION_PLANS, SubscriptionTier } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { currentUser } = useMockDB();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (tier === user?.subscriptionTier) return;
    router.push(`/dashboard/subscription/checkout?plan=${tier}`);
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
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
      {/* Hero Header */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 mb-4"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Planos Flexíveis</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-[900] tracking-tight text-slate-900 leading-tight"
        >
          Tudo o que precisa para <span className="text-emerald-600">vender online</span> com sucesso.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-slate-500 font-medium"
        >
          Escolha o plano que melhor se adapta ao tamanho do seu negócio. Comece grátis e escale à medida que cresce.
        </motion.p>

        {/* Billing Toggle */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-4 mt-8"
        >
          <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>Mensal</span>
          <button 
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="w-14 h-7 bg-slate-200 rounded-full relative p-1 transition-colors"
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>
          <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-400'}`}>
            Anual <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">-20%</span>
          </span>
        </motion.div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {SUBSCRIPTION_PLANS.map((plan, index) => {
          const isCurrent = user?.subscriptionTier === plan.id;
          const isPro = plan.id === 'PRO';
          const displayedPrice = billingCycle === 'yearly' ? Math.floor(plan.price * 0.8) : plan.price;

          return (
            <motion.div 
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative flex flex-col bg-white rounded-[32px] p-8 border-2 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 ${
                isPro ? 'border-emerald-500 scale-105 z-10 shadow-xl ring-8 ring-emerald-50' : 'border-slate-100'
              }`}
            >
              {isPro && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase shadow-lg">
                  Mais Recomendado
                </div>
              )}

              <div className="space-y-6 flex-1">
                <div className="space-y-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${getColors(plan.id)}`}>
                    {getIcon(plan.id)}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">{plan.name}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{plan.description}</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">€{displayedPrice}</span>
                  <span className="text-slate-400 text-sm font-bold">/mês</span>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-1 bg-emerald-500 rounded-full p-0.5 flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={isCurrent || (plan.id === 'STARTER' && !isCurrent)}
                className={`w-full mt-10 py-4 rounded-2xl font-black text-[14px] transition-all flex items-center justify-center gap-2 border-none cursor-pointer group ${
                  isCurrent 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : plan.id === 'STARTER'
                    ? 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    : isPro
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 hover:scale-[1.02] active:scale-95'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {isCurrent ? 'Plano Atual' : (
                  <>
                    Selecionar {plan.name}
                    {!isCurrent && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Feature Section */}
      <div className="bg-slate-900 rounded-[48px] p-12 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full -ml-48 -mb-48" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Globe className="w-6 h-6 text-emerald-400" />
            </div>
            <h4 className="font-bold text-lg">Presença Global</h4>
            <p className="text-slate-400 text-sm leading-relaxed">Infraestrutura otimizada para carregamento ultra-rápido em qualquer parte do mundo.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="font-bold text-lg">Segurança Máxima</h4>
            <p className="text-slate-400 text-sm leading-relaxed">Certificados SSL incluídos em todos os planos e proteção contra ataques DDoS.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <h4 className="font-bold text-lg">Data-Driven</h4>
            <p className="text-slate-400 text-sm leading-relaxed">Tome decisões baseadas em dados reais com o nosso motor de analytics integrado.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Headphones className="w-6 h-6 text-amber-400" />
            </div>
            <h4 className="font-bold text-lg">Suporte de Elite</h4>
            <p className="text-slate-400 text-sm leading-relaxed">Equipa de especialistas pronta para ajudar a escalar o seu negócio a qualquer hora.</p>
          </div>
        </div>
      </div>

      {/* Trusted By / FAQ Hint */}
      <div className="text-center space-y-4 pb-12">
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Pagamentos Seguros Processados por</p>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-40 grayscale contrast-125">
           <div className="h-6 w-24 bg-slate-300 rounded" title="Stripe" />
           <div className="h-6 w-24 bg-slate-300 rounded" title="PayPal" />
           <div className="h-6 w-24 bg-slate-300 rounded" title="Visa" />
           <div className="h-6 w-24 bg-slate-300 rounded" title="Mastercard" />
           <div className="h-6 w-24 bg-slate-300 rounded" title="Revolut" />
        </div>
      </div>
    </div>
  );
}
