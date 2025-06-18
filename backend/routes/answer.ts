import express from "express";
import { Pool } from "pg";
import { queryGemini } from "../src/services/gemini";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.post("/answer", async (req, res) => {
  const { user_id, question_id, answer_text } = req.body;

  try {
    // 1. Soru bilgilerini al
    const qRes = await pool.query("SELECT * FROM questions WHERE id = $1", [question_id]);
    if (qRes.rows.length === 0) {
      res.status(404).json({ error: "Question not found" });
      return; // Sadece return, response dönmeyin
    }

    const question = qRes.rows[0];

    // 2. LLM'e prompt hazırla ve gönder
    const prompt = createPromptWithQuestionContext(question, answer_text);
    const llmResult = await queryGemini(prompt);
    const score = extractScore(llmResult);

    console.log("🎯 Extracted Score:", score);

    // 3. Cevabı veritabanına kaydet
    await pool.query(
      "INSERT INTO answers (user_id, question_id, answer_text, llm_score) VALUES ($1, $2, $3, $4)",
      [user_id, question_id, answer_text, score]
    );

    // 4. followup_rules kontrolü
    let next_question_id = null;
    let note = null;

    if (Array.isArray(question.followup_rules)) {
      const matchedRule = question.followup_rules.find(
        (rule: any) => score >= rule.min_score && score <= rule.max_score
      );
      if (matchedRule) {
        next_question_id = matchedRule.next_question_id;
        note = matchedRule.note;
      }
    }

    // 5. Sonuç dön
    res.json({
      score,
      next_question_id,
      note
    });

  } catch (err) {
    console.error("❌ Answer error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// Prompt şablonu oluşturur
function createPromptWithQuestionContext(question: any, answer_text: string): string {
  return `
You are a cybersecurity auditor scoring organizational maturity.

Question Domain: ${question.domain_name}
NIST Function: ${question.nist_function}
Related NIST Category: ${question.related_nist_category}
ISO/IEC 27001 Controls: ${question.iso27001_controls?.join(", ")}
Criticality Level: ${question.criticality}
Maturity Level: ${question.maturity_level}

Question:
${question.question_text}

Hint:
${question.hint}

Expected Keywords:
${question.expected_keywords?.join(", ")}

Instructions for Scoring:
${question.llm_scoring_instructions}

User's Answer:
${answer_text}

Return only a score from 0 to 100.
`.trim();
}

// LLM cevabından ilk sayıyı al
function extractScore(llmText: string): number {
  const match = llmText.match(/\d+/);
  return match ? Math.min(100, Math.max(0, parseInt(match[0], 10))) : 0;
}

export default router;
