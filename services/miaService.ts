// services/miaService.ts
/**
 * Mia Service - Backend API Version
 * All AI calls go through the secure backend
 */

import { GeminiResponse, TokenUsage, ImplementationTask } from '../types';
import { logFrontendError, ErrorSeverity } from "../utils/errorLogger";
import { withRetries } from './apiUtils';
import { executeCode } from './codeExecutor';
import { generateContentViaBackend } from './backendApiService';

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
            const result = await generateContentViaBackend(prompt, 'gemini-2.5-pro');
            return result.resultText;
        };
        return await withRetries(apiCall);
    } catch (error) {
        logFrontendError(error, ErrorSeverity.High, { context: 'getMiaChatResponse Backend API call' });
        throw error;
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
            const result = await generateContentViaBackend(prompt, 'gemini-2.5-pro');
            return result.resultText;
        };
        return await withRetries(apiCall);
    } catch (error) {
        logFrontendError(error, ErrorSeverity.Critical, { context: 'getMiaErrorAnalysis Backend API call' });
        throw error;
    }
};

export const generateCodeFixPlan = async (errorLog: Record<string, any>, projectContext: string): Promise<GeminiResponse> => {
  const prompt = `
You are the **Host Agent**, a master orchestrator AI powered by Gemini. Your purpose is to resolve a critical error within the web application by assembling and directing a team of specialist sub-agents. You must use your advanced reasoning and extended thinking capabilities to synthesize their findings into a single, flawless implementation plan.

**Your Sub-Agent Team:**

1.  **React Sub-Agent:** An expert in the React 19 ecosystem. It analyzes component lifecycle, state management (Hooks), props, JSX, and event handling.
2.  **TypeScript Sub-Agent:** A specialist in static typing. It scrutinizes type definitions, interfaces, Zod schemas, and potential type mismatches.
3.  **DevOps Sub-Agent:** A systems expert. It reviews build configurations, dependencies (package.json), environment variables, and backend API contracts.

**Your Mission:**

Given the following error report and project context, you must perform a collaborative diagnosis and generate a complete, production-quality code fix.

**Execution Protocol:**

1.  **Internal Monologue (Simulated):**
    *   **Host Analysis:** Briefly state your initial assessment of the error.
    *   **Delegate & Synthesize:** For each sub-agent, simulate their analysis process. Write down what each agent would look for and what conclusions they would draw based on the provided error and context.
    *   **Final Strategy:** Based on the synthesized findings from your agents, formulate the definitive root cause and the precise strategy for the fix.

2.  **Generate Implementation Plan:**
    *   Translate your final strategy into a series of \`implementationTasks\`.
    *   For each file that needs modification, you **MUST** provide the **ENTIRE, NEW, and COMPLETE file content** in the 'newContent' field.
    *   Do not provide diffs, partial code, or explanations in the 'newContent' field. It must be only the raw code for the complete file.
    *   Ensure file paths are correct and the generated code is syntactically perfect.

3.  **Output:**
    *   Return your response strictly according to the JSON schema.
    *   You are not required to provide clarifying questions, an architectural proposal, or test cases. Return empty arrays or empty strings for those fields.

---
**Error Report:**
${JSON.stringify(errorLog, null, 2)}

---
**Project Context (Codebase):**
${projectContext}
---
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
    throw error;
  }
};

// TRUST ARCHITECTURE: LLM-judge self-correction loop
export const executeAndSelfCorrect = async (
    task: ImplementationTask,
    projectContext: string,
    maxAttempts: number = 3
): Promise<{ success: boolean; result: string; attempts: number }> => {
    let attempts = 0;
    let lastResult = '';
    let currentCode = task.newContent || '';

    while (attempts < maxAttempts) {
        attempts++;

        // Execute the code - assuming JavaScript/TypeScript
        try {
            lastResult = await executeCode('javascript', currentCode);
            // If no error was thrown, execution succeeded
            if (!lastResult.toLowerCase().includes('error')) {
                return { success: true, result: lastResult, attempts };
            }
        } catch (error) {
            lastResult = error instanceof Error ? error.message : String(error);
        }

        // If execution failed, use LLM to self-correct
        const correctionPrompt = `
You are an expert code debugger. The following code failed to execute with an error.

**Original Code:**
\`\`\`
${currentCode}
\`\`\`

**Error Output:**
\`\`\`
${lastResult}
\`\`\`

**Task Description:**
${task.description}

Please provide the corrected, complete code that fixes this error. Return ONLY the corrected code, nothing else.
`;

        try {
            const result = await generateContentViaBackend(correctionPrompt, 'gemini-2.5-pro');
            currentCode = result.resultText.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim();
        } catch (error) {
            logFrontendError(error, ErrorSeverity.High, { context: 'executeAndSelfCorrect correction attempt' });
            break;
        }
    }

    return { success: false, result: lastResult, attempts };
};
