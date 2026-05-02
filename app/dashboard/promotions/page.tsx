'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useMockDB } from '@/lib/store';
import { 
  Plus, Edit2, Trash2, X, Megaphone, Percent, 
  Calendar, DollarSign, Package, Link2, Loader2,
  Eye, EyeOff, GripVertical, ShoppingCart, Tag,
  Sparkles, Truck
} from 'lucide-react';
import Image from 'next/image';

type TabType = 'banners' | 'rules';

type Banner = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  link_type: string;
  link_value: string;
  position: string;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  priority: number;
  click_count: number;
};

type PromotionRule = {
  id: string;
  name: string;
  description: string;
  rule_type: string;
  conditions: any;
  discount_type: string;
  discount_value: number;
  applicable_categories: string[];
  min_purchase: number;
  min_quantity: number;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  usage_count: number;
  max_uses: number | null;
};

const ruleTypeLabels: Record<string, string> = {
  'buy_x_get_y': 'Compre X Leve Y',
  'discount_category': 'Desconto por Categoria',
  'shipping_free': 'Frete Grátis',
  'bulk_discount': 'Desconto por Quantidade',
  'first_order': 'Primeira Encomenda'
};

const ruleTypeIcons: Record<string, any> = {
  'buy_x_get_y': ShoppingCart,
  'discount_category': Tag,
  'shipping_free': Truck,
  'bulk_discount': Percent,
  'first_order': Sparkles
};

const positionOptions = [
  { value: 'hero', label: 'Hero (Topo)' },
  { value: 'banner', label: 'Banner (Meio)' },
  { value: 'popup', label: 'Popup (Modal)' },
  { value: 'sidebar', label: 'Barra Lateral' }
];

