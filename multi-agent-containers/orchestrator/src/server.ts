/**
 * Multi-Agent Workflow Orchestrator
 * Coordinates Claude Code, Gemini 2.0, and Gemini 2.5 Pro agents
 * Based on test workflow.png architecture
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 8090;

// Database connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@database:5432/workflow_db',
});

// Agent endpoints
const CLAUDE_AGENT_URL = process.env.CLAUDE_AGENT_URL || 'http://claude-agent:8091';
const GEMINI_2_0_AGENT_URL = process.env.GEMINI_2_0_AGENT_URL || 'http://gemini-2-0-agent:8092';
const GEMINI_2_5_AGENT_URL = process.env.GEMINI_2_5_AGENT_URL || 'http://gemini-2-5-agent:8093';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize database
async function initDatabase() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS workflows (
      id UUID PRIMARY KEY,
      action VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL,
      input_text TEXT NOT NULL,
      context TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      final_output TEXT,
      agreement BOOLEAN,
      validation_passed BOOLEAN
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS workflow_steps (
      id UUID PRIMARY KEY,
      workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
      step_number INT NOT NULL,
      agent VARCHAR(50) NOT NULL,
      stage VARCHAR(100) NOT NULL,
      input TEXT,
      output TEXT,
      tokens_used INT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log('[Orchestrator] Database initialized');
}

// Request schema
const ExecuteWorkflowSchema = z.object({
  action: z.string(),
  text: z.string(),
  context: z.string().optional(),
});

/**
 * POST /api/workflow/execute
 * Execute multi-agent workflow based on Shunt action
 */
