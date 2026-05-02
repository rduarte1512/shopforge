
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyB4GtxyWDgFrQyWp29EH6AjdFfVTRMh2JQ";
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error fetching models:", error);
  }
}

listModels();
