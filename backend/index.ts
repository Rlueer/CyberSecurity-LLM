import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { queryGemini } from "./src/services/gemini";
import { createPromptWithQuestionContext, extractScore } from "./routes/answerUtils";

// ... (interface tanımları aynı)
interface FollowupRule {
  min_score: number;
  max_score: number;
  next_question_id: number | null;
  note?: string;
}

interface Question {
  id: number;
  question_text: string;
  followup_rules?: FollowupRule[];
}

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

pool.connect()
  .then(() => console.log("✅ Database connected"))
  .catch((err) => console.error("❌ Failed to connect to database", err));

app.use(cors());
app.use(express.json());

// ... (diğer endpoint'ler /ping, /db-check, /questions aynı)
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

app.post("/ask", async (req, res) => {
  console.log("🔥 /ask endpoint'ine istek geldi");
  
  // 1. Değişiklik: previous_question_id request body'sinden okunuyor.
  const { prompt, previous_question_id } = req.body;
  console.log("📦 Request body:", { prompt: prompt?.substring(0, 50) + '...', previous_question_id });

  const userId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'; // 🔐 Geçici kullanıcı

  try {
    // Eğer cevap verilecek bir önceki soru yoksa, bu ilk sorudur.
    if (!previous_question_id) {
      console.log("🆕 İlk soru getiriliyor...");
      const firstQuestionRes = await pool.query("SELECT * FROM questions ORDER BY id ASC LIMIT 1");
      
      if (firstQuestionRes.rows.length === 0) {
        res.status(404).json({ error: "Sistemde hiç soru bulunamadı." });
        return;
      }

      const firstQuestion = firstQuestionRes.rows[0];
      
      // İlk soruya henüz cevap verilmediği için sadece sorunun metnini döndür.
      res.json({
        result: "Lütfen bu soruya cevap vererek başlayın.",
        score: null,
        current_question_id: firstQuestion.id,
        current_question_text: firstQuestion.question_text,
        next_question_id: null,
        note: "Bu ilk soru."
      });
      return
    }

    // 2. Değişiklik: Artık en son cevabı değil, ID'si verilen soruyu çekiyoruz.
    const prevQuestionRes = await pool.query<Question>("SELECT * FROM questions WHERE id = $1", [previous_question_id]);

    if (prevQuestionRes.rows.length === 0) {
      res.status(404).json({ error: `Soru ID ${previous_question_id} bulunamadı.` });
    
      return;}
    
    const previousQuestion = prevQuestionRes.rows[0];
    console.log("✅ Cevaplanan soru:", previousQuestion.question_text?.substring(0, 50) + "...");
    
    // 3. Değişiklik: Skor, doğru sorunun metni ile kullanıcının cevabına göre hesaplanıyor.
    const enhancedPrompt = createPromptWithQuestionContext(previousQuestion, prompt);
    const response = await queryGemini(enhancedPrompt);
    const score = extractScore(response);
    console.log("🎯 Hesaplanan Skor:", score);

    // 4. Değişiklik: Cevap, doğru `question_id` ile veritabanına kaydediliyor.
    await pool.query(
      "INSERT INTO answers (user_id, question_id, answer_text, llm_score) VALUES ($1, $2, $3, $4)",
      [userId, previous_question_id, prompt, score]
    );
    console.log(`✅ Cevap (Soru ID: ${previous_question_id}) veritabanına kaydedildi.`);

    // 5. Değişiklik: Sıradaki soru, doğru sorunun kurallarına ve yeni skora göre belirleniyor.
    const followup = previousQuestion.followup_rules?.find((rule) =>
      score >= rule.min_score && score <= rule.max_score
    );

    const next_question_id = followup?.next_question_id || null;
    let next_question_text = null;

    if (next_question_id) {
        const nextQ = await pool.query("SELECT question_text FROM questions WHERE id = $1", [next_question_id]);
        if(nextQ.rows.length > 0) {
            next_question_text = nextQ.rows[0].question_text;
        }
    }
    
    res.json({
      result: response,
      score,
      answered_question_id: previous_question_id,
      next_question_id: next_question_id,
      next_question_text: next_question_text,
      note: followup?.note || (next_question_id === null ? "🎉 Değerlendirme tamamlandı!" : null)
    });

  } catch (err) {
    console.error("💥 Hata:", err);
    res.status(500).json({ error: "LLM isteği veya veritabanı işlemi sırasında bir hata oluştu." });
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});