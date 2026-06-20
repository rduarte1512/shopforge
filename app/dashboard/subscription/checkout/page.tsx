'use client';

import { useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@/lib/store';
import { CreditCard, ArrowLeft, ShieldCheck, CheckCircle2, Loader2, Wallet, Smartphone, Sparkles, LockKeyhole, BadgePercent, AlertCircle, ArrowRight } from 'lucide-react';

type PaymentMethod = 'card' | 'paypal' | 'revolut';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('plan') as SubscriptionTier;
  const billingCycle = searchParams.get('billing') === 'yearly' ? 'yearly' : 'monthly';
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const pricing = useMemo(() => {
    if (!plan) return null;
    const monthlyEquivalent = billingCycle === 'yearly' ? Math.round(plan.price * 0.8) : plan.price;
    const total = billingCycle === 'yearly' ? Math.round(plan.price * 12 * 0.8) : plan.price;
    const savings = billingCycle === 'yearly' ? Math.round(plan.price * 12 - total) : 0;

    return { monthlyEquivalent, total, savings };
  }, [billingCycle, plan]);

  const paymentOptions: Array<{
    id: PaymentMethod;
    label: string;
    description: string;
    badge: string;
    icon: typeof CreditCard;
  }> = [
    {
      id: 'card',
      label: 'Cartão',
      description: 'Visa, Mastercard e cartões compatíveis.',
      badge: 'Mais usado',
      icon: CreditCard,
    },
    {
      id: 'paypal',
      label: 'PayPal',
      description: 'Continua pela tua conta PayPal via Stripe.',
      badge: 'Carteira digital',
      icon: Wallet,
    },
    {
      id: 'revolut',
      label: 'Revolut Pay',
      description: 'Confirma o pagamento com Revolut Pay.',
      badge: 'Rápido',
      icon: Smartphone,
    },
  ];

  if (!plan || plan.id === 'STARTER' || !pricing) {
    return (
      <div className="max-w-xl mx-auto text-center p-10 bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-100">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-slate-950">Plano não encontrado</h2>
        <p className="text-slate-500 mt-2 font-medium">Volta à página de subscrições e escolhe um plano válido.</p>
        <button onClick={() => router.push('/dashboard/subscription')} className="mt-6 px-6 py-3 rounded-2xl bg-slate-950 text-white font-black border-none cursor-pointer">
          Voltar para planos
        </button>
      </div>
    );
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          interval: billingCycle,
          paymentMethod,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error(data.error || 'Não foi possível criar o checkout.');
    } catch (error: any) {
      console.error('Error:', error);
      setIsProcessing(false);
      setErrorMessage(error?.message || 'Ocorreu um erro ao processar o pagamento. Tenta novamente.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <button
        onClick={() => router.push('/dashboard/subscription')}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-bold border-none bg-transparent cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar aos planos
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="relative overflow-hidden bg-slate-950 text-white rounded-[36px] p-8 md:p-10 shadow-2xl shadow-slate-200">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.28),transparent_35%)]" />
            <div className="relative z-10 space-y-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-emerald-300 text-xs font-black uppercase tracking-widest">
                <Sparkles className="w-4 h-4" /> Checkout seguro
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl md:text-5xl font-[950] tracking-tight">Finalizar subscrição</h1>
                <p className="text-slate-300 font-medium leading-relaxed max-w-xl">
                  Vais ser redirecionado para a Stripe. Quando voltares ao ShopForge, validamos o pagamento no servidor e ativamos o plano automaticamente.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {['Stripe Checkout', 'SSL seguro', 'Ativação automática'].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-2xl bg-white/10 border border-white/10 px-4 py-3 text-sm font-bold text-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-100/70 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/70">
              <h2 className="text-xl font-black text-slate-950">Escolhe como queres pagar</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">O método escolhido será enviado para o checkout seguro da Stripe.</p>
            </div>

            <div className="p-6 md:p-8 space-y-5">
              <div className="grid grid-cols-1 gap-4">
                {paymentOptions.map((option) => {
                  const Icon = option.icon;
                  const selected = paymentMethod === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => setPaymentMethod(option.id)}
                      className={`group w-full text-left p-5 rounded-3xl border-2 transition-all flex items-center gap-4 cursor-pointer ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100/70'
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-md'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-slate-950">{option.label}</h3>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selected ? 'bg-white text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {option.badge}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mt-1">{option.description}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-200'}`}>
                        {selected && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {errorMessage && (
                <div className="flex items-start gap-3 bg-red-50 text-red-700 border border-red-100 rounded-2xl p-4 text-sm font-bold">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {errorMessage}
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-[900] text-[16px] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 border-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    A abrir Stripe...
                  </>
                ) : (
                  <>
                    Pagar €{pricing.total},00 na Stripe
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-slate-500 text-[12px] font-bold pt-1">
                <LockKeyhole className="w-4 h-4 text-emerald-500" />
                Os dados de pagamento são tratados pela Stripe, não ficam guardados no ShopForge.
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-100/70 overflow-hidden sticky top-24">
            <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-br from-emerald-50 to-white">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Resumo</p>
                  <h2 className="text-2xl font-[900] text-slate-950 mt-1">Plano {plan.name}</h2>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                  <BadgePercent className="w-7 h-7" />
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="rounded-3xl bg-slate-950 text-white p-6 space-y-2 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/20 blur-3xl rounded-full" />
                <p className="relative text-sm text-slate-300 font-bold">Equivalente mensal</p>
                <div className="relative flex items-end gap-1">
                  <span className="text-5xl font-black">€{pricing.monthlyEquivalent}</span>
                  <span className="text-slate-400 font-black mb-2">/mês</span>
                </div>
                <p className="relative text-xs text-slate-400 font-bold">
                  {billingCycle === 'yearly' ? `Cobrado anualmente: €${pricing.total},00` : 'Cobrado mensalmente'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold">Plano</span>
                  <span className="text-slate-950 font-black">{plan.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold">Faturação</span>
                  <span className="text-slate-950 font-black">{billingCycle === 'yearly' ? 'Anual' : 'Mensal'}</span>
                </div>
                {billingCycle === 'yearly' && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span className="font-bold">Desconto anual</span>
                    <span className="font-black">-€{pricing.savings},00</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold">IVA</span>
                  <span className="text-slate-950 font-black">€0,00</span>
                </div>
                <div className="flex justify-between pt-5 border-t border-slate-100 text-xl">
                  <span className="text-slate-950 font-black">Total hoje</span>
                  <span className="text-emerald-600 font-[950]">€{pricing.total},00</span>
                </div>
              </div>

              <div className="space-y-3 rounded-3xl bg-emerald-50/70 p-5 border border-emerald-100">
                {plan.features.slice(0, 5).map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-emerald-900 font-bold leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Podes cancelar a subscrição a qualquer momento. O acesso às funcionalidades do plano mantém-se enquanto a subscrição estiver ativa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-[80vh] py-8 px-4 bg-gradient-to-b from-white via-slate-50 to-white">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-shopify-green" />
        </div>
      }>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}
