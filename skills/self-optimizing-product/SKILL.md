---
name: self-optimizing-product
description: Use this skill when you need to build a complete product that autonomously evolves and optimizes itself based on real user behavior with zero human intervention. Orchestrates Test-Driven Agent (backend code generation), Cognitive-Adaptive Interface (frontend UI optimization), and a Feedback Agent using Graph of Thoughts reasoning to translate user telemetry into automatic product improvements. The system continuously monitors user behavior, detects friction points, generates new features or fixes, deploys changes, and repeats indefinitely. Best for: MVPs, SaaS products, e-commerce platforms, dashboards that need continuous optimization.
---

# Self-Optimizing Product (SOP) Loop Skill

## Purpose

This skill creates a **fully autonomous product** that writes its own code, optimizes its own UI, and evolves based on real user behavior. It's the ultimate synthesis of TDA (backend) + CAI (frontend) + Feedback Agent (intelligence), creating a closed-loop system that requires zero human intervention after initialization.

## When to Use This Skill

- **MVP Development**: Build and deploy a self-improving product rapidly
- **SaaS Platforms**: Products that need continuous feature evolution
- **E-Commerce**: Checkout flows that optimize for conversion automatically
- **Dashboards**: Interfaces that adapt to user behavior patterns
- **Experimental Products**: Test product-market fit with autonomous iteration

**Do NOT use for**: Safety-critical systems, regulated industries without human oversight, or products where changes need legal review.

## How It Works

### The Self-Optimizing Loop

```
┌─────────────────────────────────────────────────┐
│                  SOP LOOP                       │
│                                                 │
│  ┌──────────┐         ┌──────────┐            │
│  │   TDA    │◄────────┤   CAI    │            │
│  │ Backend  │         │ Frontend │            │
│  └────┬─────┘         └─────┬────┘            │
│       │                     │                  │
│       │    ┌──────────┐     │                  │
│       └───►│ Feedback │◄────┘                  │
│            │  Agent   │                        │
│            │  (GoT)   │                        │
│            └────┬─────┘                        │
│                 │                              │
│          ┌──────▼──────┐                       │
│          │  Telemetry  │                       │
│          │  Analysis   │                       │
│          └─────────────┘                       │
│                 ▲                              │
│                 │                              │
│         Real User Behavior                     │
└─────────────────┼──────────────────────────────┘
                  │
              Users
```

### The 7-Step Continuous Loop

1. **DEPLOY**: TDA generates backend API, CAI generates frontend UI
2. **OBSERVE**: Monitor real user telemetry (clicks, scrolls, conversions, errors)
3. **ANALYZE**: Detect behavioral patterns (hesitation, rage clicks, drop-offs)
4. **TRANSLATE**: Feedback Agent uses Graph of Thoughts to convert telemetry → user story
5. **EVOLVE BACKEND**: TDA generates new code/tests from user story
6. **ADAPT FRONTEND**: CAI optimizes UI based on detected friction
7. **REPEAT**: Loop runs continuously (default: every 60 seconds)

## Usage Instructions

### Step 1: Define Initial Product Specification

You need TWO metaprompts: one for TDA (backend) and one for CAI (frontend).

#### Backend Specification (TDA)

```typescript
import { UserStoryMetaprompt, generateUniqueId } from '../types/autonomous';

const backendStory: UserStoryMetaprompt = {
  system_role: 'test_driven_agent',
  timestamp: new Date().toISOString(),
  id: generateUniqueId(),
  task_id: 'initial-api-v1',
  source_trigger: 'manual',

  user_story: {
    title: 'Build User Registration and Authentication API',
    description: `
      Create a secure user registration and login system with:
      - User registration with email validation
      - Password hashing with bcrypt
      - JWT token generation for authentication
      - Session management
      - Email confirmation flow
    `,
    acceptance_criteria: [
      {
        id: generateUniqueId(),
        given: 'New user provides valid email and password',
        when: 'POST /api/auth/register is called',
        then: 'User is created, confirmation email sent, return 201',
        priority: 1
      },
      {
        id: generateUniqueId(),
        given: 'Registered user provides correct credentials',
        when: 'POST /api/auth/login is called',
        then: 'Return JWT token with user data',
        priority: 2
      }
    ],
    priority: 'critical'
  },

  rag_context_queries: [
    'Existing database schema',
    'Email service configuration',
    'JWT authentication patterns'
  ],

  technical_constraints: {
    language: 'typescript',
    framework: 'express',
    test_framework: 'jest',
    coding_standards: ['airbnb', 'async-await']
  }
};
```

#### Frontend Specification (CAI)

