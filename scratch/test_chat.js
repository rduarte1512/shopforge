
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyB4GtxyWDgFrQyWp29EH6AjdFfVTRMh2JQ";
const genAI = new GoogleGenerativeAI(API_KEY);

async function testChat() {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage("Olá, como estás?");
    const response = await result.response;
    console.log("Response:", response.text());
  } catch (error) {
    console.error("AI Chat Error Details:", error);
    if (error.response) {
        console.error("Response data:", JSON.stringify(error.response, null, 2));
    }
  }
}

testChat();
