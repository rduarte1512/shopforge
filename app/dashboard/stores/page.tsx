'use client';

import { useUser } from '@clerk/nextjs';
import { getMyStoresAction, createStoreAction, deleteStoreAction } from '@/lib/actions';
import { useMockDB, SUBSCRIPTION_PLANS } from '@/lib/store';
import { Plus, Store as StoreIcon, ExternalLink, Link2, Monitor, Sparkles, Loader2, ChevronRight, ChevronLeft, AlertCircle, Trash2, Lock, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { generateStoreConfig } from '@/lib/ai-actions';
import { useRouter } from 'next/navigation';

export default function StoresPage() {
  const { user: clerkUser } = useUser();
  const { setSelectedStore } = useMockDB();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const subscriptionTier = (clerkUser?.publicMetadata?.subscriptionTier as string) || 'STARTER';
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscriptionTier) || SUBSCRIPTION_PLANS[0];
  const canCreateMoreStores = stores.length < plan.limits.stores;
  const isAiRestricted = plan.id === 'STARTER' || plan.id === 'GROWTH';
  
  const [isCreating, setIsCreating] = useState(false);
  const [isAiMode, setIsAiMode] = useState(!isAiRestricted);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [newStore, setNewStore] = useState({ 
    name: '', 
    domain: '', 
    description: '',
    theme: 'light' as 'light' | 'dark',
    primaryColor: '#008060'
  });

  const [generationStep, setGenerationStep] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [deleteConfirmStoreId, setDeleteConfirmStoreId] = useState<string | null>(null);

  const fetchStores = async () => {
    try {
      const data = await getMyStoresAction();
      setStores(data || []);
    } catch (err) {
      console.error('Error fetching stores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clerkUser) {
      fetchStores();
    }
  }, [clerkUser]);

  const steps = [
    "A analisar a tua ideia...",
    "A criar o branding perfeito...",
    "A gerar os produtos e imagens...",
    "A finalizar a loja pronta a escalar..."
  ];

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim() || !clerkUser) return;
    setIsGenerating(true);
    setGenerationStep(0);
    setGenerationError(null);

    const stepInterval = setInterval(() => {
      setGenerationStep(prev => (prev < 3 ? prev + 1 : prev));
    }, 2000);

    try {
      const config = await generateStoreConfig(aiPrompt);
      
      const store = await createStoreAction({
        name: config.name || 'Loja Gerada por IA',
        domain: (config.domain || 'loja-ia').toLowerCase().replace(/[^a-z0-9-]/g, ''),
        description: config.description || '',
        theme: config.theme === 'dark' ? 'dark' : 'light',
        primary_color: config.primaryColor || '#008060',
        base_currency: 'EUR'
      });
      
      // Note: Products insertion for Neon would need another server action
      // For now, we'll focus on the store migration

      clearInterval(stepInterval);
      setGenerationStep(4);
      
      await fetchStores();

      setTimeout(() => {
        setSelectedStore(store.id);
        setIsGenerating(false);
        setIsCreating(false);
        setAiPrompt('');
      }, 1500);

    } catch (error: any) {
      clearInterval(stepInterval);
      console.error("Erro detalhado da IA:", error);
      setGenerationError(error.message || "Erro inesperado ao gerar a loja.");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await createStoreAction({
        name: newStore.name,
        domain: newStore.domain.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        description: newStore.description,
        theme: newStore.theme,
        primary_color: newStore.primaryColor,
        base_currency: 'EUR'
      });

      setSelectedStore(data.id);
      setIsCreating(false);
      setNewStore({ name: '', domain: '', description: '', theme: 'light', primaryColor: '#008060' });
      await fetchStores();
    } catch (err: any) {
      alert(`Erro ao criar loja: ${err.message}`);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    try {
      await deleteStoreAction(storeId);
      await fetchStores();
      setDeleteConfirmStoreId(null);
    } catch (err: any) {
      alert(`Erro ao eliminar loja: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-shopify-green" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-[24px] font-[600] tracking-tight text-text-dark">Minhas Lojas</h1>
          <p className="text-[14px] text-text-muted mt-1">Gerencie as suas lojas ou crie uma nova.</p>
        </div>
        <button 
          onClick={() => {
            if (canCreateMoreStores) {
              setIsCreating(true);
            } else {
              router.push('/dashboard/subscription');
            }
          }}
          className={`${canCreateMoreStores ? 'bg-shopify-green' : 'bg-orange-500'} text-white px-[16px] py-[8px] rounded-[4px] font-[600] text-[13px] border-none cursor-pointer flex items-center gap-2 hover:opacity-90 transition-opacity`}
        >
          {canCreateMoreStores ? (
            <>
              <Plus className="w-[18px] h-[18px]" /> Criar Nova Loja
            </>
          ) : (
            <>
              <Zap className="w-[18px] h-[18px]" /> Fazer Upgrade para Criar Mais
            </>
          )}
        </button>
      </div>

      {!canCreateMoreStores && !isCreating && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-orange-600 w-5 h-5" />
            <p className="text-[14px] text-orange-800 font-medium">
              Atingiu o limite de lojas do seu plano <span className="font-bold">{plan.name}</span> ({stores.length}/{plan.limits.stores}).
            </p>
          </div>
          <Link href="/dashboard/subscription" className="text-[13px] font-bold text-orange-700 hover:underline">
            Ver Planos →
          </Link>
        </div>
      )}

      {isCreating && (
        <div className="bg-white rounded-[8px] shadow-[var(--shadow-card)] border border-[var(--color-border)] p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[18px] font-bold flex items-center gap-2">
              {isAiMode ? <Sparkles className="w-5 h-5 text-shopify-green" /> : <Plus className="w-5 h-5" />}
              {isAiMode ? 'Gerar Loja Completa com IA' : 'Configuração Manual'}
            </h2>
            <button onClick={() => setIsCreating(false)} className="text-text-muted hover:text-text-dark border-none bg-transparent cursor-pointer">Esc</button>
          </div>

          <div className="flex gap-4 mb-6 border-b border-[var(--color-border)] pb-4">
            <button 
              onClick={() => {
                if (!isAiRestricted) {
                  setIsAiMode(true);
                }
              }}
              className={`relative px-4 py-2 text-[13px] font-[600] rounded-[4px] transition-colors ${isAiMode ? 'bg-shopify-green text-white' : 'hover:bg-gray-100 text-text-muted'} ${isAiRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Automação IA (Loja Pronta)
              {isAiRestricted && <Lock className="w-3 h-3 absolute -top-1 -right-1 text-orange-500" />}
            </button>
            <button 
              onClick={() => setIsAiMode(false)}
              className={`px-4 py-2 text-[13px] font-[600] rounded-[4px] transition-colors ${!isAiMode ? 'bg-shopify-green text-white' : 'hover:bg-gray-100 text-text-muted'}`}
            >
              Configuração Manual
            </button>
          </div>

          {isAiMode && !isAiRestricted ? (
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-[600] text-text-dark mb-2">Descreve a tua ideia de negócio. A IA vai criar os produtos, descrições, imagens, cores e banners automaticamente!</label>
                <textarea 
                  rows={4} 
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[4px] focus:outline-none focus:border-shopify-green text-[14px]" 
                  placeholder="Ex: Uma loja de roupa streetwear para jovens, estilo urbano e minimalista. Quero t-shirts oversize, hoodies e acessórios. Cores principais: preto e branco..."
                />
              </div>
              <button 
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className="w-full bg-text-dark text-white py-3 rounded-[4px] font-[600] text-[14px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" /> Criar Loja Pronta a Vender
              </button>
            </div>
          ) : isAiMode && isAiRestricted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-orange-500" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-text-dark">Funcionalidade Exclusiva PRO</h3>
                <p className="text-[14px] text-text-muted max-w-sm mx-auto">
                  A criação de lojas automáticas com IA está disponível apenas para subscritores dos planos Pro e Enterprise.
                </p>
              </div>
              <button 
                onClick={() => router.push('/dashboard/subscription')}
                className="bg-shopify-green text-white px-6 py-2 rounded-lg font-bold text-[14px] border-none cursor-pointer"
              >
                Fazer Upgrade Agora
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-[600] text-text-dark mb-1">Nome da Loja</label>
                  <input required type="text" value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[4px] focus:outline-none focus:border-shopify-green text-[14px]" placeholder="Ex: Minha Loja Fantástica" />
                </div>
                <div>
                  <label className="block text-[13px] font-[600] text-text-dark mb-1">Domínio</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-[4px] border border-r-0 border-[var(--color-border)] bg-bg-gray text-text-muted text-[13px]">
                      /s/
                    </span>
                    <input required type="text" value={newStore.domain} onChange={e => setNewStore({...newStore, domain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-[4px] border border-[var(--color-border)] focus:outline-none focus:border-shopify-green text-[14px]" placeholder="minha-loja" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-[600] text-text-dark mb-1">Descrição</label>
                <textarea rows={2} value={newStore.description} onChange={e => setNewStore({...newStore, description: e.target.value})} className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[4px] focus:outline-none focus:border-shopify-green text-[14px]" placeholder="Breve descrição da loja..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-[600] text-text-dark mb-1">Tema</label>
                  <select 
                    value={newStore.theme}
                    onChange={e => setNewStore({...newStore, theme: e.target.value as 'light' | 'dark'})}
                    className="w-full px-3 py-2 border border-[var(--color-border)] rounded-[4px] focus:outline-none focus:border-shopify-green text-[14px]"
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-[600] text-text-dark mb-1">Cor Principal</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={newStore.primaryColor}
                      onChange={e => setNewStore({...newStore, primaryColor: e.target.value})}
                      className="h-9 w-12 p-1 border border-[var(--color-border)] rounded-[4px] cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={newStore.primaryColor}
                      onChange={e => setNewStore({...newStore, primaryColor: e.target.value})}
                      className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-[4px] focus:outline-none focus:border-shopify-green text-[14px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <button type="button" onClick={() => setIsAiMode(true)} className="flex items-center gap-2 text-[13px] text-shopify-green font-[600] hover:underline">
                  <ChevronLeft className="w-4 h-4" /> Voltar para o Assistente
                </button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-[14px] font-medium text-text-dark hover:bg-gray-50 border border-transparent rounded-[4px]">
                    Cancelar
                  </button>
                  <button type="submit" className="bg-shopify-green text-white px-[16px] py-[8px] rounded-[4px] font-[600] text-[13px] border-none cursor-pointer">
                    Criar Loja
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in duration-300">
            {!generationError ? (
              <>
                <div className="mb-6 relative">
                  <div className="w-20 h-20 border-4 border-gray-100 border-t-shopify-green rounded-full animate-spin mx-auto"></div>
                  <Sparkles className="w-8 h-8 text-shopify-green absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                
                <h3 className="text-xl font-bold mb-2">A magia está a acontecer...</h3>
                <p className="text-text-muted mb-8 text-[14px]">{steps[generationStep] || "A finalizar a tua loja..."}</p>
                
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-2">
                  <div 
                    className="bg-shopify-green h-full transition-all duration-500 ease-out" 
                    style={{ width: `${((generationStep + 1) / 4) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-text-muted uppercase font-bold tracking-widest">Fase {Math.min(generationStep + 1, 4)} de 4</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Algo correu mal</h3>
                <p className="text-red-600 mb-6 text-[14px] bg-red-50 p-4 rounded-lg border border-red-100">
                  {generationError}
                </p>
                <div className="space-y-3">
                  <button 
                    onClick={() => { setIsGenerating(false); setGenerationError(null); }}
                    className="w-full py-3 bg-text-dark text-white rounded-lg font-bold hover:opacity-90 transition-opacity"
                  >
                    Tentar Novamente
                  </button>
                  <button 
                    onClick={() => { setIsGenerating(false); setIsAiMode(false); setGenerationError(null); }}
                    className="w-full py-3 bg-white text-text-dark border border-gray-200 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                  >
                    Configurar Manualmente
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stores.map((store) => (
          <div key={store.id} className="bg-white rounded-[12px] shadow-[var(--shadow-card)] border border-[var(--color-border)] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[var(--color-border)] relative">
              <button 
                onClick={() => setDeleteConfirmStoreId(store.id)}
                className="absolute top-4 right-4 p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-[4px] transition-colors"
                title="Eliminar loja"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-4" style={{ backgroundColor: `${store.primary_color}15`, color: store.primary_color }}>
                {store.logo_url ? (
                  <img src={store.logo_url} alt={store.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <StoreIcon className="w-6 h-6" />
                )}
              </div>
              <h3 className="text-[18px] font-bold text-text-dark mb-1">{store.name}</h3>
              <p className="text-[14px] text-text-muted flex items-center gap-1.5">
                <Link2 className="w-4 h-4" /> shopforge.com/s/{store.domain}
              </p>
              
              <div className="mt-6 flex gap-2 flex-wrap sm:flex-nowrap">
                <button 
                  onClick={() => {
                    setSelectedStore(store.id);
                    router.push('/dashboard');
                  }}
                  className="bg-white border border-[var(--color-border)] text-text-dark px-3 py-2 rounded-[4px] font-[600] text-[13px] hover:bg-gray-50 transition-colors"
                >
                  Gerir
                </button>
                <Link 
                  href={`/dashboard/stores/${store.id}/customize`}
                  className="bg-shopify-green text-white px-3 py-2 rounded-[4px] font-[600] text-[13px] hover:opacity-90 transition-opacity flex-1 flex items-center justify-center gap-1.5 whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Customizar
                </Link>
                <Link 
                  href={`/s/${store.domain}`}
                  target="_blank"
                  className="bg-emerald-600 text-white px-3 py-2 rounded-[4px] font-[600] text-[13px] hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 min-w-[80px]"
                >
                  Ver <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {stores.length === 0 && !isCreating && (
        <div className="text-center py-20 bg-white rounded-[8px] border border-[var(--color-border)]">
          <StoreIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Ainda não tem lojas</h2>
          <p className="text-gray-500 mb-6">Crie a sua primeira loja para começar a vender online.</p>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-shopify-green text-white px-[16px] py-[8px] rounded-[4px] font-[600] text-[13px] border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            Criar Minha Primeira Loja
          </button>
        </div>
      )}

      {deleteConfirmStoreId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center">Eliminar Loja</h3>
            <p className="text-text-muted text-center mb-6 text-[14px]">
              Tem a certeza que deseja eliminar esta loja? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmStoreId(null)}
                className="flex-1 py-3 bg-gray-100 text-text-dark rounded-lg font-[600] text-[14px] hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDeleteStore(deleteConfirmStoreId)}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg font-[600] text-[14px] hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
