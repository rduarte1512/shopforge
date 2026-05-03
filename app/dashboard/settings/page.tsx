'use client';

import { useState, useEffect } from 'react';
import { useMockDB, PaymentMethod } from '@/lib/store';
import { useUser } from '@clerk/nextjs';
import { Save, Store, Package, CreditCard, Palette, Search, Bell, ChevronDown, ChevronUp, Wallet, Building, Smartphone, CreditCard as CardIcon, Banknote, Loader2 } from 'lucide-react';
import { getMyStoresAction } from '@/lib/actions';

interface FormData {
  name: string;
  domain: string;
  description: string;
  theme: 'light' | 'dark';
  primaryColor: string;
  phone: string;
  email: string;
  address: string;
  businessHours: string;
  currency: string;
  currencySymbol: string;
  baseCurrency: string;
  returnPolicy: string;
  termsAndConditions: string;
  privacyPolicy: string;
  lowStockThreshold: number;
  notifyLowStock: boolean;
  logoUrl: string;
  bannerUrl: string;
  faviconUrl: string;
  secondaryColor: string;
  metaTitle: string;
  metaDescription: string;
  notifyNewOrder: boolean;
  notifyOrderStatus: boolean;
  paymentMethods: PaymentMethod[];
}

const Section = ({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: any; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-[8px] shadow-[var(--shadow-card)] border border-[var(--color-border)] overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-shopify-green" />
          <span className="font-semibold text-[15px] text-text-dark">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
      </button>
      {isOpen && <div className="px-6 pb-6 border-t border-[var(--color-border)]">{children}</div>}
    </div>
  );
};

const InputField = ({ label, ...props }: { label: string; [key: string]: any }) => (
  <div>
    <label className="block text-[13px] font-[600] text-text-dark mb-1">{label}</label>
    <input {...props} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[4px] focus:outline-none focus:border-shopify-green text-[14px]" />
  </div>
);

const TextAreaField = ({ label, ...props }: { label: string; [key: string]: any }) => (
  <div>
    <label className="block text-[13px] font-[600] text-text-dark mb-1">{label}</label>
    <textarea {...props} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[4px] focus:outline-none focus:border-shopify-green text-[14px]" rows={3} />
  </div>
);

const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <label className="flex items-center gap-3 cursor-pointer">
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-shopify-green' : 'bg-gray-300'}`} />
      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </div>
    <span className="text-[14px] text-text-dark">{label}</span>
  </label>
);

