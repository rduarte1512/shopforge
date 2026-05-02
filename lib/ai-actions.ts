'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = "AIzaSyB4GtxyWDgFrQyWp29EH6AjdFfVTRMh2JQ";

const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateStoreConfig(prompt: string) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      }
    });

    const fullPrompt = `Act as an e-commerce branding expert. Based on the user's description: "${prompt}", generate a complete store configuration. 
Return ONLY a valid JSON object with these fields: 
- name (string)
- domain (string, url-friendly)
- description (string, short)
- theme (string, "light" or "dark")
- primaryColor (string, hex)
- bannerKeyword (string, a single descriptive word for a hero banner image)
- logoKeyword (string, a single descriptive word for a logo image)
- products (array of objects, generate at least 4 products. Each product object must have: name, description, price (number), stock (number), category, and imageKeyword (single descriptive word for the product image)).`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let aiText = response.text();

    if (!aiText) {
      throw new Error("A API devolveu uma resposta vazia.");
    }

    // Fallback: cleaning markdown if AI includes it despite responseMimeType
    if (aiText.includes('```')) {
      aiText = aiText.replace(/```json|```/g, '').trim();
    }

    try {
      return JSON.parse(aiText);
    } catch (parseErr) {
      console.error("Failed to parse AI JSON. Raw text:", aiText);
      throw new Error("A IA gerou um formato inválido. Tenta novamente.");
    }

  } catch (error: any) {
    console.error("AI Generation Critical Error:", error);

    if (error.message?.includes('404')) {
      throw new Error("Erro na comunicação com a API (Status: 404). O modelo pode estar indisponível.");
    }

    throw new Error(error.message || "Erro desconhecido na geração");
  }
}

export async function updateStoreCustomizationWithAI(currentConfig: any, userRequest: string) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.5,
        responseMimeType: "application/json",
      }
    });

    const fullPrompt = `Act as an e-commerce branding and design expert. 
Current Store Configuration: ${JSON.stringify(currentConfig)}

The user wants to make the following changes: "${userRequest}"

Generate an updated configuration object. You can modify colors, theme, layout, header settings, and most importantly, the dynamic sections.
Return ONLY the COMPLETE updated JSON object for the customization field. 

Structure:
{
  "header": { "sticky": boolean, "logoPosition": "left"|"center", "height": number },
  "colors": { "background": string, "text": string, "accent": string, "muted": string, "primary": string },
  "fonts": { "heading": string, "body": string },
  "sections": [
    { 
      "id": string, 
      "type": "hero"|"products"|"text"|"button"|"image"|"spacer",
      "content": {
        // For hero: { title, subtitle, buttonText }
        // For products: { title }
        // For text: { text }
        // For button: { text, action: "link"|"whatsapp"|"checkout", url }
        // For image: { url, alt }
      },
      "styles": {
        // For all: { textAlign: "left"|"center"|"right" }
        // For products: { columns: number }
        // For hero: { height: number }
        // For spacer: { height: number }
      }
    }
  ] 
}

Make sure the changes are visually appealing and consistent with the user's request. Add new sections or reorder them if needed to fulfill the request.`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let aiText = response.text();

    if (aiText.includes('```')) {
      aiText = aiText.replace(/```json|```/g, '').trim();
    }

    return JSON.parse(aiText);

  } catch (error: any) {
    console.error("AI Update Critical Error:", error);
    throw new Error("Falha ao atualizar a loja com IA. Tenta novamente.");
  }
}

export async function generateProduct(prompt: string, category?: string) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json",
      }
    });

    const categoryContext = category ? `Categoria do produto: ${category}.` : '';

    const fullPrompt = `Act as an e-commerce product expert. Based on the user's description: "${prompt}" ${categoryContext}
Generate a complete product details. 
Return ONLY a valid JSON object with these fields: 
- name (string, product name)
- description (string, detailed product description, 2-3 sentences highlighting features and benefits)
- price (number, realistic price in EUR)
- stock (number, realistic stock quantity between 10-200)
- category (string, appropriate category)
- imageKeyword (string, a single descriptive word for the product image that will be used with picsum.photos)
- sku (string, unique SKU code like "PRD-001")
- weight (number, weight in kg)
- dimensions (object with length, width, height in cm)
- material (string, main material)
- brand (string, brand name)
- tags (array of strings, relevant tags)
- specifications (object, key-value pairs for technical specs)
- isActive (boolean, default true)
- isFeatured (boolean, default false).`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let aiText = response.text();

    if (!aiText) {
      throw new Error("A API devolveu uma resposta vazia.");
    }

    if (aiText.includes('```')) {
      aiText = aiText.replace(/```json|```/g, '').trim();
    }

    try {
      return JSON.parse(aiText);
    } catch (parseErr) {
      console.error("Failed to parse AI JSON. Raw text:", aiText);
      throw new Error("A IA gerou um formato inválido. Tenta novamente.");
    }

  } catch (error: any) {
    console.error("AI Product Generation Error:", error);
    throw new Error(error.message || "Erro desconhecido na geração de produto");
  }
}

