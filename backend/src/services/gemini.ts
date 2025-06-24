/* import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';


dotenv.config();
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
export async function queryGemini(prompt: string): Promise<string> {
  console.log("[PROMPT GÖNDERİLDİ]:", prompt); // 🌟 burada loglanır

  const model = ai.getGenerativeModel({ model: "gemini-1.5-pro" }); // veya gemini-1.5-flash
  const result = await model.generateContent(prompt);
  const response = await result.response;

  const text = await response.text();
  console.log("[LLM'DEN GELEN CEVAP]:", text); // <--- BU
  return text;
  
}

*/ 
import { OpenAI } from "openai"; // Evet, Groq için de OpenAI paketini kullanıyoruz
import dotenv from 'dotenv';

dotenv.config();

// Groq istemcisini yapılandırıyoruz.
// OpenAI paketi kullanılıyor ancak baseURL ve apiKey Groq'a göre ayarlanıyor.
const groq = new OpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY, // .env dosyanızdaki Groq anahtarı
});

/**
 * Bu fonksiyon, adı "queryGemini" olmasına rağmen, artık Groq API'si üzerinde
 * çalışan açık kaynaklı bir LLM'e (Llama 3) istek gönderir.
 * Fonksiyon adı projenin geri kalanında değişiklik yapmamak için aynı tutulmuştur.
 * @param prompt Kullanıcının modele göndereceği metin.
 * @returns Modelin metin olarak cevabı.
 */
export async function queryGemini(prompt: string): Promise<string> {
  // Log mesajını hangi modelin kullanıldığını belirtmek için güncelledik
  console.log("[PROMPT GÖNDERİLDİ (Groq - Llama 3)]:", prompt);

  try {
    // Groq API'sine OpenAI uyumlu formatta istek gönderme
    const response = await groq.chat.completions.create({
      // DİKKAT: Model adını Groq'un desteklediği bir model ile değiştirdik.
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7, // Yaratıcılık seviyesi
    });

    // Gelen cevaptan metni ayıklama
    const text = response.choices[0].message.content;

    if (!text) {
      console.log("[Groq'DAN BOŞ CEVAP GELDİ]");
      return "";
    }

    console.log("[LLM'DEN GELEN CEVAP (Groq - Llama 3)]:", text);
    return text;

  } catch (error) {
    console.error("Groq API ile iletişimde hata oluştu:", error);
    return "Yapay zeka modeliyle iletişim kurulamadı. Lütfen tekrar deneyin.";
  }
}