export default function PromotionsPage() {
  const { user } = useAuth();
  const { selectedStoreId } = useMockDB();
  const [activeTab, setActiveTab] = useState<TabType>('banners');
  const [stores, setStores] = useState<any[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [rules, setRules] = useState<PromotionRule[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [editingRule, setEditingRule] = useState<PromotionRule | null>(null);

  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    link_type: 'none',
    link_value: '',
    position: 'banner',
    active: true,
    start_date: '',
    end_date: '',
    priority: 0
  });

  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    rule_type: 'discount_category',
    discount_type: 'percentage',
    discount_value: '',
    applicable_categories: '',
    min_purchase: '0',
    min_quantity: '',
    active: true,
    start_date: '',
    end_date: '',
    max_uses: ''
  });

  const fetchData = async () => {
    if (!user || !supabase) return;
    try {
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id);
      
      if (storesError) throw storesError;
      setStores(storesData || []);

      const currentStore = selectedStoreId 
        ? storesData?.find(s => s.id === selectedStoreId) || storesData?.[0]
        : storesData?.[0];

      if (currentStore) {
        const { data: bannersData } = await supabase
          .from('promotions')
          .select('*')
          .eq('store_id', currentStore.id)
          .order('priority', { ascending: true });
        
        const { data: rulesData } = await supabase
          .from('promotion_rules')
          .select('*')
          .eq('store_id', currentStore.id)
          .order('created_at', { ascending: false });
        
        setBanners(bannersData || []);
        setRules(rulesData || []);
      }
    } catch (err) {
      console.error('Error fetching promotions data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, selectedStoreId]);

  const currentStoreId = selectedStoreId || stores[0]?.id;

  const openBannerModal = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        title: banner.title,
        subtitle: banner.subtitle || '',
        description: banner.description || '',
        image_url: banner.image_url || '',
        link_type: banner.link_type || 'none',
        link_value: banner.link_value || '',
        position: banner.position || 'banner',
        active: banner.active,
        start_date: banner.start_date ? new Date(banner.start_date).toISOString().split('T')[0] : '',
        end_date: banner.end_date ? new Date(banner.end_date).toISOString().split('T')[0] : '',
        priority: banner.priority || 0
      });
    } else {
      setEditingBanner(null);
      setBannerForm({
        title: '',
        subtitle: '',
        description: '',
        image_url: '',
        link_type: 'none',
        link_value: '',
        position: 'banner',
        active: true,
        start_date: '',
        end_date: '',
        priority: 0
      });
    }
    setIsBannerModalOpen(true);
  };

  const openRuleModal = (rule?: PromotionRule) => {
    if (rule) {
      setEditingRule(rule);
      setRuleForm({
        name: rule.name,
        description: rule.description || '',
        rule_type: rule.rule_type,
        discount_type: rule.discount_type,
        discount_value: rule.discount_value?.toString() || '',
        applicable_categories: rule.applicable_categories?.join(', ') || '',
        min_purchase: rule.min_purchase?.toString() || '0',
        min_quantity: rule.min_quantity?.toString() || '',
        active: rule.active,
        start_date: rule.start_date ? new Date(rule.start_date).toISOString().split('T')[0] : '',
        end_date: rule.end_date ? new Date(rule.end_date).toISOString().split('T')[0] : '',
        max_uses: rule.max_uses?.toString() || ''
      });
    } else {
      setEditingRule(null);
      setRuleForm({
        name: '',
        description: '',
        rule_type: 'discount_category',
        discount_type: 'percentage',
        discount_value: '',
        applicable_categories: '',
        min_purchase: '0',
        min_quantity: '',
        active: true,
        start_date: '',
        end_date: '',
        max_uses: ''
      });
    }
    setIsRuleModalOpen(true);
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStoreId || !supabase) return;

    const bannerData = {
      store_id: currentStoreId,
      title: bannerForm.title,
      subtitle: bannerForm.subtitle || null,
      description: bannerForm.description || null,
      image_url: bannerForm.image_url || null,
      link_type: bannerForm.link_type,
      link_value: bannerForm.link_value || null,
      position: bannerForm.position,
      active: bannerForm.active,
      start_date: bannerForm.start_date || null,
      end_date: bannerForm.end_date || null,
      priority: bannerForm.priority
    };

    try {
      if (editingBanner) {
        const { error } = await supabase
          .from('promotions')
          .update(bannerData)
          .eq('id', editingBanner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('promotions')
          .insert(bannerData);
        if (error) throw error;
      }
      setIsBannerModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`Erro ao guardar promoção: ${err.message}`);
    }
  };

  const handleRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStoreId || !supabase) return;

    const ruleData = {
      store_id: currentStoreId,
      name: ruleForm.name,
      description: ruleForm.description || null,
      rule_type: ruleForm.rule_type,
      conditions: ruleForm.rule_type === 'buy_x_get_y' 
        ? { min_quantity: parseInt(ruleForm.min_quantity) || 2, free_quantity: 1 }
        : {},
      discount_type: ruleForm.discount_type,
      discount_value: ruleForm.discount_type !== 'free_shipping' ? parseFloat(ruleForm.discount_value) : 0,
      applicable_categories: ruleForm.applicable_categories ? ruleForm.applicable_categories.split(',').map(c => c.trim()) : [],
      min_purchase: parseFloat(ruleForm.min_purchase),
      min_quantity: ruleForm.min_quantity ? parseInt(ruleForm.min_quantity) : null,
      active: ruleForm.active,
      start_date: ruleForm.start_date || null,
      end_date: ruleForm.end_date || null,
      max_uses: ruleForm.max_uses ? parseInt(ruleForm.max_uses) : null
    };

    try {
      if (editingRule) {
        const { error } = await supabase
          .from('promotion_rules')
          .update(ruleData)
          .eq('id', editingRule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('promotion_rules')
          .insert(ruleData);
        if (error) throw error;
      }
      setIsRuleModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(`Erro ao guardar regra: ${err.message}`);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Tens a certeza que desejas eliminar este banner?') || !supabase) return;
    try {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(`Erro ao eliminar banner: ${err.message}`);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Tens a certeza que desejas eliminar esta regra?') || !supabase) return;
    try {
      const { error } = await supabase.from('promotion_rules').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert(`Erro ao eliminar regra: ${err.message}`);
    }
  };

  const handleToggleBanner = async (banner: Banner) => {
    if (!supabase) return;
    try {
      await supabase.from('promotions').update({ active: !banner.active }).eq('id', banner.id);
      fetchData();
    } catch (err: any) {
      alert(`Erro ao atualizar: ${err.message}`);
    }
  };

  const handleToggleRule = async (rule: PromotionRule) => {
    if (!supabase) return;
    try {
      await supabase.from('promotion_rules').update({ active: !rule.active }).eq('id', rule.id);
      fetchData();
    } catch (err: any) {
      alert(`Erro ao atualizar: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-shopify-green)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-[24px] font-[600] tracking-tight text-[var(--color-text-dark)]">Promoções</h1>
          <p className="text-[14px] text-[var(--color-text-muted)] mt-1">Gerir banners e regras de desconto automático.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => openBannerModal()}
            className="bg-white border border-[var(--color-border)] text-[var(--color-text-dark)] px-4 py-2 rounded-md font-[600] text-[13px] flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <Megaphone className="w-4 h-4" /> Novo Banner
          </button>
          <button 
            onClick={() => openRuleModal()}
            className="bg-[var(--color-shopify-green)] text-white px-4 py-2 rounded-md font-[600] text-[13px] flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
          >
            <Percent className="w-4 h-4" /> Nova Regra
          </button>
        </div>
      </div>

      <div className="flex border-b border-[var(--color-border)]">
        <button
          onClick={() => setActiveTab('banners')}
          className={`px-6 py-3 text-[14px] font-[600] border-b-2 transition-colors ${
            activeTab === 'banners'
              ? 'border-[var(--color-shopify-green)] text-[var(--color-shopify-green)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-dark)]'
          }`}
        >
          <Megaphone className="w-4 h-4 inline mr-2" />
          Banners ({banners.length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-6 py-3 text-[14px] font-[600] border-b-2 transition-colors ${
            activeTab === 'rules'
              ? 'border-[var(--color-shopify-green)] text-[var(--color-shopify-green)]'
              : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-dark)]'
          }`}
        >
          <Percent className="w-4 h-4 inline mr-2" />
          Regras de Desconto ({rules.length})
        </button>
      </div>

      {activeTab === 'banners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div key={banner.id} className={`bg-white rounded-xl shadow-[var(--shadow-card)] border border-[var(--color-border)] overflow-hidden ${!banner.active ? 'opacity-60' : ''}`}>
              <div className="relative h-40 bg-gray-100">
                {banner.image_url ? (
                  <Image src={banner.image_url} alt={banner.title} fill className="object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Megaphone className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-[600] ${
                    banner.position === 'hero' ? 'bg-purple-100 text-purple-700' :
                    banner.position === 'popup' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {banner.position}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-[600] text-[15px] text-[var(--color-text-dark)]">{banner.title}</h3>
                {banner.subtitle && <p className="text-[12px] text-[var(--color-text-muted)] mt-1">{banner.subtitle}</p>}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleBanner(banner)}
                      className={`p-1.5 rounded-lg transition-colors ${banner.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                    >
                      {banner.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <span className="text-[11px] text-[var(--color-text-muted)]">{banner.click_count} cliques</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openBannerModal(banner)} className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-shopify-green)] transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteBanner(banner.id)} className="p-1.5 text-[var(--color-text-muted)] hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {banners.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-[14px] text-[var(--color-text-muted)]">Nenhum banner criado.</p>
              <button onClick={() => openBannerModal()} className="mt-3 text-[var(--color-shopify-green)] text-[13px] font-[600] hover:underline">
                Criar primeiro banner
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="bg-white rounded-xl shadow-[var(--shadow-card)] border border-[var(--color-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--color-gray-50)]">
                  <th className="text-left text-[12px] font-[600] text-[var(--color-text-muted)] py-4 px-6 border-b border-[var(--color-border)] uppercase tracking-wider">Nome</th>
                  <th className="text-left text-[12px] font-[600] text-[var(--color-text-muted)] py-4 px-6 border-b border-[var(--color-border)] uppercase tracking-wider">Tipo</th>
                  <th className="text-left text-[12px] font-[600] text-[var(--color-text-muted)] py-4 px-6 border-b border-[var(--color-border)] uppercase tracking-wider">Desconto</th>
                  <th className="text-left text-[12px] font-[600] text-[var(--color-text-muted)] py-4 px-6 border-b border-[var(--color-border)] uppercase tracking-wider">Uso</th>
                  <th className="text-left text-[12px] font-[600] text-[var(--color-text-muted)] py-4 px-6 border-b border-[var(--color-border)] uppercase tracking-wider">Estado</th>
                  <th className="text-right text-[12px] font-[600] text-[var(--color-text-muted)] py-4 px-6 border-b border-[var(--color-border)] uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {rules.map((rule) => {
                  const RuleIcon = ruleTypeIcons[rule.rule_type] || Percent;
                  return (
                    <tr key={rule.id} className="hover:bg-[var(--color-gray-50)] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                            <RuleIcon className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <span className="font-[500] text-[14px] text-[var(--color-text-dark)]">{rule.name}</span>
                            {rule.description && <p className="text-[11px] text-[var(--color-text-muted)]">{rule.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[13px] text-[var(--color-text-dark)]">{ruleTypeLabels[rule.rule_type]}</span>
                        {rule.min_purchase > 0 && (
                          <p className="text-[11px] text-[var(--color-text-muted)]">Mín. €{Number(rule.min_purchase).toFixed(2)}</p>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[14px] font-[600]">
                          {rule.discount_type === 'percentage' ? `${rule.discount_value}%` :
                           rule.discount_type === 'free_shipping' ? 'Frete Grátis' :
                           `€ ${Number(rule.discount_value).toFixed(2)}`}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-[13px] text-[var(--color-text-dark)]">
                          {rule.usage_count} {rule.max_uses ? `/ ${rule.max_uses}` : 'utilizações'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleRule(rule)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-[600] cursor-pointer ${rule.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {rule.active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-3 text-[var(--color-text-muted)]">
                          <button onClick={() => openRuleModal(rule)} className="hover:text-[var(--color-shopify-green)] transition-colors">
                            <Edit2 className="w-4.5 h-4.5" />
                          </button>
                          <button onClick={() => handleDeleteRule(rule.id)} className="hover:text-red-600 transition-colors">
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-[var(--color-text-muted)]">
                      Nenhuma regra de desconto criada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isBannerModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[var(--color-gray-50)]">
              <h2 className="text-lg font-bold">{editingBanner ? 'Editar Banner' : 'Novo Banner'}</h2>
              <button onClick={() => setIsBannerModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleBannerSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Título *</label>
                <input required type="text" placeholder="Ex: Sale de Verão" value={bannerForm.title} onChange={e => setBannerForm({...bannerForm, title: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]" />
              </div>
              <div>
                <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Subtítulo</label>
                <input type="text" placeholder="Ex: Até 50% de desconto" value={bannerForm.subtitle} onChange={e => setBannerForm({...bannerForm, subtitle: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]" />
              </div>
              <div>
                <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">URL da Imagem</label>
                <input type="url" placeholder="https://..." value={bannerForm.image_url} onChange={e => setBannerForm({...bannerForm, image_url: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Posição</label>
                  <select value={bannerForm.position} onChange={e => setBannerForm({...bannerForm, position: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]">
                    {positionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Prioridade</label>
                  <input type="number" value={bannerForm.priority} onChange={e => setBannerForm({...bannerForm, priority: parseInt(e.target.value)})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Link Tipo</label>
                  <select value={bannerForm.link_type} onChange={e => setBannerForm({...bannerForm, link_type: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]">
                    <option value="none">Sem Link</option>
                    <option value="product">Produto</option>
                    <option value="category">Categoria</option>
                    <option value="url">URL Externa</option>
                  </select>
                </div>
                {bannerForm.link_type !== 'none' && (
                  <div>
                    <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Link Valor</label>
                    <input type="text" placeholder={bannerForm.link_type === 'url' ? 'https://...' : 'ID ou nome'} value={bannerForm.link_value} onChange={e => setBannerForm({...bannerForm, link_value: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Data Início</label>
                  <input type="date" value={bannerForm.start_date} onChange={e => setBannerForm({...bannerForm, start_date: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]" />
                </div>
                <div>
                  <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Data Fim</label>
                  <input type="date" value={bannerForm.end_date} onChange={e => setBannerForm({...bannerForm, end_date: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="banner-active" checked={bannerForm.active} onChange={e => setBannerForm({...bannerForm, active: e.target.checked})} className="w-4 h-4" />
                <label htmlFor="banner-active" className="text-sm font-medium cursor-pointer">Banner Ativo</label>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsBannerModalOpen(false)} className="px-6 py-2.5 text-gray-500 font-bold text-[13px] hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-[var(--color-text-dark)] text-white font-bold text-[13px] rounded-lg">Guardar Banner</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRuleModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[var(--color-gray-50)]">
              <h2 className="text-lg font-bold">{editingRule ? 'Editar Regra' : 'Nova Regra'}</h2>
              <button onClick={() => setIsRuleModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleRuleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Nome *</label>
                <input required type="text" placeholder="Ex: Desconto Cliente Fiel" value={ruleForm.name} onChange={e => setRuleForm({...ruleForm, name: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]" />
              </div>
              <div>
                <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Descrição</label>
                <input type="text" placeholder="Descrição opcional" value={ruleForm.description} onChange={e => setRuleForm({...ruleForm, description: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Tipo de Regra</label>
                  <select value={ruleForm.rule_type} onChange={e => setRuleForm({...ruleForm, rule_type: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]">
                    <option value="discount_category">Desconto por Categoria</option>
                    <option value="buy_x_get_y">Compre X Leve Y</option>
                    <option value="bulk_discount">Desconto por Quantidade</option>
                    <option value="shipping_free">Frete Grátis</option>
                    <option value="first_order">Primeira Encomenda</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Tipo de Desconto</label>
                  <select value={ruleForm.discount_type} onChange={e => setRuleForm({...ruleForm, discount_type: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]">
                    <option value="percentage">Percentagem (%)</option>
                    <option value="fixed">Valor Fixo (€)</option>
                    <option value="free_shipping">Frete Grátis</option>
                  </select>
                </div>
              </div>
              {ruleForm.discount_type !== 'free_shipping' && (
                <div>
                  <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Valor do Desconto *</label>
                  <input required type="number" step="0.01" placeholder={ruleForm.discount_type === 'percentage' ? '10' : '5.00'} value={ruleForm.discount_value} onChange={e => setRuleForm({...ruleForm, discount_value: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Compra Mínima (€)</label>
                  <input type="number" step="0.01" value={ruleForm.min_purchase} onChange={e => setRuleForm({...ruleForm, min_purchase: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]" />
                </div>
                {(ruleForm.rule_type === 'buy_x_get_y' || ruleForm.rule_type === 'bulk_discount') && (
                  <div>
                    <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Quantidade Mínima</label>
                    <input type="number" value={ruleForm.min_quantity} onChange={e => setRuleForm({...ruleForm, min_quantity: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Categorias Aplicáveis</label>
                <input type="text" placeholder="Roupa, Acessórios (separadas por vírgula)" value={ruleForm.applicable_categories} onChange={e => setRuleForm({...ruleForm, applicable_categories: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Data Início</label>
                  <input type="date" value={ruleForm.start_date} onChange={e => setRuleForm({...ruleForm, start_date: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]" />
                </div>
                <div>
                  <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Data Fim</label>
                  <input type="date" value={ruleForm.end_date} onChange={e => setRuleForm({...ruleForm, end_date: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-[600] text-[var(--color-text-dark)] mb-1.5">Limite de Usos</label>
                <input type="number" placeholder="Sem limite" value={ruleForm.max_uses} onChange={e => setRuleForm({...ruleForm, max_uses: e.target.value})} className="w-full px-4 py-2.5 bg-[var(--color-gray-50)] border rounded-lg text-[14px]" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="rule-active" checked={ruleForm.active} onChange={e => setRuleForm({...ruleForm, active: e.target.checked})} className="w-4 h-4" />
                <label htmlFor="rule-active" className="text-sm font-medium cursor-pointer">Regra Ativa</label>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsRuleModalOpen(false)} className="px-6 py-2.5 text-gray-500 font-bold text-[13px] hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-[var(--color-text-dark)] text-white font-bold text-[13px] rounded-lg">Guardar Regra</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}