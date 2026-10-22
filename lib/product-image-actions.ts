'use server';

import { getProductSmartImage } from './smart-images';

type ProductImageDraft = {
  name: string;
  category?: string;
  imageKeyword?: string;
  description?: string;
};

// Pesquisa fotografias do produto, em vez de atribuir imagens aleatórias por seed.
// A chave, quando disponível, é lida exclusivamente do servidor.
export async function findProductPhotos(products: ProductImageDraft[], storeContext = ''): Promise<string[]> {
  const limited = Array.isArray(products) ? products.slice(0, 8) : [];
  const pexelsKey = process.env.PEXELS_API_KEY;
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

  return Promise.all(limited.map(async (product, index) => {
    const fallback = getProductSmartImage(product, index, storeContext);
    // A designação individual prevalece sobre o nicho global para não
    // apresentar, por exemplo, uma t-shirt numa ficha de calças.
    const query = [product.name, product.category].filter(Boolean).join(' ').slice(0, 100);
    if (!query.trim()) return fallback;

    try {
      if (pexelsKey) {
        const response = await fetch('https://api.pexels.com/v1/search?query=' + encodeURIComponent(query) + '&per_page=5&orientation=portrait', {
          headers: { Authorization: pexelsKey }, cache: 'no-store', signal: AbortSignal.timeout(6500),
        });
        if (response.ok) {
          const data = await response.json();
          const photo = (data.photos || []).find((item: any) => item?.src?.large && item?.alt);
          if (photo?.src?.large && /^https:\/\/images\.pexels\.com\//.test(photo.src.large)) return photo.src.large;
        }
      }
      if (unsplashKey) {
        const response = await fetch('https://api.unsplash.com/search/photos?query=' + encodeURIComponent(query) + '&per_page=5&orientation=portrait', {
          headers: { Authorization: 'Client-ID ' + unsplashKey }, cache: 'no-store', signal: AbortSignal.timeout(6500),
        });
        if (response.ok) {
          const data = await response.json();
          const photo = (data.results || []).find((item: any) => item?.urls?.regular && item?.alt_description);
          if (photo?.urls?.regular && /^https:\/\/images\.unsplash\.com\//.test(photo.urls.regular)) return photo.urls.regular;
        }
      }
    } catch (error) {
      console.warn('Fotografia externa não disponível, a utilizar fotografia de catálogo:', error);
    }
    return fallback;
  }));
}
