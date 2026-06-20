'use client';

import { 
  getStorefrontDataAction, 
  getShippingMethodsAction,
  getCouponsAction,
  checkCouponAction,
  createOrderAction,
  getAffiliateByCodeAction
} from '@/lib/actions';
import { getEnabledPaymentMethods, StorefrontPaymentMethod } from '@/lib/payment-methods';
import { useParams } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import { useCurrency } from '@/hooks/useCurrency';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Ticket, Truck, AlertCircle, CheckCircle2, Wallet, Building, Smartphone, CreditCard as CardIcon, Banknote, Loader2, ShieldCheck, LockKeyhole, ArrowLeft, Sparkles } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

function PaymentIcon({ method, selected }: { method: StorefrontPaymentMethod; selected: boolean }) {
  const className = `w-5 h-5 ${selected ? 'text-white' : 'text-slate-700'}`;

  if (method.type === 'multibanco') return <Building className={className} />;
  if (method.type === 'mbway') return <Smartphone className={className} />;
  if (method.type === 'transfer') return <Banknote className={className} />;
  if (method.type === 'cash') return <Wallet className={className} />;
  if (method.type === 'revolut') return <Sparkles className={className} />;
  return <CardIcon className={className} />;
}

export default function CartPage() {
  const params = useParams() as { domain: string };
  const { items, removeItem, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  
  const [selectedShippingId, setSelectedShippingId] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState('');
  const [paymentInfo, setPaymentInfo] = useState<{ name: string; instructions: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!params.domain) return;
      
      try {
        const storefrontData = await getStorefrontDataAction(params.domain);
        if (!storefrontData) throw new Error('Store not found');
        setStore(storefrontData.store);
        setProducts(storefrontData.products || []);

        const [shippingData, couponsData] = await Promise.all([
          getShippingMethodsAction(storefrontData.store.id),
          getCouponsAction(storefrontData.store.id)
        ]);

        setShippingMethods(shippingData.filter((m: any) => m.active !== false));
        setCoupons(couponsData.filter((c: any) => c.active !== false));
        
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [params.domain]);

  const paymentMethods = useMemo(() => {
    return getEnabledPaymentMethods(
      store?.payment_methods ||
      store?.paymentMethods ||
      store?.customization?.paymentMethods ||
      store?.customization?.payment_methods
    );
  }, [store]);

  const cartItems = useMemo(() => items.map(item => {
    const product = products.find(p => p.id === item.productId);
    return { ...item, product };
  }).filter(item => item.product), [items, products]);

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + (price * item.quantity);
  }, 0), [cartItems]);

  const selectedShipping = useMemo(() => shippingMethods.find((m: any) => m.id === selectedShippingId) || shippingMethods[0], [selectedShippingId, shippingMethods]);
  const selectedPayment = useMemo(() => paymentMethods.find(method => method.id === selectedPaymentId) || paymentMethods[0], [selectedPaymentId, paymentMethods]);
  
  const shippingCost = useMemo(() => {
    if (!selectedShipping) return 0;
    if (selectedShipping.min_order_for_free && subtotal >= Number(selectedShipping.min_order_for_free)) return 0;
    return Number(selectedShipping.cost) || 0;
  }, [selectedShipping, subtotal]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === 'percentage') {
      return subtotal * (Number(appliedCoupon.discount_value) / 100);
    }
    return Number(appliedCoupon.discount_value) || 0;
  }, [appliedCoupon, subtotal]);

  const total = Math.max(0, subtotal + shippingCost - discountAmount);

  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!store) return;

    try {
      const coupon = await checkCouponAction(store.id, couponCode);

      if (!coupon) {
        setCouponError('Cupão inválido ou expirado.');
        setAppliedCoupon(null);
        return;
      }

      if (subtotal < Number(coupon.min_purchase)) {
        setCouponError(`Compra mínima de ${formatPrice(Number(coupon.min_purchase))} necessária.`);
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon(coupon);
    } catch (err) {
      setCouponError('Erro ao aplicar cupão.');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipping) {
      alert('Por favor, selecione um método de envio.');
      return;
    }
    if (!selectedPayment) {
      alert('Por favor, selecione um método de pagamento.');
      return;
    }
    setIsCheckingOut(true);

    try {
      const refCode = sessionStorage.getItem('affiliate_ref');
      let affiliateLinkId = null;
      
      if (refCode && store) {
        const linkData = await getAffiliateByCodeAction(store.id, refCode);
        if (linkData) {
          affiliateLinkId = linkData.id;
        }
      }

      const orderItemsData = cartItems.map(i => ({
        product_id: i.productId,
        quantity: i.quantity,
        price: Number(i.product.price)
      }));

      const orderData: any = {
        store_id: store.id,
        customer_name: formData.name,
        customer_email: formData.email,
        status: 'pending',
        subtotal: subtotal,
        total: total,
        shipping_cost: shippingCost,
        discount_amount: discountAmount,
        coupon_id: appliedCoupon?.id || null,
        shipping_method_id: selectedShipping.id,
        currency: 'EUR',
        payment_method_id: selectedPayment.id,
        payment_method_type: selectedPayment.type,
        payment_instructions: selectedPayment.instructions || null,
        affiliate_link_id: affiliateLinkId
      };

      await createOrderAction(orderData, orderItemsData);

      clearCart();
      setPaymentInfo({
        name: selectedPayment.name,
        instructions: selectedPayment.instructions || ''
      });
      setSuccess(true);
    } catch (error: any) {
      console.error('Error saving order:', error?.message || error);
      alert(`Erro ao processar encomenda: ${error?.message || 'Tente novamente.'}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-black/5 border border-slate-100">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (!store) return null;

  if (success) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_35%),linear-gradient(180deg,#ffffff,#f8fafc)] px-6 py-24">
        <div className="max-w-3xl mx-auto text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600 shadow-2xl shadow-emerald-500/10">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Encomenda confirmada.</h1>
          <p className="text-slate-500 mb-8 text-lg max-w-md mx-auto">A sua encomenda foi registada com sucesso. Guarde as instruções de pagamento abaixo para concluir o processo.</p>
          {paymentInfo && paymentInfo.instructions && (
            <div className="bg-white rounded-[2rem] p-7 mb-10 text-left max-w-xl mx-auto border border-slate-100 shadow-2xl shadow-black/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: store.primary_color }}>
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-black">Pagamento escolhido</p>
                  <h3 className="font-black text-lg">{paymentInfo.name}</h3>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm">{paymentInfo.instructions}</p>
            </div>
          )}
          <Link 
            href={`/s/${store.domain}`}
            className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl text-white font-black hover:opacity-90 transition-all shadow-xl shadow-black/10"
            style={{ backgroundColor: store.primary_color }}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar à Loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_30%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-10 lg:py-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <Link href={`/s/${store.domain}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950 transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              Continuar a comprar
            </Link>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-4">
              <ShieldCheck className="w-4 h-4" style={{ color: store.primary_color }} />
              Checkout seguro
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-950">Carrinho</h1>
            <p className="text-slate-500 font-semibold mt-3">{cartItems.length} {cartItems.length === 1 ? 'item selecionado' : 'itens selecionados'} para finalizar a compra.</p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-3xl bg-white border border-slate-100 p-2 shadow-xl shadow-black/5 w-full lg:w-auto">
            {['Carrinho', 'Envio', 'Pagamento'].map((step, index) => (
              <div key={step} className={`px-4 py-3 rounded-2xl text-center text-xs font-black ${index === 2 ? 'text-white' : 'text-slate-500 bg-slate-50'}`} style={index === 2 ? { backgroundColor: store.primary_color } : undefined}>
                {step}
              </div>
            ))}
          </div>
        </div>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-28 bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-black/5">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-9 h-9 text-slate-300" />
            </div>
            <p className="text-2xl font-black text-slate-900 mb-3">O seu carrinho está vazio.</p>
            <p className="text-slate-500 mb-8">Explore a loja e adicione produtos para continuar.</p>
            <Link 
              href={`/s/${store.domain}`}
              className="inline-block px-10 py-4 rounded-2xl text-white font-black hover:opacity-90 transition-all shadow-xl shadow-black/10"
              style={{ backgroundColor: store.primary_color }}
            >
              Começar a Comprar
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12">
            <div className="lg:col-span-7 space-y-8">
              <div className="bg-white border border-slate-100 rounded-[2rem] shadow-2xl shadow-black/5 overflow-hidden">
                <div className="px-6 md:px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-black">Produtos</p>
                    <h2 className="text-2xl font-black text-slate-950">A sua seleção</h2>
                  </div>
                  <span className="text-sm font-black text-slate-400">{cartItems.length} itens</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {cartItems.map((item) => (
                    <div key={`${item.productId}-${item.variantId || 'base'}`} className="p-6 md:p-8 flex gap-5 md:gap-7 group">
                      <div className="w-28 h-32 md:w-36 md:h-44 relative rounded-3xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-sm">
                        {item.product!.image_url && <Image src={item.product!.image_url} alt={item.product!.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div className="flex justify-between gap-4 items-start">
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 truncate">{item.product!.category}</p>
                            <h3 className="font-black text-xl md:text-2xl leading-tight text-slate-950">{item.product!.name}</h3>
                            <p className="text-sm font-bold mt-3 text-slate-500">Quantidade: {item.quantity}</p>
                          </div>
                          <p className="font-black text-xl md:text-2xl whitespace-nowrap text-slate-950">{formatPrice(Number(item.product!.price) * item.quantity)}</p>
                        </div>
                        <button 
                          onClick={() => removeItem(item.productId, item.variantId)} 
                          className="text-xs font-black text-slate-300 hover:text-rose-500 flex items-center gap-2 transition-colors w-fit mt-6 uppercase tracking-[0.15em]"
                        >
                          <Trash2 className="w-4 h-4" /> Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-[2rem] shadow-2xl shadow-black/5 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-black">Passo 1</p>
                    <h2 className="text-xl font-black text-slate-950">Opções de Envio</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {shippingMethods.map(method => {
                    const selected = selectedShipping?.id === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedShippingId(method.id)}
                        className={`p-5 rounded-3xl border text-left transition-all ${
                          selected
                            ? 'text-white shadow-2xl shadow-black/10 scale-[1.01]'
                            : 'border-slate-100 hover:border-slate-200 bg-slate-50 hover:bg-white text-slate-900'
                        }`}
                        style={selected ? { backgroundColor: store.primary_color, borderColor: store.primary_color } : undefined}
                      >
                        <div className="flex justify-between items-center mb-2 gap-3">
                          <p className="font-black">{method.name}</p>
                          <p className="font-black">
                            {method.min_order_for_free && subtotal >= Number(method.min_order_for_free) ? 'Grátis' : formatPrice(Number(method.cost))}
                          </p>
                        </div>
                        <p className={`text-xs ${selected ? 'text-white/70' : 'text-slate-500'} font-semibold leading-relaxed`}>
                          {method.delivery_time} • {method.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-[2rem] shadow-2xl shadow-black/5 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-black">Passo 2</p>
                    <h2 className="text-xl font-black text-slate-950">Método de Pagamento</h2>
                  </div>
                </div>

                {paymentMethods.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paymentMethods.map((method: StorefrontPaymentMethod) => {
                      const selected = selectedPayment?.id === method.id;
                      return (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPaymentId(method.id)}
                          className={`relative p-5 rounded-3xl border text-left transition-all overflow-hidden ${
                            selected
                              ? 'text-white shadow-2xl shadow-black/10 scale-[1.01]'
                              : 'border-slate-100 hover:border-slate-200 bg-slate-50 hover:bg-white text-slate-900'
                          }`}
                          style={selected ? { backgroundColor: store.primary_color, borderColor: store.primary_color } : undefined}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${selected ? 'bg-white/15' : 'bg-white border border-slate-100 shadow-sm'}`}>
                              <PaymentIcon method={method} selected={selected} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <p className="font-black">{method.name}</p>
                                {method.badge && <span className={`text-[9px] font-black uppercase tracking-[0.18em] rounded-full px-2 py-1 ${selected ? 'bg-white/15 text-white' : 'bg-white text-slate-500 border border-slate-100'}`}>{method.badge}</span>}
                              </div>
                              <p className={`text-xs ${selected ? 'text-white/75' : 'text-slate-500'} font-semibold leading-relaxed`}>{method.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800 text-sm font-semibold flex gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    Esta loja ainda não tem métodos de pagamento ativos.
                  </div>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-5">
              <div className="p-6 md:p-8 rounded-[2rem] bg-white border border-slate-100 shadow-2xl shadow-black/5 sticky top-24 overflow-hidden">
                <div className="absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl opacity-10" style={{ backgroundColor: store.primary_color }} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-black mb-1">Checkout</p>
                      <h2 className="text-2xl font-black tracking-tight text-slate-950">Resumo</h2>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-slate-950 text-white flex items-center justify-center">
                      <LockKeyhole className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Tens um cupão?</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Ticket className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Código" 
                          value={couponCode} 
                          onChange={e => setCouponCode(e.target.value)} 
                          className="w-full pl-10 pr-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-slate-950 font-mono font-black text-sm" 
                        />
                      </div>
                      <button 
                        onClick={handleApplyCoupon}
                        className="px-6 py-4 bg-slate-950 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                    {couponError && <p className="text-xs text-red-500 mt-3 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {couponError}</p>}
                    {appliedCoupon && <p className="text-xs text-emerald-600 mt-3 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Cupão {appliedCoupon.code} aplicado!</p>}
                  </div>

                  <div className="space-y-4 mb-8 rounded-3xl bg-slate-50 p-5 border border-slate-100">
                    <div className="flex justify-between text-sm font-bold text-slate-500">
                      <span>Subtotal</span>
                      <span className="text-slate-950">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-slate-500">
                      <span>Envio ({selectedShipping?.name || 'por selecionar'})</span>
                      <span className="text-slate-950">{shippingCost === 0 ? 'Grátis' : formatPrice(shippingCost)}</span>
                    </div>
                    {selectedPayment && (
                      <div className="flex justify-between text-sm font-bold text-slate-500">
                        <span>Pagamento</span>
                        <span className="text-slate-950">{selectedPayment.name}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm font-black text-emerald-600">
                        <span>Desconto ({appliedCoupon?.code})</span>
                        <span>- {formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
                      <span className="font-black text-lg text-slate-950">Total</span>
                      <span className="font-black text-4xl tracking-tighter text-slate-950">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <form onSubmit={handleCheckout} className="space-y-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Informação de Entrega</p>
                    <input required type="text" placeholder="Nome Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-slate-950 font-semibold" />
                    <input required type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-slate-950 font-semibold" />
                    <button
                      type="submit"
                      disabled={isCheckingOut || !selectedPayment || !selectedShipping}
                      className="w-full py-5 rounded-2xl text-white font-black text-lg transition-all hover:opacity-90 disabled:opacity-40 shadow-xl shadow-black/10 mt-4 flex items-center justify-center gap-2"
                      style={{ backgroundColor: store.primary_color }}
                    >
                      {isCheckingOut && <Loader2 className="w-5 h-5 animate-spin" />}
                      {isCheckingOut ? 'A processar...' : 'Finalizar Compra'}
                    </button>
                    <p className="text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Dados protegidos e checkout seguro
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
