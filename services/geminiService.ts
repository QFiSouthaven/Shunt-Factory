import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { ShuntAction, GeminiResponse, TokenUsage, ImplementationTask, PromptModuleKey } from '../types';
import { getPromptForAction, promptModules } from './prompts';

/**
 * A utility function that wraps an API call with a retry mechanism.
 * If the API call fails with a rate limit error (429), it will retry
 * the call with an exponential backoff delay.
 * @param apiCall The async function to call.
 * @returns The result of the API call.
 */
const withRetries = async <T>(apiCall: () => Promise<T>): Promise<T> => {
    const maxRetries = 3;
    let delay = 1000; // start with 1 second

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiCall();
        } catch (error: any) {
            const errorMessage = error.toString().toLowerCase();
            const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('resource_exhausted');
            
            if (isRateLimitError && i < maxRetries - 1) {
                console.warn(`Rate limit exceeded. Retrying in ${delay / 1000}s...`);
                await new Promise(res => setTimeout(res, delay));
                delay *= 2; // exponential backoff
            } else {
                throw error; // Re-throw if it's not a rate limit error or retries are exhausted
            }
        }
    }
    // This should not be reachable, but typescript needs a return path
    throw new Error("Exhausted retries for API call.");
};

const mapTokenUsage = (response: GenerateContentResponse, model: string): TokenUsage => {
    return {
        prompt_tokens: response.usageMetadata?.promptTokenCount ?? 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        total_tokens: response.usageMetadata?.totalTokenCount ?? 0,
        model: model,
    };
};

const callGeminiAPI = async (prompt: string, modelName: string, jsonResponseSchema?: any): Promise<GenerateContentResponse> => {
    return withRetries(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const config: any = {};
        if (jsonResponseSchema) {
            config.responseMimeType = "application/json";
            config.responseSchema = jsonResponseSchema;
        }

        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config
        });
        return response;
    });
};

export const performShunt = async (text: string, action: ShuntAction, model: string, context?: string, priority?: string): Promise<{ resultText: string; tokenUsage: TokenUsage }> => {
    const prompt = getPromptForAction(text, action, context, priority);
    const response = await callGeminiAPI(prompt, model);
    const resultText = response.text;
    const tokenUsage = mapTokenUsage(response, model);
    return { resultText, tokenUsage };
};

export const executeModularPrompt = async (text: string, modules: Set<PromptModuleKey>, context?: string, priority?: string): Promise<{ resultText: string; tokenUsage: TokenUsage }> => {
    let fullPrompt = promptModules.CORE.content;
    for (const key of modules) {
        if (promptModules[key]) {
            fullPrompt += `\n\n---\n\n${promptModules[key].content}`;
        }
    }
    if (context) {
        fullPrompt += `\n\n---\n\nReference Documents:\n${context}`;
    }
    
    if (priority) {
        fullPrompt += `\n\n---\n\n**Task Priority: ${priority}**\nThis priority level should guide the depth and speed of your response.`;
    }

    fullPrompt += `\n\n---\n\nUser Input:\n${text}`;
    
    const model = 'gemini-2.5-pro';
    const response = await callGeminiAPI(fullPrompt, model);
    const resultText = response.text;
    const tokenUsage = mapTokenUsage(response, model);
    return { resultText, tokenUsage };
};

export const generateDevelopmentPlan = async (goal: string, context: string): Promise<GeminiResponse> => {
    const prompt = `
**Goal:**
${goal}

**Project Context:**
---
${context}
---

Based on the goal and project context, generate a complete development plan.`;
    const model = 'gemini-2.5-pro';
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            clarifyingQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            architecturalProposal: { type: Type.STRING },
            implementationTasks: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        filePath: { type: Type.STRING },
                        description: { type: Type.STRING },
                        details: { type: Type.STRING },
                    },
                    required: ['filePath', 'description']
                }
            },
            testCases: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['implementationTasks']
    };
    const response = await callGeminiAPI(prompt, model, responseSchema);
    const parsedResponse = JSON.parse(response.text);
    const tokenUsage = mapTokenUsage(response, model);
    return { ...parsedResponse, tokenUsage };
};

export const analyzeImage = async (prompt: string, image: { base64Data: string; mimeType: string }): Promise<{ resultText: string; tokenUsage: TokenUsage }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-2.5-pro';
    const imagePart = {
        inlineData: {
            data: image.base64Data,
            mimeType: image.mimeType,
        },
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [textPart, imagePart] },
    });

    const resultText = response.text;
    const tokenUsage = mapTokenUsage(response, model);
    return { resultText, tokenUsage };
};

export const gradeOutput = async (output: string, prompt: string): Promise<{ score: number }> => {
    const gradingPrompt = `You are a prompt engineering expert. Below is an original prompt and the AI's output. Your task is to grade the output on a scale of -10 to +10 based on its quality, relevance, accuracy, and how well it fulfills the prompt's intent. Compare it to what real-world expert knowledge on the topic would be. Only return a JSON object with a single key "score".

PROMPT:
---
${prompt}
---

OUTPUT:
---
${output}
---
`;
    const model = 'gemini-2.5-flash';
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            score: { 
                type: Type.NUMBER,
                description: 'A grade from -10 to +10.'
            },
        },
        required: ['score']
    };
    const response = await callGeminiAPI(gradingPrompt, model, responseSchema);
    const parsed = JSON.parse(response.text);
    if (typeof parsed.score === 'number') {
        return { score: parsed.score };
    }
    throw new Error("AI response did not contain a valid score.");
};