```typescript
import { CAIMetaprompt, CognitivePrinciple } from '../types/autonomous';

const frontendSpec: CAIMetaprompt = {
  system_role: 'cognitive_adaptive_interface',
  timestamp: new Date().toISOString(),
  id: generateUniqueId(),
  objective: 'maximize_conversion',
  business_objective: 'Maximize user registration completion',

  target_persona: {
    id: generateUniqueId(),
    name: 'New User',
    demographics: {
      age_range: '18-65',
      tech_savviness: 'medium'
    },
    pain_points: [
      'Too many form fields',
      'Unclear password requirements',
      'No social login option'
    ],
    motivations: ['Quick signup', 'Security'],
    goals: ['Create account in under 2 minutes']
  },

  cognitive_fitness_function: {
    principles: [
      {
        principle: CognitivePrinciple.COGNITIVE_LOAD,
        weight: 0.4,
        target_metric: 'form_fields_count',
        target_value: 3
      },
      {
        principle: CognitivePrinciple.FITTS_LAW,
        weight: 0.3,
        target_metric: 'submit_button_size_px',
        target_value: 48
      },
      {
        principle: CognitivePrinciple.RECOGNITION_VS_RECALL,
        weight: 0.3,
        target_metric: 'password_hints_visible',
        target_value: 1.0
      }
    ]
  },

  technical_constraints: {
    wcag_compliance: 'WCAG_2_2_AA',
    semantic_html: true,
    keyboard_accessible: true,
    aria_required: true,
    frameworks: ['react', 'tailwindcss']
  }
};
```

### Step 2: Initialize the SOP Loop

```typescript
import { sopService } from '../services/selfOptimizingProduct.service';

// Initialize with both specs
const sopState = await sopService.initialize(
  backendStory,   // TDA metaprompt
  frontendSpec    // CAI metaprompt
);

console.log('🚀 Self-Optimizing Product Initialized!');
console.log('Backend Status:', sopState.tda_state?.final_status);
console.log('Frontend Status:', sopState.cai_state?.status);
console.log('Initial Metrics:', sopState.product_metrics);
```

### Step 3: Start the Autonomous Loop

```typescript
// Set loop interval (how often to check for optimization)
sopService.setLoopInterval(60000); // 60 seconds

// Start the loop (runs forever until stopped)
await sopService.startLoop();

// The product now:
// ✓ Monitors user behavior continuously
// ✓ Detects friction points automatically
// ✓ Generates new features based on user needs
// ✓ Optimizes UI for better conversion
// ✓ Deploys changes automatically
// ✓ Repeats indefinitely
```

### Step 4: Monitor Evolution (Optional)

```typescript
// Check current state
const currentState = sopService.getLoopState();
console.log('Loop Iteration:', currentState.loop_iteration);
console.log('Deployment Status:', currentState.deployment_status);

// View evolution history
const history = sopService.getEvolutionHistory();
history.forEach(iteration => {
  console.log(`Iteration ${iteration.iteration}:`);
  console.log('  Changes:', iteration.changes_made);
  console.log('  Delight Before:', iteration.metrics_before.user_delight_score);
  console.log('  Delight After:', iteration.metrics_after.user_delight_score);
});

// Get current metrics
const metrics = sopService.getCurrentMetrics();
console.log('User Delight Score:', metrics.user_delight_score);
console.log('Conversion Rate:', metrics.conversion_rate);
console.log('Error Rate:', metrics.error_rate);
console.log('Performance Score:', metrics.performance_score);
```

### Step 5: Stop the Loop (When Needed)

```typescript
// Stop autonomous optimization
sopService.stopLoop();

// Reset completely
sopService.resetLoop();
```

## The Feedback Agent: Graph of Thoughts

The Feedback Agent is the "brain" of the SOP Loop. It uses **Graph of Thoughts (GoT)** reasoning to analyze user behavior.

### How It Works

1. **Create Thought Nodes**:
   - Node 1: Behavioral anomalies (hesitation, rage clicks)
   - Node 2: Cognitive principle violations
   - Node 3: Conversion blockers
   - Node 4: Performance issues

2. **Build Edges (Causal Relationships)**:
   - "High drop-off at checkout" → CAUSED BY → "Too many form fields"
   - "Rage clicks on submit button" → CAUSED BY → "Button too small (Fitts's Law violation)"

3. **Identify Root Causes**:
   - Follow edges backwards from symptoms to root problems
   - Distinguish symptoms from actual issues

4. **Prioritize Issues**:
   - Severity: How many users affected?
   - Impact: Effect on conversion/delight?
   - Complexity: How hard to fix?

5. **Generate User Story**:
   - Translate root cause into TDA-compatible user story
   - Auto-feed to TDA for code generation

### Example Feedback Agent Analysis

