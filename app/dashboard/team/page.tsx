'use client';

import { getTeamWorkspaceAction, inviteTeamMemberAction, removeTeamMemberAction } from '@/lib/team-actions';
import { Crown, Loader2, Mail, Plus, ShieldCheck, Trash2, UserCog, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const permissionLabels: Record<string, string> = {
  products: 'Produtos', orders: 'Encomendas', customers: 'Clientes', finance: 'Financeiro', marketing: 'Marketing', team: 'Equipa', support: 'Suporte', stores: 'Lojas'
};

function defaults(role: string) {
  if (role === 'admin') return { stores: true, products: true, orders: true, customers: true, finance: true, marketing: true, team: true, support: true };
  if (role === 'manager') return { stores: false, products: true, orders: true, customers: true, finance: true, marketing: true, team: false, support: true };
  return { stores: false, products: false, orders: true, customers: true, finance: false, marketing: false, team: false, support: true };
}

export default function TeamPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({ email: '', name: '', role: 'support', permissions: defaults('support') });

  async function load(storeId?: string) {
    setLoading(true);
    const result = await getTeamWorkspaceAction(storeId || localStorage.getItem('selectedStoreId'));
    setData(result);
    if (result.selectedStoreId) localStorage.setItem('selectedStoreId', result.selectedStoreId);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  const logs = useMemo(() => data?.logs || [], [data]);

  async function invite() {
    if (!data?.selectedStoreId) return;
    setSaving(true);
    try {
      await inviteTeamMemberAction({ ...form, storeId: data.selectedStoreId });
      setForm({ email: '', name: '', role: 'support', permissions: defaults('support') });
      await load(data.selectedStoreId);
    } catch (error: any) {
      alert(error.message || 'Erro ao convidar colaborador.');
    } finally {
      setSaving(false);
    }
  }

  function changeRole(role: string) {
    setForm((prev: any) => ({ ...prev, role, permissions: defaults(role) }));
  }

  function togglePermission(key: string) {
    setForm((prev: any) => ({ ...prev, permissions: { ...prev.permissions, [key]: !prev.permissions[key] } }));
  }

  if (loading) return <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-slate-950 rounded-[40px] p-8 md:p-10 text-white shadow-2xl border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-emerald-300 text-xs font-black uppercase tracking-widest mb-5">
              <Users className="w-4 h-4" /> Business / Enterprise
            </div>
            <h1 className="text-4xl md:text-5xl font-[950] tracking-tight">Equipa e colaboradores</h1>
            <p className="text-slate-300 font-medium mt-3 max-w-2xl">Convida membros, define permissões por loja, escolhe funções e consulta o histórico de ações.</p>
          </div>
          {data?.stores?.length > 0 && (
            <select value={data.selectedStoreId || ''} onChange={(e) => load(e.target.value)} className="bg-white text-slate-950 rounded-2xl px-4 py-3 text-sm font-black border-none">
              {data.stores.map((store: any) => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {!data?.unlocked && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-400/20 rounded-[32px] p-6 flex gap-4 items-start">
          <Crown className="w-8 h-8 text-amber-600 dark:text-amber-300" />
          <div>
            <h2 className="font-black text-amber-900 dark:text-amber-100">Funcionalidade bloqueada pelo plano</h2>
            <p className="text-sm font-bold text-amber-800/80 dark:text-amber-100/75 mt-1">A gestão de equipa está disponível apenas nos planos Business e Enterprise.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-card-bg/95 dark:bg-slate-900/85 border border-border rounded-[32px] shadow-premium overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div><h2 className="text-xl font-black text-text-primary">Membros</h2><p className="text-xs font-bold text-text-muted mt-1">Admin, gestor ou suporte por loja.</p></div>
          </div>
          <div className="divide-y divide-border">
            {(data?.members || []).map((member: any) => (
              <div key={member.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><UserCog className="w-6 h-6" /></div>
                  <div><p className="font-black text-text-primary">{member.name || member.member_email}</p><p className="text-xs font-bold text-text-muted flex items-center gap-1"><Mail className="w-3 h-3" /> {member.member_email}</p></div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase">{member.role}</span>
                  <span className="px-3 py-1 rounded-full bg-bg-gray text-text-muted text-xs font-black uppercase">{member.status}</span>
                  <button onClick={async () => { if (confirm('Remover colaborador?')) { await removeTeamMemberAction(member.id); await load(data.selectedStoreId); } }} className="p-2 rounded-xl bg-rose-50 text-rose-600 border-none cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            {(data?.members || []).length === 0 && <div className="p-12 text-center text-text-muted font-bold">Ainda não tens colaboradores nesta loja.</div>}
          </div>
        </div>

        <div className="bg-card-bg/95 dark:bg-slate-900/85 border border-border rounded-[32px] shadow-premium p-6 space-y-5">
          <h2 className="text-xl font-black text-text-primary">Convidar membro</h2>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome" className="w-full px-4 py-3 rounded-2xl bg-bg-gray border border-border text-sm font-bold" />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" className="w-full px-4 py-3 rounded-2xl bg-bg-gray border border-border text-sm font-bold" />
          <select value={form.role} onChange={(e) => changeRole(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-bg-gray border border-border text-sm font-bold">
            <option value="admin">Admin</option><option value="manager">Gestor</option><option value="support">Suporte</option>
          </select>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(permissionLabels).map((key) => (
              <button key={key} onClick={() => togglePermission(key)} className={`px-3 py-2 rounded-xl text-xs font-black border ${form.permissions[key] ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-bg-gray text-text-muted border-border'}`}>{permissionLabels[key]}</button>
            ))}
          </div>
          <button disabled={!data?.unlocked || saving} onClick={invite} className="w-full py-4 rounded-2xl bg-primary text-white font-black flex items-center justify-center gap-2 disabled:opacity-50 border-none cursor-pointer">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Enviar convite
          </button>
        </div>
      </div>

      <div className="bg-card-bg/95 dark:bg-slate-900/85 border border-border rounded-[32px] shadow-premium overflow-hidden">
        <div className="p-6 border-b border-border flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-primary" /><h2 className="font-black text-text-primary">Histórico de ações</h2></div>
        <div className="divide-y divide-border">
          {logs.map((log: any) => <div key={log.id} className="p-4 flex justify-between gap-4"><div><p className="font-black text-text-primary">{log.action}</p><p className="text-xs text-text-muted font-bold">{log.actor_email || log.actor_user_id || 'Sistema'}</p></div><p className="text-xs text-text-muted font-bold">{log.created_at ? new Date(log.created_at).toLocaleString('pt-PT') : '-'}</p></div>)}
          {logs.length === 0 && <div className="p-8 text-center text-text-muted font-bold">Sem ações registadas.</div>}
        </div>
      </div>
    </div>
  );
}
