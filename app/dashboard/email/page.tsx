'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Send, Bell, ShoppingCart, Palette, Settings, ChevronDown, ChevronUp, Save, Loader2, Eye, RotateCcw } from 'lucide-react';
import { StoreEmailSettings } from '@/lib/email';
import { useMockDB } from '@/lib/store';
import { getStoreEmailSettingsAction, updateStoreEmailSettingsAction } from '@/lib/actions';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = false }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded-xl">{icon}</div>
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {isOpen && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <span className="text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </label>
  );
}

export default function EmailSettingsPage() {
  const router = useRouter();
  const { stores, selectedStoreId } = useMockDB();
  const currentStore = selectedStoreId ? stores.find(s => s.id === selectedStoreId) || stores[0] : stores[0];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [settings, setSettings] = useState<StoreEmailSettings>({
    store_id: currentStore?.id || '',
    resend_api_key: '',
    sender_name: '',
    sender_email: '',
    reply_to_email: '',
    logo_url: '',
    brand_color: '#00B062',
    notify_new_order: true,
    notify_order_status: true,
    notify_low_stock: false,
    cart_recovery_enabled: false,
    cart_recovery_delay_hours: 24,
    cart_recovery_2nd_email: false,
    marketing_consent_default: false,
    marketing_consent_text: 'Aceito receber newsletters e promoções',
  });

  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    if (currentStore?.id) loadSettings();
  }, [currentStore?.id]);

  async function loadSettings() {
    if (!currentStore?.id) return;
    try {
      const data = await getStoreEmailSettingsAction(currentStore.id);
      if (data) setSettings({ ...settings, ...data });
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    if (!currentStore?.id) return;
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await updateStoreEmailSettingsAction({ ...settings, store_id: currentStore.id });
      if (error) {
        setMessage({ type: 'error', text: 'Erro ao guardar configurações' });
      } else {
        setMessage({ type: 'success', text: 'Configurações guardadas com sucesso!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao guardar configurações' });
    } finally {
      setSaving(false);
    }
  }

  async function sendTestEmail() {
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Introduza um email para testar' });
      return;
    }
    setTestingEmail(true);
    setMessage(null);
    try {
      const res = await fetch('/api/email/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: currentStore?.id, email: testEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Email de teste enviado com sucesso!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao enviar email de teste' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erro ao enviar email de teste' });
    }
    setTestingEmail(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações de Email</h1>
          <p className="text-gray-500 mt-1">Gerencie as configurações de email da sua loja</p>
        </div>
        <Link href="/dashboard/email/templates" className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-colors">
          <Mail className="w-4 h-4" />
          Editar Templates
        </Link>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4">
        <Section title="Configuração do Resend" icon={<Mail className="w-5 h-5 text-emerald-600" />} defaultOpen>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key do Resend</label>
              <input
                type="password"
                value={settings.resend_api_key || ''}
                onChange={(e) => setSettings({ ...settings, resend_api_key: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="re_xxxxxxxxxxxxx"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Remetente</label>
                <input
                  type="text"
                  value={settings.sender_name || ''}
                  onChange={(e) => setSettings({ ...settings, sender_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Minha Loja"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email do Remetente</label>
                <input
                  type="email"
                  value={settings.sender_email || ''}
                  onChange={(e) => setSettings({ ...settings, sender_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="noreply@minhaloja.pt"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reply-To Email</label>
              <input
                type="email"
                value={settings.reply_to_email || ''}
                onChange={(e) => setSettings({ ...settings, reply_to_email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="support@minhaloja.pt"
              />
            </div>
            <div className="flex gap-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={sendTestEmail}
                disabled={testingEmail}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors disabled:opacity-50"
              >
                {testingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Testar Email
              </button>
            </div>
          </div>
        </Section>

        <Section title="Branding" icon={<Palette className="w-5 h-5 text-emerald-600" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL do Logótipo</label>
              <input
                type="url"
                value={settings.logo_url || ''}
                onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="https://exemplo.com/logo.png"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor da Marca</label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={settings.brand_color || '#00B062'}
                  onChange={(e) => setSettings({ ...settings, brand_color: e.target.value })}
                  className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.brand_color || '#00B062'}
                  onChange={(e) => setSettings({ ...settings, brand_color: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Notificações" icon={<Bell className="w-5 h-5 text-emerald-600" />}>
          <div className="space-y-1">
            <Toggle
              checked={settings.notify_new_order || false}
              onChange={(checked) => setSettings({ ...settings, notify_new_order: checked })}
              label="Nova encomenda"
            />
            <Toggle
              checked={settings.notify_order_status || false}
              onChange={(checked) => setSettings({ ...settings, notify_order_status: checked })}
              label="Atualização de estado"
            />
            <Toggle
              checked={settings.notify_low_stock || false}
              onChange={(checked) => setSettings({ ...settings, notify_low_stock: checked })}
              label="Stock baixo"
            />
          </div>
        </Section>

        <Section title="Recuperação de Carrinho" icon={<ShoppingCart className="w-5 h-5 text-emerald-600" />}>
          <div className="space-y-4">
            <Toggle
              checked={settings.cart_recovery_enabled || false}
              onChange={(checked) => setSettings({ ...settings, cart_recovery_enabled: checked })}
              label="Ativar recuperação de carrinho"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horas até primeiro email</label>
              <input
                type="number"
                min={1}
                max={48}
                value={settings.cart_recovery_delay_hours || 24}
                onChange={(e) => setSettings({ ...settings, cart_recovery_delay_hours: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <Toggle
              checked={settings.cart_recovery_2nd_email || false}
              onChange={(checked) => setSettings({ ...settings, cart_recovery_2nd_email: checked })}
              label="Enviar segundo email (48h depois)"
            />
          </div>
        </Section>

        <Section title="Marketing" icon={<Send className="w-5 h-5 text-emerald-600" />}>
          <div className="space-y-4">
            <Toggle
              checked={settings.marketing_consent_default || false}
              onChange={(checked) => setSettings({ ...settings, marketing_consent_default: checked })}
              label="Consentimento de marketing por defeito"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Texto do consentimento</label>
              <textarea
                value={settings.marketing_consent_text || ''}
                onChange={(e) => setSettings({ ...settings, marketing_consent_text: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                placeholder="Aceito receber newsletters e promoções"
              />
            </div>
          </div>
        </Section>
      </div>

      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Configurações
        </button>
      </div>
    </div>
  );
}