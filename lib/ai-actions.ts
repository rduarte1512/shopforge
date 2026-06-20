'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

type StoreIntent = {
  niche: string;
  label: string;
  explicit: boolean;
  keywords: string[];
  nameRoots: string[];
  heroLines: string[];
  productNames: string[];
  categories: string[];
  imageKeyword: string;
};

const STORE_INTENTS: StoreIntent[] = [
  {
    niche: 'relogios',
    label: 'relógios premium',
    explicit: false,
    keywords: ['relogio', 'relogios', 'relógio', 'relógios', 'watch', 'watches', 'cronografo', 'cronógrafo', 'automatico', 'automático', 'pulseira de relogio'],
    nameRoots: ['Tempo', 'Chronos', 'Heritage', 'Vértice', 'Noir Time', 'Aurum Watches'],
    heroLines: [
      'Relógios escolhidos para marcar presença em todos os momentos.',
      'Precisão, elegância e caráter no pulso.',
      'Peças intemporais para quem valoriza detalhe, estilo e pontualidade.',
    ],
    productNames: [
      'Relógio Automático Heritage',
      'Relógio Minimalista Noir',
      'Cronógrafo Urbano Steel',
      'Relógio Classic Leather',
      'Relógio Sport Chrono Pro',
      'Relógio Skeleton Prestige',
      'Relógio Dourado Aurum',
      'Relógio Feminino Luna',
    ],
    categories: ['Relógios Automáticos', 'Cronógrafos', 'Relógios Clássicos', 'Relógios de Luxo'],
    imageKeyword: 'luxury watch wristwatch chronograph',
  },
  {
    niche: 'joias',
    label: 'joalharia premium',
    explicit: false,
    keywords: ['joia', 'joias', 'jóia', 'jóias', 'anel', 'aneis', 'anéis', 'colar', 'pulseira', 'brinco', 'brincos', 'ouro', 'prata'],
    nameRoots: ['Éclat', 'Aurum', 'Luna', 'Maison Joias', 'Brilho'],
    heroLines: ['Elegância e brilho em cada peça.', 'Joias que celebram momentos únicos.', 'Detalhes preciosos para histórias inesquecíveis.'],
    productNames: ['Anel Aura Dourado', 'Colar Luna Pérola', 'Pulseira Riviera', 'Brincos Éclat Cristal', 'Anel Solitário Classic', 'Colar Minimal Gold', 'Pulseira Fine Silver', 'Brincos Aurora'],
    categories: ['Anéis', 'Colares', 'Pulseiras', 'Brincos'],
    imageKeyword: 'premium jewelry gold ring necklace',
  },
  {
    niche: 'moda',
    label: 'moda urbana',
    explicit: false,
    keywords: ['roupa', 'streetwear', 'tshirt', 't-shirt', 'camisola', 'hoodie', 'moda', 'fashion', 'casaco', 'calças', 'vestido'],
    nameRoots: ['Urban', 'Shadow', 'Core', 'Drip', 'Studio Wear'],
    heroLines: ['Peças urbanas com presença e atitude.', 'Roupa criada para destacar o teu estilo.', 'Moda confortável, moderna e confiante.'],
    productNames: ['Hoodie Oversized Core', 'T-Shirt Signature', 'Casaco Street Noir', 'Calças Cargo Urban', 'Sweat Essential', 'T-Shirt Premium Heavy', 'Bomber Jacket Studio', 'Conjunto Minimal Fit'],
    categories: ['Hoodies', 'T-Shirts', 'Casacos', 'Streetwear'],
    imageKeyword: 'streetwear fashion clothing',
  },
  {
    niche: 'tecnologia',
    label: 'gadgets tecnológicos',
    explicit: false,
    keywords: ['tech', 'tecnologia', 'gadget', 'gadgets', 'eletronico', 'eletrónico', 'eletronica', 'eletrónica', 'gaming', 'smartphone', 'auscultadores'],
    nameRoots: ['Techify', 'Volt', 'Nexa', 'Gadget Lab', 'Pixel'],
    heroLines: ['Tecnologia útil, moderna e pronta para o teu dia.', 'Gadgets que tornam a rotina mais inteligente.', 'Performance, design e inovação num só lugar.'],
    productNames: ['Auscultadores Pro Wireless', 'Carregador MagSafe Ultra', 'Suporte Smart Desk', 'Teclado Mecânico Compact', 'Rato Gaming Precision', 'Powerbank Slim Max', 'Hub USB-C 8 em 1', 'Luz LED Setup Pro'],
    categories: ['Gadgets', 'Gaming', 'Acessórios Tech', 'Setup'],
    imageKeyword: 'technology gadgets electronics',
  },
  {
    niche: 'beleza',
    label: 'beleza e skincare',
    explicit: false,
    keywords: ['beleza', 'skincare', 'cosmetico', 'cosmético', 'cosmeticos', 'cosméticos', 'perfume', 'maquilhagem', 'creme', 'serum', 'sérum'],
    nameRoots: ['Glow', 'Derma', 'Lumi', 'Pure Skin', 'Aura Beauty'],
    heroLines: ['Rotinas de beleza com resultados visíveis.', 'Cuidado diário com uma experiência premium.', 'Produtos pensados para brilho, confiança e bem-estar.'],
    productNames: ['Sérum Glow Vitamin C', 'Creme Hidratante Pure', 'Máscara Detox Clay', 'Óleo Facial Lumi', 'Perfume Aura Mist', 'Gel Limpeza Gentle', 'Tónico Balance Skin', 'Kit Rotina Glow'],
    categories: ['Skincare', 'Perfumes', 'Tratamento', 'Rotina Facial'],
    imageKeyword: 'skincare beauty cosmetics',
  },
  {
    niche: 'cafe',
    label: 'café boutique',
    explicit: false,
    keywords: ['café', 'cafe', 'pastelaria', 'restaurante', 'comida', 'snack', 'padaria', 'brunch'],
    nameRoots: ['Maruja', 'Brew', 'Roast', 'Café Studio', 'Bean House'],
    heroLines: ['Café especial para momentos memoráveis.', 'Sabor, aroma e conforto em cada pedido.', 'Uma seleção artesanal para verdadeiros apreciadores.'],
    productNames: ['Café Arábica Premium', 'Blend Espresso Signature', 'Pack Cápsulas Intenso', 'Cold Brew Artesanal', 'Granola Brunch House', 'Cookie Chocolate Belga', 'Chá Verde Citrus', 'Kit Degustação Café'],
    categories: ['Café', 'Brunch', 'Bebidas', 'Pastelaria'],
    imageKeyword: 'coffee cafe bakery',
  },
  {
    niche: 'construcao',
    label: 'materiais de construção',
    explicit: false,
    keywords: ['construção', 'construcao', 'cimento', 'areia', 'tijolo', 'obra', 'ferramenta', 'ferramentas', 'entulho', 'ferro'],
    nameRoots: ['ObraFácil', 'Build Pro', 'SacoFácil', 'Cimento Norte', 'Materiais Pro'],
    heroLines: ['Materiais certos para obras rápidas e bem feitas.', 'Entrega prática para construção e renovação.', 'Soluções profissionais para cada etapa da obra.'],
    productNames: ['Saco de Cimento 25kg', 'Areia Lavada Média', 'Brita Granítica 20mm', 'Tijolo Cerâmico Pro', 'Argamassa Multiusos', 'Ferro Varão 8mm', 'Saco Obra Grande', 'Kit Renovação Base'],
    categories: ['Cimento', 'Areia', 'Ferragens', 'Materiais'],
    imageKeyword: 'construction materials cement tools',
  },
  {
    niche: 'fitness',
    label: 'fitness e performance',
    explicit: false,
    keywords: ['fitness', 'gym', 'ginásio', 'ginasio', 'treino', 'suplemento', 'desporto', 'musculação', 'musculacao', 'yoga'],
    nameRoots: ['Peak', 'Iron', 'FitLab', 'Core Performance', 'Athlete'],
    heroLines: ['Equipamento e acessórios para treinar melhor.', 'Performance, foco e consistência todos os dias.', 'Produtos pensados para superar limites.'],
    productNames: ['Shaker Pro 700ml', 'Luvas Treino Grip', 'Elásticos Resistance Set', 'Tapete Yoga Premium', 'Corda Speed Jump', 'Garrafa Hydra Steel', 'Mochila Gym Pack', 'Rolo Massagem Recovery'],
    categories: ['Treino', 'Acessórios', 'Recovery', 'Performance'],
    imageKeyword: 'fitness gym workout equipment',
  },
];

