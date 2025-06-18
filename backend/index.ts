import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { queryGemini } from "./src/services/gemini";
import { createPromptWithQuestionContext, extractScore } from "./routes/answerUtils";


dotenv.config();


const app = express();
const port = 3001;

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  connectionString: process.env.DATABASE_URL,
});

console.log("[DEBUG] GEMINI_API_KEY:", process.env.GEMINI_API_KEY);

pool.connect()
  .then(() => console.log("✅ Database connected"))
  .catch((err) => console.error("❌ Failed to connect to database", err));


app.use(cors());
app.use(express.json());

app.get('/ping', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Database connected!', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: 'Failed to connect to database', details: err });
  }
});

app.get('/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err });
  }
});

app.get("/questions", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM questions ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

app.listen(3001, () => {
  console.log('Server is running on http://localhost:3001');
});



app.post("/ask", async (req, res) => {
  console.log("🔥 /ask endpoint'ine istek geldi");
  console.log("📦 Request body:", req.body);
  
  const { prompt } = req.body;
  console.log("📝 Kullanıcının girdiği prompt:", prompt);
  
  try {
    // 1. İlk soruyu veritabanından al
    console.log("🔍 İlk soruyu getiriliyor...");
    const qRes = await pool.query("SELECT * FROM questions ORDER BY id ASC LIMIT 1");
    console.log("📊 Database sonucu:", qRes.rows.length, "adet sonuç");
    
    if (qRes.rows.length === 0) {
      console.log("❌ Soru bulunamadı!");
      res.status(404).json({ error: "No questions found in database" });
      return;
    }
    
    const question = qRes.rows[0];
    console.log("✅ İlk soru bulundu:", question.question_text?.substring(0, 50) + "...");

    // 2. Kullanıcının girdiği prompt ile soru bilgilerini birleştir
    console.log("🔧 Geliştirilmiş prompt oluşturuluyor...");
    const enhancedPrompt = createPromptWithQuestionContext(question, prompt);
    console.log("📝 Oluşturulan prompt (ilk 200 karakter):", enhancedPrompt.substring(0, 200) + "...");
    
    console.log("🚀 queryGemini çağrılıyor...");
    const response = await queryGemini(enhancedPrompt);
    console.log("✅ Gemini'den cevap geldi:", response?.substring(0, 100) + "...");
    
    const score = extractScore(response);
    console.log("🎯 Çıkarılan skor:", score);

    // 3. Cevabı answers tablosuna kaydet (UUID kullanarak)
    console.log("💾 Cevap answers tablosuna kaydediliyor...");
    await pool.query(
      "INSERT INTO answers (user_id, question_id, answer_text, llm_score) VALUES ($1, $2, $3, $4)",
      [
        'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', // Geçici UUID - ileride dinamik olacak
        question.id, 
        prompt, 
        score
      ]
    );
    console.log("✅ Cevap başarıyla kaydedildi!");

    res.json({ 
      result: response, 
      score: score,
      question_used: question.question_text,
      question_id: question.id
    });
  } catch (err) {
    console.error("💥 Hata detayları:", err);
    res.status(500).json({ error: "LLM request failed" });
  }
});
