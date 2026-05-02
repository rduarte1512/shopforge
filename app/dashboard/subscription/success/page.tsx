'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMockDB, SubscriptionTier, SUBSCRIPTION_PLANS } from '@/lib/store';
import { CheckCircle2, Loader2 } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser, updateSubscription } = useMockDB();
  
  const planId = searchParams.get('plan') as SubscriptionTier;
  const sessionId = searchParams.get('session_id');
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);

  useEffect(() => {
    if (sessionId && planId && currentUser) {
      updateSubscription(currentUser.id, planId);
      
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

      return () => clearTimeout(timer);
    } else if (!sessionId) {
      router.push('/dashboard/subscription');
    }
  }, [sessionId, planId, currentUser, updateSubscription, router]);

  if (!plan) return null;

  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-12 mt-12">
      <div className="relative">
        <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20 scale-150" />
        <div className="relative bg-green-500 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg">
          <CheckCircle2 className="w-10 h-10" />
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-[800] text-text-dark">Pagamento Confirmado!</h1>
        <p className="text-text-muted">
          Bem-vindo ao plano <span className="font-bold text-shopify-green">{plan.name}</span>. 
          Todas as funcionalidades já estão desbloqueadas.
        </p>
      </div>
      <p className="text-[14px] text-text-muted animate-pulse">
        A redirecionar para o painel de controlo...
      </p>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="py-8 min-h-[60vh] flex items-center justify-center">
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