export default function SettingsPage() {
  const { user: clerkUser } = useUser();
  const { updateStore: updateMockStore, selectedStoreId } = useMockDB();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentStore, setCurrentStore] = useState<any>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '', domain: '', description: '', theme: 'light', primaryColor: '#000000',
    phone: '', email: '', address: '', businessHours: '',
    currency: 'EUR', currencySymbol: '€', baseCurrency: 'EUR', returnPolicy: '', termsAndConditions: '', privacyPolicy: '',
    lowStockThreshold: 10, notifyLowStock: true,
    logoUrl: '', bannerUrl: '', faviconUrl: '', secondaryColor: '#2D3748',
    metaTitle: '', metaDescription: '',
    notifyNewOrder: true, notifyOrderStatus: true,
    paymentMethods: [
      { id: 'pm1', type: 'multibanco', name: 'Multibanco', description: 'Pagamento via Multibanco', active: true, instructions: 'Após confirmar a encomenda, receberá uma referência Multibanco por email.' },
      { id: 'pm2', type: 'mbway', name: 'MB WAY', description: 'Pagamento via MB WAY', active: true, instructions: 'Receberá uma notificação no seu telemóvel para confirmar o pagamento.' },
      { id: 'pm3', type: 'paypal', name: 'PayPal', description: 'Pagamento via PayPal', active: false, instructions: 'Será redirecionado para o PayPal para completar o pagamento.' },
      { id: 'pm4', type: 'transfer', name: 'Transferência Bancária', description: 'Transferência direta para a conta da loja', active: false, instructions: 'Após confirmar, receberá os dados bancários por email.' },
      { id: 'pm5', type: 'cash', name: 'Pagamento à Entrega', description: 'Pagamento em dinheiro quando receber a encomenda', active: false, instructions: 'Pague em dinheiro ao receber a sua encomenda.' }
    ]
  });

  const setFormDataFromStore = (store: any) => {
    setFormData({
      name: store.name || '',
      domain: store.domain || '',
      description: store.description || '',
      theme: store.theme || 'light',
      primaryColor: store.primary_color || store.primaryColor || '#000000',
      phone: store.phone || '',
      email: store.email || '',
      address: store.address || '',
      businessHours: store.business_hours || store.businessHours || '',
      currency: store.currency || 'EUR',
      currencySymbol: store.currency_symbol || store.currencySymbol || '€',
      baseCurrency: store.base_currency || store.baseCurrency || 'EUR',
      returnPolicy: store.return_policy || store.returnPolicy || '',
      termsAndConditions: store.terms_and_conditions || store.termsAndConditions || '',
      privacyPolicy: store.privacy_policy || store.privacyPolicy || '',
      lowStockThreshold: store.low_stock_threshold || store.lowStockThreshold || 10,
      notifyLowStock: store.notify_low_stock ?? store.notifyLowStock ?? true,
      logoUrl: store.logo_url || store.logoUrl || '',
      bannerUrl: store.banner_url || store.bannerUrl || '',
      faviconUrl: store.favicon_url || store.faviconUrl || '',
      secondaryColor: store.secondary_color || store.secondaryColor || '#2D3748',
      metaTitle: store.meta_title || store.metaTitle || '',
      metaDescription: store.meta_description || store.metaDescription || '',
      notifyNewOrder: store.notify_new_order ?? store.notifyNewOrder ?? true,
      notifyOrderStatus: store.notify_order_status ?? store.notifyOrderStatus ?? true,
      paymentMethods: store.payment_methods || store.paymentMethods || [
        { id: 'pm1', type: 'multibanco', name: 'Multibanco', description: 'Pagamento via Multibanco', active: true, instructions: 'Após confirmar a encomenda, receberá uma referência Multibanco por email.' },
        { id: 'pm2', type: 'mbway', name: 'MB WAY', description: 'Pagamento via MB WAY', active: true, instructions: 'Receberá uma notificação no seu telemóvel para confirmar o pagamento.' },
        { id: 'pm3', type: 'paypal', name: 'PayPal', description: 'Pagamento via PayPal', active: false, instructions: 'Será redirecionado para o PayPal para completar o pagamento.' },
        { id: 'pm4', type: 'transfer', name: 'Transferência Bancária', description: 'Transferência direta para a conta da loja', active: false, instructions: 'Após confirmar, receberá os dados bancários por email.' },
        { id: 'pm5', type: 'cash', name: 'Pagamento à Entrega', description: 'Pagamento em dinheiro quando receber a encomenda', active: false, instructions: 'Pague em dinheiro ao receber a sua encomenda.' }
      ]
    });
  };

  useEffect(() => {
    async function fetchStore() {
      if (!clerkUser || !selectedStoreId) {
        setLoading(false);
        return;
      }

      try {
        const stores = await getMyStoresAction();
        const store = stores.find((s: any) => s.id === selectedStoreId);

        if (store) {
          setCurrentStore(store);
          setFormDataFromStore(store);
        }
      } catch (err) {
        console.error('Error fetching store in settings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStore();
  }, [clerkUser, selectedStoreId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // In a real app, you'd call a server action to update Neon
    // For now, we update the mock DB for consistency
    if (currentStore?.id) {
      updateMockStore(currentStore.id, formData as any);
    }
    
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-shopify-green" />
      </div>
    );
  }

  if (!currentStore) {
    return (
      <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
        <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Loja não encontrada</h2>
        <p className="text-gray-500">Por favor, selecione uma loja para configurar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[24px] font-[600] tracking-tight text-text-dark">Configurações</h1>
          <p className="text-[14px] text-text-muted mt-1">Gerencie todas as configurações da sua loja.</p>
        </div>
      </div>

      {saved && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg flex items-center justify-between border border-emerald-200 animate-in fade-in slide-in-from-top-2">
          <span className="font-medium text-[14px]">Configurações guardadas com sucesso!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 pb-20">
        <Section title="Informações da Loja" icon={Store} defaultOpen={true}>
          <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Nome da Loja" value={formData.name} onChange={(e: any) => updateField('name', e.target.value)} />
            <InputField label="Domínio" value={formData.domain} onChange={(e: any) => updateField('domain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} />
            <InputField label="Telefone" value={formData.phone} onChange={(e: any) => updateField('phone', e.target.value)} placeholder="+351 912 345 678" />
            <InputField label="Email de Contacto" type="email" value={formData.email} onChange={(e: any) => updateField('email', e.target.value)} placeholder="contact@loja.com" />
            <div className="md:col-span-2">
              <InputField label="Morada" value={formData.address} onChange={(e: any) => updateField('address', e.target.value)} placeholder="Rua, Número, Cidade" />
            </div>
            <div className="md:col-span-2">
              <InputField label="Horário de Funcionamento" value={formData.businessHours} onChange={(e: any) => updateField('businessHours', e.target.value)} placeholder="9:00 - 18:00, Segunda a Sexta" />
            </div>
            <div className="md:col-span-2">
              <TextAreaField label="Descrição" value={formData.description} onChange={(e: any) => updateField('description', e.target.value)} />
            </div>
          </div>
        </Section>

        <Section title="Aparência" icon={Palette}>
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-[600] text-text-dark mb-1">Tema Base</label>
                <select value={formData.theme} onChange={(e: any) => updateField('theme', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[4px] focus:outline-none focus:border-shopify-green text-[14px]">
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-[600] text-text-dark mb-1">Cor Principal</label>
                <div className="flex gap-2">
                  <input type="color" value={formData.primaryColor} onChange={(e: any) => updateField('primaryColor', e.target.value)} className="h-[38px] w-[38px] border-0 p-0 rounded cursor-pointer" />
                  <input type="text" value={formData.primaryColor} onChange={(e: any) => updateField('primaryColor', e.target.value)} className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-[4px] focus:outline-none focus:border-shopify-green text-[14px]" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-[600] text-text-dark mb-1">Cor Secundária</label>
                <div className="flex gap-2">
                  <input type="color" value={formData.secondaryColor} onChange={(e: any) => updateField('secondaryColor', e.target.value)} className="h-[38px] w-[38px] border-0 p-0 rounded cursor-pointer" />
                  <input type="text" value={formData.secondaryColor} onChange={(e: any) => updateField('secondaryColor', e.target.value)} className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-[4px] focus:outline-none focus:border-shopify-green text-[14px]" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[var(--color-border)]">
              <InputField label="URL do Logo" value={formData.logoUrl} onChange={(e: any) => updateField('logoUrl', e.target.value)} placeholder="https://..." />
              <InputField label="URL do Banner" value={formData.bannerUrl} onChange={(e: any) => updateField('bannerUrl', e.target.value)} placeholder="https://..." />
              <InputField label="URL do Favicon" value={formData.faviconUrl} onChange={(e: any) => updateField('faviconUrl', e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </Section>

        <Section title="Produtos" icon={Package}>
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <InputField label="Alerta de Stock Baixo" type="number" value={formData.lowStockThreshold} onChange={(e: any) => updateField('lowStockThreshold', parseInt(e.target.value) || 0)} />
                <p className="text-[12px] text-text-muted mt-1">Notificar quando o stock atingir este valor</p>
              </div>
              <div className="flex flex-col justify-center gap-4">
                <Toggle checked={formData.notifyLowStock} onChange={(v) => updateField('notifyLowStock', v)} label="Notificar stock baixo por email" />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Checkout & Pagamentos" icon={CreditCard}>
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[13px] font-[600] text-text-dark mb-1">Moeda de Referência (Base)</label>
                <select value={formData.baseCurrency} onChange={(e: any) => updateField('baseCurrency', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[4px] focus:outline-none focus:border-shopify-green text-[14px]">
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - Dólar Americano</option>
                  <option value="GBP">GBP - Libra Esterlina</option>
                  <option value="BRL">BRL - Real Brasileiro</option>
                </select>
                <p className="text-[10px] text-text-muted mt-1">Os preços dos produtos são definidos nesta moeda.</p>
              </div>
              <div>
                <label className="block text-[13px] font-[600] text-text-dark mb-1">Moeda de Visualização</label>
                <select value={formData.currency} onChange={(e: any) => updateField('currency', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[4px] focus:outline-none focus:border-shopify-green text-[14px]">
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - Dólar Americano</option>
                  <option value="GBP">GBP - Libra Esterlina</option>
                  <option value="BRL">BRL - Real Brasileiro</option>
                  <option value="AOA">AOA - Kwanza Angolano</option>
                </select>
                <p className="text-[10px] text-text-muted mt-1">Moeda padrão mostrada na loja.</p>
              </div>
              <InputField label="Símbolo da Moeda" value={formData.currencySymbol} onChange={(e: any) => updateField('currencySymbol', e.target.value)} />
            </div>
            <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
              <TextAreaField label="Política de Devolução" value={formData.returnPolicy} onChange={(e: any) => updateField('returnPolicy', e.target.value)} placeholder="Descreva a política de devolução da sua loja..." />
              <TextAreaField label="Termos e Condições" value={formData.termsAndConditions} onChange={(e: any) => updateField('termsAndConditions', e.target.value)} placeholder="Descreva os termos e condições..." />
              <TextAreaField label="Política de Privacidade" value={formData.privacyPolicy} onChange={(e: any) => updateField('privacyPolicy', e.target.value)} placeholder="Descreva a política de privacidade..." />
            </div>
          </div>
        </Section>

        <Section title="Métodos de Pagamento" icon={Wallet} defaultOpen={true}>
          <div className="pt-4 space-y-4">
            <p className="text-[13px] text-text-muted mb-4">Selecione os métodos de pagamento que deseja disponibilizar aos seus clientes na loja.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.paymentMethods.map((method, index) => (
                <div key={method.id} className={`p-4 rounded-[8px] border-2 transition-all ${method.active ? 'border-shopify-green bg-shopify-green/5' : 'border-[var(--color-border)] bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${method.active ? 'bg-shopify-green text-white' : 'bg-gray-200 text-gray-400'}`}>
                        {method.type === 'multibanco' && <Building className="w-5 h-5" />}
                        {method.type === 'mbway' && <Smartphone className="w-5 h-5" />}
                        {method.type === 'paypal' && <CardIcon className="w-5 h-5" />}
                        {method.type === 'transfer' && <Banknote className="w-5 h-5" />}
                        {method.type === 'cash' && <Wallet className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-[14px] text-text-dark">{method.name}</p>
                        <p className="text-[11px] text-text-muted">{method.description}</p>
                      </div>
                    </div>
                    <Toggle 
                      checked={method.active} 
                      onChange={(v) => {
                        const newMethods = [...formData.paymentMethods];
                        newMethods[index] = { ...method, active: v };
                        updateField('paymentMethods', newMethods);
                      }} 
                      label="" 
                    />
                  </div>
                  {method.active && (
                    <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
                      <label className="block text-[11px] font-[600] text-text-dark mb-1">Instruções para o cliente</label>
                      <textarea 
                        value={method.instructions || ''} 
                        onChange={(e) => {
                          const newMethods = [...formData.paymentMethods];
                          newMethods[index] = { ...method, instructions: e.target.value };
                          updateField('paymentMethods', newMethods);
                        }}
                        className="w-full px-2 py-2 border border-[var(--color-border)] rounded-[4px] focus:outline-none focus:border-shopify-green text-[12px]"
                        rows={2}
                        placeholder="Instruções que o cliente verá após fazer a encomenda..."
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section title="SEO" icon={Search}>
          <div className="pt-4 space-y-4">
            <InputField label="Meta Título" value={formData.metaTitle} onChange={(e: any) => updateField('metaTitle', e.target.value)} placeholder="Título que aparece nos motores de busca" />
            <div>
              <label className="block text-[13px] font-[600] text-text-dark mb-1">Meta Descrição</label>
              <textarea value={formData.metaDescription} onChange={(e: any) => updateField('metaDescription', e.target.value)} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[4px] focus:outline-none focus:border-shopify-green text-[14px]" rows={3} placeholder="Descrição que aparece nos motores de busca..." />
              <p className="text-[12px] text-text-muted mt-1">{formData.metaDescription.length}/160 caracteres recomendados</p>
            </div>
          </div>
        </Section>

        <Section title="Notificações" icon={Bell}>
          <div className="pt-4 space-y-4">
            <Toggle checked={formData.notifyNewOrder} onChange={(v) => updateField('notifyNewOrder', v)} label="Notificar quando receber nova encomenda" />
            <Toggle checked={formData.notifyOrderStatus} onChange={(v) => updateField('notifyOrderStatus', v)} label="Notificar alterações de status de encomenda" />
          </div>
        </Section>

        <div className="fixed bottom-8 right-8 z-40">
          <button 
            type="submit" 
            disabled={saving}
            className="bg-shopify-green text-white px-8 py-4 rounded-full font-bold text-[15px] flex items-center gap-2 hover:shadow-xl hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'A Guardar...' : 'Guardar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
