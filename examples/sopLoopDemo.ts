// examples/sopLoopDemo.ts
// Complete demonstration of the Self-Optimizing Product Loop

import { sopService } from '../services/selfOptimizingProduct.service';
import { tdaService } from '../services/testDrivenAgent.service';
import { caiService } from '../services/cognitiveAdaptiveInterface.service';
import {
  UserStoryMetaprompt,
  CAIMetaprompt,
  CognitivePrinciple,
  generateUniqueId
} from '../types/autonomous';

/**
 * ============================================================================
 * DEMO: Self-Optimizing E-Commerce Checkout Flow
 * ============================================================================
 *
 * This demo shows how the SOP Loop autonomously optimizes a checkout flow:
 *
 * 1. Initial TDA: Generate secure payment processing backend
 * 2. Initial CAI: Generate cognitive-optimized checkout UI
 * 3. Deploy & Monitor: Collect real user telemetry
 * 4. Detect Issues: Feedback agent identifies friction (e.g., high drop-off at payment step)
 * 5. Auto-Evolve: TDA adds "express checkout" feature, CAI simplifies UI
 * 6. Repeat: Continuous optimization
 */

async function runSelfOptimizingProductDemo() {
  console.log('\n🚀 SELF-OPTIMIZING PRODUCT DEMO: E-Commerce Checkout\n');
  console.log('=' .repeat(60));

  // ============================================================================
  // STEP 1: Define Initial Backend User Story (TDA)
  // ============================================================================

  console.log('\n📋 STEP 1: Defining Initial Backend (TDA)\n');

  const initialBackendStory: UserStoryMetaprompt = {
    system_role: 'test_driven_agent',
    timestamp: new Date().toISOString(),
    id: generateUniqueId(),
    task_id: 'checkout-backend-v1',
    source_trigger: 'manual',
    user_story: {
      title: 'Implement Secure Payment Processing API',
      description: `
Build a secure payment processing API that:
- Validates payment information (credit card, billing address)
- Processes payments via Stripe integration
- Handles payment failures gracefully
- Stores order records in database
- Sends confirmation emails
      `,
      acceptance_criteria: [
        {
          id: generateUniqueId(),
          given: 'A user submits valid payment information',
          when: 'POST /api/checkout/process is called',
          then: 'Payment is processed, order is created, and confirmation email is sent',
          priority: 1
        },
        {
          id: generateUniqueId(),
          given: 'A user submits invalid card information',
          when: 'POST /api/checkout/process is called',
          then: 'System returns 400 with clear error message',
          priority: 2
        },
        {
          id: generateUniqueId(),
          given: 'Stripe API is down',
          when: 'Payment processing is attempted',
          then: 'System handles error gracefully and notifies user to retry',
          priority: 3
        }
      ],
      priority: 'critical'
    },
    rag_context_queries: [
      'Existing Stripe integration patterns',
      'Error handling middleware',
      'Database models for orders',
      'Email service implementation'
    ],
    technical_constraints: {
      language: 'typescript',
      framework: 'express',
      test_framework: 'jest',
      coding_standards: ['airbnb', 'async-await', 'error-first-callbacks']
    }
  };

  // ============================================================================
  // STEP 2: Define Initial Frontend (CAI)
  // ============================================================================

  console.log('\n🎨 STEP 2: Defining Initial Frontend (CAI)\n');

  const initialFrontendMetaprompt: CAIMetaprompt = {
    system_role: 'cognitive_adaptive_interface',
    timestamp: new Date().toISOString(),
    id: generateUniqueId(),
    objective: 'maximize_conversion',
    business_objective: 'Maximize checkout completion rate while minimizing user friction',
    target_persona: {
      id: generateUniqueId(),
      name: 'Online Shopper',
      demographics: {
        age_range: '25-55',
        occupation: 'General Consumer',
        tech_savviness: 'medium'
      },
      pain_points: [
        'Too many form fields slow down checkout',
        'Unclear error messages cause confusion',
        'No indication of security/trust',
        'Unexpected costs at final step',
        'No option to save payment info'
      ],
      motivations: [
        'Quick and easy checkout',
        'Trust and security',
        'Transparent pricing'
      ],
      goals: [
        'Complete purchase in under 3 minutes',
        'Feel confident about security',
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
          weight: 0.35, // Highest weight - minimize mental effort
          target_metric: 'form_fields_per_step',
          target_value: 3 // Max 3 fields per step
        },
        {
          principle: CognitivePrinciple.FITTS_LAW,
          weight: 0.25,
          target_metric: 'primary_button_size_px',
          target_value: 56 // Large for mobile
        },
        {
          principle: CognitivePrinciple.HICKS_LAW,
          weight: 0.15,
          target_metric: 'payment_options_count',
          target_value: 3 // Limit payment methods
        },
        {
          principle: CognitivePrinciple.RECOGNITION_VS_RECALL,
          weight: 0.15,
          target_metric: 'visible_info_ratio',
          target_value: 0.95 // Show, don't ask
        },
        {
          principle: CognitivePrinciple.PEAK_END_RULE,
          weight: 0.10,
          target_metric: 'confirmation_delight_score',
          target_value: 0.9 // Delightful confirmation
        }
      ]
    },
    initial_generation: true
  };

  // ============================================================================
  // STEP 3: Initialize SOP Loop
  // ============================================================================

  console.log('\n⚙️  STEP 3: Initializing Self-Optimizing Product Loop\n');

  const sopState = await sopService.initialize(
    initialBackendStory,
    initialFrontendMetaprompt
  );

  console.log('✅ Initialization Complete!');
  console.log('\nInitial State:');
  console.log(`  - Backend Status: ${sopState.tda_state?.final_status}`);
  console.log(`  - Frontend Status: ${sopState.cai_state?.status}`);
  console.log(`  - Initial Metrics:`, sopState.product_metrics);
  console.log(`    • User Delight Score: ${sopState.product_metrics.user_delight_score.toFixed(3)}`);
  console.log(`    • Conversion Rate: ${sopState.product_metrics.conversion_rate.toFixed(3)}`);
  console.log(`    • Error Rate: ${sopState.product_metrics.error_rate.toFixed(3)}`);
  console.log(`    • Performance Score: ${sopState.product_metrics.performance_score.toFixed(3)}`);

  // ============================================================================
  // STEP 4: Run Simulation (Simulates Real Users Over Time)
  // ============================================================================

  console.log('\n\n🔄 STEP 4: Running Self-Optimization Simulation (10 Iterations)\n');
  console.log('This simulates real users interacting with the product over time.');
  console.log('The SOP Loop will detect issues and autonomously evolve the product.\n');

  sopService.setLoopInterval(2000); // Speed up for demo (2s between iterations)

  const finalState = await sopService.runSimulation(10);

  // ============================================================================
  // STEP 5: Analyze Evolution
  // ============================================================================

  console.log('\n\n📊 STEP 5: Evolution Analysis\n');
  console.log('=' .repeat(60));

  const history = finalState.evolution_history;

  console.log(`\nTotal Iterations: ${history.length}`);
  console.log(`\nEvolution Timeline:\n`);

  history.forEach((iteration, index) => {
    const delightDelta = iteration.metrics_after.user_delight_score - iteration.metrics_before.user_delight_score;
    const conversionDelta = iteration.metrics_after.conversion_rate - iteration.metrics_before.conversion_rate;

    console.log(`Iteration ${iteration.iteration}:`);
    console.log(`  Time: ${iteration.timestamp}`);
    console.log(`  Changes: ${iteration.changes_made.join(', ')}`);
    console.log(`  User Delight: ${iteration.metrics_before.user_delight_score.toFixed(3)} → ${iteration.metrics_after.user_delight_score.toFixed(3)} (${delightDelta >= 0 ? '+' : ''}${delightDelta.toFixed(3)})`);
    console.log(`  Conversion: ${iteration.metrics_before.conversion_rate.toFixed(3)} → ${iteration.metrics_after.conversion_rate.toFixed(3)} (${conversionDelta >= 0 ? '+' : ''}${conversionDelta.toFixed(3)})`);
    console.log('');
  });

  // ============================================================================
  // STEP 6: Final Metrics
  // ============================================================================

  console.log('\n📈 STEP 6: Final Metrics Comparison\n');
  console.log('=' .repeat(60));

  if (history.length > 0) {
    const initialMetrics = history[0].metrics_before;
    const finalMetrics = finalState.product_metrics;

    console.log('\nInitial → Final:');
    console.log(`  User Delight:  ${initialMetrics.user_delight_score.toFixed(3)} → ${finalMetrics.user_delight_score.toFixed(3)} (${((finalMetrics.user_delight_score - initialMetrics.user_delight_score) * 100).toFixed(1)}% change)`);
    console.log(`  Conversion:    ${initialMetrics.conversion_rate.toFixed(3)} → ${finalMetrics.conversion_rate.toFixed(3)} (${((finalMetrics.conversion_rate - initialMetrics.conversion_rate) * 100).toFixed(1)}% change)`);
    console.log(`  Error Rate:    ${initialMetrics.error_rate.toFixed(3)} → ${finalMetrics.error_rate.toFixed(3)} (${((finalMetrics.error_rate - initialMetrics.error_rate) * 100).toFixed(1)}% change)`);
    console.log(`  Performance:   ${initialMetrics.performance_score.toFixed(3)} → ${finalMetrics.performance_score.toFixed(3)} (${((finalMetrics.performance_score - initialMetrics.performance_score) * 100).toFixed(1)}% change)`);
  }

  // ============================================================================
  // STEP 7: Summary
  // ============================================================================

  console.log('\n\n✨ DEMO COMPLETE\n');
  console.log('=' .repeat(60));
  console.log(`
The Self-Optimizing Product Loop has demonstrated:

✓ Autonomous backend code generation (TDA)
✓ Cognitive-optimized UI generation (CAI)
✓ Real-time telemetry analysis
✓ Automatic issue detection (Feedback Agent)
✓ Autonomous code and UI evolution
✓ Continuous improvement over ${history.length} iterations

Key Insights:
- No human intervention required after initial setup
- Product evolves based on REAL user behavior
- Both backend and frontend optimize together
- Cognitive fitness function ensures UX quality
- Error-forward debugging enables self-healing

This is the future of software development: Products that optimize themselves.
  `);

  console.log('\n' + '=' .repeat(60) + '\n');
}

// ============================================================================
// Run the demo
// ============================================================================

if (require.main === module) {
  runSelfOptimizingProductDemo()
    .then(() => {
      console.log('✅ Demo completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Demo failed:', error);
      process.exit(1);
    });
}

export { runSelfOptimizingProductDemo };
