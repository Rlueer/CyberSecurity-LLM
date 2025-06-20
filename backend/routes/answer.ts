import express from "express";
import { Pool } from "pg";
import { queryGemini } from "../src/services/gemini";
import dotenv from "dotenv";
import { createPromptWithQuestionContext, extractLlmResponse ,extractScore } from "./answerUtils"; 


dotenv.config();

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });


router.post("/answer", async (req, res) => {
  const { user_id, question_id, answer_text } = req.body;

  try {
    // ... (The part for getting the question from the DB remains the same)
    const qRes = await pool.query("SELECT * FROM questions WHERE id = $1", [question_id]);
    if (qRes.rows.length === 0) {
      res.status(404).json({ error: "Question not found" });
      return;
    }
    const question = qRes.rows[0];

    // 2. Prepare prompt and get structured response from LLM
    const prompt = createPromptWithQuestionContext(question, answer_text);
    const llmResult = await queryGemini(prompt);
    // Use the new parsing function
    const { score, comment, task } = extractLlmResponse(llmResult);

    console.log("🎯 Extracted Score:", score);
    console.log("💬 AI Comment:", comment);
    console.log("📝 AI Task:", task);


    // 3. Save the answer, score, and new fields to the database
    await pool.query(
      "INSERT INTO answers (user_id, question_id, answer_text, llm_score, ai_comment, ai_task) VALUES ($1, $2, $3, $4, $5, $6)",
      [user_id, question_id, answer_text, score, comment, task]
    );

    // ... (The followup_rules logic remains the same)
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


    // 5. Return the result including the new fields
    res.json({
      score,
      comment, // Add new field
      task,    // Add new field
      next_question_id,
      note
    });

  } catch (err) {
    console.error("❌ Answer error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});



export default router;
