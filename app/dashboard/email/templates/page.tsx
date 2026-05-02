'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Eye, Save, Loader2, X, Settings } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/email';
import { useMockDB } from '@/lib/store';

interface EmailTemplate {
  id?: string;
  store_id: string;
  type: string;
  subject: string;
  preview_text: string;
  html_content: string;
}

const TEMPLATE_TYPES = [
  { value: 'order_confirmation', label: 'Confirmação de Encomenda' },
  { value: 'order_status', label: 'Estado da Encomenda' },
  { value: 'cart_recovery', label: 'Recuperação de Carrinho' },
  { value: 'welcome', label: 'Boas-vindas' },
  { value: 'newsletter', label: 'Newsletter' },
];

export default function EmailTemplatesPage() {
  const router = useRouter();
  const { stores, selectedStoreId } = useMockDB();
  const currentStore = selectedStoreId ? stores.find(s => s.id === selectedStoreId) || stores[0] : stores[0];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedType, setSelectedType] = useState('order_confirmation');
  const [templates, setTemplates] = useState<Record<string, EmailTemplate>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (currentStore?.id) loadTemplates();
  }, [currentStore?.id]);

  async function loadTemplates() {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('email_templates')
      .select('*')
      .eq('store_id', currentStore.id);
    if (data) {
      const templateMap: Record<string, EmailTemplate> = {};
      data.forEach((t) => {
        templateMap[t.type] = t;
      });
      setTemplates(templateMap);
    }
    setLoading(false);
  }

  function getTemplate(type: string): EmailTemplate {
    return templates[type] || {
      store_id: currentStore?.id || '',
      type,
      subject: '',
      preview_text: '',
      html_content: '',
    };
  }

  function updateTemplate(type: string, field: keyof EmailTemplate, value: string) {
    setTemplates((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  }

  async function saveTemplate() {
    if (!currentStore?.id || !supabase) return;
    setSaving(true);
    setMessage(null);
    const template = getTemplate(selectedType);
    const { error } = await supabase
      .from('email_templates')
      .upsert({ ...template, store_id: currentStore.id }, { onConflict: 'store_id,type' });
    setSaving(false);
    if (error) {
      setMessage({ type: 'error', text: 'Erro ao guardar template' });
    } else {
      setMessage({ type: 'success', text: 'Template guardado com sucesso!' });
    }
  }

  function openPreview() {
    const template = getTemplate(selectedType);
    setPreviewHtml(template.html_content || '<p>Sem conteúdo</p>');
    setPreviewOpen(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const currentTemplate = getTemplate(selectedType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates de Email</h1>
          <p className="text-gray-500 mt-1">Personalize os templates dos seus emails</p>
        </div>
        <Link href="/dashboard/email" className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
          <Settings className="w-4 h-4" />
          Voltar às Configurações
        </Link>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-4 border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4 px-2">Tipos de Template</h2>
          <div className="space-y-1">
            {TEMPLATE_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                  selectedType === type.value
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-gray-900">
                {TEMPLATE_TYPES.find((t) => t.value === selectedType)?.label}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
                <input
                  type="text"
                  value={currentTemplate.subject || ''}
                  onChange={(e) => updateTemplate(selectedType, 'subject', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Assunto do email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texto de Pré-visualização</label>
                <input
                  type="text"
                  value={currentTemplate.preview_text || ''}
                  onChange={(e) => updateTemplate(selectedType, 'preview_text', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Texto que aparece na caixa de entrada"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo HTML</label>
                <textarea
                  value={currentTemplate.html_content || ''}
                  onChange={(e) => updateTemplate(selectedType, 'html_content', e.target.value)}
                  rows={20}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm resize-y"
                  placeholder="<!DOCTYPE html>..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={openPreview}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Pré-visualizar
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Pré-visualização</h3>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[600px] border border-gray-200 rounded-xl"
                title="Email Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}