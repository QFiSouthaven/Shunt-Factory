---
name: cognitive-ui-optimizer
description: Use this skill when you need to generate or optimize user interfaces based on cognitive science and human psychology principles. Automatically evaluates UIs using Fitts's Law, Hick's Law, Cognitive Load theory, and analyzes real user telemetry to detect friction points. Autonomously optimizes layouts, button placement, information density, and interaction flows to maximize user delight and conversion rates. Best for: landing pages, checkout flows, dashboards, forms, mobile interfaces.
---

# Cognitive UI Optimizer (CAI) Skill

## Purpose

This skill generates and optimizes user interfaces using a quantifiable **Cognitive Fitness Function** based on 8 cognitive science principles. It analyzes real user behavior through telemetry and autonomously improves UIs to minimize friction and maximize user delight.

## When to Use This Skill

- **UI Generation**: Create new interfaces optimized for specific user personas
- **UX Optimization**: Improve existing UIs based on behavioral data
- **Conversion Optimization**: Reduce drop-offs in critical user flows
- **Accessibility Compliance**: Ensure WCAG 2.2 AA/AAA compliance
- **A/B Testing**: Generate and compare UI variants scientifically
- **Mobile Optimization**: Apply Fitts's Law for touch targets

**Do NOT use for**: Backend logic, data processing, or non-visual components.

## How It Works

### The 4-Phase CAI Engine

```
Cognitive Metaprompt → Initial Generation → Telemetry Loop → Autonomous Optimization
```

1. **Phase 1: Cognitive Metaprompt**
   - Define objective (maximize conversion, minimize friction, etc.)
   - Specify target persona with pain points and motivations
   - Set weighted cognitive fitness function
   - Enforce technical constraints (WCAG, frameworks)

2. **Phase 2: Initial Generation**
   - Generate UI component tree optimized for persona
   - Annotate each design decision with cognitive principle
   - Calculate initial fitness score
   - Ensure accessibility compliance

3. **Phase 3: Telemetry Loop**
   - Ingest real user interaction events
   - Detect behavioral patterns:
     - Hesitation points (long dwell time)
     - Rage clicks (frustration indicators)
     - Drop-off points (abandonment)
     - Successful conversions
   - Identify cognitive principle violations

4. **Phase 4: Autonomous Optimization**
   - Generate recommendations from telemetry analysis
   - Apply top-priority changes
   - Re-calculate fitness score
   - A/B test variants if needed
   - Deploy winner automatically

## The 8 Cognitive Principles