app.post('/api/workflow/execute', async (req: Request, res: Response) => {
  try {
    const { action, text, context } = ExecuteWorkflowSchema.parse(req.body);
    const workflowId = uuidv4();

    console.log(`[Orchestrator] Starting workflow ${workflowId} for action: ${action}`);

    // Create workflow record
    await db.query(
      `INSERT INTO workflows (id, action, status, input_text, context)
       VALUES ($1, $2, $3, $4, $5)`,
      [workflowId, action, 'in_progress', text, context || null]
    );

    let stepNumber = 1;

    // STEP 1: Gemini 2.0 - Task Delegation
    console.log(`[Orchestrator] Step ${stepNumber}: Gemini 2.0 task delegation`);
    const delegationResponse = await fetch(`${GEMINI_2_0_AGENT_URL}/delegate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, action, context }),
    });
    const delegation = await delegationResponse.json();

    await db.query(
      `INSERT INTO workflow_steps (id, workflow_id, step_number, agent, stage, input, output, tokens_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uuidv4(), workflowId, stepNumber++, 'gemini-2-0', 'delegation', text, JSON.stringify(delegation), delegation.usage?.total_tokens || 0]
    );

    // STEP 2: Gemini 2.5 Pro - Main Processing
    console.log(`[Orchestrator] Step ${stepNumber}: Gemini 2.5 Pro processing`);
    const processingResponse = await fetch(`${GEMINI_2_5_AGENT_URL}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        action,
        taskPlan: delegation.taskPlan,
        context,
      }),
    });
    const processing = await processingResponse.json();

    await db.query(
      `INSERT INTO workflow_steps (id, workflow_id, step_number, agent, stage, input, output, tokens_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uuidv4(), workflowId, stepNumber++, 'gemini-2-5', 'processing', JSON.stringify(delegation.taskPlan), processing.result, processing.usage?.total_tokens || 0]
    );

    // STEP 3: Gemini 2.5 Pro - Research (if needed for complex actions)
    if (['MAKE_ACTIONABLE', 'BUILD_A_SKILL', 'COMPREHENSIVE_ANALYSIS'].includes(action)) {
      console.log(`[Orchestrator] Step ${stepNumber}: Gemini 2.5 Pro research`);
      const researchResponse = await fetch(`${GEMINI_2_5_AGENT_URL}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: processing.result, context }),
      });
      const research = await researchResponse.json();

      await db.query(
        `INSERT INTO workflow_steps (id, workflow_id, step_number, agent, stage, input, output, tokens_used)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [uuidv4(), workflowId, stepNumber++, 'gemini-2-5', 'research', processing.result, research.research, research.usage?.total_tokens || 0]
      );
    }

    // STEP 4: Gemini 2.5 Pro - Reflection
    console.log(`[Orchestrator] Step ${stepNumber}: Gemini 2.5 Pro reflection`);
    const reflectionResponse = await fetch(`${GEMINI_2_5_AGENT_URL}/reflect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: processing.result }),
    });
    const reflection = await reflectionResponse.json();

    await db.query(
      `INSERT INTO workflow_steps (id, workflow_id, step_number, agent, stage, input, output, tokens_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uuidv4(), workflowId, stepNumber++, 'gemini-2-5', 'reflection', processing.result, reflection.reflection, reflection.usage?.total_tokens || 0]
    );

    // STEP 5: Gemini 2.5 Pro - Conclusion
    console.log(`[Orchestrator] Step ${stepNumber}: Gemini 2.5 Pro conclusion`);
    const conclusionResponse = await fetch(`${GEMINI_2_5_AGENT_URL}/conclude`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: reflection.reflection }),
    });
    const conclusion = await conclusionResponse.json();

    await db.query(
      `INSERT INTO workflow_steps (id, workflow_id, step_number, agent, stage, input, output, tokens_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uuidv4(), workflowId, stepNumber++, 'gemini-2-5', 'conclusion', reflection.reflection, conclusion.conclusion, conclusion.usage?.total_tokens || 0]
    );

    // STEP 6: Claude Code - Peer Review & Validation
    console.log(`[Orchestrator] Step ${stepNumber}: Claude Code peer review`);
    const reviewResponse = await fetch(`${CLAUDE_AGENT_URL}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: conclusion.conclusion,
        action,
        context,
        rootInstruction: action,
      }),
    });
    const review = await reviewResponse.json();

    await db.query(
      `INSERT INTO workflow_steps (id, workflow_id, step_number, agent, stage, input, output, tokens_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uuidv4(), workflowId, stepNumber++, 'claude', 'peer_review', conclusion.conclusion, review.reviewedContent, review.usage?.input_tokens + review.usage?.output_tokens || 0]
    );

    // STEP 7: Agreement Check
    const agreement = review.approved && review.score >= 80;
    console.log(`[Orchestrator] Agreement check: ${agreement ? 'PASS' : 'NEEDS_REFINEMENT'}`);

    // STEP 8: Refinement (if needed)
    let finalOutput = review.reviewedContent;
    if (!agreement) {
      console.log(`[Orchestrator] Step ${stepNumber}: Gemini 2.5 Pro refinement`);
      const refinementResponse = await fetch(`${GEMINI_2_5_AGENT_URL}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: conclusion.conclusion,
          feedback: review.feedback,
        }),
      });
      const refinement = await refinementResponse.json();

      await db.query(
        `INSERT INTO workflow_steps (id, workflow_id, step_number, agent, stage, input, output, tokens_used)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [uuidv4(), workflowId, stepNumber++, 'gemini-2-5', 'refinement', review.feedback, refinement.refinedContent, refinement.usage?.total_tokens || 0]
      );

      finalOutput = refinement.refinedContent;
    }

    // Update workflow with final result
    await db.query(
      `UPDATE workflows
       SET status = $1, final_output = $2, agreement = $3, validation_passed = $4, updated_at = NOW()
       WHERE id = $5`,
      ['completed', finalOutput, agreement, review.approved, workflowId]
    );

    console.log(`[Orchestrator] Workflow ${workflowId} completed`);

    res.json({
      success: true,
      workflowId,
      finalOutput,
      agreement,
      validationPassed: review.approved,
      steps: stepNumber - 1,
    });

  } catch (error: any) {
    console.error('[Orchestrator] Workflow error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/workflow/:id
 * Get workflow status and result
 */
app.get('/api/workflow/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const workflowResult = await db.query('SELECT * FROM workflows WHERE id = $1', [id]);
    if (workflowResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const stepsResult = await db.query(
      'SELECT * FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_number',
      [id]
    );

    res.json({
      workflow: workflowResult.rows[0],
      steps: stepsResult.rows,
    });

  } catch (error: any) {
    console.error('[Orchestrator] Get workflow error:', error);
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
app.get('/health', async (req: Request, res: Response) => {
  try {
    await db.query('SELECT 1');
    res.json({
      status: 'healthy',
      service: 'orchestrator',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'orchestrator',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// Start server
async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`[Orchestrator] Running on port ${PORT}`);
    console.log(`[Orchestrator] Claude Agent: ${CLAUDE_AGENT_URL}`);
    console.log(`[Orchestrator] Gemini 2.0 Agent: ${GEMINI_2_0_AGENT_URL}`);
    console.log(`[Orchestrator] Gemini 2.5 Agent: ${GEMINI_2_5_AGENT_URL}`);
    console.log(`[Orchestrator] Ready to orchestrate multi-agent workflows`);
  });
}

start().catch(console.error);
