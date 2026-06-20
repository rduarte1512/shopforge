'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

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

  if (start >= 0 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1));
  }

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

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function detectNiche(prompt: string) {
  const lower = prompt.toLowerCase();

  if (/joia|jóia|anel|colar|pulseira|brinco/.test(lower)) return 'joalharia premium';
  if (/roupa|streetwear|tshirt|camisola|moda|fashion/.test(lower)) return 'moda urbana';
  if (/tech|tecnologia|gadget|eletr|electr|gaming/.test(lower)) return 'gadgets tecnológicos';
  if (/beleza|skincare|cosmético|cosmetico|perfume/.test(lower)) return 'beleza e skincare';
  if (/café|cafe|pastelaria|restaurante|comida|snack/.test(lower)) return 'café boutique';
  if (/construção|construcao|cimento|ferramenta|obra/.test(lower)) return 'materiais de construção modernos';
  if (/fitness|gym|treino|suplemento|desporto/.test(lower)) return 'fitness e performance';

  return pick([
    'joalharia premium',
    'moda urbana',
    'gadgets tecnológicos',
    'beleza e skincare',
    'casa minimalista',
    'acessórios lifestyle',
  ]);
}

function buildFallbackStoreConfig(prompt: string) {
  const niche = detectNiche(prompt);
  const concepts = [
    {
      suffix: 'Atelier',
      mood: 'luxuoso, editorial e minimalista',
      theme: 'light',
      colors: ['#111827', '#f8fafc', '#c08a2d'],
      hero: 'Design intemporal para quem valoriza detalhe.',
    },
    {
      suffix: 'Lab',
      mood: 'futurista, limpo e tecnológico',
      theme: 'dark',
      colors: ['#050816', '#f8fafc', '#22c55e'],
      hero: 'Produtos inteligentes para uma experiência superior.',
    },
    {
      suffix: 'Studio',
      mood: 'premium, moderno e aspiracional',
      theme: 'light',
      colors: ['#fff7ed', '#111827', '#ea580c'],
      hero: 'Uma coleção criada para elevar o teu dia a dia.',
    },
    {
      suffix: 'House',
      mood: 'elegante, acolhedor e sofisticado',
      theme: 'light',
      colors: ['#f5f5f4', '#1c1917', '#0f766e'],
      hero: 'Escolhas com personalidade, qualidade e presença.',
    },
  ];

  const concept = pick(concepts);
  const nameRoot = niche.split(' ')[0].replace(/^./, (letter) => letter.toUpperCase());
  const name = `${nameRoot} ${concept.suffix}`;
  const [background, text, accent] = concept.colors;
  const baseSeed = slugify(`${name}-${Date.now()}`);

  const productNames = [
    'Edição Signature',
    'Coleção Essential',
    'Modelo Aurora',
    'Peça Prime',
    'Pack Studio',
    'Linha Icon',
    'Seleção Premium',
    'Produto Hero',
  ];

  const products = productNames.map((productName, index) => ({
    name: `${productName} ${index + 1}`,
    description: `Produto pensado para ${niche}, com apresentação premium e foco em qualidade percebida.`,
    price: Number((29 + index * 12 + Math.random() * 18).toFixed(2)),
    stock: 25 + index * 7,
    category: niche,
    imageKeyword: `${niche} ${productName}`,
  }));

  return {
    name,
    domain: `${slugify(name)}-${Math.floor(Math.random() * 900 + 100)}`,
    description: `Uma loja de ${niche} com posicionamento ${concept.mood}.`,
    theme: concept.theme,
    primaryColor: accent,
    bannerKeyword: niche,
    logoKeyword: nameRoot,
    products,
    customization: {
      header: { sticky: true, logoPosition: concept.theme === 'dark' ? 'center' : 'left', height: 76 },
      hero: { height: 520, textAlign: 'center', showOverlay: true, overlayOpacity: 0.18, title: name, subtitle: concept.hero },
      products: { columns: 4, gap: 30, aspectRatio: 'portrait', showPrice: true, showStock: true },
      colors: { background, text, accent, muted: '#94a3b8', primary: accent },
      fonts: { heading: 'Inter', body: 'Inter' },
      sections: [
        {
          id: 'hero-1',
          type: 'hero',
          content: { title: name, subtitle: concept.hero, buttonText: 'Explorar coleção' },
          styles: { height: 520, textAlign: 'center' },
        },
        {
          id: 'brand-story-1',
          type: 'text',
          content: { text: `Criámos uma experiência de compra ${concept.mood}, focada em confiança, desejo e conversão.` },
          styles: { textAlign: 'center' },
        },
        {
          id: 'image-1',
          type: 'image',
          content: { url: `https://picsum.photos/seed/${baseSeed}/1400/560`, alt: `${name} banner` },
          styles: { textAlign: 'center' },
        },
        {
          id: 'products-1',
          type: 'products',
          content: { title: 'Mais desejados' },
          styles: { columns: 4, textAlign: 'left' },
        },
        {
          id: 'cta-1',
          type: 'button',
          content: { text: 'Comprar agora', action: 'checkout', url: '#produtos' },
          styles: { textAlign: 'center' },
        },
      ],
    },
  };
}