export const generateOraculumInsights = async (eventsJson: string): Promise<string> => {
    const prompt = `You are a senior data analyst with deep expertise in product-market fit and user behavior for AI-powered developer tools. Your task is to analyze a raw stream of telemetry events from the "Aether Shunt" application and extract high-value, non-obvious business insights.

**Core Principles:**
- **Think like a strategist:** Don't just summarize. Connect the dots. What do these events *imply* about user intent, product value, and market trends?
- **Identify Economic Signals:** Focus on events that indicate monetization potential, churn risk, and power-user behavior.
- **Find Behavioral Patterns:** What workflows are users creating? Which features are most and least engaging? What predicts success or failure?
- **Be Actionable:** Frame your insights as concrete recommendations for the product, marketing, or sales teams.

**Raw Telemetry Event Stream (JSON):**
---
${eventsJson}
---

**Your Analysis (in Markdown):**

### 1. Executive Summary (The "So What?")
A single, high-impact paragraph summarizing the most critical insight from this data.

### 2. Key Insights & Observations
- **Insight 1:** [Describe a significant pattern or correlation. e.g., "Users who combine 'Build a Skill' with 'Format as JSON' are 3x more likely to become power users."]
  - **Supporting Data:** [Cite specific event types or data points.]
  - **Recommendation:** [Suggest a concrete action. e.g., "Create a tutorial or template that combines these two features to accelerate user activation."]
- **Insight 2:** [Describe another pattern, perhaps related to churn or feature abandonment.]
  - **Supporting Data:** [...]
  - **Recommendation:** [...]
- **Insight 3 (Non-Obvious):** [Present a counter-intuitive or unexpected finding.]
  - **Supporting Data:** [...]
  - **Recommendation:** [...]

### 3. Emerging Trends
Based on this snapshot, what new user behaviors or market opportunities might be emerging? What should the team watch closely?
`;
    const model = 'gemini-2.5-pro';
    const response = await callGeminiAPI(prompt, model);
    return response.text;
};

export const generateRawText = async (prompt: string, model: string): Promise<{ resultText: string; tokenUsage: TokenUsage }> => {
    const response = await callGeminiAPI(prompt, model);
    const resultText = response.text;
    const tokenUsage = mapTokenUsage(response, model);
    return { resultText, tokenUsage };
};

export const generateProjectTome = async (projectContext: string): Promise<{ resultText: string; tokenUsage: TokenUsage }> => {
    const prompt = `
You are a senior technical writer and software architect tasked with creating a comprehensive, book-like document about a software project. This "Project Tome" should be so detailed that a new developer could become an expert on the codebase just by reading it.

Analyze the entire project's source code provided below and generate a complete project guide in Markdown format.

**Your output MUST follow this structure precisely:**

# Project Tome: The Definitive Guide to [Infer Project Name]

## Chapter 1: Introduction & Vision
- **Project Purpose:** What problem does this application solve? Who is the target user?
- **Core Philosophy:** What are the guiding principles behind the project's design? (e.g., modularity, performance, user experience).

## Chapter 2: Architectural Deep-Dive
- **High-Level Overview:** Describe the main architectural pattern (e.g., component-based, context-driven state).
- **Technology Stack:** List all major frameworks, libraries, and tools used.
- **Folder & File Structure:** Explain the purpose of each top-level directory.
[INSERT_FILE_STRUCTURE_DIAGRAM]

## Chapter 3: Visual Component Hierarchy
- **Overview:** Explain how the main UI components are nested and interact.
- **Component Diagram:** A visual representation of the component tree.
[INSERT_COMPONENT_HIERARCHY_DIAGRAM]

## Chapter 4: Component Reference
For each major component (e.g., MissionControl, Shunt, Weaver, MiaAssistant, Chat, etc.), provide a detailed section:
- ### \`[ComponentName]\`
  - **Responsibility:** What is this component's primary role?
  - **State Management:** Describe its internal state (useState, useRef).
  - **Key Functions:** Detail its main functions and what they do.
  - **Interactions:** How does it connect to services, contexts, or child components?

## Chapter 5: State Management & Data Flow
- **Global State (Contexts):** Detail each React Context (SettingsContext, TelemetryContext, MiaContext, etc.). Explain what state it holds and its purpose.
- **Data Flow Example:** Choose a key user workflow (like performing a Shunt action) and describe the step-by-step data flow from user input to UI update.

## Chapter 6: Services & External APIs
- **Service Layer:** Describe the purpose of the \`services\` directory.
- For each service file (e.g., \`geminiService.ts\`, \`miaService.ts\`, \`telemetry.service.ts\`):
  - ### \`[ServiceName].ts\`
    - **Purpose:** What is its responsibility?
    - **Key Functions:** List and explain the primary functions it exports.
    - **API Interactions:** Detail calls made to external APIs (like Google's Gemini API).

## Chapter 7: Security & Utilities
- **Security Measures:** Explain the purpose of files like \`utils/security.ts\`.
- **Error Handling:** Describe the global error handling strategy (\`utils/errorLogger.ts\`).
- **Custom Hooks:** Detail any custom hooks used for reusable logic.

## Chapter 8: Conclusion
- **Summary:** Briefly summarize the project's current state.
- **Future Direction:** Suggest potential next steps or areas for improvement based on the current architecture.

---
**PROJECT SOURCE CODE:**
---
${projectContext}
---
`;
    const model = 'gemini-2.5-pro';
    const response = await callGeminiAPI(prompt, model);
    const resultText = response.text;
    const tokenUsage = mapTokenUsage(response, model);
    return { resultText, tokenUsage };
};