function getModel(options?: any) {
  if (!API_KEY) return null;
  const genAI = new GoogleGenerativeAI(API_KEY);
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    ...options,
  });
}

function cleanJson(text: string) {
  return text.replace(/```json|```/g, '').trim();
}

function parseJsonResponse(text: string) {
  const cleaned = cleanJson(text);
  const firstObject = cleaned.indexOf('{');
  const firstArray = cleaned.indexOf('[');
  const start = firstArray !== -1 && (firstArray < firstObject || firstObject === -1) ? firstArray : firstObject;
  const end = cleaned.trim().endsWith(']') ? cleaned.lastIndexOf(']') : cleaned.lastIndexOf('}');

  if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
  return JSON.parse(cleaned);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42) || 'loja-online';
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function detectIntent(prompt: string): StoreIntent {
  const normalized = normalizeText(prompt);
  const found = STORE_INTENTS.find((intent) => intent.keywords.some((keyword) => normalized.includes(normalizeText(keyword))));

  if (found) return { ...found, explicit: true };
  return { ...pick(STORE_INTENTS), explicit: false };
}

function productMatchesIntent(product: any, intent: StoreIntent) {
  const text = normalizeText(`${product?.name ?? ''} ${product?.description ?? ''} ${product?.category ?? ''} ${product?.imageKeyword ?? ''}`);
  return intent.keywords.some((keyword) => text.includes(normalizeText(keyword))) || text.includes(normalizeText(intent.label));
}

