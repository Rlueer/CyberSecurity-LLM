import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { queryGemini } from "./src/services/gemini";
import { createPromptWithQuestionContext,extractLlmResponse, extractScore } from "./routes/answerUtils";
import sectorsRoute from './routes/sectors';
import PDFDocument from 'pdfkit';
import stream from 'stream';
dotenv.config();
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

const SECTORS = [
  "Small and Medium Enterprises (SMEs)",
  "Large Enterprises",
  "Finance and Insurance",
  "Healthcare and Pharmaceuticals",
  "Public Sector and Government",
  "Critical Infrastructure",
  "Energy and Utilities",
  "Transportation and Logistics",
  "Telecommunications",
  "Information Technology and Software",
  "Cloud and SaaS Providers",
  "Manufacturing and Industry",
  "Education and Research",
  "Retail and E-Commerce",
  "Construction and Real Estate",
  "Legal and Consulting Services",
  "Media and Entertainment",
  "Agriculture and Food",
  "Defense and Aerospace",
  "Non-Profit and NGOs"
];

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

// Mevcut app.post('/ask', ...) fonksiyonunuzu aşağıdakiyle tamamen değiştirin.

app.post("/ask", async (req, res) => {
  console.log("🔥 /ask endpoint'ine istek geldi");
  
  // DEĞİŞİKLİK: user_id'yi request body'sinden alıyoruz.
  const { prompt, previous_question_id, user_id, answer_id_to_edit } = req.body;
  console.log("📦 Request body:", { prompt: prompt?.substring(0, 50) + '...', previous_question_id, user_id, answer_id_to_edit });

  // Güvenlik kontrolü: user_id gelmemişse hata döndür.
  if (!user_id) {
    res.status(400).json({ error: 'user_id is required in the request body.' });
    return;
    }

  try {
    // SPECIAL CASE: Sector classification (Bu kısım aynı kalıyor)
    if (previous_question_id === 999) {
      const sectorPrompt = `
      Given a job or profession, match it to the most appropriate sector from the following list.
      Return only the exact sector name from the list, nothing else.

      Sectors:
      ${SECTORS.join(', ')}

      Job/Profession: ${prompt}
            `.trim();

      const llmResult = await queryGemini(sectorPrompt);
      console.log("[SECTOR LLM RAW RESPONSE]:", llmResult);

      const found = SECTORS.find(s => llmResult.toLowerCase().includes(s.toLowerCase()));
      if (found) {
        res.json({ comment: found, score: 100, task: "" });
        return;
      } else {
        res.json({ comment: "Could not match to a sector.", score: 0, task: "" });
        return
      }
    }
    
    // ... (Soru bulma mantığı aynı)
    const prevQuestionRes = await pool.query<Question>("SELECT * FROM questions WHERE id = $1", [previous_question_id]);
    if (prevQuestionRes.rows.length === 0) {
      res.status(404).json({ error: `Soru ID ${previous_question_id} bulunamadı.` });
      return;
    }
    const previousQuestion = prevQuestionRes.rows[0];
    console.log("✅ Cevaplanan soru:", previousQuestion.question_text?.substring(0, 50) + "...");
    
    // ... (LLM'den cevap alma mantığı aynı)
    const enhancedPrompt = createPromptWithQuestionContext(previousQuestion, prompt);
    const response = await queryGemini(enhancedPrompt);
    const { score, comment, task } = extractLlmResponse(response);
    
    console.log("🎯 Hesaplanan Skor:", score);

    // --- VERİTABANI MANTIĞI ---
    let db_answer_id = answer_id_to_edit;

    if (answer_id_to_edit) {
      // ✅ EDIT MODU:
      console.log(`🔄 Cevap güncelleniyor, DB ID: ${answer_id_to_edit}`);
      await pool.query(
        "UPDATE answers SET answer_text = $1, llm_score = $2, ai_comment = $3, ai_task = $4 WHERE id = $5",
        [prompt, score, comment, task, answer_id_to_edit]
      );
    } else {
      // ✅ YENİ KAYIT MODU:
      console.log(`✍️ Yeni cevap kaydediliyor, Soru ID: ${previous_question_id}, User ID: ${user_id}`);
      const insertRes = await pool.query(
        // DEĞİŞİKLİK: Sabit userId yerine frontend'den gelen user_id kullanılıyor.
        "INSERT INTO answers (user_id, question_id, answer_text, llm_score, ai_comment, ai_task) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [user_id, previous_question_id, prompt, score, comment, task]
      );
      db_answer_id = insertRes.rows[0].id;
    }

    // ... (Geri kalan dallanma ve response mantığı aynı kalıyor)
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
    
    res.json({
      db_answer_id,
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

app.get('/report/pdf', async (req, res) => {
  const userId = req.query.user_id as string;
  if (!userId) {
    res.status(400).json({ error: 'user_id is required' });
    return ;
  }
  try {
    // Fetch all answers for the user, join with questions for context
    const answersRes = await pool.query(
      `SELECT a.*, q.question_text, q.domain_name
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       WHERE a.user_id = $1
       ORDER BY a.question_id ASC`,
      [userId]
    );
    const answers = answersRes.rows;
    if (!answers.length) {
      res.status(404).json({ error: 'No answers found for this user.' });
      return ;
    }
    // Create PDF
    const doc = new PDFDocument({ margin: 40 });
    const passThrough = new stream.PassThrough();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="assessment-report-${userId}.pdf"`);
    doc.pipe(passThrough);
    // Title
    doc.fontSize(20).fillColor('#2563eb').text('CyberSecurity Maturity Assessment Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).fillColor('black').text(`User: ${userId}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    answers.forEach((a, idx) => {
      doc.fontSize(14).fillColor('#1e293b').text(`Q${idx + 1}: ${a.question_text}`);
      doc.fontSize(12).fillColor('black').text(`Domain: ${a.domain_name}`);
      doc.text(`Answer: ${a.answer_text}`);
      doc.text(`Score: ${a.llm_score}`);
      doc.text(`AI Comment: ${a.ai_comment}`);
      doc.text(`AI Task: ${a.ai_task}`);
      doc.moveDown();
      doc.moveDown(0.5);
    });
    doc.end();
    passThrough.on('end', () => console.log('PDF sent.'));
    passThrough.on('error', (err) => console.error('PDF stream error:', err));
    passThrough.pipe(res);
  } catch (err) {
    console.error('PDF report error:', err);
    res.status(500).json({ error: 'Failed to generate PDF report.' });
  }
});

app.use('/sectors', sectorsRoute);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});