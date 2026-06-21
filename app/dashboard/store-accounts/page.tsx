'use client';

import { getMyStoresAction } from '@/lib/actions';
import {
  createStoreCustomerRewardAction,
  deleteStoreCustomerAction,
  getStoreCustomersAction,
  updateStoreCustomerDetailsAction,
} from '@/lib/store-customer-actions';
import {
  BadgePercent,
  Gift,
  Loader2,
  Mail,
  Pencil,
  Save,
  Search,
  ShoppingBag,
  Trash2,
  Trophy,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const emptyReward = {
  reward_type: 'discount',
  title: 'Desconto especial',
  description: '',
  discount_type: 'percentage',
  discount_value: 10,
  min_purchase: 0,
  max_uses: 1,
  code: '',
};

export default function StoreAccountsPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [rewardsNeedsSetup, setRewardsNeedsSetup] = useState(false);
  const [search, setSearch] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [editData, setEditData] = useState({ name: '', email: '' });
  const [rewardCustomer, setRewardCustomer] = useState<any>(null);
  const [rewardData, setRewardData] = useState<any>(emptyReward);
  const [saving, setSaving] = useState(false);

  const selectedStore = stores.find(store => store.id === selectedStoreId);

  const loadCustomers = async (storeId: string) => {
    if (!storeId) return;
    setLoadingCustomers(true);

    try {
      const result = await getStoreCustomersAction(storeId);
      setCustomers(result?.customers || []);
      setNeedsSetup(Boolean(result?.needsSetup));
      setRewardsNeedsSetup(Boolean(result?.rewardsNeedsSetup));
    } catch (error) {
      console.error('Error loading store accounts:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const data = await getMyStoresAction();
        const safeStores = data || [];
        setStores(safeStores);

        const storedId = localStorage.getItem('selectedStoreId');
        const activeId = safeStores.find((store: any) => store.id === storedId)?.id || safeStores[0]?.id || '';
        setSelectedStoreId(activeId);

        if (activeId) await loadCustomers(activeId);
      } catch (error) {
        console.error('Error loading stores:', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return customers;
    return customers.filter(customer =>
      String(customer.name || '').toLowerCase().includes(term) ||
      String(customer.email || '').toLowerCase().includes(term)
    );
  }, [customers, search]);

  const stats = useMemo(() => {
    return {
      total: customers.length,
      revenue: customers.reduce((sum, customer) => sum + Number(customer.total_spent || 0), 0),
      rewards: customers.reduce((sum, customer) => sum + (Array.isArray(customer.rewards) ? customer.rewards.length : 0), 0),
    };
  }, [customers]);

  const handleStoreChange = async (storeId: string) => {
    setSelectedStoreId(storeId);
    localStorage.setItem('selectedStoreId', storeId);
    await loadCustomers(storeId);
  };

  const openEdit = (customer: any) => {
    setEditingCustomer(customer);
    setEditData({ name: customer.name || '', email: customer.email || '' });
  };

  const saveCustomer = async () => {
    if (!selectedStoreId || !editingCustomer) return;
    setSaving(true);

    try {
      const result = await updateStoreCustomerDetailsAction(selectedStoreId, editingCustomer.id, editData);
      if (!result?.success) throw new Error(result?.error || 'Não foi possível editar a conta.');
      await loadCustomers(selectedStoreId);
      setEditingCustomer(null);
    } catch (error: any) {
      alert(error.message || 'Erro ao editar conta.');
    } finally {
      setSaving(false);
    }
  };

  const removeCustomer = async (customer: any) => {
    const ok = confirm(`Eliminar a conta de ${customer.name || customer.email}? A conta deixa de poder iniciar sessão nesta loja.`);
    if (!ok) return;

    try {
      const result = await deleteStoreCustomerAction(selectedStoreId, customer.id);
      if (!result?.success) throw new Error(result?.error || 'Não foi possível eliminar a conta.');
      setCustomers(prev => prev.filter(item => item.id !== customer.id));
    } catch (error: any) {
      alert(error.message || 'Erro ao eliminar conta.');
    }
  };

  const openReward = (customer: any) => {
    setRewardCustomer(customer);
    setRewardData({
      ...emptyReward,
      code: `${String(customer.name || customer.email || 'VIP').replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()}10`,
    });
  };

  const saveReward = async () => {
    if (!selectedStoreId || !rewardCustomer) return;
    setSaving(true);

    try {
      const result = await createStoreCustomerRewardAction(selectedStoreId, rewardCustomer.id, rewardData);
      if (!result?.success) throw new Error(result?.error || 'Não foi possível criar prémio/desconto.');
      await loadCustomers(selectedStoreId);
      setRewardCustomer(null);
      if (result.coupon_code) alert(`Desconto criado com sucesso. Código: ${result.coupon_code}`);
    } catch (error: any) {
      alert(error.message || 'Erro ao criar prémio/desconto.');
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

  if (!stores.length) {
    return (
      <div className="bg-white rounded-3xl border border-border p-12 text-center">
        <Users className="w-14 h-14 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-text-dark">Ainda não tens lojas</h1>
        <p className="text-sm text-text-muted mt-2">Cria uma loja primeiro para veres as contas dos clientes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-[24px] font-[700] tracking-tight text-text-dark">Contas da Loja</h1>
          <p className="text-[14px] text-text-muted mt-1">Vê, edita, elimina e recompensa as contas criadas na loja selecionada.</p>
        </div>
        <select value={selectedStoreId} onChange={event => handleStoreChange(event.target.value)} className="bg-white border border-border rounded-2xl px-4 py-3 text-sm font-bold text-text-dark focus:outline-none focus:border-primary">
          {stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
        </select>
      </div>

      {needsSetup && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-amber-900">
          <h2 className="font-black text-lg">Falta criar a tabela de contas da loja</h2>
          <p className="text-sm mt-1">Corre o SQL que deixei no chat para ativar esta aba.</p>
        </div>
      )}

      {rewardsNeedsSetup && !needsSetup && (
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 text-blue-900">
          <p className="font-black">A tabela de prémios ainda não existe.</p>
          <p className="text-sm mt-1">Os descontos ainda podem ser criados como cupões, mas corre o SQL para guardar histórico de prémios por cliente.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-border p-5 shadow-sm">
          <p className="text-xs font-black text-text-muted uppercase tracking-widest">Contas criadas</p>
          <p className="text-3xl font-black text-text-dark mt-2">{stats.total}</p>
        </div>
        <div className="bg-white rounded-3xl border border-border p-5 shadow-sm">
          <p className="text-xs font-black text-text-muted uppercase tracking-widest">Receita destas contas</p>
          <p className="text-3xl font-black text-text-dark mt-2">€ {stats.revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-3xl border border-border p-5 shadow-sm">
          <p className="text-xs font-black text-text-muted uppercase tracking-widest">Prémios dados</p>
          <p className="text-3xl font-black text-text-dark mt-2">{stats.rewards}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-black text-text-dark">{selectedStore?.name || 'Loja selecionada'}</h2>
            <p className="text-xs text-text-muted mt-1">Contas registadas apenas nesta loja.</p>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Pesquisar nome ou email..." className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-border focus:outline-none focus:border-primary text-sm font-semibold" />
          </div>
        </div>

        {loadingCustomers ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left text-[12px] font-black text-text-muted py-4 px-6 uppercase">Conta</th>
                  <th className="text-left text-[12px] font-black text-text-muted py-4 px-6 uppercase">Compras</th>
                  <th className="text-left text-[12px] font-black text-text-muted py-4 px-6 uppercase">Prémios/Descontos</th>
                  <th className="text-left text-[12px] font-black text-text-muted py-4 px-6 uppercase">Criada em</th>
                  <th className="text-right text-[12px] font-black text-text-muted py-4 px-6 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-black">
                          {String(customer.name || customer.email || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-text-dark">{customer.name || 'Cliente'}</p>
                          <p className="text-xs text-text-muted flex items-center gap-1 mt-1"><Mail className="w-3 h-3" /> {customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-black text-text-dark">{Number(customer.total_orders || 0)} encomenda(s)</p>
                      <p className="text-xs text-text-muted mt-1">€ {Number(customer.total_spent || 0).toFixed(2)} gasto</p>
                    </td>
                    <td className="py-4 px-6">
                      {customer.rewards?.length > 0 ? (
                        <div className="space-y-1">
                          {customer.rewards.slice(0, 2).map((reward: any) => (
                            <div key={reward.id || reward.coupon_code} className="inline-flex mr-2 mb-1 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-[11px] font-black">
                              {reward.coupon_code || reward.title}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-text-muted">Sem prémios</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-text-muted">
                      {customer.created_at ? new Date(customer.created_at).toLocaleDateString('pt-PT') : '-'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openReward(customer)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Dar prémio/desconto">
                          <Gift className="w-5 h-5" />
                        </button>
                        <button onClick={() => openEdit(customer)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Editar conta">
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button onClick={() => removeCustomer(customer)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Eliminar conta">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCustomers.length === 0 && (
              <div className="py-20 text-center">
                <UserRound className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-black text-text-dark">Ainda não existem contas nesta loja</h3>
                <p className="text-sm text-text-muted mt-1">Quando clientes criarem conta, vão aparecer aqui.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-black">Editar conta</h2>
              <button onClick={() => setEditingCustomer(null)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <label className="block space-y-1">
                <span className="text-xs font-black text-text-muted uppercase">Nome</span>
                <input value={editData.name} onChange={event => setEditData({ ...editData, name: event.target.value })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-primary" />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-black text-text-muted uppercase">Email</span>
                <input type="email" value={editData.email} onChange={event => setEditData({ ...editData, email: event.target.value })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-primary" />
              </label>
            </div>
            <div className="p-6 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setEditingCustomer(null)} className="px-5 py-3 rounded-2xl bg-white border border-border font-black text-sm">Cancelar</button>
              <button onClick={saveCustomer} disabled={saving} className="px-6 py-3 rounded-2xl bg-slate-950 text-white font-black text-sm flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {rewardCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Dar prémio/desconto</h2>
                <p className="text-xs text-text-muted mt-1">Cliente: {rewardCustomer.name} · {rewardCustomer.email}</p>
              </div>
              <button onClick={() => setRewardCustomer(null)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-xs font-black text-text-muted uppercase">Tipo</span>
                <select value={rewardData.reward_type} onChange={event => setRewardData({ ...rewardData, reward_type: event.target.value })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-primary">
                  <option value="discount">Desconto/Cupão</option>
                  <option value="gift">Prémio manual</option>
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-black text-text-muted uppercase">Título</span>
                <input value={rewardData.title} onChange={event => setRewardData({ ...rewardData, title: event.target.value })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-primary" />
              </label>

              {rewardData.reward_type === 'discount' && (
                <>
                  <label className="block space-y-1">
                    <span className="text-xs font-black text-text-muted uppercase">Código</span>
                    <input value={rewardData.code} onChange={event => setRewardData({ ...rewardData, code: event.target.value.toUpperCase() })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-primary font-mono font-black" />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-black text-text-muted uppercase">Tipo de desconto</span>
                    <select value={rewardData.discount_type} onChange={event => setRewardData({ ...rewardData, discount_type: event.target.value })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-primary">
                      <option value="percentage">Percentagem</option>
                      <option value="fixed">Valor fixo</option>
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-black text-text-muted uppercase">Valor</span>
                    <input type="number" step="0.01" value={rewardData.discount_value} onChange={event => setRewardData({ ...rewardData, discount_value: Number(event.target.value) })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-primary" />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-black text-text-muted uppercase">Compra mínima</span>
                    <input type="number" step="0.01" value={rewardData.min_purchase} onChange={event => setRewardData({ ...rewardData, min_purchase: Number(event.target.value) })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-primary" />
                  </label>
                </>
              )}

              <label className="block space-y-1 md:col-span-2">
                <span className="text-xs font-black text-text-muted uppercase">Descrição interna</span>
                <textarea rows={3} value={rewardData.description} onChange={event => setRewardData({ ...rewardData, description: event.target.value })} className="w-full px-4 py-3 rounded-2xl border border-border focus:outline-none focus:border-primary resize-none" placeholder="Ex: cliente VIP, oferta por fidelidade, desconto de recuperação..." />
              </label>
            </div>
            <div className="p-6 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setRewardCustomer(null)} className="px-5 py-3 rounded-2xl bg-white border border-border font-black text-sm">Cancelar</button>
              <button onClick={saveReward} disabled={saving} className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : rewardData.reward_type === 'discount' ? <BadgePercent className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
