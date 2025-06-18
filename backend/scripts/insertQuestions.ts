import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// JSON'u manuel import edin - eğer import çalışmıyorsa
const questions = require("../questions/questions.json");

async function insertQuestions() {
  try {
    console.log("📊 Toplam soru sayısı:", questions.length);
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      console.log(`${i + 1}/${questions.length} - Soru ekleniyor: ${q.id}`);
      
      await pool.query(
        `INSERT INTO questions (
          id, domain_name, related_nist_category, nist_function, maturity_level,
          criticality, question_text, question_type, hint, expected_keywords,
          llm_scoring_instructions, followup_rules, situational,
          tags, task_template_id, referenced_by
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16
        ) ON CONFLICT (id) DO NOTHING`,
        [
          q.id,
          q.domain_name,
          q.related_nist_category,
          q.nist_function,
          q.maturity_level,
          q.criticality,
          q.question_text,
          q.question_type,
          q.hint || null,
          q.expected_keywords || [],
          q.llm_scoring_instructions || null,
          JSON.stringify(q.followup_rules || []),
          q.situational || false,
          q.tags || [],
          q.task_template_id || null,
          q.referenced_by || null,
        ]
      );
    }

    const result = await pool.query("SELECT current_database(), current_user");
    console.log("🧾 [insert] DB bağlantısı:", result.rows[0]);
    console.log("✅ All questions inserted successfully!");
  } catch (error) {
    console.error("❌ Error inserting questions:", error);
  } finally {
    await pool.end();
  }
}

insertQuestions();