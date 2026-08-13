import { GoogleGenerativeAI } from "@google/generative-ai";

/* ---------- AI REVIEW FUNCTION ---------- */
export const getAIReview = async ({ content, message, ruleIssues, previousContent }) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const ruleIssuesSection =
      ruleIssues.length > 0
        ? `Rule violations found:\n${ruleIssues.join("\n")}`
        : "No rule violations found.";

    const previousContentSection = previousContent
      ? `Previous Code:\n${previousContent}`
      : "No previous version available. This is the first version of the file.";

    const prompt = `
You are a senior software engineer reviewing a pull request.

Your job is to COMPARE the previous code and the new code and evaluate whether the changes are valid, safe, and meaningful.

IMPORTANT INSTRUCTIONS:
- Do NOT review the new code in isolation
- Your summary MUST describe WHAT CHANGED between them.
- You MUST compare it with the previous code
- Do NOT describe the new code as "initial implementation" if previous code exists.
- Identify if functionality is removed, broken, or unrelated
- Detect regressions (loss of logic, simplification, or invalid replacement)
- If no previous code exists, review the new code on its own merit
- Focus on differences: additions, removals, improvements, or regressions.

Respond ONLY in this exact JSON format with no extra text or markdown backticks:

{
  "summary": "What changed from previous to new code in one sentence so Describe EXACTLY what changed from previous code to new code",
  "status": "good or bad",
  "issues": [
    {
      "type": "critical or warning or suggestion",
      "issue": "What is wrong in terms of the change",
      "why": "Why this change is problematic compared to previous code",
      "fix": "How to fix it"
    }
  ],
  "improvements": ["optional improvement 1", "optional improvement 2"],
  "commitMessageFeedback": "Feedback on the commit message quality"
}

Status Rules:
- status is "bad" ONLY if there are critical issues
- status is "good" if there are only warnings or suggestions
- If new code removes important logic → critical issue → status "bad"
- If new code is completely unrelated to previous → critical issue → status "bad"
- If new code improves existing logic → status "good"
- If new code is valid but has minor issues → status "good" with warnings

Code Quality Rules:
- Detect bad variable names
- Detect missing error handling
- Detect security vulnerabilities
- Detect inefficient code
- Detect poor structure

STRICT INSTRUCTION:
- Output ONLY valid JSON
- Do NOT include any explanation or text before or after JSON
- Do NOT use markdown

PR Details:
Commit Message: "${message}"
${ruleIssuesSection}

${previousContentSection}

New Code:
${content}
    `;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("No valid JSON found in AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    console.log("RAW AI RESPONSE:", rawText);

    /* ---------- STATUS BASED ON CRITICAL ISSUES ONLY ---------- */
    const hasCriticalIssues = (parsed.issues || []).some(
      (issue) => issue.type === "critical"
    );

    return {
      status: hasCriticalIssues ? "bad" : "good",
      summary: parsed.summary || "",
      issues: parsed.issues || [],
      improvements: parsed.improvements || [],
      commitMessageFeedback: parsed.commitMessageFeedback || ""
    };

  } catch (error) {
    console.error("AI Review failed:", error.message);

    // const hasCriticalRuleIssues = ruleIssues.length > 0;

    // return {
    //   status: hasCriticalRuleIssues ? "bad" : "good",
    //   summary: "AI review unavailable",
    //   issues: ruleIssues.map((issue) => ({
    //     type: "warning",
    //     issue,
    //     why: "Violates repository rule",
    //     fix: `Fix: ${issue}`
    //   })),
    //   improvements: [],
    //   commitMessageFeedback: ""
    // };
    throw error;
  }
};