function buildIntentProducts(intent: StoreIntent) {
  return intent.productNames.map((productName, index) => {
    const category = intent.categories[index % intent.categories.length];
    const premiumMultiplier = intent.niche === 'relogios' || intent.niche === 'joias' ? 1.9 : 1;
    const basePrice = 29 + index * 14;

    return {
      name: productName,
      description: `Produto de ${intent.label} com design cuidado, apresentação premium e foco em qualidade percebida. Ideal para clientes que procuram ${intent.label}.`,
      price: Number((basePrice * premiumMultiplier + Math.random() * 18).toFixed(2)),
      stock: 20 + index * 8,
      category,
      imageKeyword: `${intent.imageKeyword} ${productName}`,
      sku: `${intent.niche.toUpperCase().slice(0, 3)}-${1000 + index}`,
      weight: intent.niche === 'relogios' ? 0.2 : 0.5,
      brand: pick(intent.nameRoots),
      tags: [intent.niche, category, 'premium'],
      isActive: true,
      isFeatured: index < 4,
    };
  });
}

function buildFallbackStoreConfig(prompt: string) {
  const intent = detectIntent(prompt);
  const concepts = [
    {
      suffix: 'Atelier',
      mood: 'luxuoso, editorial e minimalista',
      theme: 'light',
      colors: ['#fffaf0', '#111827', '#b7791f'],
    },
    {
      suffix: 'Studio',
      mood: 'premium, moderno e aspiracional',
      theme: 'light',
      colors: ['#ffffff', '#0f172a', '#008060'],
    },
    {
      suffix: 'Noir',
      mood: 'escuro, sofisticado e impactante',
      theme: 'dark',
      colors: ['#050816', '#f8fafc', '#22c55e'],
    },
    {
      suffix: 'House',
      mood: 'elegante, acolhedor e profissional',
      theme: 'light',
      colors: ['#f8fafc', '#1e293b', '#0f766e'],
    },
  ];

  const concept = pick(concepts);
  const root = pick(intent.nameRoots);
  const name = `${root} ${concept.suffix}`;
  const [background, text, accent] = concept.colors;
  const baseSeed = slugify(`${name}-${intent.niche}-${Date.now()}`);
  const products = buildIntentProducts(intent);
  const heroLine = pick(intent.heroLines);

  return {
    name,
    domain: `${slugify(name)}-${Math.floor(Math.random() * 900 + 100)}`,
    description: `Uma loja de ${intent.label} com posicionamento ${concept.mood}.`,
    theme: concept.theme,
    primaryColor: accent,
    bannerKeyword: intent.imageKeyword,
    logoKeyword: root,
    products,
    customization: {
      header: { sticky: true, logoPosition: concept.theme === 'dark' ? 'center' : 'left', height: 76 },
      hero: { height: 540, textAlign: 'center', showOverlay: true, overlayOpacity: 0.18, title: name, subtitle: heroLine },
      products: { columns: 4, gap: 30, aspectRatio: 'portrait', showPrice: true, showStock: true },
      colors: { background, text, accent, muted: '#94a3b8', primary: accent },
      fonts: { heading: 'Inter', body: 'Inter' },
      sections: [
        {
          id: 'hero-1',
          type: 'hero',
          content: { title: name, subtitle: heroLine, buttonText: intent.niche === 'relogios' ? 'Ver relógios' : 'Explorar coleção' },
          styles: { height: 540, textAlign: 'center' },
        },
        {
          id: 'brand-story-1',
          type: 'text',
          content: { text: `Criámos uma experiência de compra focada em ${intent.label}, confiança, desejo e conversão.` },
          styles: { textAlign: 'center' },
        },
        {
          id: 'image-1',
          type: 'image',
          content: { url: `https://picsum.photos/seed/${baseSeed}/1400/560`, alt: `${name} ${intent.label}` },
          styles: { textAlign: 'center' },
        },
        {
          id: 'products-1',
          type: 'products',
          content: { title: intent.niche === 'relogios' ? 'Relógios em destaque' : 'Mais desejados' },
          styles: { columns: 4, textAlign: 'left' },
        },
        {
          id: 'cta-1',
          type: 'button',
          content: { text: intent.niche === 'relogios' ? 'Comprar relógio' : 'Comprar agora', action: 'checkout', url: '#produtos' },
          styles: { textAlign: 'center' },
        },
      ],
    },
  };
}