```typescript
// Input: Telemetry shows 60% drop-off at payment step

// Feedback Agent Output:
{
  identified_issues: [
    {
      issue_id: 'issue-1',
      issue_type: 'user_friction',
      severity: 'critical',
      affected_users: 150,
      evidence: [ /* telemetry events showing drop-off */ ]
    }
  ],

  reasoning_graph: {
    nodes: [
      {
        id: 'node-1',
        type: 'behavioral_anomaly',
        description: '60% drop-off at payment step'
      },
      {
        id: 'node-2',
        type: 'cognitive_violation',
        description: 'Payment form has 8 fields (Cognitive Load violation)'
      },
      {
        id: 'node-3',
        type: 'root_cause',
        description: 'No guest checkout option'
      }
    ],
    edges: [
      { from: 'node-1', to: 'node-2', relationship: 'caused_by' },
      { from: 'node-2', to: 'node-3', relationship: 'caused_by' }
    ],
    root_causes: ['node-3']
  },

  generated_user_story: {
    title: 'Add guest checkout option',
    description: 'Allow users to checkout without creating account',
    acceptance_criteria: [
      {
        given: 'User is at checkout without account',
        when: 'Clicks "Checkout as Guest"',
        then: 'Proceed to payment with email only'
      }
    ]
  }
}
```

## Product Metrics

The SOP Loop tracks 4 key metrics:

### 1. User Delight Score (0.0 - 1.0)
Equals CAI's cognitive fitness score. Measures how well UI adheres to cognitive principles.

**Calculation**: Weighted average of all cognitive principle scores

### 2. Conversion Rate (0.0 - 1.0)
Percentage of users completing desired actions.

**Source**: CAI telemetry analysis

### 3. Error Rate (0.0 - 1.0)
Proportion of failing tests or runtime errors.

**Calculation**: 1 - (passing_tests / total_tests)

### 4. Performance Score (0.0 - 1.0)
Page load time, API latency, etc.

**Source**: Performance monitoring (placeholder in current implementation)

## Simulation Mode

For testing without real users:

```typescript
// Run 10 iterations with synthetic telemetry
const finalState = await sopService.runSimulation(10);

console.log('Simulation Complete!');
console.log('Evolution History:', finalState.evolution_history);
console.log('Final Metrics:', finalState.product_metrics);
```

The simulation:
- Generates synthetic user behavior
- Injects realistic friction (rage clicks, drop-offs)
- Triggers the feedback loop
- Evolves the product autonomously
- Shows metrics improvement over time

## Complete Example: E-Commerce Checkout

```typescript
// Step 1: Define initial backend
const checkoutBackend: UserStoryMetaprompt = {
  user_story: {
    title: 'Secure Payment Processing API',
    description: 'Stripe integration for credit card payments',
    acceptance_criteria: [
      {
        given: 'Valid payment info',
        when: 'POST /api/checkout/process',
        then: 'Process payment and return order confirmation'
      },
      {
        given: 'Invalid card',
        when: 'POST /api/checkout/process',
        then: 'Return 400 with clear error'
      }
    ]
  },
  technical_constraints: {
    language: 'typescript',
    framework: 'express'
  }
};

// Step 2: Define initial frontend
const checkoutFrontend: CAIMetaprompt = {
  objective: 'maximize_conversion',
  business_objective: 'Reduce cart abandonment from 70% to 30%',

  target_persona: {
    name: 'Online Shopper',
    pain_points: [
      'Too many checkout steps',
      'Unexpected shipping costs',
      'No saved payment methods'
    ],
    behavioral_patterns: {
      typical_device: 'mobile',
      attention_span: 'low'
    }
  },

  cognitive_fitness_function: {
    principles: [
      {
        principle: CognitivePrinciple.COGNITIVE_LOAD,
        weight: 0.4,
        target_metric: 'checkout_steps',
        target_value: 2
      },
      {
        principle: CognitivePrinciple.FITTS_LAW,
        weight: 0.3,
        target_metric: 'place_order_button_size',
        target_value: 56
      },
      {
        principle: CognitivePrinciple.PEAK_END_RULE,
        weight: 0.3,
        target_metric: 'confirmation_delight',
        target_value: 0.9
      }
    ]
  }
};

// Step 3: Initialize and run
await sopService.initialize(checkoutBackend, checkoutFrontend);
await sopService.startLoop();

// The system now:
// ✓ Detects users dropping off at shipping info
// ✓ Feedback Agent: "Too many fields" (Cognitive Load violation)
// ✓ TDA: Generates "save address" feature
// ✓ CAI: Optimizes form layout, increases button size
// ✓ Metrics improve: Conversion 70% → 75% → 80%
// ✓ Continues optimizing indefinitely
```

## Advanced Features

### Custom Loop Interval

```typescript
// Check for optimizations every 30 seconds
sopService.setLoopInterval(30000);

// Check once per hour
sopService.setLoopInterval(3600000);
```

