import { Pool } from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// JSON dosyasının yolu
const weightsPath = path.join(__dirname, '../questions/sector_weights.json');
const weights = JSON.parse(fs.readFileSync(weightsPath, 'utf-8'));

async function insertSectorWeights() {
  const client = await pool.connect();

  try {
    console.log("🚀 sector_domain_scores tablosu güncelleniyor...");

    await client.query('TRUNCATE TABLE sector_domain_scores RESTART IDENTITY CASCADE;');

    for (const sector of Object.keys(weights)) {
      const domainScores = weights[sector];
      for (const domain of Object.keys(domainScores)) {
        const score = domainScores[domain];

        await client.query(
          `INSERT INTO sector_domain_scores (sector, domain, score)
           VALUES ($1, $2, $3)`,
          [sector, domain, score]
        );

        console.log(`  ✔ ${sector} → ${domain}: ${score}`);
      }
    }

    console.log("🎉 Tüm skorlar başarıyla yüklendi!");
  } catch (error) {
    console.error("❌ Hata oluştu:", error);
  } finally {
    client.release();
    await pool.end();
    console.log("🚪 Veritabanı bağlantısı kapatıldı.");
  }
}

insertSectorWeights();