function normalizeProductsForIntent(products: any[], intent: StoreIntent) {
  const safeProducts = Array.isArray(products) ? products : [];
  const matchingCount = safeProducts.filter((product) => productMatchesIntent(product, intent)).length;

  if (intent.explicit && matchingCount < Math.max(2, Math.ceil(safeProducts.length * 0.6))) {
    return buildIntentProducts(intent);
  }

  const fallbackProducts = buildIntentProducts(intent);
  const normalized = safeProducts.slice(0, 8).map((product, index) => {
    const fallback = fallbackProducts[index] || fallbackProducts[0];
    const productIsRelevant = !intent.explicit || productMatchesIntent(product, intent);

    return {
      ...fallback,
      ...(productIsRelevant ? product : {}),
      category: productIsRelevant ? product.category || fallback.category : fallback.category,
      imageKeyword: productIsRelevant ? product.imageKeyword || fallback.imageKeyword : fallback.imageKeyword,
    };
  });

  while (normalized.length < 8) normalized.push(fallbackProducts[normalized.length]);
  return normalized;
}

function normalizeStoreConfig(config: any, prompt: string) {
  const intent = detectIntent(prompt);
  const fallback = buildFallbackStoreConfig(prompt);
  const merged = { ...fallback, ...(config || {}) };
  const customization = config?.customization || config?.layout || config?.storefront || fallback.customization;
  const products = normalizeProductsForIntent(merged.products, intent);
  const explicitDescription = `Uma loja de ${intent.label} com curadoria profissional e apresentação premium.`;
  const heroSection = Array.isArray(customization?.sections)
    ? customization.sections.find((section: any) => section.type === 'hero')
    : null;
  const productsSection = Array.isArray(customization?.sections)
    ? customization.sections.find((section: any) => section.type === 'products')
    : null;

  const safeSections = Array.isArray(customization?.sections) && customization.sections.length > 0
    ? customization.sections
    : fallback.customization.sections;

  const fixedSections = safeSections.map((section: any) => {
    if (section.type === 'hero' && intent.explicit) {
      return {
        ...section,
        content: {
          ...section.content,
          title: section.content?.title || merged.name || fallback.name,
          subtitle: productMatchesIntent({ description: section.content?.subtitle }, intent) ? section.content?.subtitle : pick(intent.heroLines),
          buttonText: intent.niche === 'relogios' ? 'Ver relógios' : section.content?.buttonText || 'Explorar coleção',
        },
      };
    }

    if (section.type === 'products' && intent.explicit) {
      return {
        ...section,
        content: {
          ...section.content,
          title: intent.niche === 'relogios' ? 'Relógios em destaque' : section.content?.title || `Produtos de ${intent.label}`,
        },
      };
    }

    return section;
  });

  if (!heroSection && intent.explicit) fixedSections.unshift(fallback.customization.sections[0]);
  if (!productsSection && intent.explicit) fixedSections.push(fallback.customization.sections[3]);

  return {
    ...merged,
    name: merged.name || fallback.name,
    domain: slugify(merged.domain || merged.name || fallback.domain),
    description: intent.explicit ? explicitDescription : merged.description || fallback.description,
    theme: merged.theme === 'dark' ? 'dark' : 'light',
    primaryColor: merged.primaryColor || merged.primary_color || fallback.primaryColor,
    bannerKeyword: intent.imageKeyword,
    logoKeyword: merged.logoKeyword || fallback.logoKeyword,
    products,
    customization: {
      ...fallback.customization,
      ...(customization || {}),
      header: { ...fallback.customization.header, ...(customization?.header || {}) },
      hero: { ...fallback.customization.hero, ...(customization?.hero || {}), subtitle: intent.explicit ? pick(intent.heroLines) : customization?.hero?.subtitle || fallback.customization.hero.subtitle },
      colors: { ...fallback.customization.colors, ...(customization?.colors || {}) },
      fonts: { ...fallback.customization.fonts, ...(customization?.fonts || {}) },
      products: { ...fallback.customization.products, ...(customization?.products || {}) },
      sections: fixedSections,
    },
  };
}

