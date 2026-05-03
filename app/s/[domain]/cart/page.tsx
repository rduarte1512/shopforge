'use client';

import { 
  getStorefrontDataAction, 
  getShippingMethodsAction,
  getCouponsAction,
  checkCouponAction,
  createOrderAction,
  getAffiliateByCodeAction
} from '@/lib/actions';
import { useParams } from 'next/navigation';
import { useCart } from '@/components/CartProvider';
import { useCurrency } from '@/hooks/useCurrency';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Ticket, Truck, AlertCircle, CheckCircle2, Wallet, Building, Smartphone, CreditCard as CardIcon, Banknote, Loader2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

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

  const cartItems = useMemo(() => items.map(item => {
    const product = products.find(p => p.id === item.productId);
    // Note: variants handling simplified for now or should be fetched separately
    return { ...item, product };
  }).filter(item => item.product), [items, products]);

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + (price * item.quantity);
  }, 0), [cartItems]);

  const selectedShipping = useMemo(() => shippingMethods.find((m: any) => m.id === selectedShippingId) || shippingMethods[0], [selectedShippingId, shippingMethods]);
  const selectedPayment = useMemo(() => store?.payment_methods?.find((m: any) => m.id === selectedPaymentId) || store?.payment_methods?.[0], [selectedPaymentId, store]);
  
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

  const total = subtotal + shippingCost - discountAmount;

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!store) return null;

  if (success) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-40 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black mb-4">Obrigado pela sua encomenda!</h1>
        <p className="text-gray-500 mb-6 text-lg max-w-md mx-auto">A sua encomenda foi processada com sucesso e receberá um email de confirmação em breve.</p>
        {paymentInfo && paymentInfo.instructions && (
          <div className="bg-gray-50 rounded-2xl p-6 mb-10 text-left max-w-md mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-5 h-5" style={{ color: store.primary_color }} />
              <h3 className="font-bold text-lg">Informações de Pagamento</h3>
            </div>
            <p className="font-semibold text-gray-800 mb-2">{paymentInfo.name}</p>
            <p className="text-gray-500 text-sm">{paymentInfo.instructions}</p>
          </div>
        )}
        <Link 
          href={`/s/${store.domain}`}
          className="inline-block px-10 py-4 rounded-2xl text-white font-bold hover:opacity-90 transition-all shadow-xl shadow-black/10"
          style={{ backgroundColor: store.primary_color }}
        >
          Voltar à Loja
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 lg:py-24">
      <div className="flex items-end gap-4 mb-12">
        <h1 className="text-4xl font-black tracking-tight">Carrinho</h1>
        <p className="text-gray-400 font-bold mb-1">{cartItems.length} itens</p>
      </div>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-32 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
          <p className="text-xl font-medium opacity-40 mb-8">O seu carrinho está vazio.</p>
          <Link 
            href={`/s/${store.domain}`}
            className="inline-block px-10 py-4 rounded-2xl text-white font-bold hover:opacity-90 transition-all shadow-xl shadow-black/10"
            style={{ backgroundColor: store.primary_color }}
          >
            Começar a Comprar
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-12">
            {/* Products List */}
            <div className="space-y-8">
              {cartItems.map((item) => (
                <div key={`${item.productId}-${item.variantId || 'base'}`} className="flex gap-8 group">
                  <div className="w-32 h-40 relative rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
                    {item.product!.image_url && <Image src={item.product!.image_url} alt={item.product!.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-2">
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{item.product!.category}</p>
                         <h3 className="font-bold text-xl leading-tight">{item.product!.name}</h3>
                         <p className="text-sm font-medium mt-2">Quantidade: {item.quantity}</p>
                       </div>
                       <p className="font-black text-xl">{formatPrice(Number(item.product!.price) * item.quantity)}</p>
                     </div>
                     <button 
                        onClick={() => removeItem(item.productId, item.variantId)} 
                        className="text-xs font-bold text-gray-300 hover:text-red-500 flex items-center gap-2 transition-colors w-fit"
                     >
                        <Trash2 className="w-4 h-4" /> REMOVER
                     </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping Selection */}
            <div className="pt-12 border-t border-gray-100">
              <div className="flex items-center gap-3 mb-8">
                <Truck className="w-6 h-6 text-gray-400" />
                <h2 className="text-xl font-bold">Opções de Envio</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shippingMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedShippingId(method.id)}
                    className={`p-6 rounded-2xl border-2 text-left transition-all ${
                      (selectedShippingId === method.id || (!selectedShippingId && shippingMethods[0]?.id === method.id))
                        ? 'border-black bg-black text-white shadow-xl shadow-black/10'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-bold">{method.name}</p>
                      <p className="font-black">
                        {method.min_order_for_free && subtotal >= Number(method.min_order_for_free) ? 'Grátis' : formatPrice(Number(method.cost))}
                      </p>
                    </div>
                    <p className={`text-xs ${selectedShippingId === method.id ? 'opacity-60' : 'text-gray-400'} font-medium`}>
                      {method.delivery_time} • {method.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Selection */}
            {(store?.payment_methods || []).length > 0 && (
              <div className="pt-12 border-t border-gray-100">
                <div className="flex items-center gap-3 mb-8">
                  <Wallet className="w-6 h-6 text-gray-400" />
                  <h2 className="text-xl font-bold">Método de Pagamento</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(store?.payment_methods || []).map((method: any) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentId(method.id)}
                      className={`p-6 rounded-2xl border-2 text-left transition-all ${
                        (selectedPaymentId === method.id || (!selectedPaymentId && (store?.payment_methods || [])[0]?.id === method.id))
                          ? 'border-black bg-black text-white shadow-xl shadow-black/10'
                          : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedPaymentId === method.id || (!selectedPaymentId && (store?.payment_methods || [])[0]?.id === method.id) ? 'bg-white/20' : 'bg-gray-100'}`}>
                          {method.type === 'multibanco' && <Building className="w-5 h-5" />}
                          {method.type === 'mbway' && <Smartphone className="w-5 h-5" />}
                          {method.type === 'paypal' && <CardIcon className="w-5 h-5" />}
                          {method.type === 'transfer' && <Banknote className="w-5 h-5" />}
                          {method.type === 'cash' && <Wallet className="w-5 h-5" />}
                        </div>
                        <p className="font-bold">{method.name}</p>
                      </div>
                      <p className={`text-xs ${selectedPaymentId === method.id ? 'opacity-60' : 'text-gray-400'} font-medium`}>
                        {method.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="lg:col-span-5">
             <div className="p-8 rounded-3xl bg-white border border-gray-100 shadow-2xl shadow-black/5 sticky top-24">
                <h2 className="text-2xl font-black mb-8 tracking-tight">Resumo</h2>
                
                {/* Coupon Input */}
                <div className="mb-8">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Tens um cupão?</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Código" 
                        value={couponCode} 
                        onChange={e => setCouponCode(e.target.value)} 
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:border-black font-mono font-bold" 
                      />
                    </div>
                    <button 
                      onClick={handleApplyCoupon}
                      className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
                    >
                      Aplicar
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {couponError}</p>}
                  {appliedCoupon && <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Cupão {appliedCoupon.code} aplicado!</p>}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm font-medium text-gray-500">
                    <span>Subtotal</span>
                    <span className="text-black">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-gray-500">
                    <span>Envio ({selectedShipping?.name})</span>
                    <span className="text-black">{shippingCost === 0 ? 'Grátis' : formatPrice(shippingCost)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm font-bold text-green-600">
                      <span>Desconto ({appliedCoupon?.code})</span>
                      <span>- {formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="pt-6 border-t border-gray-100 flex justify-between items-end">
                    <span className="font-black text-lg">Total</span>
                    <span className="font-black text-3xl tracking-tighter">{formatPrice(total)}</span>
                  </div>
                </div>

                <form onSubmit={handleCheckout} className="space-y-4">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Informação de Entrega</p>
                   <div>
                     <input required type="text" placeholder="Nome Completo" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-4 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:border-black font-medium" />
                   </div>
                   <div>
                     <input required type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-4 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:border-black font-medium" />
                   </div>
                   <button
                     type="submit"
                     disabled={isCheckingOut}
                     className="w-full py-5 rounded-2xl text-white font-black text-lg transition-all hover:opacity-90 disabled:opacity-30 shadow-xl shadow-black/10 mt-4"
                     style={{ backgroundColor: store.primary_color }}
                   >
                     {isCheckingOut ? 'A processar...' : `Finalizar Compra`}
                   </button>
                </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
