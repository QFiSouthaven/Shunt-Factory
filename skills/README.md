# Agentic Skills for Claude

This directory contains skill packages specifically designed for Claude to discover and use autonomously.

## Available Skills

### 1. Test-Driven Agent (`test-driven-agent`)
**Use when:** You need to generate production code with comprehensive tests using TDD.

Autonomous code generation with:
- Failing test generation from acceptance criteria
- Minimal implementation code
- Self-healing error recovery
- Full TDD cycle (Red-Green-Refactor)

**Invocation:** Reference this skill when implementing features, APIs, or algorithms that need test coverage.

---

### 2. Cognitive UI Optimizer (`cognitive-ui-optimizer`)
**Use when:** You need to generate or optimize user interfaces based on cognitive science.

UI generation and optimization with:
- 8 cognitive principles (Fitts's Law, Hick's Law, Cognitive Load, etc.)
- Real user telemetry analysis
- Automatic friction detection
- WCAG compliance enforcement
- A/B testing capabilities

**Invocation:** Reference this skill when designing UIs, optimizing conversion funnels, or improving user experience.

---

### 3. Self-Optimizing Product (`self-optimizing-product`)
**Use when:** You need a complete product that evolves autonomously based on user behavior.

Full-stack autonomous product with:
- TDA for backend code generation
- CAI for frontend UI optimization
- Feedback Agent with Graph of Thoughts reasoning
- Continuous evolution loop
- Zero human intervention

**Invocation:** Reference this skill when building MVPs, SaaS products, or any system that should improve itself over time.

---

## Skill Architecture

Each skill follows Anthropic's skill packaging standard:

```
skill-name/
├── SKILL.md           # Primary entry point with YAML frontmatter
├── package.json       # Dependencies (if needed)
└── scripts/           # Executable logic (if needed)
```

### SKILL.md Structure

```yaml
---
name: skill-name
description: When to use this skill and what it does
---

# Skill Title

## Purpose
## When to Use
## How It Works
## Usage Instructions
## Examples
## Advanced Features
## Best Practices
## Troubleshooting
```

## How Claude Discovers Skills

1. **Description Field**: The YAML `description` is the most critical part. It must clearly explain:
   - When to use this skill
   - What problem it solves
   - Key capabilities

2. **Skill Discovery**: An orchestrating agent (or Claude) scans `description` fields to match user intent with appropriate skills.

3. **Usage**: Once discovered, the skill's instructional body provides step-by-step guidance.

## Using These Skills

### As a Human Developer

```bash
# Read the skill documentation
cat skills/test-driven-agent/SKILL.md

# Import the service
import { tdaService } from '../services/testDrivenAgent.service';

# Follow the usage instructions in SKILL.md
```

### As Claude (AI Agent)

When you (Claude) receive a request that matches a skill's description:

1. Reference the skill: "I'll use the test-driven-agent skill for this task"
2. Follow the instructions in the SKILL.md
3. Execute the workflow as documented
4. Return results to the user

## Extending Skills

To create a new skill:

1. Create directory: `skills/your-skill-name/`
2. Write `SKILL.md` with YAML frontmatter
3. Include clear `description` for discovery
4. Provide step-by-step usage instructions
5. Add examples and troubleshooting

## Integration with Main Codebase

These skills are wrappers around core services:

- `test-driven-agent` → `services/testDrivenAgent.service.ts`
- `cognitive-ui-optimizer` → `services/cognitiveAdaptiveInterface.service.ts`
- `self-optimizing-product` → `services/selfOptimizingProduct.service.ts`

The skills provide:
- Discoverable descriptions
- Usage documentation
- Best practices
- Examples

The services provide:
- Implementation logic
- Type definitions
- Core algorithms

## License

MIT - Part of the Agentic Self-Optimizing Systems architecture
