import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

export const askBot = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ response: "No query provided." });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const chat = model.startChat({
      history: [],
      generationConfig: { maxOutputTokens: 1000 },
    });
    const result = await chat.sendMessage(query);
    const response = result.response.text();
    res.json({ response });
  } catch (err) {
    res.status(500).json({ response: "Bot failed to respond." });
  }
}; 