'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { CheckCircle2, Loader2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'confirming' | 'success' | 'error'>('confirming');
  const [errorMessage, setErrorMessage] = useState('');

  const planId = searchParams.get('plan') as SubscriptionTier;
  const sessionId = searchParams.get('session_id');
  const plan = useMemo(() => SUBSCRIPTION_PLANS.find((p) => p.id === planId), [planId]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function confirmCheckout() {
      if (!sessionId) {
        router.replace('/dashboard/subscription');
        return;
      }

      try {
        setStatus('confirming');
        const response = await fetch('/api/stripe/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Não foi possível confirmar a subscrição.');
        }

        await refreshUser();
        setStatus('success');

        timer = setTimeout(() => {
          router.replace('/dashboard');
        }, 2600);
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error?.message || 'Não foi possível confirmar o pagamento.');
      }
    }

    void confirmCheckout();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [refreshUser, router, sessionId]);

  if (status === 'error') {
    return (
      <div className="max-w-xl mx-auto text-center space-y-8 py-12 px-6">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
          <div className="relative bg-red-500 text-white w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-red-100">
            <AlertCircle className="w-11 h-11" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-[900] text-slate-950">Pagamento ainda não confirmado</h1>
          <p className="text-slate-500 font-medium leading-relaxed">{errorMessage}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => router.replace('/dashboard/subscription')}
            className="px-6 py-3 rounded-2xl bg-slate-950 text-white font-black shadow-lg border-none cursor-pointer"
          >
            Voltar aos planos
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-2xl bg-white text-slate-700 font-black border border-slate-200 cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center space-y-8 py-12 px-6">
      <div className="relative mx-auto w-28 h-28">
        <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-40" />
        <div className="absolute inset-0 bg-emerald-200 rounded-full blur-2xl opacity-60" />
        <div className="relative bg-gradient-to-br from-emerald-400 to-emerald-600 text-white w-28 h-28 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200">
          {status === 'confirming' ? <Loader2 className="w-12 h-12 animate-spin" /> : <CheckCircle2 className="w-14 h-14" />}
        </div>
      </div>

      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-black text-xs uppercase tracking-widest">
          <Sparkles className="w-4 h-4" />
          {status === 'confirming' ? 'A confirmar pagamento' : 'Subscrição ativa'}
        </div>

        <h1 className="text-3xl md:text-5xl font-[900] tracking-tight text-slate-950">
          {status === 'confirming' ? 'Estamos a desbloquear o teu plano...' : 'Plano desbloqueado com sucesso!'}
        </h1>

        <p className="text-slate-500 text-lg font-medium leading-relaxed">
          {status === 'confirming'
            ? 'Estamos a validar a sessão diretamente com a Stripe. Não feches esta página.'
            : (
              <>
                Bem-vindo ao plano <span className="font-black text-emerald-600">{plan?.name ?? 'selecionado'}</span>. As funcionalidades premium já foram ativadas na tua conta.
              </>
            )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
        {['Pagamento verificado', 'Plano guardado na base de dados', 'Funcionalidades liberadas'].map((item) => (
          <div key={item} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-500 mb-2" />
            <p className="text-sm font-black text-slate-700">{item}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-slate-400 font-bold animate-pulse">
        {status === 'confirming' ? 'A confirmar...' : 'A redirecionar para o painel...'}
      </p>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="py-8 min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-white via-emerald-50/30 to-white">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-shopify-green" />
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
