import express from "express";
import { queryGemini } from "../src/services/gemini";

const router = express.Router();

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

function createSectorPrompt(job: string) {
  return `Match the following job/profession description to the most appropriate sector from the given list:

SECTORS:
${SECTORS.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Job/Profession: ${job}

Return only the exact name of the sector.`;
}

router.post("/classify", async (req, res) => {
  const { job } = req.body;
  if (!job || typeof job !== "string") {
    res.status(400).json({ error: "Job is required" });
    return;
  }
  try {
    const prompt = createSectorPrompt(job);
    console.log("[SECTOR PROMPT]", prompt);
    const llmResult = await queryGemini(prompt);
    console.log("[SECTOR LLM RESPONSE]", llmResult);
    // Find the best match in SECTORS (case-insensitive, allow partial match)
    const found = SECTORS.find(s => llmResult.toLowerCase().includes(s.toLowerCase()));
    const sector = found || "Education and Research";
    res.json({ sector });
  } catch (err) {
    console.error("[SECTOR CLASSIFY ERROR]", err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;