### Evolution History Analysis

```typescript
const history = sopService.getEvolutionHistory();

// Find biggest improvement
const bestIteration = history.reduce((best, current) => {
  const currentGain = current.metrics_after.user_delight_score
                    - current.metrics_before.user_delight_score;
  const bestGain = best.metrics_after.user_delight_score
                 - best.metrics_before.user_delight_score;
  return currentGain > bestGain ? current : best;
});

console.log('Biggest improvement was:', bestIteration.changes_made);
```

### Deployment Gating

```typescript
// In production, add checks before deploying changes
const state = sopService.getLoopState();

if (state.deployment_status === 'staging') {
  // Run additional tests
  // Check with human if needed
  // Then promote to production
}
```

## Best Practices

1. **Start Small**
   - Initialize with minimal viable product
   - Let the system evolve features based on real usage
   - Don't over-engineer initial spec

2. **Monitor Closely at First**
   - Watch first 10-20 iterations
   - Ensure changes align with business goals
   - Adjust cognitive fitness function if needed

3. **Set Appropriate Intervals**
   - Development: 10-30 seconds for fast iteration
   - Staging: 5-10 minutes for realistic testing
   - Production: 30-60 minutes to avoid over-optimization

4. **Use Simulation First**
   - Test with `runSimulation(100)` before production
   - Validate that evolution makes sense
   - Check that metrics improve

5. **Combine with Human Review**
   - Even autonomous systems benefit from oversight
   - Review evolution history weekly
   - Adjust persona/fitness function based on learnings

## Troubleshooting

**Issue:** No optimizations triggered
- **Solution:** Need sufficient telemetry (min 100 events)
- **Solution:** Check that telemetry includes friction indicators
- **Solution:** Lower severity threshold for issues

**Issue:** Product changes too frequently
- **Solution:** Increase loop interval
- **Solution:** Raise issue severity threshold
- **Solution:** Require minimum affected users

**Issue:** Changes don't improve metrics
- **Solution:** Review feedback agent's reasoning_graph
- **Solution:** Check if personas match real users
- **Solution:** Adjust cognitive fitness function weights

**Issue:** Backend and frontend misaligned
- **Solution:** Ensure TDA generates APIs CAI expects
- **Solution:** Add API contract validation
- **Solution:** Review RAG context queries

## System Requirements

### For Development
- Node.js 16+
- TypeScript 4.5+
- Gemini API key (for LLM)
- Telemetry service (can simulate)

### For Production
- Real telemetry integration
- Database for storing evolution history
- CI/CD pipeline for deployments
- Monitoring and alerting

## Metrics Baseline

After initialization, expect:
- **User Delight Score**: 0.7-0.8 (good)
- **Conversion Rate**: Depends on product
- **Error Rate**: <0.05 (5%)
- **Performance Score**: >0.8 (80%)

After 10 iterations:
- **User Delight**: +10-20% improvement
- **Conversion**: +5-15% improvement
- **Error Rate**: -50% reduction
- **Performance**: +5-10% improvement

## Integration with Other Skills

The SOP Loop IS the integration of:
- **TDA Skill**: Backend code generation
- **CAI Skill**: Frontend UI optimization
- Both orchestrated by the Feedback Agent

Use standalone TDA or CAI when you only need one component.

## Technical Details

**Service Location:** `services/selfOptimizingProduct.service.ts`
**Type Definitions:** `types/autonomous.ts` (SOPLoopState, FeedbackAgentAnalysis)
**Dependencies:**
- `testDrivenAgent.service.ts`
- `cognitiveAdaptiveInterface.service.ts`
- `agenticRAG.service.ts`
- Telemetry service

## Output Format

```typescript
{
  loop_iteration: number,
  tda_state: TDAWorkflowState,
  cai_state: CAIWorkflowState,
  feedback_analysis: FeedbackAgentAnalysis,
  deployment_status: 'development' | 'staging' | 'production' | 'rollback',
  product_metrics: {
    user_delight_score: number,
    conversion_rate: number,
    error_rate: number,
    performance_score: number
  },
  evolution_history: Array<{
    iteration: number,
    timestamp: string,
    changes_made: string[],
    metrics_before: object,
    metrics_after: object
  }>
}
```

## The Future: Product-Bench

This skill implements the "Product-Bench" benchmark:

**Given:** High-level product goal + cognitive fitness function
**Input:** Stream of simulated user telemetry
**Task:** Build V1 and autonomously evolve over millions of sessions
**Metric:** Maximize fitness function over time

This is the future of software: **products that build and optimize themselves**.

## License & Attribution

Part of the Agentic Self-Optimizing Systems architecture.
Synthesizes TDD, cognitive science, RAG, and multi-agent orchestration.
