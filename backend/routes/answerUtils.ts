// routes/answerUtils.ts
// routes/answerUtils.ts

export function createPromptWithQuestionContext(question: any, answer_text: string): string {
  // The core of the prompt remains the same, but the instructions at the end are changed.
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

    Based on the user's answer, provide a response in a strict JSON format. The JSON object must contain three keys:
    1.  "score": An integer score from 0 to 100.
    2.  "comment": A brief, one-sentence explanation for the score given.
    3.  "task": A concrete, actionable task for the user to improve their maturity in this area.

    Return ONLY the JSON object.
    `.trim();
}

// This function is removed as it's being replaced.
// export function extractScore(llmText: string): number { ... }

// New function to parse the entire JSON response from the LLM
export function extractLlmResponse(llmText: string): { score: number; comment: string; task: string } {
  try {
    // Find the JSON object within the LLM's response
    const jsonMatch = llmText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON object found in LLM response:", llmText);
      return { score: 0, comment: "Error: Could not parse AI response.", task: "No task generated." };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const score = Math.min(100, Math.max(0, parseInt(parsed.score, 10) || 0));
    const comment = parsed.comment || "No comment provided.";
    const task = parsed.task || "No task generated.";

    return { score, comment, task };

  } catch (error) {
    console.error("Failed to parse LLM response as JSON:", error);
    // Fallback if JSON is malformed
    const scoreMatch = llmText.match(/\d+/);
    const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[0], 10))) : 0;
    
    return {
      score,
      comment: "AI response was not in the correct format, but a score was extracted.",
      task: "Could not generate a task due to a response format error."
    };
  }
}
export function extractScore(llmText: string): number {
  const match = llmText.match(/\d+/);
  return match ? Math.min(100, Math.max(0, parseInt(match[0], 10))) : 0;
}
