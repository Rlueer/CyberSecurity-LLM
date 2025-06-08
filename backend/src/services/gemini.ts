import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';


dotenv.config();
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
export async function queryGemini(prompt: string): Promise<string> {
  console.log("[PROMPT GÖNDERİLDİ]:", prompt); // 🌟 burada loglanır

  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" }); // veya gemini-1.5-flash
  const result = await model.generateContent(prompt);
  const response = await result.response;

  const text = await response.text();
  console.log("[LLM'DEN GELEN CEVAP]:", text); // <--- BU
  return text;
  
}
