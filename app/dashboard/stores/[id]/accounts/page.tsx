'use client';

import { getMyStoresAction, updateStoreCustomizationAction } from '@/lib/actions';
import { ArrowLeft, Loader2, Save, ShieldCheck, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

function normalizeCustomization(store: any) {
  const current = store?.customization && typeof store.customization === 'object' ? store.customization : {};

  return {
    ...current,
    accounts: {
      enabled: current.accounts?.enabled !== false,
      requireLoginForCheckout: current.accounts?.requireLoginForCheckout === true,
      allowRegistration: current.accounts?.allowRegistration !== false,
    },
  };
}

export default function StoreAccountsSettingsPage() {
  const { id } = useParams() as { id: string };
  const [store, setStore] = useState<any>(null);
  const [customization, setCustomization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadStore() {
      try {
        const stores = await getMyStoresAction();
        const currentStore = stores.find((item: any) => item.id === id);
        setStore(currentStore || null);
        setCustomization(normalizeCustomization(currentStore));
      } catch (error) {
        console.error('Error loading store account settings:', error);
      } finally {
        setLoading(false);
      }
    }

    if (id) loadStore();
  }, [id]);

  const accounts = useMemo(() => customization?.accounts || { enabled: true, requireLoginForCheckout: false, allowRegistration: true }, [customization]);

  const updateAccounts = (next: any) => {
    setCustomization((current: any) => ({
      ...(current || {}),
      accounts: {
        ...(current?.accounts || {}),
        ...next,
      },
    }));
  };

  const save = async () => {
    if (!store || !customization) return;
    setSaving(true);
    setSaved(false);

    try {
      await updateStoreCustomizationAction(store.id, customization);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      console.error('Error saving store account settings:', error);
      alert('Erro ao guardar as opções de login da loja.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store || !customization) {
    return (
      <div className="bg-white rounded-3xl border border-border p-10 text-center">
        <h1 className="text-2xl font-black mb-2">Loja não encontrada</h1>
        <Link href="/dashboard/stores" className="text-primary font-black">Voltar às lojas</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href="/dashboard/stores" className="inline-flex items-center gap-2 text-sm font-bold text-text-muted hover:text-text-dark mb-4">
            <ArrowLeft className="w-4 h-4" /> Voltar às lojas
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-text-dark">Login e contas da loja</h1>
          <p className="text-text-muted mt-2">Controla se os clientes podem criar conta diretamente na loja {store.name}.</p>
        </div>
        <button onClick={save} disabled={saving} className="bg-slate-950 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'A guardar...' : 'Guardar'}
        </button>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl p-4 font-bold">
          Configurações guardadas com sucesso.
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden">
        <div className="p-7 border-b border-border flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <UserRound className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-text-dark">Sistema de login da loja</h2>
            <p className="text-sm text-text-muted mt-1 leading-relaxed">As contas são exclusivas desta loja. Se a loja for apagada, os clientes registados também são removidos pela base de dados.</p>
          </div>
        </div>

        <div className="p-7 space-y-5">
          <label className="flex items-start justify-between gap-6 p-5 rounded-3xl bg-slate-50 border border-border cursor-pointer">
            <div>
              <p className="font-black text-text-dark">Permitir login e criar conta na loja</p>
              <p className="text-sm text-text-muted mt-1">Mostra o botão Conta no header da loja e ativa /account.</p>
            </div>
            <input type="checkbox" checked={accounts.enabled} onChange={(event) => updateAccounts({ enabled: event.target.checked })} className="mt-1 h-5 w-5 accent-primary" />
          </label>

          <label className="flex items-start justify-between gap-6 p-5 rounded-3xl bg-slate-50 border border-border cursor-pointer">
            <div>
              <p className="font-black text-text-dark">Permitir criação de novas contas</p>
              <p className="text-sm text-text-muted mt-1">Clientes podem registar-se com nome, email e password nesta loja.</p>
            </div>
            <input type="checkbox" checked={accounts.allowRegistration} onChange={(event) => updateAccounts({ allowRegistration: event.target.checked })} className="mt-1 h-5 w-5 accent-primary" />
          </label>

          <label className="flex items-start justify-between gap-6 p-5 rounded-3xl bg-slate-50 border border-border cursor-pointer">
            <div>
              <p className="font-black text-text-dark">Obrigar login no checkout</p>
              <p className="text-sm text-text-muted mt-1">Se estiver ativo, o cliente deve entrar/criar conta antes de finalizar compra.</p>
            </div>
            <input type="checkbox" checked={accounts.requireLoginForCheckout} onChange={(event) => updateAccounts({ requireLoginForCheckout: event.target.checked })} className="mt-1 h-5 w-5 accent-primary" />
          </label>
        </div>
      </div>

      <div className="bg-slate-950 text-white rounded-[2rem] p-7 flex gap-4">
        <ShieldCheck className="w-6 h-6 text-emerald-300 shrink-0" />
        <div>
          <h3 className="font-black mb-2">Como funciona</h3>
          <p className="text-sm text-white/60 leading-relaxed">Quando o cliente estiver logado, o checkout usa automaticamente o nome e email da conta. Se abandonar o carrinho, a aba Carrinhos Abandonados mostra essa conta associada.</p>
        </div>
      </div>
    </div>
  );
}
