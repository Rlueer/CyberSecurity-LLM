import { Pool } from "pg";
import dotenv from "dotenv";
// questions.json dosyasını okumak için 'fs' modülünü ekliyoruz.
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// questions.json dosyasının tam yolunu belirliyoruz.
const questionsPath = path.join(__dirname, '../questions/questions.json');
// JSON dosyasını okuyup parse ediyoruz.
const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

/**
 * Bu betik, 'questions' tablosundaki tüm mevcut verileri siler
 * ve ardından questions.json dosyasındaki tüm soruları yeniden ekler.
 */
async function syncQuestions() {
  const client = await pool.connect(); // Havuzdan bir istemci alıyoruz.
  try {
    console.log("🚀 Veritabanı senkronizasyonu başlıyor...");

    // 1. Adım: Mevcut tüm verileri tablodan silmek.
    // TRUNCATE komutu, DELETE'e göre daha hızlıdır ve tabloyu sıfırlar.
    // RESTART IDENTITY, auto-increment olan ID'leri sıfırlar.
    // CASCADE, bu tabloya bağlı diğer tablolardaki ilişkili kayıtları da temizler.
    await client.query('TRUNCATE TABLE questions RESTART IDENTITY CASCADE;');
    console.log("✅ Tablo başarıyla temizlendi.");

    // 2. Adım: JSON dosyasındaki tüm soruları veritabanına eklemek.
    console.log(`📊 Toplam ${questions.length} soru veritabanına eklenecek.`);
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      console.log(`  -> Ekleniyor: Soru #${q.id} (${i + 1}/${questions.length})`);
      
      // Tablo boş olduğu için artık ON CONFLICT kontrolüne gerek yok.
      await client.query(
        `INSERT INTO questions (
          id, domain_name, related_nist_category, nist_function, maturity_level,
          criticality, question_text, question_type, hint, expected_keywords,
          llm_scoring_instructions, followup_rules, situational,
          tags, task_template_id, referenced_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )`,
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
          // JSON verilerini veritabanına string olarak kaydediyoruz.
          JSON.stringify(q.followup_rules || []),
          q.situational || false,
          q.tags || [],
          q.task_template_id || null,
          q.referenced_by || null,
        ]
      );
    }

    const result = await client.query("SELECT current_database(), current_user");
    console.log("🔍 DB bağlantı bilgisi:", result.rows[0]);
    console.log("🎉 Tüm sorular başarıyla veritabanına senkronize edildi!");

  } catch (error) {
    console.error("❌ Senkronizasyon sırasında bir hata oluştu:", error);
  } finally {
    // İstemciyi havuza geri bırakıyoruz.
    client.release();
    // Havuzdaki tüm bağlantıları kapatıyoruz.
    await pool.end();
    console.log("🚪 Veritabanı bağlantısı kapatıldı.");
  }
}

// Fonksiyonu çalıştır
syncQuestions();
