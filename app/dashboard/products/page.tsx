'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useMockDB, SUBSCRIPTION_PLANS } from '@/lib/store';
import { 
  Plus, Edit2, Trash2, X, Sparkles, Loader2, Package, Image as ImageIcon, 
  Wand2, Save, AlertCircle, LayoutGrid, Tag, Truck, Eye, CheckCircle2, 
  ChevronRight, Info, Layers, GripHorizontal, Copy, Minus, Lock, Zap 
} from 'lucide-react';
import Image from 'next/image';
import { generateProduct, generateMultipleProducts } from '@/lib/ai-actions';
import { motion, AnimatePresence } from 'motion/react';

export default function ProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedStoreId, currentUser } = useMockDB();
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === currentUser?.subscriptionTier) || SUBSCRIPTION_PLANS[0];
  const isAiRestricted = plan.id === 'STARTER';
  const canCreateMoreProducts = products.length < (plan?.limits?.products || 50);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [variantAttributes, setVariantAttributes] = useState<Record<string, string[]>>({});
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newAttributeValue, setNewAttributeValue] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    price: '',
    compare_at_price: '',
    stock: '',
    sku: '',
    image_url: 'https://picsum.photos/seed/product/400/500',
    images: [] as string[],
    video_url: '',
    category: '',
    brand: '',
    weight: '',
    is_active: true,
    is_featured: false,
    tags: '',
    has_variants: false
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
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', currentStore.id)
          .order('created_at', { ascending: false });
        
        if (productsError) throw productsError;
        setProducts(productsData || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, selectedStoreId]);

  const currentStoreId = selectedStoreId || stores[0]?.id;

  const steps = [
    "A analisar os detalhes do produto...",
    "A criar descrições atrativas...",
    "A gerar imagens e atributos...",
    "A finalizar o produto..."
  ];

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationStep(0);

    const stepInterval = setInterval(() => {
      setGenerationStep(prev => (prev < 3 ? prev + 1 : prev));
    }, 2000);

    try {
      const result = await generateProduct(aiPrompt);
      if (result) {
        setFormData({
          ...formData,
          ...result,
          image_url: result.image_url || formData.image_url
        });
        setIsAiMode(false);
      }
    } catch (err) {
      setGenerationError("Falha ao gerar produto. Tente novamente.");
    } finally {
      clearInterval(stepInterval);
      setIsGenerating(false);
    }
  };

  const handleAiGenerateMultiple = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setGenerationStep(0);

    try {
      const productsList = await generateMultipleProducts(aiPrompt, 4);
      if (productsList && productsList.length > 0) {
        // Para simplificar, vamos inserir logo na DB ou mostrar o primeiro e sugerir os outros
        // Aqui vamos apenas salvar o primeiro e fechar o modo AI
        const first = productsList[0];
        setFormData({
          ...formData,
          ...first
        });
        setIsAiMode(false);
      }
    } catch (err) {
      setGenerationError("Erro ao gerar lote de produtos.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStoreId || !supabase) return;

    try {
      const productPayload = {
        store_id: currentStoreId,
        name: formData.name,
        description: formData.description,
        short_description: formData.short_description,
        price: parseFloat(formData.price) || 0,
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        stock: parseInt(formData.stock) || 0,
        sku: formData.sku,
        image_url: formData.image_url,
        images: formData.images,
        category: formData.category,
        brand: formData.brand,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        has_variants: formData.has_variants
      };

      let productId = editingProduct?.id;

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert([productPayload])
          .select();
        if (error) throw error;
        productId = data[0].id;
      }

      // Handle variants if any
      if (formData.has_variants && productVariants.length > 0 && productId) {
        // Delete old variants if editing
        if (editingProduct) {
          await supabase.from('product_variants').delete().eq('product_id', productId);
        }

        const variantsToInsert = productVariants.map(v => ({
          product_id: productId,
          name: v.name,
          sku: v.sku,
          price: v.price,
          stock: v.stock,
          attributes: v.attributes,
          is_active: true
        }));

        const { error: variantError } = await supabase
          .from('product_variants')
          .insert(variantsToInsert);
        
        if (variantError) throw variantError;
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  const openModal = async (product: any = null) => {
    if (!supabase) return;
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        short_description: product.short_description || '',
        price: product.price?.toString() || '',
        compare_at_price: product.compare_at_price?.toString() || '',
        stock: product.stock?.toString() || '',
        sku: product.sku || '',
        image_url: product.image_url || 'https://picsum.photos/seed/product/400/500',
        images: product.images || [],
        video_url: product.video_url || '',
        category: product.category || '',
        brand: product.brand || '',
        weight: product.weight?.toString() || '',
        is_active: product.is_active !== false,
        is_featured: product.is_featured || false,
        tags: product.tags || '',
        has_variants: product.has_variants || false
      });

      // Fetch variants if they exist
      const { data: variantData } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', product.id);
      
      if (variantData) {
        setProductVariants(variantData);
        // Tentar reconstruir attributes do primeiro item
        if (variantData[0]?.attributes) {
          const attrs: Record<string, string[]> = {};
          variantData.forEach(v => {
            Object.entries(v.attributes).forEach(([k, val]) => {
              if (!attrs[k]) attrs[k] = [];
              if (!attrs[k].includes(val as string)) attrs[k].push(val as string);
            });
          });
          setVariantAttributes(attrs);
        }
      }
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        short_description: '',
        price: '',
        compare_at_price: '',
        stock: '0',
        sku: '',
        image_url: 'https://picsum.photos/seed/product/400/500',
        images: [],
        video_url: '',
        category: '',
        brand: '',
        weight: '',
        is_active: true,
        is_featured: false,
        tags: '',
        has_variants: false
      });
      setProductVariants([]);
      setVariantAttributes({});
    }
    setActiveTab('general');
    setIsAiMode(false);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem a certeza que deseja eliminar este produto?') || !supabase) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const addImageField = () => {
    setFormData({ ...formData, images: [...formData.images, ''] });
  };

  const updateImageField = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const removeImageField = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const addNewAttributeType = () => {
    if (newAttributeName.trim() && !variantAttributes[newAttributeName]) {
      setVariantAttributes({ ...variantAttributes, [newAttributeName]: [] });
      setNewAttributeName('');
    }
  };

  const removeAttributeType = (name: string) => {
    const newAttrs = { ...variantAttributes };
    delete newAttrs[name];
    setVariantAttributes(newAttrs);
  };

  const removeVariantAttribute = (attrName: string, value: string) => {
    setVariantAttributes({
      ...variantAttributes,
      [attrName]: variantAttributes[attrName].filter(v => v !== value)
    });
  };

  const generateVariants = () => {
    const attrNames = Object.keys(variantAttributes);
    if (attrNames.length === 0) return [];

    const combinations: Record<string, string>[] = [{}];

    attrNames.forEach(attrName => {
      const newCombinations: Record<string, string>[] = [];
      combinations.forEach(combo => {
        variantAttributes[attrName].forEach(value => {
          newCombinations.push({ ...combo, [attrName]: value });
        });
      });
      combinations.length = 0;
      combinations.push(...newCombinations);
    });

    return combinations.map(combo => {
      const name = Object.entries(combo)
        .map(([k, v]) => `${v}`)
        .join(' / ');
      return {
        name: `${formData.name} - ${name}`,
        attributes: combo,
        price: formData.price ? parseFloat(formData.price) : 0,
        stock: formData.stock ? parseInt(formData.stock) : 0,
        sku: formData.sku ? `${formData.sku}-${name.replace(/\s+/g, '')}` : '',
        is_active: true
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-primary">Produtos</h1>
          <p className="text-sm text-text-secondary mt-1">Gira o inventário da tua loja com ferramentas de IA avançadas.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              if (!isAiRestricted) {
                openModal();
                setIsAiMode(true);
              } else {
                router.push('/dashboard/subscription');
              }
            }}
            className={`glass group px-6 py-3 rounded-2xl font-bold text-sm cursor-pointer flex items-center gap-2 hover:bg-white transition-all shadow-premium relative ${isAiRestricted ? 'opacity-70' : ''}`}
          >
            <Sparkles className="w-4 h-4 text-primary group-hover:animate-pulse" /> IA Gerar
            {isAiRestricted && <Lock className="w-3 h-3 absolute -top-1 -right-1 text-orange-500" />}
          </button>
          <button 
            onClick={() => {
              if (canCreateMoreProducts) {
                openModal();
              } else {
                router.push('/dashboard/subscription');
              }
            }}
            className={`px-6 py-3 rounded-2xl font-bold text-sm border-none cursor-pointer flex items-center gap-2 transition-all shadow-premium text-white ${canCreateMoreProducts ? 'bg-primary hover:bg-primary-dark' : 'bg-orange-500 hover:bg-orange-600'}`}
          >
            {canCreateMoreProducts ? (
              <>
                <Plus className="w-4 h-4" /> Adicionar Produto
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" /> Fazer Upgrade
              </>
            )}
          </button>
        </div>
      </div>

      {/* Limit Alert */}
      {!canCreateMoreProducts && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 border border-orange-200 p-5 rounded-3xl flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertCircle className="text-orange-600 w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-orange-800 font-bold">Limite de Produtos Atingido</p>
              <p className="text-xs text-orange-700">Estás a usar {products.length} de {plan.limits.products} produtos do plano {plan.name}.</p>
            </div>
          </div>
          <button onClick={() => router.push('/dashboard/subscription')} className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors">
            Upgrade Agora
          </button>
        </motion.div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${filterLowStock ? 'bg-orange-500 text-white border-orange-400' : 'bg-white text-text-secondary border-border hover:border-primary/30'}`}
        >
          <AlertCircle className={`w-4 h-4 ${filterLowStock ? 'text-white' : 'text-orange-500'}`} />
          Stock Baixo ({products.filter(p => Number(p.stock) < 5).length})
        </button>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[80] glass border border-primary/20 shadow-2xl rounded-3xl px-8 py-4 flex items-center gap-8 min-w-[600px]"
          >
            <div className="flex items-center gap-3 pr-8 border-r border-border">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black">
                {selectedIds.length}
              </div>
              <div>
                <p className="text-xs font-black text-text-primary uppercase tracking-widest">Selecionados</p>
                <button onClick={() => setSelectedIds([])} className="text-[10px] font-bold text-text-muted hover:text-primary transition-colors">Limpar Seleção</button>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-1">
              <button 
                onClick={() => handleBulkAction('status', true)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-2.5 rounded-xl bg-slate-50 group-hover:bg-emerald-50 text-text-secondary group-hover:text-emerald-600 transition-all">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">Ativar</span>
              </button>
              <button 
                onClick={() => handleBulkAction('status', false)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-2.5 rounded-xl bg-slate-50 group-hover:bg-slate-200 text-text-secondary transition-all">
                  <Minus className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">Rascunho</span>
              </button>
              <button 
                onClick={() => {
                  const newStock = prompt('Novo stock para os selecionados:', '0');
                  if (newStock !== null) handleBulkAction('stock', parseInt(newStock));
                }}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-2.5 rounded-xl bg-slate-50 group-hover:bg-blue-50 text-text-secondary group-hover:text-blue-600 transition-all">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">Stock</span>
              </button>
              <button 
                onClick={() => {
                  const newPrice = prompt('Novo preço para os selecionados:', '0.00');
                  if (newPrice !== null) handleBulkAction('price', parseFloat(newPrice));
                }}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-2.5 rounded-xl bg-slate-50 group-hover:bg-amber-50 text-text-secondary group-hover:text-amber-600 transition-all">
                  <Tag className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">Preço</span>
              </button>
              <button 
                onClick={() => handleBulkAction('delete')}
                className="flex flex-col items-center gap-1 group ml-auto"
              >
                <div className="p-2.5 rounded-xl bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                  <Trash2 className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-red-500 group-hover:text-red-600">Eliminar</span>
              </button>
            </div>
            
            {bulkActionLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-3xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Table */}
      <div className="bg-white rounded-[32px] shadow-premium border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="py-5 pl-8 pr-0 border-b border-border w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                    checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredProducts.map(p => p.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </th>
                <th className="text-left text-[11px] text-text-muted py-5 border-b border-border font-black uppercase tracking-widest px-8">Produto</th>
                <th className="text-left text-[11px] text-text-muted py-5 border-b border-border font-black uppercase tracking-widest px-6">Status</th>
                <th className="text-left text-[11px] text-text-muted py-5 border-b border-border font-black uppercase tracking-widest px-6">Categoria</th>
                <th className="text-left text-[11px] text-text-muted py-5 border-b border-border font-black uppercase tracking-widest px-6">Preço</th>
                <th className="text-left text-[11px] text-text-muted py-5 border-b border-border font-black uppercase tracking-widest px-6">Stock</th>
                <th className="text-right text-[11px] text-text-muted py-5 border-b border-border font-black uppercase tracking-widest px-8">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                <tr key={product.id} className={`group hover:bg-slate-50/50 transition-colors ${selectedIds.includes(product.id) ? 'bg-primary/5' : ''}`}>
                  <td className="py-5 pl-8 pr-0">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                      checked={selectedIds.includes(product.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, product.id]);
                        } else {
                          setSelectedIds(selectedIds.filter(id => id !== product.id));
                        }
                      }}
                    />
                  </td>
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 relative rounded-2xl overflow-hidden bg-slate-100 border border-border shadow-sm group-hover:scale-105 transition-transform">
                        {product.image_url ? (
                          <Image src={product.image_url} alt={product.name} fill className="object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-text-primary">{product.name}</div>
                        <div className="text-[10px] text-text-muted font-bold mt-0.5 tracking-wider uppercase">{product.sku || 'Sem SKU'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${product.is_active !== false ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                      {product.is_active !== false ? 'Ativo' : 'Rascunho'}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <span className="px-3 py-1 rounded-xl bg-slate-100 text-[11px] font-bold text-text-secondary border border-border/50">{product.category || 'Geral'}</span>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-text-primary">€ {Number(product.price).toFixed(2)}</span>
                      {product.compare_at_price && (
                        <span className="text-[10px] text-text-muted line-through opacity-60 font-bold">€ {Number(product.compare_at_price).toFixed(2)}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${Number(product.stock) > 10 ? 'bg-emerald-500' : Number(product.stock) > 0 ? 'bg-amber-500' : 'bg-red-500'}`} />
                      <span className="text-sm font-bold text-text-primary">{product.stock}</span>
                    </div>
                  </td>
                  <td className="py-5 px-8 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(product)} className="p-2.5 bg-white border border-border rounded-xl text-text-secondary hover:text-primary hover:border-primary/30 transition-all shadow-sm">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="p-2.5 bg-white border border-border rounded-xl text-text-secondary hover:text-red-500 hover:border-red-200 transition-all shadow-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-text-muted">
                      <Package className="w-12 h-12 opacity-20" />
                      <p className="font-bold">Nenhum produto encontrado.</p>
                      <button onClick={() => openModal()} className="text-primary hover:underline text-sm font-bold">Cria o teu primeiro produto</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
              onClick={() => setIsModalOpen(false)} 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-7xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative z-10 border border-white/20"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-border flex justify-between items-center bg-white">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    {isAiMode ? <Sparkles className="w-7 h-7" /> : editingProduct ? <Edit2 className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-text-primary">{isAiMode ? 'Gerar com IA' : editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
                    <p className="text-sm text-text-secondary font-medium">
                      {isAiMode ? 'A nossa IA ajuda-te a vender mais com descrições premium' : editingProduct ? `Modificando ${editingProduct.name}` : 'Completa os dados para publicar o teu item'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl hover:bg-slate-100 flex items-center justify-center transition-colors text-text-muted hover:text-text-primary">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                  {isAiMode && !editingProduct ? (
                    <div className="max-w-2xl mx-auto space-y-10 py-10">
                      <div className="text-center space-y-4">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary to-emerald-400 rounded-[36px] flex items-center justify-center text-white mx-auto shadow-xl shadow-primary/20 rotate-3">
                          <Wand2 className="w-12 h-12" />
                        </div>
                        <h3 className="text-3xl font-black text-text-primary">O que queres vender?</h3>
                        <p className="text-text-secondary font-medium text-lg">Descreve o teu produto em poucas palavras.</p>
                      </div>

                      {isGenerating ? (
                        <div className="bg-slate-50 rounded-[32px] p-12 text-center space-y-8 border border-border">
                          <div className="relative w-24 h-24 mx-auto">
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <p className="text-xl font-black text-text-primary">{steps[generationStep]}</p>
                            <p className="text-sm text-text-secondary">O ShopForge está a construir o teu catálogo...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          <div className="space-y-4">
                            <textarea 
                              value={aiPrompt} 
                              onChange={e => setAiPrompt(e.target.value)} 
                              className="w-full px-8 py-6 bg-slate-50 border-2 border-transparent rounded-[32px] focus:bg-white focus:border-primary/30 transition-all outline-none text-lg font-medium min-h-[200px] resize-none shadow-inner" 
                              placeholder="Ex: Conjunto de 6 pratos de cerâmica artesanal em tom terracota, ideais para jantares rústicos..." 
                            />
                            {generationError && <p className="text-red-500 text-sm font-bold ml-2">{generationError}</p>}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <button onClick={handleAiGenerate} disabled={!aiPrompt.trim()} className="bg-primary text-white py-5 rounded-2xl font-black text-lg hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                              <Wand2 className="w-6 h-6" /> Criar Produto
                            </button>
                            <button onClick={handleAiGenerateMultiple} disabled={!aiPrompt.trim()} className="bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                              <Layers className="w-6 h-6" /> Criar Lote (4)
                            </button>
                          </div>
                          <button onClick={() => setIsAiMode(false)} className="w-full py-2 text-sm font-bold text-text-muted hover:text-primary transition-colors">Prefiro preencher manualmente</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} id="product-form" className="space-y-12">
                      {/* Form Tabs */}
                      <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl w-fit">
                        {[
                          { id: 'general', label: 'Geral', icon: LayoutGrid },
                          { id: 'inventory', label: 'Inventário', icon: Tag },
                          { id: 'variants', label: 'Variantes', icon: Layers },
                          { id: 'shipping', label: 'Envio & Status', icon: Truck }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                          >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary' : ''}`} />
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="min-h-[500px]">
                        {activeTab === 'general' && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-3">
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Nome do Produto</label>
                                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 transition-all outline-none text-sm font-bold" placeholder="Ex: T-shirt Algodão Premium" />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Categoria</label>
                                <input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 transition-all outline-none text-sm font-bold" placeholder="Ex: Vestuário" />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Descrição Curta</label>
                              <input value={formData.short_description} onChange={e => setFormData({...formData, short_description: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 transition-all outline-none text-sm font-bold" placeholder="Uma frase de impacto sobre o produto" />
                            </div>

                            <div className="space-y-3">
                              <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Descrição Detalhada</label>
                              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 transition-all outline-none text-sm font-bold min-h-[160px] resize-none" placeholder="Explica todas as vantagens do teu produto..." />
                            </div>

                            <div className="space-y-5">
                              <div className="flex justify-between items-center">
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Galeria de Imagens</label>
                                <button type="button" onClick={addImageField} className="text-xs font-black text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                  <Plus className="w-3.5 h-3.5" /> Adicionar URL
                                </button>
                              </div>
                              <div className="grid grid-cols-1 gap-4">
                                <div className="relative group">
                                  <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                  <input value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 transition-all outline-none text-sm font-bold" placeholder="URL da imagem de capa" />
                                </div>
                                {formData.images.map((img, idx) => (
                                  <div key={idx} className="relative flex gap-3 animate-in fade-in slide-in-from-left-2">
                                    <div className="relative flex-1 group">
                                      <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                      <input value={img} onChange={e => updateImageField(idx, e.target.value)} className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 transition-all outline-none text-sm font-bold" placeholder={`URL da imagem ${idx + 2}`} />
                                    </div>
                                    <button type="button" onClick={() => removeImageField(idx)} className="p-4 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all border border-transparent hover:border-red-100">
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {activeTab === 'inventory' && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-3">
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Preço de Venda (€)</label>
                                <div className="relative group">
                                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted font-black group-focus-within:text-primary transition-colors">€</span>
                                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full pl-10 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 transition-all outline-none text-sm font-black" placeholder="0.00" />
                                </div>
                              </div>
                              <div className="space-y-3">
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Preço Comparativo (€)</label>
                                <div className="relative group">
                                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted font-black group-focus-within:text-primary transition-colors">€</span>
                                  <input type="number" step="0.01" value={formData.compare_at_price} onChange={e => setFormData({...formData, compare_at_price: e.target.value})} className="w-full pl-10 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 transition-all outline-none text-sm font-bold text-text-secondary" placeholder="0.00" />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-3">
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Unidades em Stock</label>
                                <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 transition-all outline-none text-sm font-bold" placeholder="0" />
                              </div>
                              <div className="space-y-3">
                                <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">SKU (Referência Interna)</label>
                                <input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 transition-all outline-none text-sm font-bold" placeholder="EX: MOD-BLU-S" />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Marca / Fornecedor</label>
                              <input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-primary/20 transition-all outline-none text-sm font-bold" placeholder="Ex: ShopForge Premium" />
                            </div>
                          </motion.div>
                        )}

                        {activeTab === 'variants' && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <div className={`flex items-center justify-between p-6 rounded-[32px] border-2 transition-all cursor-pointer group ${formData.has_variants ? 'border-primary bg-primary/5 shadow-premium' : 'border-slate-50 bg-slate-50/50 hover:border-slate-100'}`} onClick={() => setFormData({...formData, has_variants: !formData.has_variants})}>
                              <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${formData.has_variants ? 'bg-primary text-white rotate-6' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                  <Layers className="w-7 h-7" />
                                </div>
                                <div>
                                  <p className="text-base font-black text-text-primary">Este produto tem variantes</p>
                                  <p className="text-sm text-text-secondary font-medium">Ex: Diferentes cores, tamanhos ou materiais</p>
                                </div>
                              </div>
                              <div className={`w-14 h-7 rounded-full relative transition-colors ${formData.has_variants ? 'bg-primary' : 'bg-slate-200'}`}>
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${formData.has_variants ? 'left-8' : 'left-1'}`}></div>
                              </div>
                            </div>

                            {formData.has_variants && (
                              <div className="space-y-8 pt-8 animate-in fade-in zoom-in-95">
                                <div className="space-y-6">
                                  <div className="flex justify-between items-center">
                                    <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em]">Configurar Opções</label>
                                    <div className="flex gap-2">
                                      <input 
                                        type="text" 
                                        value={newAttributeName}
                                        onChange={e => setNewAttributeName(e.target.value)}
                                        placeholder="Ex: Cor"
                                        className="px-4 py-2 text-xs bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-primary/20 outline-none font-bold"
                                      />
                                      <button 
                                        type="button"
                                        onClick={addNewAttributeType}
                                        disabled={!newAttributeName.trim()}
                                        className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black disabled:opacity-50 hover:bg-slate-800 transition-colors"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(variantAttributes).map(([attrName, values]) => (
                                      <div key={attrName} className="bg-slate-50 rounded-[24px] p-6 space-y-4 border border-slate-100 shadow-sm">
                                        <div className="flex justify-between items-center">
                                          <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">{attrName}</span>
                                          <button type="button" onClick={() => removeAttributeType(attrName)} className="text-slate-300 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {values.map((val, idx) => (
                                            <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-text-primary shadow-sm">
                                              {val}
                                              <button type="button" onClick={() => removeVariantAttribute(attrName, val)} className="text-slate-300 hover:text-red-500">
                                                <X className="w-3 h-3" />
                                              </button>
                                            </span>
                                          ))}
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                          <input 
                                            type="text"
                                            value={newAttributeValue}
                                            onChange={e => setNewAttributeValue(e.target.value)}
                                            placeholder={`Adicionar ${attrName}...`}
                                            onKeyPress={e => { 
                                              if (e.key === 'Enter') { 
                                                e.preventDefault(); 
                                                if (newAttributeValue.trim()) {
                                                  setVariantAttributes(prev => ({ ...prev, [attrName]: [...(prev[attrName] || []), newAttributeValue] })); 
                                                  setNewAttributeValue(''); 
                                                }
                                              } 
                                            }}
                                            className="flex-1 px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-primary/30 outline-none font-bold"
                                          />
                                          <button 
                                            type="button"
                                            onClick={() => { if (newAttributeValue.trim()) { setVariantAttributes(prev => ({ ...prev, [attrName]: [...(prev[attrName] || []), newAttributeValue] })); setNewAttributeValue(''); }}}
                                            disabled={!newAttributeValue.trim()}
                                            className="bg-white border border-slate-200 text-slate-900 px-4 py-2.5 rounded-xl text-xs font-black hover:bg-slate-50 transition-colors"
                                          >
                                            Add
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {Object.keys(variantAttributes).length > 0 && (
                                    <button 
                                      type="button"
                                      onClick={() => setProductVariants(generateVariants())}
                                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-900/10"
                                    >
                                      <GripHorizontal className="w-5 h-5" />
                                      Gerar {Object.values(variantAttributes).reduce((acc, val) => acc * (val.length || 1), 1)} Variantes
                                    </button>
                                  )}
                                </div>

                                {productVariants.length > 0 && (
                                  <div className="space-y-4 pt-8 border-t border-slate-100">
                                    <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em]">Lista de Variantes</label>
                                    <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                                      {productVariants.map((variant, idx) => (
                                        <div key={idx} className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary/20 transition-all shadow-sm">
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-black text-text-primary truncate">{variant.name}</p>
                                            <div className="flex gap-4 mt-2">
                                              <div className="flex-1 space-y-1">
                                                <span className="text-[10px] font-bold text-text-muted uppercase">Preço</span>
                                                <div className="relative">
                                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted">€</span>
                                                  <input 
                                                    type="number"
                                                    step="0.01"
                                                    value={variant.price}
                                                    onChange={e => {
                                                      const newVariants = [...productVariants];
                                                      newVariants[idx] = { ...newVariants[idx], price: parseFloat(e.target.value) || 0 };
                                                      setProductVariants(newVariants);
                                                    }}
                                                    className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 font-black outline-none"
                                                  />
                                                </div>
                                              </div>
                                              <div className="flex-1 space-y-1">
                                                <span className="text-[10px] font-bold text-text-muted uppercase">Stock</span>
                                                <input 
                                                  type="number"
                                                  value={variant.stock}
                                                  onChange={e => {
                                                    const newVariants = [...productVariants];
                                                    newVariants[idx] = { ...newVariants[idx], stock: parseInt(e.target.value) || 0 };
                                                    setProductVariants(newVariants);
                                                  }}
                                                  className="w-full px-3 py-2 text-xs bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 font-black outline-none"
                                                />
                                              </div>
                                              <div className="flex-[2] space-y-1">
                                                <span className="text-[10px] font-bold text-text-muted uppercase">SKU</span>
                                                <input 
                                                  type="text"
                                                  value={variant.sku || ''}
                                                  onChange={e => {
                                                    const newVariants = [...productVariants];
                                                    newVariants[idx] = { ...newVariants[idx], sku: e.target.value };
                                                    setProductVariants(newVariants);
                                                  }}
                                                  className="w-full px-3 py-2 text-xs bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 font-black outline-none"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                          <button 
                                            type="button"
                                            onClick={() => setProductVariants(productVariants.filter((_, i) => i !== idx))}
                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                          >
                                            <Trash2 className="w-5 h-5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        )}

                        {activeTab === 'shipping' && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                            <div className="space-y-4">
                              <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Logística</label>
                              <div className="bg-slate-50 p-6 rounded-[32px] space-y-6">
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-text-primary">Peso do Produto (kg)</label>
                                  <input type="number" step="0.001" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full px-6 py-4 bg-white border-2 border-transparent rounded-2xl focus:border-primary/20 transition-all outline-none text-sm font-black shadow-sm" placeholder="0.000" />
                                  <p className="text-[10px] text-text-secondary italic ml-1">Crucial para o cálculo automático de portes e etiquetas de envio.</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-6">
                              <label className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Visibilidade</label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className={`flex items-center justify-between p-6 rounded-[28px] border-2 transition-all cursor-pointer group ${formData.is_active ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-50 bg-slate-50/50 hover:border-slate-100'}`} onClick={() => setFormData({...formData, is_active: !formData.is_active})}>
                                  <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${formData.is_active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                      <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                      <p className="text-[13px] font-black text-text-primary">Ativar Vendas</p>
                                      <p className="text-[11px] text-text-secondary font-medium">Produto disponível na loja</p>
                                    </div>
                                  </div>
                                  <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.is_active ? 'bg-primary' : 'bg-slate-200'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_active ? 'left-7' : 'left-1'}`}></div>
                                  </div>
                                </div>
                                
                                <div className={`flex items-center justify-between p-6 rounded-[28px] border-2 transition-all cursor-pointer group ${formData.is_featured ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-slate-50 bg-slate-50/50 hover:border-slate-100'}`} onClick={() => setFormData({...formData, is_featured: !formData.is_featured})}>
                                  <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${formData.is_featured ? 'bg-amber-400 text-white shadow-lg shadow-amber-200' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                                      <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div>
                                      <p className="text-[13px] font-black text-text-primary">Destaque VIP</p>
                                      <p className="text-[11px] text-text-secondary font-medium">Topo da página inicial</p>
                                    </div>
                                  </div>
                                  <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.is_featured ? 'bg-amber-400' : 'bg-slate-200'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.is_featured ? 'left-7' : 'left-1'}`}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </form>
                  )}
                </div>

                {/* Right Sidebar - Preview */}
                <div className="hidden lg:flex w-[420px] bg-slate-50/50 p-10 flex-col items-center justify-start overflow-y-auto no-scrollbar border-l border-border">
                  <div className="w-full flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Live Preview</span>
                    </div>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black rounded-md">REAL-TIME</span>
                  </div>

                  <div className="w-full bg-white rounded-[32px] shadow-2xl shadow-slate-200/50 overflow-hidden group transition-all hover:shadow-primary/5 border border-border">
                    <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
                      {formData.image_url ? (
                        <Image 
                          src={formData.image_url} 
                          alt="Preview" 
                          fill 
                          className="object-cover transition-transform duration-700 group-hover:scale-105" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                          <ImageIcon className="w-16 h-16 opacity-30" />
                          <span className="text-[10px] uppercase font-black tracking-widest opacity-50">Aguardando Imagem</span>
                        </div>
                      )}
                      
                      {formData.compare_at_price && Number(formData.compare_at_price) > Number(formData.price) && (
                        <div className="absolute top-5 left-5 bg-red-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl">
                          Promoção
                        </div>
                      )}
                      <div className="absolute top-5 right-5 bg-white/90 backdrop-blur-xl p-2.5 rounded-2xl shadow-premium border border-white/20">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                      </div>
                    </div>
                    <div className="p-8 space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-md">{formData.category || 'Categoria'}</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full" />
                          <span className="text-[10px] font-bold text-text-muted uppercase">{formData.brand || 'Marca'}</span>
                        </div>
                        <h3 className="text-lg font-black text-text-primary leading-tight line-clamp-2">{formData.name || 'Nome do Teu Produto'}</h3>
                      </div>
                      
                      <div className="flex items-end justify-between pt-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-text-primary">€ {Number(formData.price || 0).toFixed(2)}</span>
                            {formData.compare_at_price && (
                              <span className="text-sm text-text-muted line-through opacity-50 font-bold">€ {Number(formData.compare_at_price).toFixed(2)}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-emerald-500 font-black mt-2 flex items-center gap-1.5 uppercase tracking-widest">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 
                            {Number(formData.stock) > 0 ? 'Stock Disponível' : 'Esgotado'}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl shadow-slate-200 group-hover:bg-primary transition-all group-hover:scale-110">
                          <Plus className="w-6 h-6" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 w-full p-6 bg-primary/5 rounded-[32px] border border-primary/10 space-y-4">
                    <h4 className="text-[11px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                      <Info className="w-4 h-4" /> Dica de Especialista
                    </h4>
                    <p className="text-[11px] text-text-secondary leading-relaxed font-medium italic">
                      "Produtos com variantes (como cores e tamanhos) têm taxas de conversão significativamente maiores."
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-border flex justify-end gap-4 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 rounded-2xl font-black text-sm text-text-secondary hover:bg-slate-50 transition-all uppercase tracking-widest">Cancelar</button>
                {!isAiMode && (
                  <button 
                    type="submit" 
                    form="product-form"
                    className="bg-primary text-white px-10 py-4 rounded-2xl font-black text-sm hover:opacity-90 shadow-xl shadow-primary/20 transition-all flex items-center gap-3 active:scale-95 uppercase tracking-widest"
                  >
                    <Save className="w-5 h-5" />
                    {editingProduct ? 'Guardar' : 'Publicar'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}