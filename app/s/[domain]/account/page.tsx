'use client';

import { getStorefrontDataAction } from '@/lib/actions';
import { loginStoreCustomerAction, registerStoreCustomerAction } from '@/lib/store-customer-actions';
import { ArrowLeft, Loader2, LockKeyhole, UserPlus, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Mode = 'login' | 'register';

export default function StoreAccountPage() {
  const params = useParams() as { domain: string };
  const router = useRouter();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    async function loadStore() {
      if (!params.domain) return;

      try {
        const data = await getStorefrontDataAction(params.domain);
        setStore(data?.store || null);
      } catch (err) {
        console.error('Error loading store account:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStore();
  }, [params.domain]);

  const storageKey = useMemo(() => store?.id ? `shopforge-store-customer-${store.id}` : '', [store?.id]);

  useEffect(() => {
    if (!storageKey) return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setCustomer(JSON.parse(saved));
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const accountsEnabled = store?.customization?.accounts?.enabled === true;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!store || !storageKey) return;

    setError('');
    setIsSubmitting(true);

    try {
      const payload = { store_id: store.id, ...form };
      const result = mode === 'register'
        ? await registerStoreCustomerAction(payload)
        : await loginStoreCustomerAction(payload);

      if (!result?.success) {
        throw new Error(result?.error || 'Não foi possível continuar.');
      }

      localStorage.setItem(storageKey, JSON.stringify(result.customer));
      setCustomer(result.customer);
      router.push(`/s/${store.domain}/cart`);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = () => {
    if (storageKey) localStorage.removeItem(storageKey);
    setCustomer(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-6">
        <div>
          <h1 className="text-2xl font-black mb-2">Loja não encontrada</h1>
          <Link href="/" className="text-primary font-bold">Voltar</Link>
        </div>
      </div>
    );
  }

  if (!accountsEnabled) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-20">
        <div className="max-w-xl mx-auto bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl text-center">
          <LockKeyhole className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h1 className="text-2xl font-black mb-2">Conta indisponível</h1>
          <p className="text-slate-500 mb-6">Esta loja ainda não ativou o sistema de login.</p>
          <Link href={`/s/${store.domain}`} className="inline-flex items-center gap-2 px-6 py-3 bg-slate-950 text-white rounded-2xl font-black">
            <ArrowLeft className="w-4 h-4" /> Voltar à loja
          </Link>
        </div>
      </div>
    );
  }

  if (customer) {
    return (
      <div className="min-h-screen bg-[#f7f3ed] px-6 py-20">
        <div className="max-w-xl mx-auto bg-white rounded-[2rem] p-8 border border-black/5 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-slate-950 text-white flex items-center justify-center mx-auto mb-5">
            <UserRound className="w-8 h-8" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 mb-2">Conta ativa</p>
          <h1 className="text-3xl font-black mb-2">{customer.name}</h1>
          <p className="text-slate-500 font-semibold mb-8">{customer.email}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href={`/s/${store.domain}/cart`} className="px-6 py-4 bg-slate-950 text-white rounded-2xl font-black">Ir para checkout</Link>
            <button onClick={logout} className="px-6 py-4 bg-slate-100 text-slate-800 rounded-2xl font-black">Sair da conta</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f3ed] px-6 py-20">
      <div className="max-w-xl mx-auto">
        <Link href={`/s/${store.domain}`} className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-950 mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar à loja
        </Link>
        <div className="bg-white rounded-[2rem] p-8 border border-black/5 shadow-2xl shadow-black/10">
          <div className="w-14 h-14 rounded-2xl bg-slate-950 text-white flex items-center justify-center mb-6">
            {mode === 'login' ? <LockKeyhole className="w-7 h-7" /> : <UserPlus className="w-7 h-7" />}
          </div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400 mb-2">{store.name}</p>
          <h1 className="text-3xl font-black mb-2">{mode === 'login' ? 'Entrar na conta' : 'Criar conta'}</h1>
          <p className="text-slate-500 font-medium mb-8">A sua conta fica ligada apenas a esta loja.</p>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-slate-950 font-semibold" />
            )}
            <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-slate-950 font-semibold" />
            <input required type="password" minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" className="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-slate-950 font-semibold" />
            {error && <p className="text-sm font-bold text-red-500">{error}</p>}
            <button disabled={isSubmitting} className="w-full py-5 rounded-2xl bg-slate-950 text-white font-black flex items-center justify-center gap-2 disabled:opacity-50">
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full mt-5 text-sm font-black text-slate-500 hover:text-slate-950">
            {mode === 'login' ? 'Ainda não tenho conta. Criar conta' : 'Já tenho conta. Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