function normalizeStoreConfig(config: any, prompt: string) {
  const fallback = buildFallbackStoreConfig(prompt);
  const merged = { ...fallback, ...(config || {}) };
  const customization = config?.customization || config?.layout || config?.storefront || fallback.customization;

  return {
    ...merged,
    name: merged.name || fallback.name,
    domain: slugify(merged.domain || merged.name || fallback.domain),
    description: merged.description || fallback.description,
    theme: merged.theme === 'dark' ? 'dark' : 'light',
    primaryColor: merged.primaryColor || merged.primary_color || fallback.primaryColor,
    products: Array.isArray(merged.products) && merged.products.length > 0 ? merged.products : fallback.products,
    customization: {
      ...fallback.customization,
      ...(customization || {}),
      header: { ...fallback.customization.header, ...(customization?.header || {}) },
      colors: { ...fallback.customization.colors, ...(customization?.colors || {}) },
      fonts: { ...fallback.customization.fonts, ...(customization?.fonts || {}) },
      products: { ...fallback.customization.products, ...(customization?.products || {}) },
      sections: Array.isArray(customization?.sections) && customization.sections.length > 0 ? customization.sections : fallback.customization.sections,
    },
  };
}

export async function generateStoreConfig(prompt: string) {
  const fallback = buildFallbackStoreConfig(prompt);

  try {
    const model = getModel({
      generationConfig: {
        temperature: 1.05,
        topP: 0.95,
        responseMimeType: 'application/json',
      },
    });

    if (!model) return fallback;

    const creativeBrief = `
You are an elite e-commerce brand strategist, store designer and conversion copywriter.
The user request is: "${prompt}".

If the request is vague, such as "create an incredible/perfect store", you MUST choose a specific niche, a strong brand concept and a distinct visual direction. Do not make a generic Shopify clone.

Generate a complete, production-ready Portuguese online store concept with:
- memorable brand name
- unique domain slug
- short Portuguese description
- theme: "light" or "dark"
- primaryColor in HEX
- bannerKeyword and logoKeyword
- 8 realistic products in EUR
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

Use picsum image URLs with unique seeds, for example https://picsum.photos/seed/brand-name-hero/1400/560.
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
  try {
    const model = getModel({
      generationConfig: {
        temperature: 0.85,
        responseMimeType: 'application/json',
      },
    });

    if (!model) {
      return {
        name: 'Produto Premium',
        description: `Produto criado para ${prompt}, com foco em qualidade e apresentação profissional.`,
        price: 39.9,
        stock: 80,
        category: category || 'Destaques',
        imageKeyword: prompt,
        sku: `PRD-${Math.floor(Math.random() * 9999)}`,
        weight: 0.5,
        material: 'Premium',
        brand: 'ShopForge',
        tags: ['premium', 'novo', 'destaque'],
        specifications: {},
        isActive: true,
        isFeatured: true,
      };
    }

    const categoryContext = category ? `Categoria do produto: ${category}.` : '';
    const fullPrompt = `Act as an e-commerce product expert. Based on: "${prompt}" ${categoryContext}
Generate complete product details in Portuguese.
Return ONLY valid JSON with: name, description, price, stock, category, imageKeyword, sku, weight, dimensions, material, brand, tags, specifications, isActive, isFeatured.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiText = response.text();

    if (!aiText) throw new Error('A API devolveu uma resposta vazia.');

    return parseJsonResponse(aiText);
  } catch (error: any) {
    console.error('AI Product Generation Error:', error);
    throw new Error(error.message || 'Erro desconhecido na geração de produto');
  }
}

export async function generateMultipleProducts(prompt: string, count: number = 4) {
  try {
    const model = getModel({
      generationConfig: {
        temperature: 0.9,
        responseMimeType: 'application/json',
      },
    });

    if (!model) return buildFallbackStoreConfig(prompt).products.slice(0, count);

    const fullPrompt = `Act as an e-commerce product expert. Based on: "${prompt}"
Generate ${count} complete product details in Portuguese.
Return ONLY a valid JSON array with ${count} product objects. Each must include name, description, price, stock, category, imageKeyword, sku, weight, material, brand, tags, isActive.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiText = response.text();

    if (!aiText) throw new Error('A API devolveu uma resposta vazia.');

    const products = parseJsonResponse(aiText);
    return Array.isArray(products) ? products : [products];
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