### 1. Cognitive Load
**Goal:** Minimize working memory burden
- Max 7±2 items per group (Miller's Law)
- Progressive disclosure for complex flows
- Chunking related information

**Example Violation:** Checkout form with 15 fields on one page
**Fix:** Split into 3 steps with 5 fields each

### 2. Fitts's Law
**Formula:** `T = a + b * log2(D/W + 1)`
- Larger targets for primary actions (min 44x44px mobile)
- Place frequent controls close together
- Optimize distance and size

**Example Violation:** Small "Buy Now" button far from product image
**Fix:** Increase button to 56px, move next to product

### 3. Hick's Law
**Formula:** `T = b * log2(n+1)` where n = choices
- Reduce decision time by limiting options
- Critical actions should have <5 choices
- Use defaults and recommendations

**Example Violation:** Navigation with 15 top-level items
**Fix:** Reduce to 5 categories with mega-menu

### 4. Miller's Law
**Principle:** Working memory holds 7±2 chunks
- Group related items (5-9 max)
- Use visual hierarchy
- Card-based layouts

**Example Violation:** List of 20 ungrouped settings
**Fix:** Create 4 setting categories with 5 items each

### 5. Gestalt Proximity
**Principle:** Related elements should be visually grouped
- Use whitespace to create boundaries
- Group form fields by category
- Visual containers for related actions

### 6. Peak-End Rule
**Principle:** Users remember peaks and endings
- Optimize most intense moment of journey
- Optimize final step (confirmation)
- Delight at checkout completion

### 7. Serial Position Effect
**Principle:** First and last items remembered best
- Place critical items at start or end
- Important navigation first/last
- Calls-to-action at top and bottom

### 8. Recognition vs Recall
**Principle:** Recognition easier than recall
- Visible options > hidden menus
- Icons with labels
- Persistent navigation
- Auto-complete and suggestions

## Usage Instructions

### Step 1: Define the Cognitive Metaprompt

```typescript
import { CAIMetaprompt, CognitivePrinciple } from '../types/autonomous';

const metaprompt: CAIMetaprompt = {
  system_role: 'cognitive_adaptive_interface',
  timestamp: new Date().toISOString(),
  id: generateUniqueId(),
  objective: 'maximize_conversion',
  business_objective: 'Increase checkout completion rate from 45% to 70%',

  target_persona: {
    id: generateUniqueId(),
    name: 'Busy Online Shopper',
    demographics: {
      age_range: '25-45',
      occupation: 'Working Professional',
      tech_savviness: 'medium'
    },
    pain_points: [
      'Too many form fields',
      'Unclear error messages',
      'No guest checkout option',
      'Unexpected shipping costs'
    ],
    motivations: [
      'Fast checkout',
      'Clear pricing',
      'Trust and security'
    ],
    goals: [
      'Complete purchase in under 3 minutes',
      'Understand total cost upfront'
    ],
    behavioral_patterns: {
      typical_device: 'mobile',
      attention_span: 'low',
      preferred_interaction: 'visual'
    }
  },

  technical_constraints: {
    wcag_compliance: 'WCAG_2_2_AA',
    semantic_html: true,
    keyboard_accessible: true,
    aria_required: true,
    frameworks: ['react', 'tailwindcss']
  },

  cognitive_fitness_function: {
    principles: [
      {
        principle: CognitivePrinciple.COGNITIVE_LOAD,
        weight: 0.35,  // Highest priority
        target_metric: 'form_fields_per_step',
        target_value: 3
      },
      {
        principle: CognitivePrinciple.FITTS_LAW,
        weight: 0.25,
        target_metric: 'primary_button_size_px',
        target_value: 56
      },
      {
        principle: CognitivePrinciple.HICKS_LAW,
        weight: 0.20,
        target_metric: 'payment_options_count',
        target_value: 3
      },
      {
        principle: CognitivePrinciple.RECOGNITION_VS_RECALL,
        weight: 0.20,
        target_metric: 'visible_info_ratio',
        target_value: 0.95
      }
    ]
  },

  initial_generation: true
};
```

### Step 2: Initialize CAI Engine

```typescript
import { caiService } from '../services/cognitiveAdaptiveInterface.service';

const caiState = await caiService.initialize(metaprompt);

console.log('Generated UI:', caiState.current_ui);
console.log('Initial Fitness Score:', caiState.current_fitness_score);
// Fitness score: 0.0 (worst) to 1.0 (perfect)
```

### Step 3: Ingest Telemetry Data

```typescript
import { UserTelemetryEvent } from '../types/autonomous';

// Telemetry events from your analytics
const telemetryEvents: UserTelemetryEvent[] = [
  {
    id: generateUniqueId(),
    timestamp: new Date().toISOString(),
    sessionId: 'session-123',
    userId: 'user-456',
    eventType: 'click',
    elementId: 'checkout-button',
    elementType: 'button',
    pagePath: '/cart',
    sequenceNumber: 1,
    coords: { x: 150, y: 800 }
  },
  // ... more events
];

await caiService.ingestTelemetry(telemetryEvents);
```

### Step 4: Analyze and Optimize

```typescript
// Analyze telemetry to detect friction
const analysis = await caiService.analyzeTelemetry();

console.log('Hesitation Points:', analysis.behavioral_patterns.hesitation_points);
console.log('Rage Clicks:', analysis.behavioral_patterns.rage_clicks);
console.log('Drop-offs:', analysis.behavioral_patterns.drop_off_points);
console.log('Cognitive Violations:', analysis.cognitive_fitness_violations);

// Automatically optimize based on analysis
await caiService.optimizeUI();

console.log('New Fitness Score:', caiService.getFitnessScore());
console.log('Optimized UI:', caiService.getCurrentUI());
```

### Step 5: A/B Testing (Optional)

```typescript
// Generate a variant and test it
const variantB = caiService.getCurrentUI();

const abResult = await caiService.runABTest(variantB, 1000); // 1000 sessions

console.log('Winner:', abResult.winner);
console.log('Variant A Fitness:', abResult.variant_a.fitness_score);
console.log('Variant B Fitness:', abResult.variant_b.fitness_score);
console.log('Confidence:', abResult.confidence_level);
```

## Examples

### Example 1: Signup Form Optimization

```typescript
const signupMetaprompt: CAIMetaprompt = {
  system_role: 'cognitive_adaptive_interface',
  objective: 'minimize_friction',
  business_objective: 'Reduce signup form abandonment',

  target_persona: {
    name: 'New User',
    pain_points: ['Too many required fields', 'Unclear password requirements'],
    motivations: ['Quick account creation', 'Privacy'],
    goals: ['Sign up in under 60 seconds']
  },

  cognitive_fitness_function: {
    principles: [
      {
        principle: CognitivePrinciple.COGNITIVE_LOAD,
        weight: 0.4,
        target_metric: 'required_fields_count',
        target_value: 3  // Email, password, confirm
      },
      {
        principle: CognitivePrinciple.RECOGNITION_VS_RECALL,
        weight: 0.3,
        target_metric: 'password_requirements_visible',
        target_value: 1.0  // Always visible
      },
      {
        principle: CognitivePrinciple.FITTS_LAW,
        weight: 0.3,
        target_metric: 'submit_button_size_px',
        target_value: 48
      }
    ]
  }
};

const result = await caiService.initialize(signupMetaprompt);
```

### Example 2: Dashboard Layout

```typescript
const dashboardMetaprompt: CAIMetaprompt = {
  objective: 'maximize_engagement',
  business_objective: 'Increase daily active usage',

  target_persona: {
    name: 'Power User',
    behavioral_patterns: {
      typical_device: 'desktop',
      attention_span: 'high',
      preferred_interaction: 'mixed'
    }
  },

  cognitive_fitness_function: {
    principles: [
      {
        principle: CognitivePrinciple.MILLER_LAW,
        weight: 0.3,
        target_metric: 'widgets_per_view',
        target_value: 6
      },
      {
        principle: CognitivePrinciple.GESTALT_PROXIMITY,
        weight: 0.3,
        target_metric: 'related_widgets_grouped',
        target_value: 1.0
      },
      {
        principle: CognitivePrinciple.SERIAL_POSITION,
        weight: 0.4,
        target_metric: 'critical_widgets_position',
        target_value: 1.0  // First or last
      }
    ]
  }
};
```

## Telemetry Event Types

The CAI analyzes these telemetry events:

- **click**: User clicks an element
- **scroll**: User scrolls (detect drop-off points)
- **inputChange**: Form field changes (detect hesitation)
- **pageView**: Navigation (funnel analysis)
- **hesitation**: Long dwell time before action
- **rage_click**: Multiple rapid clicks (frustration)
- **error**: User encounters error

## Cognitive Fitness Calculation

The fitness score is a weighted composite:

```
fitness_score = Σ(principle_score × weight) / Σ(weights)

Where each principle_score is 0.0 to 1.0
```

**Example:**
- Cognitive Load: 0.85 × 0.35 = 0.2975
- Fitts's Law: 0.90 × 0.25 = 0.2250
- Hick's Law: 0.75 × 0.20 = 0.1500
- Recognition vs Recall: 0.88 × 0.20 = 0.1760
- **Total: 0.8485 (84.85% optimal)**

## Advanced Features

### Persona-Driven Generation

The CAI tailors UIs to specific user personas:

```typescript
// Tech-savvy user → More options, compact layout
// Novice user → Simple, guided, large targets
// Mobile user → Touch-optimized, vertical flow
```

### Violation Detection

Automatically detects cognitive principle violations:

```typescript
// Example violation detected:
{
  principle: CognitivePrinciple.COGNITIVE_LOAD,
  elementId: 'checkout-form',
  violation_description: 'Form has 12 fields causing overload (Miller's Law: max 7±2)',
  severity: 'high'
}
```

### Optimization Recommendations

Generates specific, actionable recommendations:

```typescript
{
  id: 'rec-1',
  priority: 1,
  element_id: 'submit-button',
  change_type: 'resize',
  rationale: 'Button too small for mobile (32px). Fitts's Law requires min 44px.',
  expected_improvement: [
    { principle: CognitivePrinciple.FITTS_LAW, estimated_score_delta: 0.15 }
  ]
}
```

## Best Practices

1. **Define Clear Personas**
   - Include real pain points from user research
   - Specify actual device usage patterns
   - Use data-driven motivations

2. **Weight Principles Appropriately**
   - Cognitive Load usually highest for complex flows
   - Fitts's Law critical for mobile
   - Adjust based on your specific goal

3. **Collect Quality Telemetry**
   - Track all interaction types
   - Include context (viewport size, etc.)
   - Link to user sessions

4. **Iterate Based on Data**
   - Run optimization after sufficient telemetry
   - A/B test major changes
   - Monitor fitness score over time

5. **Balance Optimization with Brand**
   - CAI optimizes for cognition, not aesthetics
   - Apply brand styling after optimization
   - Don't sacrifice usability for design

## Troubleshooting

**Issue:** Fitness score is low (<0.6)
- **Solution:** Check if target_values are realistic
- **Solution:** Review persona alignment with actual users
- **Solution:** Increase weights on violated principles

**Issue:** No optimization recommendations generated
- **Solution:** Need more telemetry data (min 100 events)
- **Solution:** Check for telemetry ingestion errors
- **Solution:** Lower fitness target_values

**Issue:** UI generated doesn't match framework
- **Solution:** Specify frameworks in technical_constraints
- **Solution:** Ensure component types match your library

## Integration with Other Skills

- **Combine with TDA**: TDA generates backend API, CAI generates frontend
- **Combine with SOP**: CAI is the frontend component of the full SOP loop
- **Standalone**: Use CAI alone for UI/UX optimization projects

## Technical Details

**Service Location:** `services/cognitiveAdaptiveInterface.service.ts`
**Type Definitions:** `types/autonomous.ts` (CAIWorkflowState, CognitivePrinciple)
**Dependencies:** Requires telemetry service for real-time data

## Output Format

```typescript
{
  metaprompt: CAIMetaprompt,
  current_ui: UIComponentTree,
  telemetry_sessions: string[],
  telemetry_analysis: TelemetryAnalysis,
  optimization_history: Array<{
    iteration: number,
    recommendations_applied: UIOptimizationRecommendation[],
    fitness_before: number,
    fitness_after: number
  }>,
  current_fitness_score: number,
  status: 'generating' | 'deployed' | 'monitoring' | 'optimizing'
}
```

## References

- Nielsen Norman Group: Usability Heuristics
- Don Norman: The Design of Everyday Things
- Fitts's Law: ISO 9241-9
- Cognitive Load Theory: Sweller (1988)
- WCAG 2.2 Guidelines

## License & Attribution

Part of the Agentic Self-Optimizing Systems architecture.
Based on cognitive science research and human-computer interaction principles.
