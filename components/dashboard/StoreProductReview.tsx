'use client';

import { useState } from 'react';
import { Check, Image as ImageIcon, Loader2, Plus, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { findProductPhotos } from '@/lib/product-image-actions';
import { getProductSmartImage } from '@/lib/smart-images';

export type StoreDraftProduct = {
  clientId: string;
  selected: boolean;
  source: 'ai' | 'manual';
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
  imageKeyword?: string;
};

export function toDraftProducts(products: any[], photos: string[] = [], context = ''): StoreDraftProduct[] {
  return products.map((product, index) => ({
    clientId: 'generated-' + Date.now() + '-' + index,
    selected: true,
    source: 'ai',
    name: String(product.name || ''),
    description: String(product.description || ''),
    category: String(product.category || ''),
    price: Number(product.price) || 0,
    stock: Number(product.stock) || 0,
    imageKeyword: String(product.imageKeyword || product.name || ''),
    image_url: photos[index] || getProductSmartImage(product, index, context),
  }));
}

type Props = {
  products: StoreDraftProduct[];
  onChange: (products: StoreDraftProduct[]) => void;
  generateEnabled: boolean;
  onGenerateEnabledChange: (enabled: boolean) => void;
  onGenerate: (count: number) => Promise<void>;
  generating: boolean;
  allowGeneration: boolean;
  storeContext: string;
};

export default function StoreProductReview({
  products, onChange, generateEnabled, onGenerateEnabledChange, onGenerate, generating,
  allowGeneration, storeContext,
}: Props) {
  const [count, setCount] = useState(6);
  const [updatingImage, setUpdatingImage] = useState<string | null>(null);
  const chosen = products.filter((product) => product.selected && product.name.trim()).length;

  const editProduct = (id: string, patch: Partial<StoreDraftProduct>) =>
    onChange(products.map((product) => product.clientId === id ? { ...product, ...patch } : product));

  const addManually = () => {
    onChange([...products, {
      clientId: 'manual-' + Date.now() + '-' + Math.random().toString(36).slice(2),
      selected: true, source: 'manual', name: '', description: '', category: '',
      price: 0, stock: 0, image_url: '', imageKeyword: '',
    }]);
  };

  const refreshPhoto = async (product: StoreDraftProduct) => {
    if (!product.name.trim()) return;
    setUpdatingImage(product.clientId);
    try {
      const images = await findProductPhotos([{ name: product.name, category: product.category, description: product.description }], storeContext);
      if (images[0]) editProduct(product.clientId, { image_url: images[0], imageKeyword: product.name });
    } finally {
      setUpdatingImage(null);
    }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-900">Produtos da loja</h3>
          <p className="mt-1 text-xs text-slate-500">Só os produtos selecionados serão adicionados. Podes alterar todos os campos antes da criação.</p>
        </div>
        <span className="rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-bold text-emerald-700">{chosen} selecionados</span>
      </div>

      {allowGeneration && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-sm font-bold text-slate-900">Queres que a IA proponha produtos para esta loja?</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => onGenerateEnabledChange(true)} className={'px-4 py-2 rounded-xl text-sm font-bold border ' + (generateEnabled ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200')}>Sim, gerar produtos</button>
            <button type="button" onClick={() => onGenerateEnabledChange(false)} className={'px-4 py-2 rounded-xl text-sm font-bold border ' + (!generateEnabled ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200')}>Não, só a loja</button>
          </div>
          {generateEnabled && (
            <div className="flex flex-wrap gap-3 items-center">
              <label htmlFor="product-count" className="text-xs font-semibold text-slate-600">Quantidade</label>
              <select id="product-count" value={count} onChange={(e) => setCount(Number(e.target.value))} className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">
                {[4, 6, 8].map((item) => <option value={item} key={item}>{item} produtos</option>)}
              </select>
              <button type="button" onClick={() => void onGenerate(count)} disabled={generating} className="flex items-center gap-2 rounded-xl bg-slate-950 text-white px-4 py-2.5 text-xs font-bold disabled:opacity-50">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? 'A preparar propostas...' : products.some((p) => p.source === 'ai') ? 'Gerar novas propostas' : 'Gerar e pré-visualizar'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-between items-center">
        <p className="text-xs text-slate-600">Também podes adicionar produtos manualmente, mesmo sem utilizar IA.</p>
        <button type="button" onClick={addManually} className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 hover:border-emerald-300">
          <Plus className="w-4 h-4" /> Adicionar produto manual
        </button>
      </div>

      {products.length > 0 && (
        <div className="flex justify-end gap-2">
          <button type="button" className="text-xs font-semibold text-emerald-700" onClick={() => onChange(products.map((p) => ({ ...p, selected: true })))}>Selecionar todos</button>
          <span className="text-slate-300">·</span>
          <button type="button" className="text-xs font-semibold text-slate-500" onClick={() => onChange(products.map((p) => ({ ...p, selected: false })))}>Desmarcar todos</button>
        </div>
      )}

      {products.map((product, index) => (
        <article key={product.clientId} className={'rounded-2xl border bg-white p-4 space-y-3 ' + (product.selected ? 'border-emerald-200' : 'border-slate-200 opacity-75')}>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-900 cursor-pointer">
              <input type="checkbox" checked={product.selected} onChange={(e) => editProduct(product.clientId, { selected: e.target.checked })} className="accent-emerald-600 h-4 w-4" />
              {product.source === 'ai' ? 'Proposta IA' : 'Produto manual'} #{index + 1}
            </label>
            {product.selected && <Check className="w-4 h-4 text-emerald-600" />}
            <button type="button" onClick={() => onChange(products.filter((p) => p.clientId !== product.clientId))} className="ml-auto text-xs text-red-500 inline-flex gap-1 items-center"><Trash2 className="w-3.5 h-3.5" /> Remover</button>
          </div>
          <div className="grid gap-3 md:grid-cols-[112px_1fr]">
            <div className="space-y-2">
              <div className="w-28 h-32 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                {product.image_url ? <img src={product.image_url} alt={product.name || 'Fotografia do produto'} className="w-full h-full object-cover" /> : <ImageIcon className="w-7 h-7 text-slate-400" />}
              </div>
              <button type="button" disabled={updatingImage === product.clientId || !product.name.trim()} onClick={() => void refreshPhoto(product)} className="text-[11px] font-semibold text-emerald-700 disabled:opacity-50 inline-flex gap-1 items-center">
                {updatingImage === product.clientId ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Procurar foto
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2 text-xs font-bold text-slate-600">Nome do produto
                <input required={product.selected} value={product.name} onChange={(e) => editProduct(product.clientId, { name: e.target.value })} placeholder="Nome do produto" className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm font-medium text-slate-900" />
              </label>
              <label className="sm:col-span-2 text-xs font-bold text-slate-600">Descrição
                <textarea value={product.description} onChange={(e) => editProduct(product.clientId, { description: e.target.value })} rows={2} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-900 resize-y" />
              </label>
              <label className="text-xs font-bold text-slate-600">Categoria
                <input value={product.category} onChange={(e) => editProduct(product.clientId, { category: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-900" />
              </label>
              <label className="text-xs font-bold text-slate-600">Preço (€)
                <input type="number" min="0" step="0.01" value={product.price} onChange={(e) => editProduct(product.clientId, { price: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-900" />
              </label>
              <label className="text-xs font-bold text-slate-600">Stock
                <input type="number" min="0" step="1" value={product.stock} onChange={(e) => editProduct(product.clientId, { stock: Number(e.target.value) })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-900" />
              </label>
              <label className="text-xs font-bold text-slate-600">URL da fotografia
                <input type="url" value={product.image_url} onChange={(e) => editProduct(product.clientId, { image_url: e.target.value })} placeholder="https://..." className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-900" />
              </label>
            </div>
          </div>
        </article>
      ))}
      {products.length === 0 && <p className="rounded-xl border border-dashed border-slate-200 py-5 text-center text-sm text-slate-400">Ainda não há produtos. Gera propostas com IA ou adiciona manualmente.</p>}
      <p className="text-[11px] text-slate-500">As imagens são pesquisadas por produto. Sem um fornecedor de fotografias configurado, é utilizada a biblioteca de imagens por categoria e podes substituir a URL antes de publicar.</p>
    </section>
  );
}
