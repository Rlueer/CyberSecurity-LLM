// routes/answerUtils.ts

export function createPromptWithQuestionContext(question: any, answer_text: string): string {
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

export function extractScore(llmText: string): number {
  const match = llmText.match(/\d+/);
  return match ? Math.min(100, Math.max(0, parseInt(match[0], 10))) : 0;
}