export async function generateMultipleProducts(prompt: string, count: number = 4) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json",
      }
    });

    const fullPrompt = `Act as an e-commerce product expert. Based on the user's description: "${prompt}"
Generate ${count} complete product details. 
Return ONLY a valid JSON array with ${count} product objects. Each product object must have: 
- name (string, product name)
- description (string, detailed product description, 2-3 sentences)
- price (number, realistic price in EUR between 10-500)
- stock (number, realistic stock quantity between 5-100)
- category (string, appropriate category)
- imageKeyword (string, a single descriptive word for the product image)
- sku (string, unique SKU code like "PRD-001")
- weight (number, weight in kg)
- material (string, main material)
- brand (string, brand name)
- tags (array of strings, 3-5 relevant tags)
- isActive (boolean, default true).`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    let aiText = response.text();

    if (!aiText) {
      throw new Error("A API devolveu uma resposta vazia.");
    }

    if (aiText.includes('```')) {
      aiText = aiText.replace(/```json|```/g, '').trim();
    }

    try {
      const products = JSON.parse(aiText);
      return Array.isArray(products) ? products : [products];
    } catch (parseErr) {
      console.error("Failed to parse AI JSON. Raw text:", aiText);
      throw new Error("A IA gerou um formato inválido. Tenta novamente.");
    }

  } catch (error: any) {
    console.error("AI Products Generation Error:", error);
    throw new Error(error.message || "Erro desconhecido na geração de produtos");
  }
}

export async function chatWithAssistant(messages: { role: 'user' | 'assistant', content: string }[]) {
  try {
    const systemInstruction = `Tu és o Assistente ShopForge, um especialista em e-commerce e na plataforma ShopForge.
ShopForge é uma plataforma SaaS que permite aos utilizadores criar e gerir as suas próprias lojas online de forma fácil e rápida.

Funcionalidades principais do ShopForge:
1. Painel de Controlo (Dashboard): Onde o utilizador gere tudo.
2. Gestão de Produtos: Criar, editar, remover produtos, categorias, stock e preços.
3. Encomendas: Visualizar e gerir encomendas dos clientes.
4. Clientes: Base de dados de clientes que compraram na loja.
5. Relatórios: Estatísticas de vendas e performance.
6. Promoções e Cupões: Criar descontos e campanhas de marketing.
7. Configurações de Loja: Personalização visual (tema, cores, logo), domínio e definições gerais.
8. IA Integrada: O ShopForge usa IA para ajudar a gerar descrições de produtos, configurações de loja e até imagens.

O teu objetivo é:
- Esclarecer dúvidas sobre como usar a plataforma.
- Ajudar com estratégias de e-commerce e marketing.
- Ser amigável, profissional e prestável.
- Responder em Português de Portugal.

Se não souberes algo específico sobre a conta do utilizador, sugere que ele verifique as configurações no Dashboard.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
    });

    // Gemini requires history to start with 'user' role.
    // If the first message is from the assistant, we skip it.
    const history = messages.slice(0, -1)
      .filter((m, i) => i > 0 || m.role === 'user')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    
    if (!response.text()) {
      throw new Error("O assistente não conseguiu gerar uma resposta. Tenta reformular a tua pergunta.");
    }

    return response.text();

  } catch (error: any) {
    console.error("AI Chat Error Details:", {
      message: error.message,
      stack: error.stack,
      status: error.status,
      response: error.response?.data
    });
    throw new Error("O assistente teve um problema ao processar a tua mensagem. Tenta novamente.");
  }
}
