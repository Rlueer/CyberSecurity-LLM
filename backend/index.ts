import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { queryGemini } from "./src/services/gemini";
import { createPromptWithQuestionContext,extractLlmResponse, extractScore } from "./routes/answerUtils";

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

// Mevcut app.post('/ask', ...) fonksiyonunuzu aşağıdakiyle tamamen değiştirin.

app.post("/ask", async (req, res) => {
  console.log("🔥 /ask endpoint'ine istek geldi");
  
  // YENİ: answer_id_to_edit alanı request body'sinden okunuyor.
  const { prompt, previous_question_id, answer_id_to_edit } = req.body;
  console.log("📦 Request body:", { prompt: prompt?.substring(0, 50) + '...', previous_question_id, answer_id_to_edit });

  const userId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'; // 🔐 Geçici kullanıcı

  try {
    // İlk soru mantığı aynı kalıyor, dokunmuyoruz.
    if (!previous_question_id) {
      // ... (Bu kısım aynı)
      return;
    }

    const prevQuestionRes = await pool.query<Question>("SELECT * FROM questions WHERE id = $1", [previous_question_id]);
    if (prevQuestionRes.rows.length === 0) {
      res.status(404).json({ error: `Soru ID ${previous_question_id} bulunamadı.` });
      return;
    }
    const previousQuestion = prevQuestionRes.rows[0];
    console.log("✅ Cevaplanan soru:", previousQuestion.question_text?.substring(0, 50) + "...");
    
    // LLM'den skor, yorum ve görev bilgilerini al
    const enhancedPrompt = createPromptWithQuestionContext(previousQuestion, prompt);
    const response = await queryGemini(enhancedPrompt);
    const { score, comment, task } = extractLlmResponse(response);
    
    console.log("🎯 Hesaplanan Skor:", score);

    // --- GÜNCELLENEN VERİTABANI MANTIĞI ---
    
    let db_answer_id = answer_id_to_edit;

    if (answer_id_to_edit) {
      // ✅ EDIT MODU: Eğer answer_id_to_edit varsa, mevcut cevabı GÜNCELLE.
      console.log(`🔄 Cevap güncelleniyor, DB ID: ${answer_id_to_edit}`);
      await pool.query(
        "UPDATE answers SET answer_text = $1, llm_score = $2, ai_comment = $3, ai_task = $4 WHERE id = $5",
        [prompt, score, comment, task, answer_id_to_edit]
      );
    } else {
      // ✅ YENİ KAYIT MODU: Eğer answer_id_to_edit yoksa, yeni cevap OLUŞTUR.
      console.log(`✍️ Yeni cevap kaydediliyor, Soru ID: ${previous_question_id}`);
      // GÜNCELLEME: "RETURNING id" ile yeni oluşturulan cevabın ID'sini geri alıyoruz.
      const insertRes = await pool.query(
        "INSERT INTO answers (user_id, question_id, answer_text, llm_score, ai_comment, ai_task) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [userId, previous_question_id, prompt, score, comment, task]
      );
      // Frontend'e göndermek için yeni ID'yi değişkene ata
      db_answer_id = insertRes.rows[0].id;
    }

    // --- VERİTABANI MANTIĞI SONU ---

    // Dallanma kurallarına göre bir sonraki soruyu belirle
    const followup = previousQuestion.followup_rules?.find((rule) =>
      score >= rule.min_score && score <= rule.max_score
    );
    const next_question_id = followup?.next_question_id || null;
    let next_question_text = null;
    if (next_question_id) {
        const nextQ = await pool.query("SELECT question_text FROM questions WHERE id = $1", [next_question_id]);
        if (nextQ.rows.length > 0) {
            next_question_text = nextQ.rows[0].question_text;
        }
    }
    
    // Dönen JSON yanıtı GÜNCELLENDİ: Frontend'in edit işlemi için ihtiyacı olan `db_answer_id` ekleniyor.
    res.json({
      db_answer_id, // YENİ: Frontend'e cevabın veritabanı ID'sini gönderiyoruz.
      score,
      comment,
      task,
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