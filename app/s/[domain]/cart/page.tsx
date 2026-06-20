'use client';

import { 
  getStorefrontDataAction, 
  getShippingMethodsAction,
  getCouponsAction,
  checkCouponAction,
  getAffiliateByCodeAction
} from '@/lib/actions';
import { createStorefrontOrderAction } from '@/lib/checkout-actions';
import { getEnabledPaymentMethods, StorefrontPaymentMethod } from '@/lib/payment-methods';
import { useParams } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import { useCurrency } from '@/hooks/useCurrency';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Ticket, Truck, AlertCircle, CheckCircle2, Wallet, Building, Smartphone, CreditCard as CardIcon, Banknote, Loader2, ShieldCheck, LockKeyhole, ArrowLeft, Sparkles, PackageCheck, BadgeCheck } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

function PaymentIcon({ method, selected }: { method: StorefrontPaymentMethod; selected: boolean }) {
  const className = `w-5 h-5 ${selected ? 'text-white' : 'text-slate-900'}`;

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
  const [, setCoupons] = useState<any[]>([]);
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

      const orderResult = await createStorefrontOrderAction(orderData, orderItemsData);

      if (!orderResult?.success) {
        throw new Error(orderResult?.error || 'Não foi possível guardar a encomenda.');
      }

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
      <div className="min-h-screen flex items-center justify-center bg-[#f7f3ed]">
        <div className="rounded-[2rem] bg-white p-8 shadow-2xl shadow-black/10 border border-black/5">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (!store) return null;

  if (success) {
    return (
      <div className="min-h-screen bg-[#f7f3ed] px-6 py-24">
        <div className="max-w-3xl mx-auto text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600 shadow-2xl shadow-black/10 border border-black/5">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400 font-black mb-4">Compra finalizada</p>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-slate-950">Encomenda confirmada.</h1>
          <p className="text-slate-500 mb-8 text-lg max-w-md mx-auto font-medium">A sua encomenda foi registada com sucesso. Guarde as instruções de pagamento para concluir o processo.</p>
          {paymentInfo && paymentInfo.instructions && (
            <div className="bg-white rounded-[2rem] p-7 mb-10 text-left max-w-xl mx-auto border border-black/5 shadow-2xl shadow-black/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white bg-slate-950">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400 font-black">Pagamento escolhido</p>
                  <h3 className="font-black text-lg text-slate-950">{paymentInfo.name}</h3>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm font-medium">{paymentInfo.instructions}</p>
            </div>
          )}
          <Link 
            href={`/s/${store.domain}`}
            className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-2xl text-white font-black hover:opacity-90 transition-all shadow-xl shadow-black/10 bg-slate-950"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar à Loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f3ed] text-slate-950">
      <section className="relative overflow-hidden bg-[#070707] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.10),transparent_26%)]" />
        <div className="absolute -bottom-28 left-1/2 h-56 w-[70rem] -translate-x-1/2 rounded-[100%] bg-[#f7f3ed]" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 pt-12 pb-28 lg:pt-16 lg:pb-36">
          <Link href={`/s/${store.domain}`} className="inline-flex items-center gap-2 text-sm font-black text-white/55 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Continuar a comprar
          </Link>
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-end">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 shadow-2xl text-xs font-black uppercase tracking-[0.24em] text-white/70 mb-5">
                <ShieldCheck className="w-4 h-4" />
                Checkout seguro e premium
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-[-0.06em] leading-none">Carrinho</h1>
              <p className="text-white/55 font-semibold mt-5 max-w-xl text-lg">Finalize a sua compra com uma experiência simples, elegante e protegida.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-[1.7rem] bg-white/8 border border-white/10 p-2 backdrop-blur-xl">
              {['Carrinho', 'Entrega', 'Pagamento'].map((step, index) => (
                <div key={step} className={`px-3 py-4 rounded-2xl text-center text-[11px] font-black uppercase tracking-[0.18em] ${index === 0 ? 'bg-white text-slate-950' : 'text-white/45'}`}>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 -mt-20 pb-20">
        {cartItems.length === 0 ? (
          <div className="text-center py-28 bg-white rounded-[2.5rem] border border-black/5 shadow-2xl shadow-black/10">
            <div className="w-20 h-20 bg-[#f7f3ed] rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-9 h-9 text-slate-300" />
            </div>
            <p className="text-2xl font-black text-slate-950 mb-3">O seu carrinho está vazio.</p>
            <p className="text-slate-500 mb-8 font-medium">Explore a loja e adicione produtos para continuar.</p>
            <Link 
              href={`/s/${store.domain}`}
              className="inline-block px-10 py-4 rounded-2xl text-white font-black hover:opacity-90 transition-all shadow-xl shadow-black/10 bg-slate-950"
            >
              Começar a Comprar
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border border-black/5 rounded-[2.5rem] shadow-2xl shadow-black/10 overflow-hidden">
                <div className="px-6 md:px-8 py-7 border-b border-black/5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400 font-black">Seleção</p>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">Produtos no carrinho</h2>
                  </div>
                  <span className="rounded-full bg-slate-950 text-white px-4 py-2 text-xs font-black">{cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}</span>
                </div>

                <div className="p-4 md:p-6 space-y-4">
                  {cartItems.map((item) => (
                    <div key={`${item.productId}-${item.variantId || 'base'}`} className="group rounded-[2rem] bg-[#fbfaf7] border border-black/5 p-4 md:p-5 flex gap-4 md:gap-6 hover:bg-white hover:shadow-xl hover:shadow-black/5 transition-all">
                      <div className="w-28 h-32 md:w-40 md:h-48 relative rounded-[1.6rem] overflow-hidden bg-slate-100 flex-shrink-0 shadow-sm">
                        {item.product!.image_url && <Image src={item.product!.image_url} alt={item.product!.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div className="flex justify-between gap-4 items-start">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.28em] mb-2 truncate">{item.product!.category || 'Produto premium'}</p>
                            <h3 className="font-black text-xl md:text-2xl leading-tight text-slate-950">{item.product!.name}</h3>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-white border border-black/5 px-3 py-1 text-xs font-black text-slate-600">Quantidade: {item.quantity}</span>
                              <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Em stock</span>
                            </div>
                          </div>
                          <p className="font-black text-xl md:text-2xl whitespace-nowrap text-slate-950">{formatPrice(Number(item.product!.price) * item.quantity)}</p>
                        </div>
                        <button 
                          onClick={() => removeItem(item.productId, item.variantId)} 
                          className="text-xs font-black text-slate-300 hover:text-rose-500 flex items-center gap-2 transition-colors w-fit mt-6 uppercase tracking-[0.18em]"
                        >
                          <Trash2 className="w-4 h-4" /> Remover
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white border border-black/5 rounded-[2.5rem] shadow-2xl shadow-black/10 p-6 md:p-7">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-black">Entrega</p>
                      <h2 className="text-xl font-black text-slate-950">Opções de envio</h2>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {shippingMethods.map(method => {
                      const selected = selectedShipping?.id === method.id;
                      return (
                        <button
                          key={method.id}
                          onClick={() => setSelectedShippingId(method.id)}
                          className={`w-full p-4 rounded-3xl border text-left transition-all ${selected ? 'bg-slate-950 text-white border-slate-950 shadow-xl shadow-black/10' : 'border-black/5 bg-[#fbfaf7] hover:bg-white text-slate-950'}`}
                        >
                          <div className="flex justify-between items-center mb-1 gap-3">
                            <p className="font-black">{method.name}</p>
                            <p className="font-black">{method.min_order_for_free && subtotal >= Number(method.min_order_for_free) ? 'Grátis' : formatPrice(Number(method.cost))}</p>
                          </div>
                          <p className={`text-xs ${selected ? 'text-white/60' : 'text-slate-500'} font-semibold leading-relaxed`}>{method.delivery_time} • {method.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white border border-black/5 rounded-[2.5rem] shadow-2xl shadow-black/10 p-6 md:p-7">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-black">Pagamento</p>
                      <h2 className="text-xl font-black text-slate-950">Métodos disponíveis</h2>
                    </div>
                  </div>

                  {paymentMethods.length > 0 ? (
                    <div className="space-y-3">
                      {paymentMethods.map((method: StorefrontPaymentMethod) => {
                        const selected = selectedPayment?.id === method.id;
                        return (
                          <button
                            key={method.id}
                            onClick={() => setSelectedPaymentId(method.id)}
                            className={`w-full relative p-4 rounded-3xl border text-left transition-all overflow-hidden ${selected ? 'bg-slate-950 text-white border-slate-950 shadow-xl shadow-black/10' : 'border-black/5 bg-[#fbfaf7] hover:bg-white text-slate-950'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${selected ? 'bg-white/15' : 'bg-white border border-black/5 shadow-sm'}`}>
                                <PaymentIcon method={method} selected={selected} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <p className="font-black">{method.name}</p>
                                  {method.badge && <span className={`text-[9px] font-black uppercase tracking-[0.18em] rounded-full px-2 py-1 ${selected ? 'bg-white/15 text-white' : 'bg-white text-slate-500 border border-black/5'}`}>{method.badge}</span>}
                                </div>
                                <p className={`text-xs ${selected ? 'text-white/60' : 'text-slate-500'} font-semibold leading-relaxed`}>{method.description}</p>
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
            </div>
            
            <div className="lg:col-span-4">
              <div className="sticky top-24 rounded-[2.5rem] bg-[#080808] text-white shadow-2xl shadow-black/25 overflow-hidden border border-white/10">
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ backgroundColor: store.primary_color || '#ffffff' }} />
                <div className="relative z-10 p-6 md:p-7">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-white/35 font-black mb-2">Resumo</p>
                      <h2 className="text-2xl font-black tracking-tight">Finalizar compra</h2>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white text-slate-950 flex items-center justify-center">
                      <LockKeyhole className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="mb-7">
                    <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.28em] mb-3">Cupão de desconto</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Ticket className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                        <input 
                          type="text" 
                          placeholder="Código" 
                          value={couponCode} 
                          onChange={e => setCouponCode(e.target.value)} 
                          className="w-full pl-10 pr-4 py-4 rounded-2xl bg-white/8 border border-white/10 focus:outline-none focus:border-white/35 font-mono font-black text-sm text-white placeholder:text-white/25" 
                        />
                      </div>
                      <button 
                        onClick={handleApplyCoupon}
                        className="px-5 py-4 bg-white text-slate-950 rounded-2xl font-black text-sm hover:bg-white/90 transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                    {couponError && <p className="text-xs text-red-300 mt-3 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {couponError}</p>}
                    {appliedCoupon && <p className="text-xs text-emerald-300 mt-3 font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Cupão {appliedCoupon.code} aplicado!</p>}
                  </div>

                  <div className="space-y-4 mb-7 rounded-[2rem] bg-white/[0.06] p-5 border border-white/10">
                    <div className="flex justify-between text-sm font-bold text-white/55">
                      <span>Subtotal</span>
                      <span className="text-white">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-white/55">
                      <span>Envio</span>
                      <span className="text-white">{shippingCost === 0 ? 'Grátis' : formatPrice(shippingCost)}</span>
                    </div>
                    {selectedPayment && (
                      <div className="flex justify-between text-sm font-bold text-white/55">
                        <span>Pagamento</span>
                        <span className="text-white text-right">{selectedPayment.name}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm font-black text-emerald-300">
                        <span>Desconto</span>
                        <span>- {formatPrice(discountAmount)}</span>
                      </div>
                    )}
                    <div className="pt-5 border-t border-white/10 flex justify-between items-end">
                      <span className="font-black text-white/70">Total</span>
                      <span className="font-black text-4xl tracking-tighter text-white">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <form onSubmit={handleCheckout} className="space-y-4">
                    <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.28em]">Informação de entrega</p>
                    <input required type="text" placeholder="Nome completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-4 rounded-2xl bg-white/8 border border-white/10 focus:outline-none focus:border-white/35 font-semibold text-white placeholder:text-white/25" />
                    <input required type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-4 rounded-2xl bg-white/8 border border-white/10 focus:outline-none focus:border-white/35 font-semibold text-white placeholder:text-white/25" />
                    <button
                      type="submit"
                      disabled={isCheckingOut || !selectedPayment || !selectedShipping}
                      className="w-full py-5 rounded-2xl text-slate-950 bg-white font-black text-lg transition-all hover:bg-white/90 disabled:opacity-40 shadow-xl shadow-black/20 mt-4 flex items-center justify-center gap-2"
                    >
                      {isCheckingOut && <Loader2 className="w-5 h-5 animate-spin" />}
                      {isCheckingOut ? 'A processar...' : 'Finalizar Compra'}
                    </button>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-3 flex items-center gap-2 text-[11px] font-bold text-white/55">
                        <BadgeCheck className="w-4 h-4 text-emerald-300" /> Seguro
                      </div>
                      <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-3 flex items-center gap-2 text-[11px] font-bold text-white/55">
                        <PackageCheck className="w-4 h-4 text-emerald-300" /> Protegido
                      </div>
                    </div>
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
