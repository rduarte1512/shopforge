'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useMockDB } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { 
  Link as LinkIcon, 
  Plus, 
  Copy, 
  Check, 
  Eye, 
  MousePointer, 
  DollarSign,
  X,
  Loader2,
  Trash2,
  MoreVertical,
  ExternalLink,
  ShoppingCart
} from 'lucide-react';

interface AffiliateLink {
  id: string;
  store_id: string;
  name: string;
  percentage: number;
  code: string;
  click_count: number;
  conversion_count: number;
  total_commission: number;
  active: boolean;
  created_at: string;
}

interface Commission {
  id: string;
  affiliate_link_id: string;
  order_id: string;
  amount: number;
  percentage_used: number;
  status: string;
  created_at: string;
  orders?: {
    customer_name: string;
    total: number;
  };
}

export default function AffiliatesPage() {
  const { user } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [storesLoading, setStoresLoading] = useState(true);
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkPercentage, setNewLinkPercentage] = useState(10);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedLink, setSelectedLink] = useState<AffiliateLink | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loadingCommissions, setLoadingCommissions] = useState(false);

  const currentStore = stores.find(s => s.id === selectedStoreId);

  useEffect(() => {
    async function fetchStores() {
      if (!user || !supabase) return;
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id);
      
      if (!error && data) {
        setStores(data);
        if (data.length > 0 && !selectedStoreId) {
          setSelectedStoreId(data[0].id);
        }
      }
      setStoresLoading(false);
    }

    if (user) fetchStores();
  }, [user]);

  useEffect(() => {
    if (selectedStoreId && isSupabaseConfigured) {
      fetchLinks();
    }
  }, [selectedStoreId]);

  const fetchLinks = async () => {
    if (!supabase || !selectedStoreId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('store_id', selectedStoreId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLinks(data);
    }
    setLoading(false);
  };

  const createLink = async () => {
    if (!supabase || !selectedStoreId || !newLinkName.trim()) return;

    setCreating(true);
    
    // Gerar código único
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const { data, error } = await supabase
      .from('affiliate_links')
      .insert({
        store_id: selectedStoreId,
        name: newLinkName.trim(),
        percentage: newLinkPercentage,
        code: code,
        active: true,
      })
      .select()
      .single();

    if (!error && data) {
      setLinks([data, ...links]);
      setShowModal(false);
      setNewLinkName('');
      setNewLinkPercentage(10);
    }
    setCreating(false);
  };

  const copyLink = (code: string) => {
    if (!currentStore) return;
    const url = `${window.location.origin}/s/${currentStore.domain}?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const deleteLink = async (id: string) => {
    if (!supabase || !confirm('Tens a certeza que queres eliminar este link?')) return;

    const { error } = await supabase
      .from('affiliate_links')
      .delete()
      .eq('id', id);

    if (!error) {
      setLinks(links.filter(l => l.id !== id));
    }
  };

  const toggleActive = async (link: AffiliateLink) => {
    if (!supabase) return;

    await supabase
      .from('affiliate_links')
      .update({ active: !link.active })
      .eq('id', link.id);

    setLinks(links.map(l => l.id === link.id ? { ...l, active: !l.active } : l));
  };

  const fetchCommissions = async (linkId: string) => {
    if (!supabase) return;
    
    setLoadingCommissions(true);
    const { data, error } = await supabase
      .from('affiliate_commissions')
      .select(`
        id,
        affiliate_link_id,
        order_id,
        amount,
        percentage_used,
        status,
        created_at,
        orders (
          customer_name,
          total
        )
      `)
      .eq('affiliate_link_id', linkId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCommissions(data);
    }
    setLoadingCommissions(false);
  };

  const viewLinkDetails = (link: AffiliateLink) => {
    setSelectedLink(link);
    fetchCommissions(link.id);
  };

  if (storesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-shopify-green)]" />
      </div>
    );
  }

  if (!currentStore) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--color-text-muted)]">Seleciona uma loja para gerir os afiliados</p>
      </div>
    );
  }

return (
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-dark)]">Afiliados</h1>
            <p className="text-[var(--color-text-muted)] mt-1">Cria links de afiliados para promotionar a tua loja</p>
          </div>
          {stores.length > 1 && (
            <select
              value={selectedStoreId || ''}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-[14px] bg-white"
            >
              {stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          )}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[var(--color-shopify-green)] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Link
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[12px] text-[var(--color-text-muted)] uppercase tracking-wide">Total Links</p>
              <p className="text-xl font-bold text-[var(--color-text-dark)]">{links.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-[12px] text-[var(--color-text-muted)] uppercase tracking-wide">Total Cliques</p>
              <p className="text-xl font-bold text-[var(--color-text-dark)]">{links.reduce((acc, l) => acc + (l.click_count || 0), 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[12px] text-[var(--color-text-muted)] uppercase tracking-wide">Conversões</p>
              <p className="text-xl font-bold text-[var(--color-text-dark)]">{links.reduce((acc, l) => acc + (l.conversion_count || 0), 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[12px] text-[var(--color-text-muted)] uppercase tracking-wide">Comissão Total</p>
              <p className="text-xl font-bold text-[var(--color-text-dark)]">€{links.reduce((acc, l) => acc + (l.total_commission || 0), 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Links Table */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="p-5 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-[var(--color-text-dark)]">Os Teus Links de Afiliado</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--color-shopify-green)]" />
          </div>
        ) : links.length === 0 ? (
          <div className="p-8 text-center">
            <LinkIcon className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3" />
            <p className="text-[var(--color-text-muted)]">Nenhum link de afiliado criado ainda</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-[var(--color-shopify-green)] font-medium hover:underline"
            >
              Criar primeiro link
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-bg-gray)]">
                <tr>
                  <th className="px-5 py-3 text-left text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Nome</th>
                  <th className="px-5 py-3 text-left text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Código</th>
                  <th className="px-5 py-3 text-left text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Comissão</th>
                  <th className="px-5 py-3 text-left text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Cliques</th>
                  <th className="px-5 py-3 text-left text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Vendas</th>
                  <th className="px-5 py-3 text-left text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Total</th>
                  <th className="px-5 py-3 text-left text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Estado</th>
                  <th className="px-5 py-3 text-right text-[12px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-[var(--color-gray-50)]">
                    <td className="px-5 py-4">
                      <span className="font-medium text-[var(--color-text-dark)]">{link.name}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <code className="bg-[var(--color-bg-gray)] px-2 py-1 rounded text-[13px] font-mono text-[var(--color-text-dark)]">
                          {link.code}
                        </code>
                        <button
                          onClick={() => copyLink(link.code)}
                          className="p-1 hover:bg-[var(--color-gray-100)] rounded transition-colors"
                          title="Copiar link"
                        >
                          {copiedCode === link.code ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-[var(--color-text-muted)]" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[var(--color-text-dark)] font-medium">{link.percentage}%</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-[var(--color-text-muted)]">
                        <MousePointer className="w-4 h-4" />
                        <span>{link.click_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-[var(--color-text-muted)]">
                        <ShoppingCart className="w-4 h-4" />
                        <span>{link.conversion_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-[var(--color-text-dark)]">€{(link.total_commission || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleActive(link)}
                        className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors ${
                          link.active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {link.active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => viewLinkDetails(link)}
                          className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4 text-[var(--color-text-muted)]" />
                        </button>
                        <button
                          onClick={() => copyLink(link.code)}
                          className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg transition-colors"
                          title="Copiar link"
                        >
                          <ExternalLink className="w-4 h-4 text-[var(--color-text-muted)]" />
                        </button>
                        <button
                          onClick={() => deleteLink(link.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--color-text-dark)]">Criar Novo Link de Afiliado</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg"
              >
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[var(--color-text-dark)] mb-1.5">
                  Nome do Link
                </label>
                <input
                  type="text"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  placeholder="Ex: Blog Tech, Influencer Maria..."
                  className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-shopify-green)]/30 focus:border-[var(--color-shopify-green)]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[var(--color-text-dark)] mb-1.5">
                  Percentagem de Comissão (%)
                </label>
                <input
                  type="number"
                  value={newLinkPercentage}
                  onChange={(e) => setNewLinkPercentage(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.5"
                  className="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-shopify-green)]/30 focus:border-[var(--color-shopify-green)]"
                />
                <p className="text-[12px] text-[var(--color-text-muted)] mt-1">
                  Percentagem que o afiliado recebe por cada venda
                </p>
              </div>

              <div className="bg-[var(--color-bg-gray)] p-4 rounded-lg">
                <p className="text-[13px] text-[var(--color-text-muted)]">
                  O link gerado será: <br />
                  <code className="text-[var(--color-text-dark)] font-medium">/{currentStore.domain}?ref=XXXXXXXX</code>
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg font-medium text-[var(--color-text-dark)] hover:bg-[var(--color-gray-50)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createLink}
                disabled={creating || !newLinkName.trim()}
                className="flex-1 px-4 py-2.5 bg-[var(--color-shopify-green)] text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    A criar...
                  </>
                ) : (
                  'Criar Link'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-dark)]">{selectedLink.name}</h3>
                <p className="text-[13px] text-[var(--color-text-muted)]">Código: {selectedLink.code}</p>
              </div>
              <button
                onClick={() => setSelectedLink(null)}
                className="p-2 hover:bg-[var(--color-gray-100)] rounded-lg"
              >
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-[var(--color-bg-gray)] p-4 rounded-lg text-center">
                  <p className="text-[12px] text-[var(--color-text-muted)]">Cliques</p>
                  <p className="text-xl font-bold text-[var(--color-text-dark)]">{selectedLink.click_count || 0}</p>
                </div>
                <div className="bg-[var(--color-bg-gray)] p-4 rounded-lg text-center">
                  <p className="text-[12px] text-[var(--color-text-muted)]">Vendas</p>
                  <p className="text-xl font-bold text-[var(--color-text-dark)]">{selectedLink.conversion_count || 0}</p>
                </div>
                <div className="bg-[var(--color-bg-gray)] p-4 rounded-lg text-center">
                  <p className="text-[12px] text-[var(--color-text-muted)]">Comissão</p>
                  <p className="text-xl font-bold text-[var(--color-text-dark)]">€{(selectedLink.total_commission || 0).toFixed(2)}</p>
                </div>
              </div>

              <h4 className="font-semibold text-[var(--color-text-dark)] mb-3">Histórico de Vendas</h4>
              
              {loadingCommissions ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--color-shopify-green)]" />
                </div>
              ) : commissions.length === 0 ? (
                <p className="text-center text-[var(--color-text-muted)] py-8">Nenhuma venda ainda</p>
              ) : (
                <div className="space-y-2">
                  {commissions.map((comm) => (
                    <div key={comm.id} className="flex items-center justify-between p-3 bg-[var(--color-bg-gray)] rounded-lg">
                      <div>
                        <p className="font-medium text-[var(--color-text-dark)]">{comm.orders?.customer_name || 'Cliente'}</p>
                        <p className="text-[12px] text-[var(--color-text-muted)]">
                          Venda: €{comm.orders?.total?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-[var(--color-shopify-green)]">+€{comm.amount.toFixed(2)}</p>
                        <p className="text-[12px] text-[var(--color-text-muted)]">{comm.percentage_used}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-[var(--color-border)]">
              <div className="bg-[var(--color-bg-gray)] p-4 rounded-lg flex items-center gap-3">
                <span className="text-[13px] text-[var(--color-text-muted)]">Link:</span>
                <code className="flex-1 text-[13px] font-mono text-[var(--color-text-dark)] truncate">
                  {window.location.origin}/s/{currentStore.domain}?ref={selectedLink.code}
                </code>
                <button
                  onClick={() => copyLink(selectedLink.code)}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  {copiedCode === selectedLink.code ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-[var(--color-text-muted)]" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}