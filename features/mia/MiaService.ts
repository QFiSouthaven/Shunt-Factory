// features/mia/MiaService.ts
/**
 * Mia Service - Backend API Version
 * All AI calls go through the secure backend (API key not exposed in browser)
 */

import { GeminiResponse, TokenUsage } from '../../types';
import { logFrontendError, ErrorSeverity } from "../../utils/errorLogger";
import { generateContentViaBackend } from '../../services/backendApiService';
import { withRetries } from '../../services/apiUtils';

export const getMiaChatResponse = async (history: { role: string, parts: { text: string }[] }[], newMessage: string): Promise<string> => {
    // Note: Chat with history requires backend chat endpoint
    // For now, we'll use a simple prompt-based approach
    const conversationContext = history.map(h =>
        `${h.role === 'user' ? 'User' : 'Mia'}: ${h.parts.map(p => p.text).join(' ')}`
    ).join('\n');

    const prompt = `You are Mia, a friendly and highly intelligent AI assistant embedded in a complex web application for developers. Be helpful and concise. Your primary role is to assist the user with understanding and operating the application.

Previous conversation:
${conversationContext}

User: ${newMessage}

Mia:`;

    try {
        const apiCall = async () => {
            const result = await generateContentViaBackend(prompt, 'gemini-2.5-flash');
            return result.resultText;
        };
        return await withRetries(apiCall);
    } catch (error) {
        logFrontendError(error, ErrorSeverity.High, { context: 'getMiaChatResponse Backend API call' });
        throw new Error('Failed to get a chat response from Mia.');
    }
};

export const getMiaErrorAnalysis = async (errorLog: Record<string, any>): Promise<string> => {
    const prompt = `You are an expert software engineer and helpful AI assistant named Mia. You are embedded within a web application. Your task is to analyze the following error report that was just captured from the application. Your analysis should be clear, concise, and helpful to the developer using the application. Structure your response in Markdown.

1.  **Explain the Error:** In simple terms, what does this error mean?
2.  **Identify the Likely Cause:** Based on the stack trace and provided context, what is the most probable reason for this error? Point to specific files or components if possible.
3.  **Suggest a Solution:** Provide concrete, actionable steps the developer can take to fix the issue. If possible, suggest specific code changes.

Here is the error report:
---
${JSON.stringify(errorLog, null, 2)}
---`;
    try {
        const apiCall = async () => {
            const result = await generateContentViaBackend(prompt, 'gemini-2.5-flash');
            return result.resultText;
        };
        return await withRetries(apiCall);
    } catch (error) {
        logFrontendError(error, ErrorSeverity.Critical, { context: 'getMiaErrorAnalysis Backend API call' });
        throw new Error('Failed to get error analysis from Mia.');
    }
};

export const generateCodeFixPlan = async (errorLog: Record<string, any>, projectContext: string): Promise<GeminiResponse> => {
  const prompt = `
You are an expert software engineer AI named Mia. Your task is to fix a bug in the application you are embedded in.

Analyze the following error report and the general project context. Your goal is to generate a complete, production-quality code fix.

**Error Report:**
---
${JSON.stringify(errorLog, null, 2)}
---

**Project Context:**
---
${projectContext}
---

**Instructions:**
1.  **Analyze:** Determine the root cause of the error.
2.  **Formulate a Fix:** Create a plan to fix the error. This plan will consist of modifying one or more files.
3.  **Generate Full File Content:** For each file that needs to be modified, you **MUST** provide the **ENTIRE, NEW, and COMPLETE file content** in the 'newContent' field of your response. Do not provide diffs, partial code, or explanations in the 'newContent' field. It must be only the raw code for the complete file.
4.  **Be Precise:** Ensure the file paths are correct and the generated code is syntactically valid and follows the project's conventions.
5.  **Output:** Return your response according to the provided JSON schema. You are not required to provide clarifying questions, an architectural proposal, or test cases for this task. Return empty arrays for those fields.
`;

  try {
    const apiCall = async () => {
        const result = await generateContentViaBackend(prompt, 'gemini-2.5-pro', {
            responseMimeType: "application/json",
        });

        const parsedResponse = JSON.parse(result.resultText);

        return {
            clarifyingQuestions: parsedResponse.clarifyingQuestions || [],
            architecturalProposal: parsedResponse.architecturalProposal || '',
            implementationTasks: parsedResponse.implementationTasks || [],
            testCases: parsedResponse.testCases || [],
            dataSchema: parsedResponse.dataSchema || '',
            tokenUsage: result.tokenUsage,
        };
    };
    return await withRetries(apiCall);
  } catch (error) {
    logFrontendError(error, ErrorSeverity.Critical, { context: 'generateCodeFixPlan Backend API call' });
    throw new Error('Failed to generate the code fix. The AI may have returned an invalid response or malformed JSON.');
  }
};
