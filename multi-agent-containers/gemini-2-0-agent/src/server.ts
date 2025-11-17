/**
 * Gemini 2.0 Agent - Task Orchestration & Delegation Service
 * Handles high-level task orchestration and peer review coordination
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 8092;

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const MODEL = 'gemini-2.0-flash-exp';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request schemas
const DelegateRequestSchema = z.object({
  text: z.string(),
  action: z.string(),
  context: z.string().optional(),
});

const OrchestrateRequestSchema = z.object({
  text: z.string(),
  action: z.string(),
  workflowType: z.enum(['simple', 'collaborative', 'research']),
});

const PeerReviewRequestSchema = z.object({
  text: z.string(),
  action: z.string(),
});

/**
 * POST /delegate
 * Delegate and break down tasks
 */
app.post('/delegate', async (req: Request, res: Response) => {
  try {
    const { text, action, context } = DelegateRequestSchema.parse(req.body);

    console.log(`[Gemini 2.0] Delegating task for action: ${action}`);

    const prompt = `You are Gemini 2.0, the orchestrator AI. Your role is to analyze user input and create an actionable task plan.

**Action**: ${action}
**Context**: ${context || 'None provided'}

**User Input**:
${text}

**Your Task**:
1. Analyze the input and action type
2. Break down into clear, specific sub-tasks if needed
3. Determine the best approach
4. Create a detailed task plan

**Response Format** (JSON):
\`\`\`json
{
  "taskPlan": {
    "mainGoal": "Clear description of the main objective",
    "approach": "Strategy to accomplish the goal",
    "subTasks": [
      {"step": 1, "description": "First step", "assignedTo": "gemini-2-5"},
      {"step": 2, "description": "Second step", "assignedTo": "gemini-2-5"}
    ],
    "validationCriteria": ["What makes this task successful"],
    "estimatedComplexity": "low|medium|high"
  }
}
\`\`\``;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    const responseText = response.text;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);

    let taskPlan;
    if (jsonMatch) {
      taskPlan = JSON.parse(jsonMatch[1]);
    } else {
      // Fallback
      taskPlan = {
        taskPlan: {
          mainGoal: responseText,
          approach: 'Direct processing',
          subTasks: [{ step: 1, description: 'Process input', assignedTo: 'gemini-2-5' }],
          validationCriteria: ['Output meets requirements'],
          estimatedComplexity: 'medium',
        },
      };
    }

    console.log(`[Gemini 2.0] Task delegation complete`);

    res.json({
      success: true,
      ...taskPlan,
      model: MODEL,
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata?.totalTokenCount || 0,
      },
    });

  } catch (error: any) {
    console.error('[Gemini 2.0] Delegation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /orchestrate
 * High-level workflow orchestration
 */
app.post('/orchestrate', async (req: Request, res: Response) => {
  try {
    const { text, action, workflowType } = OrchestrateRequestSchema.parse(req.body);

    console.log(`[Gemini 2.0] Orchestrating ${workflowType} workflow for: ${action}`);

    const prompt = `You are Gemini 2.0, orchestrating a ${workflowType} workflow.

**Action**: ${action}
**Workflow Type**: ${workflowType}

**Input**:
${text}

**Your Task**:
Determine the optimal execution path and coordination strategy for this workflow.

Provide:
1. Workflow steps in order
2. Which agents should be involved
3. Communication protocol between agents
4. Success criteria`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    console.log(`[Gemini 2.0] Orchestration plan complete`);

    res.json({
      success: true,
      orchestrationPlan: response.text,
      model: MODEL,
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata?.totalTokenCount || 0,
      },
    });

  } catch (error: any) {
    console.error('[Gemini 2.0] Orchestration error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /peer-review
 * High-level peer review
 */
app.post('/peer-review', async (req: Request, res: Response) => {
  try {
    const { text, action } = PeerReviewRequestSchema.parse(req.body);

    console.log(`[Gemini 2.0] Peer reviewing for action: ${action}`);

    const prompt = `You are Gemini 2.0, performing high-level peer review.

**Action**: ${action}

**Content to Review**:
${text}

**Your Task**:
Perform a strategic, high-level review focusing on:
1. Overall approach and strategy
2. Alignment with the action goal
3. Completeness and coherence
4. Potential improvements

Provide concise, actionable feedback.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    console.log(`[Gemini 2.0] Peer review complete`);

    res.json({
      success: true,
      review: response.text,
      model: MODEL,
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata?.totalTokenCount || 0,
      },
    });

  } catch (error: any) {
    console.error('[Gemini 2.0] Peer review error:', error);
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
    agent: 'gemini-2-0',
    model: MODEL,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`[Gemini 2.0 Agent] Running on port ${PORT}`);
  console.log(`[Gemini 2.0 Agent] Model: ${MODEL}`);
  console.log(`[Gemini 2.0 Agent] Ready for task orchestration`);
});
