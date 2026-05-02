'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMockDB, SUBSCRIPTION_PLANS, SubscriptionTier } from '@/lib/store';
import { CreditCard, ArrowLeft, ShieldCheck, CheckCircle2, Loader2, Wallet, Building2, Smartphone } from 'lucide-react';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser, updateSubscription } = useMockDB();
  const planId = searchParams.get('plan') as SubscriptionTier;
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'revolut'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!plan) {
    return (
      <div className="text-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-text-dark">Plano não encontrado</h2>
        <button onClick={() => router.push('/dashboard/subscription')} className="mt-4 text-shopify-green font-semibold">
          Voltar para planos
        </button>
      </div>
    );
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          price: plan.price,
          planName: plan.name,
          interval: plan.interval,
        }),
      });

      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error:', error);
      setIsProcessing(false);
      alert('Ocorreu um erro ao processar o pagamento. Tente novamente.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-6xl mx-auto">
      {/* Back Link */}
      <div className="lg:col-span-12">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-text-muted hover:text-shopify-green transition-colors font-medium border-none bg-transparent cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
      </div>

      {/* Payment Form */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-lg font-bold text-text-dark">Método de Pagamento</h2>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  paymentMethod === 'card' ? 'border-shopify-green bg-green-50/30' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-shopify-green' : 'text-gray-400'}`} />
                <span className={`text-[13px] font-bold ${paymentMethod === 'card' ? 'text-text-dark' : 'text-gray-400'}`}>Cartão</span>
              </button>
              
              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  paymentMethod === 'paypal' ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <Wallet className={`w-6 h-6 ${paymentMethod === 'paypal' ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className={`text-[13px] font-bold ${paymentMethod === 'paypal' ? 'text-text-dark' : 'text-gray-400'}`}>PayPal</span>
              </button>

              <button
                onClick={() => setPaymentMethod('revolut')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  paymentMethod === 'revolut' ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <Smartphone className={`w-6 h-6 ${paymentMethod === 'revolut' ? 'text-black' : 'text-gray-400'}`} />
                <span className={`text-[13px] font-bold ${paymentMethod === 'revolut' ? 'text-text-dark' : 'text-gray-400'}`}>Revolut</span>
              </button>
            </div>

            {paymentMethod === 'card' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-text-dark">Nome no Cartão</label>
                  <input type="text" placeholder="JOÃO SILVA" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-shopify-green/20 focus:border-shopify-green transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-text-dark">Número do Cartão</label>
                  <div className="relative">
                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-shopify-green/20 focus:border-shopify-green transition-all" />
                    <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-text-dark">Validade</label>
                    <input type="text" placeholder="MM / AA" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-shopify-green/20 focus:border-shopify-green transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-text-dark">CVC</label>
                    <input type="text" placeholder="123" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-shopify-green/20 focus:border-shopify-green transition-all" />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'paypal' && (
              <div className="p-8 text-center bg-blue-50/50 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[14px] text-blue-800 font-medium">
                  Será redirecionado para o site seguro do PayPal para completar a sua subscrição.
                </p>
              </div>
            )}

            {paymentMethod === 'revolut' && (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[14px] text-gray-800 font-medium">
                  A abrir a aplicação Revolut para confirmar o pagamento.
                </p>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full py-4 bg-shopify-green text-white rounded-xl font-[800] text-[16px] hover:opacity-95 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-3 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  A processar...
                </>
              ) : (
                `Pagar €${plan.price},00 agora`
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-text-muted text-[12px] font-medium pt-2">
              <ShieldCheck className="w-4 h-4 text-shopify-green" />
              Transação Segura SSL de 256 bits
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-lg font-bold text-text-dark">Resumo da Encomenda</h2>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-bold text-text-dark text-[16px]">Plano {plan.name}</p>
                <p className="text-[13px] text-text-muted">Faturação Mensal</p>
              </div>
              <p className="font-bold text-text-dark text-[16px]">€{plan.price},00</p>
            </div>

            <div className="space-y-3 pt-6 border-t border-gray-50">
              <div className="flex justify-between text-[14px]">
                <span className="text-text-muted font-medium">Subtotal</span>
                <span className="text-text-dark font-bold">€{plan.price},00</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span className="text-text-muted font-medium">IVA (0%)</span>
                <span className="text-text-dark font-bold">€0,00</span>
              </div>
              <div className="flex justify-between pt-4 text-[18px]">
                <span className="text-text-dark font-extrabold">Total</span>
                <span className="text-shopify-green font-[900]">€{plan.price},00</span>
              </div>
            </div>

            <div className="bg-green-50/50 p-4 rounded-xl border border-green-100/50">
              <p className="text-[12px] text-green-800 leading-relaxed font-medium">
                Pode cancelar a sua subscrição a qualquer momento. O acesso às funcionalidades do plano {plan.name} manter-se-á até ao fim do período de faturação atual.
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
    <div className="py-8">
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
