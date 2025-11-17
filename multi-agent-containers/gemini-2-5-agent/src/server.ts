/**
 * Gemini 2.5 Pro Agent - Main Processing Service
 * Handles deep reasoning, research, reflection, and content generation
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 8093;

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const MODEL = 'gemini-2.5-pro';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request schemas
const ProcessRequestSchema = z.object({
  text: z.string(),
  action: z.string(),
  taskPlan: z.any().optional(),
  context: z.string().optional(),
});

const ResearchRequestSchema = z.object({
  topic: z.string(),
  context: z.string().optional(),
});

const ReflectRequestSchema = z.object({
  content: z.string(),
  question: z.string().optional(),
});

const RefineRequestSchema = z.object({
  content: z.string(),
  feedback: z.string().optional(),
});

/**
 * POST /process
 * Main processing pipeline: task → critique → research → reflect → conclude
 */
app.post('/process', async (req: Request, res: Response) => {
  try {
    const { text, action, taskPlan, context } = ProcessRequestSchema.parse(req.body);

    console.log(`[Gemini 2.5 Pro] Processing task for action: ${action}`);

    const prompt = `You are Gemini 2.5 Pro, the primary processing agent with deep reasoning capabilities.

**Action**: ${action}
**Task Plan**: ${JSON.stringify(taskPlan || 'No plan provided')}
**Context**: ${context || 'None'}

**Input to Process**:
${text}

**Your Processing Pipeline**:
1. **Critique**: Analyze the input thoroughly
2. **Chain of Thought**: Reason through the problem step-by-step
3. **Research**: Consider relevant information and approaches
4. **Reflect**: Evaluate your reasoning
5. **Conclude**: Generate the final output

**Configuration**:
${MODEL.includes('pro') ? '- Use deep thinking mode\n- Thinking budget: 32768 tokens' : '- Standard processing'}

Process this input through all pipeline stages and provide a comprehensive, high-quality result.`;

    const config = MODEL.includes('pro')
      ? { thinkingConfig: { thinkingBudget: 32768 } }
      : {};

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config,
    });

    console.log(`[Gemini 2.5 Pro] Processing complete`);

    res.json({
      success: true,
      result: response.text,
      model: MODEL,
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata?.totalTokenCount || 0,
      },
    });

  } catch (error: any) {
    console.error('[Gemini 2.5 Pro] Processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /research
 * Deep research on a topic
 */
app.post('/research', async (req: Request, res: Response) => {
  try {
    const { topic, context } = ResearchRequestSchema.parse(req.body);

    console.log(`[Gemini 2.5 Pro] Researching: ${topic.substring(0, 50)}...`);

    const prompt = `You are Gemini 2.5 Pro performing deep research.

**Research Topic**:
${topic}

**Context**: ${context || 'General research'}

**Your Task**:
1. Identify key aspects and questions
2. Explore different perspectives
3. Consider relevant information
4. Synthesize findings
5. Provide comprehensive insights

Conduct thorough research and provide detailed findings.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 32768 } },
    });

    console.log(`[Gemini 2.5 Pro] Research complete`);

    res.json({
      success: true,
      research: response.text,
      model: MODEL,
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata?.totalTokenCount || 0,
      },
    });

  } catch (error: any) {
    console.error('[Gemini 2.5 Pro] Research error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /reflect
 * Reflection and meta-cognition
 */
app.post('/reflect', async (req: Request, res: Response) => {
  try {
    const { content, question } = ReflectRequestSchema.parse(req.body);

    console.log(`[Gemini 2.5 Pro] Reflecting on content`);

    const prompt = `You are Gemini 2.5 Pro performing reflective analysis.

**Content to Reflect On**:
${content}

${question ? `**Reflection Question**: ${question}` : ''}

**Your Task**:
Engage in deep reflection:
1. What are the strengths and weaknesses?
2. What assumptions were made?
3. What alternative approaches exist?
4. How can this be improved?
5. What are the implications?

Provide thoughtful, meta-cognitive reflection.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 16384 } },
    });

    console.log(`[Gemini 2.5 Pro] Reflection complete`);

    res.json({
      success: true,
      reflection: response.text,
      model: MODEL,
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata?.totalTokenCount || 0,
      },
    });

  } catch (error: any) {
    console.error('[Gemini 2.5 Pro] Reflection error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /conclude
 * Generate final conclusion
 */
app.post('/conclude', async (req: Request, res: Response) => {
  try {
    const { content } = z.object({ content: z.string() }).parse(req.body);

    console.log(`[Gemini 2.5 Pro] Generating conclusion`);

    const prompt = `You are Gemini 2.5 Pro generating a final conclusion.

**All Processing So Far**:
${content}

**Your Task**:
Synthesize everything into a clear, comprehensive conclusion that:
1. Addresses the original goal
2. Incorporates all insights
3. Is well-structured and complete
4. Provides actionable value

Generate the final conclusion.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    console.log(`[Gemini 2.5 Pro] Conclusion generated`);

    res.json({
      success: true,
      conclusion: response.text,
      model: MODEL,
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata?.totalTokenCount || 0,
      },
    });

  } catch (error: any) {
    console.error('[Gemini 2.5 Pro] Conclusion error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /refine
 * Collaborative refinement based on feedback
 */
app.post('/refine', async (req: Request, res: Response) => {
  try {
    const { content, feedback } = RefineRequestSchema.parse(req.body);

    console.log(`[Gemini 2.5 Pro] Refining based on feedback`);

    const prompt = `You are Gemini 2.5 Pro performing collaborative refinement.

**Original Content**:
${content}

**Feedback Received**:
${feedback || 'No specific feedback, general improvement requested'}

**Your Task**:
Refine and improve the content based on the feedback:
1. Address all feedback points
2. Enhance clarity and quality
3. Fix any issues
4. Improve overall effectiveness

Provide the refined version.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 16384 } },
    });

    console.log(`[Gemini 2.5 Pro] Refinement complete`);

    res.json({
      success: true,
      refinedContent: response.text,
      model: MODEL,
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata?.totalTokenCount || 0,
      },
    });

  } catch (error: any) {
    console.error('[Gemini 2.5 Pro] Refinement error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    agent: 'gemini-2-5-pro',
    model: MODEL,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`[Gemini 2.5 Pro Agent] Running on port ${PORT}`);
  console.log(`[Gemini 2.5 Pro Agent] Model: ${MODEL}`);
  console.log(`[Gemini 2.5 Pro Agent] Ready for deep processing`);
});
