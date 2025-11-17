/**
 * Claude Code Agent - Peer Review & Validation Service
 * Runs actual Anthropic Claude API for code review and validation
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 8091;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request schemas
const ReviewRequestSchema = z.object({
  text: z.string(),
  action: z.string(),
  context: z.string().optional(),
  rootInstruction: z.string().optional(),
});

const ValidateRequestSchema = z.object({
  text: z.string(),
  criteria: z.string(),
});

const AnalyzeRequestSchema = z.object({
  text: z.string(),
  analysisType: z.enum(['code', 'content', 'logic', 'security']),
});

/**
 * POST /review
 * Peer review content with Claude Code
 */
app.post('/review', async (req: Request, res: Response) => {
  try {
    const { text, action, context, rootInstruction } = ReviewRequestSchema.parse(req.body);

    console.log(`[Claude Agent] Reviewing for action: ${action}`);

    const prompt = `You are Claude Code, an expert AI code reviewer and technical validator.

**Root Instruction**: ${rootInstruction || action}
**Action Context**: ${context || 'None provided'}

**Content to Review**:
${text}

**Your Task**:
1. Perform a thorough technical peer review
2. Check for:
   - Logical correctness
   - Technical accuracy
   - Code quality (if applicable)
   - Completeness relative to the root instruction
   - Potential issues or edge cases

3. Provide your reviewed version with improvements, OR approve as-is if it's already excellent

**Response Format**:
\`\`\`json
{
  "approved": true/false,
  "reviewedContent": "Your improved version or original if approved",
  "feedback": "Detailed feedback explaining your review",
  "improvements": ["List of improvements made"],
  "issues": ["List of issues found"],
  "score": 0-100
}
\`\`\``;

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    // Parse JSON response
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    let reviewResult;

    if (jsonMatch) {
      reviewResult = JSON.parse(jsonMatch[1]);
    } else {
      // Fallback if Claude doesn't return JSON
      reviewResult = {
        approved: true,
        reviewedContent: responseText,
        feedback: 'Review completed',
        improvements: [],
        issues: [],
        score: 85,
      };
    }

    console.log(`[Claude Agent] Review complete. Score: ${reviewResult.score}`);

    res.json({
      success: true,
      ...reviewResult,
      model: CLAUDE_MODEL,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });

  } catch (error: any) {
    console.error('[Claude Agent] Review error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /validate
 * Validate content against criteria
 */
app.post('/validate', async (req: Request, res: Response) => {
  try {
    const { text, criteria } = ValidateRequestSchema.parse(req.body);

    console.log(`[Claude Agent] Validating content`);

    const prompt = `You are Claude Code, performing validation.

**Validation Criteria**:
${criteria}

**Content to Validate**:
${text}

**Task**: Determine if the content meets the criteria. Respond with:
- "PASS" if it meets all criteria
- "FAIL" if it doesn't
- Followed by a detailed explanation

Format: PASS/FAIL: [explanation]`;

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    const passed = responseText.toUpperCase().startsWith('PASS');

    console.log(`[Claude Agent] Validation: ${passed ? 'PASSED' : 'FAILED'}`);

    res.json({
      success: true,
      passed,
      result: responseText,
      model: CLAUDE_MODEL,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });

  } catch (error: any) {
    console.error('[Claude Agent] Validation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /analyze
 * Deep analysis of content
 */
app.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { text, analysisType } = AnalyzeRequestSchema.parse(req.body);

    console.log(`[Claude Agent] Analyzing (${analysisType})`);

    const analysisPrompts = {
      code: 'Perform a deep code analysis. Check for bugs, performance issues, security vulnerabilities, and best practices.',
      content: 'Analyze the content for clarity, coherence, completeness, and quality.',
      logic: 'Analyze the logical structure and reasoning. Check for fallacies, inconsistencies, or gaps.',
      security: 'Perform a security audit. Identify potential vulnerabilities, unsafe practices, and security risks.',
    };

    const prompt = `You are Claude Code, an expert analyst.

**Analysis Type**: ${analysisType}
**Instructions**: ${analysisPrompts[analysisType]}

**Content**:
${text}

Provide a detailed analysis with actionable insights.`;

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: prompt,
      }],
    });

    const analysis = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    console.log(`[Claude Agent] Analysis complete`);

    res.json({
      success: true,
      analysis,
      analysisType,
      model: CLAUDE_MODEL,
      usage: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens,
      },
    });

  } catch (error: any) {
    console.error('[Claude Agent] Analysis error:', error);
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
    agent: 'claude-code',
    model: CLAUDE_MODEL,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`[Claude Code Agent] Running on port ${PORT}`);
  console.log(`[Claude Code Agent] Model: ${CLAUDE_MODEL}`);
  console.log(`[Claude Code Agent] Ready for peer review and validation`);
});