export async function generateStoreConfig(prompt: string) {
  const intent = detectIntent(prompt);
  const fallback = buildFallbackStoreConfig(prompt);

  try {
    const model = getModel({
      generationConfig: {
        temperature: intent.explicit ? 0.65 : 1.05,
        topP: 0.9,
        responseMimeType: 'application/json',
      },
    });

    if (!model) return fallback;

    const creativeBrief = `
You are an elite e-commerce brand strategist, store designer and conversion copywriter.
The user request is: "${prompt}".

Detected store niche: "${intent.label}".
Niche was explicitly requested by the user: ${intent.explicit ? 'YES' : 'NO'}.
Relevant niche keywords: ${intent.keywords.join(', ')}.

CRITICAL RULES:
1. If the niche was explicitly requested, every product, category, hero text, description and imageKeyword MUST belong to "${intent.label}".
2. Do NOT switch to another niche. If the user asks for watches/relogios, create a watch store and watch products only.
3. Product names must be specific, realistic and sellable in Portuguese.
4. Avoid generic names like "Produto 1" or unrelated lifestyle products.
5. The store must feel visually premium and conversion-focused.

Generate a complete, production-ready Portuguese online store concept with:
- memorable brand name related to ${intent.label}
- unique domain slug
- short Portuguese description related to ${intent.label}
- theme: "light" or "dark"
- primaryColor in HEX
- bannerKeyword and logoKeyword related to ${intent.label}
- exactly 8 realistic products in EUR related to ${intent.label}
- a full customization object for the visual editor

The customization object must have this exact shape:
{
  "header": { "sticky": true, "logoPosition": "left" | "center", "height": number },
  "hero": { "height": number, "textAlign": "left" | "center", "showOverlay": true, "overlayOpacity": number, "title": string, "subtitle": string },
  "products": { "columns": number, "gap": number, "aspectRatio": "portrait", "showPrice": true, "showStock": true },
  "colors": { "background": string, "text": string, "accent": string, "muted": string, "primary": string },
  "fonts": { "heading": "Inter", "body": "Inter" },
  "sections": [
    { "id": string, "type": "hero", "content": { "title": string, "subtitle": string, "buttonText": string }, "styles": { "height": number, "textAlign": "left" | "center" } },
    { "id": string, "type": "text", "content": { "text": string }, "styles": { "textAlign": "left" | "center" } },
    { "id": string, "type": "image", "content": { "url": string, "alt": string }, "styles": { "textAlign": "center" } },
    { "id": string, "type": "products", "content": { "title": string }, "styles": { "columns": 3 | 4, "textAlign": "left" } },
    { "id": string, "type": "button", "content": { "text": string, "action": "checkout", "url": "#produtos" }, "styles": { "textAlign": "center" } }
  ]
}

Use picsum image URLs with unique seeds related to ${intent.imageKeyword}, for example https://picsum.photos/seed/watch-heritage-hero/1400/560.
Return ONLY valid JSON.`;

    const result = await model.generateContent(creativeBrief);
    const response = await result.response;
    const aiText = response.text();

    if (!aiText) return fallback;
    return normalizeStoreConfig(parseJsonResponse(aiText), prompt);
  } catch (error: any) {
    console.error('AI Generation Critical Error:', error);
    return fallback;
  }
}

