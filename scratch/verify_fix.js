
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyB4GtxyWDgFrQyWp29EH6AjdFfVTRMh2JQ";
const genAI = new GoogleGenerativeAI(API_KEY);

async function testFix() {
  try {
    const systemInstruction = "You are a helpful assistant.";
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemInstruction,
    });

    // Simulated messages starting with assistant greeting
    const messages = [
      { role: 'assistant', content: 'Olá! Como posso ajudar?' },
      { role: 'user', content: 'Quem és tu?' }
    ];

    // THE FIX: Filter history to ensure it starts with 'user'
    const history = messages.slice(0, -1)
      .filter((m, i) => i > 0 || m.role === 'user')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    console.log("History length:", history.length);
    if (history.length > 0) {
        console.log("First role in history:", history[0].role);
    }

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.7,
      },
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    console.log("Response:", response.text());
  } catch (error) {
    console.error("AI Chat Error Details:", error);
  }
}

testFix();
