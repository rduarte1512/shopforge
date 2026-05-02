
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyB4GtxyWDgFrQyWp29EH6AjdFfVTRMh2JQ";
const genAI = new GoogleGenerativeAI(API_KEY);

async function testChatHistory() {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const messages = [
      { role: 'assistant', content: 'Olá! Sou o assistente do ShopForge. Como posso ajudar-te hoje?' },
      { role: 'user', content: 'Quem és tu?' }
    ];

    const chat = model.startChat({
      history: messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.7,
      },
    });

    const lastMessage = messages[messages.length - 1].content;
    const prompt = `System context would be here...\n\nUtilizador: ${lastMessage}`;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    console.log("Response:", response.text());
  } catch (error) {
    console.error("AI Chat Error Details:", error);
  }
}

testChatHistory();