export async function updateStoreCustomizationWithAI(currentConfig: any, userRequest: string) {
  try {
    const model = getModel({
      generationConfig: {
        temperature: 0.85,
        topP: 0.9,
        responseMimeType: 'application/json',
      },
    });

    if (!model) throw new Error('GEMINI_API_KEY não configurada.');

    const fullPrompt = `Act as a senior e-commerce designer.
Current Store Configuration: ${JSON.stringify(currentConfig)}

The user wants: "${userRequest}"

Return ONLY the COMPLETE updated JSON object for the customization field.
Keep all required keys: header, hero, products, colors, fonts, sections.
Never return an empty sections array.
Make the design conversion-focused, visually distinct and consistent with the request.
Use Portuguese copy in visible text.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiText = response.text();

    if (!aiText) throw new Error('Resposta vazia da IA.');
    return parseJsonResponse(aiText);
  } catch (error: any) {
    console.error('AI Update Critical Error:', error);
    throw new Error('Falha ao atualizar a loja com IA. Tenta novamente.');
  }
}

export async function generateProduct(prompt: string, category?: string) {
  const intent = detectIntent(`${prompt} ${category || ''}`);

  try {
    const model = getModel({
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });

    if (!model) return buildIntentProducts(intent)[0];

    const categoryContext = category ? `Categoria do produto: ${category}.` : '';
    const fullPrompt = `Act as an e-commerce product expert.
The user asked for: "${prompt}" ${categoryContext}
Detected product niche: ${intent.label}.
Every product detail MUST be related to ${intent.label}.
Generate one complete product in Portuguese.
Return ONLY valid JSON with: name, description, price, stock, category, imageKeyword, sku, weight, dimensions, material, brand, tags, specifications, isActive, isFeatured.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiText = response.text();

    if (!aiText) return buildIntentProducts(intent)[0];

    const product = parseJsonResponse(aiText);
    return productMatchesIntent(product, intent) || !intent.explicit ? product : buildIntentProducts(intent)[0];
  } catch (error: any) {
    console.error('AI Product Generation Error:', error);
    throw new Error(error.message || 'Erro desconhecido na geração de produto');
  }
}

export async function generateMultipleProducts(prompt: string, count: number = 4) {
  const intent = detectIntent(prompt);

  try {
    const model = getModel({
      generationConfig: {
        temperature: 0.75,
        responseMimeType: 'application/json',
      },
    });

    if (!model) return buildIntentProducts(intent).slice(0, count);

    const fullPrompt = `Act as an e-commerce product expert.
The user asked for: "${prompt}"
Detected niche: ${intent.label}.
Generate ${count} complete product details in Portuguese.
Every product MUST be related to ${intent.label}; do not create unrelated products.
Return ONLY a valid JSON array with ${count} product objects. Each must include name, description, price, stock, category, imageKeyword, sku, weight, material, brand, tags, isActive.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiText = response.text();

    if (!aiText) return buildIntentProducts(intent).slice(0, count);

    const products = parseJsonResponse(aiText);
    const productArray = Array.isArray(products) ? products : [products];
    return normalizeProductsForIntent(productArray, intent).slice(0, count);
  } catch (error: any) {
    console.error('AI Products Generation Error:', error);
    throw new Error(error.message || 'Erro desconhecido na geração de produtos');
  }
}

export async function chatWithAssistant(messages: { role: 'user' | 'assistant'; content: string }[]) {
  try {
    const model = getModel({
      systemInstruction: `Tu és o Assistente ShopForge, especialista em e-commerce, criação de lojas online e crescimento de vendas. Responde em Português de Portugal, com respostas práticas e diretas.`,
    });

    if (!model) throw new Error('GEMINI_API_KEY não configurada.');

    const history = messages.slice(0, -1)
      .filter((message, index) => index > 0 || message.role === 'user')
      .map((message) => ({
        role: message.role === 'user' ? 'user' : 'model',
        parts: [{ text: message.content }],
      }));

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.75,
      },
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;

    if (!response.text()) throw new Error('O assistente não conseguiu gerar uma resposta.');
    return response.text();
  } catch (error: any) {
    console.error('AI Chat Error Details:', error);
    throw new Error('O assistente teve um problema ao processar a tua mensagem. Tenta novamente.');
  }
}
