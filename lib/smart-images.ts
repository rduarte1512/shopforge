const IMAGE_LIBRARY: Record<string, { product: string[]; banner: string[] }> = {
  relogios: {
    product: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=900&q=85',
    ],
    banner: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1600&q=85',
    ],
  },
  joias: {
    product: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?auto=format&fit=crop&w=900&q=85',
    ],
    banner: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1600&q=85',
    ],
  },
  moda: {
    product: [
      'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85',
    ],
    banner: [
      'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1600&q=85',
    ],
  },
  tecnologia: {
    product: [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=85',
    ],
    banner: [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1600&q=85',
    ],
  },
  beleza: {
    product: [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85',
    ],
    banner: [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?auto=format&fit=crop&w=1600&q=85',
    ],
  },
  cafe: {
    product: [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85',
    ],
    banner: [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=85',
    ],
  },
  construcao: {
    product: [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=85',
    ],
    banner: [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=85',
    ],
  },
  fitness: {
    product: [
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=85',
    ],
    banner: [
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=85',
    ],
  },
  generic: {
    product: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1481437156560-3205f6a55735?auto=format&fit=crop&w=900&q=85',
      'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=900&q=85',
    ],
    banner: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=85',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1600&q=85',
    ],
  },
};

function normalizeText(value: string) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function detectImageTheme(input: string) {
  const text = normalizeText(input);

  if (/relogio|relogios|watch|watches|cronografo|automatico/.test(text)) return 'relogios';
  if (/joia|joias|anel|aneis|colar|pulseira|brinco|ouro|prata/.test(text)) return 'joias';
  if (/roupa|moda|fashion|streetwear|tshirt|camisola|hoodie|casaco|calca|vestido/.test(text)) return 'moda';
  if (/tech|tecnologia|gadget|eletron|gaming|auscultadores|teclado|rato|smartphone|usb/.test(text)) return 'tecnologia';
  if (/beleza|skincare|cosmetico|perfume|maquilhagem|creme|serum|tonico/.test(text)) return 'beleza';
  if (/cafe|coffee|pastelaria|padaria|brunch|espresso|cookie|cha/.test(text)) return 'cafe';
  if (/construcao|cimento|areia|tijolo|obra|ferramenta|ferro|argamassa|brita/.test(text)) return 'construcao';
  if (/fitness|gym|ginasio|treino|desporto|yoga|shaker|luvas|recovery/.test(text)) return 'fitness';

  return 'generic';
}

export function isRandomPlaceholderImage(url?: string | null) {
  if (!url) return true;
  return url.includes('picsum.photos') || url.includes('source.unsplash.com') || url.includes('placeholder');
}

export function getSmartImageUrl(input: string, index = 0, type: 'product' | 'banner' = 'product') {
  const theme = detectImageTheme(input);
  const library = IMAGE_LIBRARY[theme] || IMAGE_LIBRARY.generic;
  const images = library[type] || library.product;
  return images[Math.abs(index) % images.length];
}

export function getProductSmartImage(product: any, index = 0, storeContext = '') {
  if (product?.image_url && !isRandomPlaceholderImage(product.image_url)) return product.image_url;

  const input = [
    product?.name,
    product?.description,
    product?.category,
    product?.imageKeyword,
    storeContext,
  ].filter(Boolean).join(' ');

  return getSmartImageUrl(input, index, 'product');
}

export function getBannerSmartImage(storeOrText: any, index = 0) {
  const input = typeof storeOrText === 'string'
    ? storeOrText
    : [storeOrText?.name, storeOrText?.description, storeOrText?.domain, storeOrText?.bannerKeyword].filter(Boolean).join(' ');

  return getSmartImageUrl(input, index, 'banner');
}

export function replaceRandomImagesInCustomization(customization: any, context: string) {
  if (!customization || typeof customization !== 'object') return customization;

  const sections = Array.isArray(customization.sections)
    ? customization.sections.map((section: any, index: number) => {
      if (section?.type !== 'image') return section;

      const currentUrl = section.content?.url;
      if (!isRandomPlaceholderImage(currentUrl)) return section;

      return {
        ...section,
        content: {
          ...section.content,
          url: getSmartImageUrl(`${context} ${section.content?.alt || ''}`, index, 'banner'),
          alt: section.content?.alt || context,
        },
      };
    })
    : customization.sections;

  return { ...customization, sections };
}
