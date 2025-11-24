# Multi-Agent Docker Containers - Quick Start

## What This Is

A **true multi-agent system** where **Claude Code**, **Gemini 2.0**, and **Gemini 2.5 Pro** run in separate Docker containers and collaborate on tasks based on which Shunt button the user presses.

## Architecture

```
User clicks Shunt button (e.g., "Amplify")
        ↓
Frontend sends request to Orchestrator
        ↓
┌───────────────────────────────────────────┐
│         Orchestrator (Port 8090)          │
│  Coordinates the 3-agent workflow         │
└─────────────┬─────────────────────────────┘
              │
    ┌─────────┴──────────┬──────────────┐
    ↓                    ↓              ↓
┌─────────┐      ┌──────────┐    ┌─────────────┐
│ Gemini  │      │ Gemini   │    │   Claude    │
│  2.0    │      │ 2.5 Pro  │    │    Code     │
│ (8092)  │      │  (8093)  │    │   (8091)    │
└─────────┘      └──────────┘    └─────────────┘
Task             Main             Peer Review
Delegation       Processing       & Validation
```

## Prerequisites

- Docker & Docker Compose installed
- Anthropic API key (for Claude)
- Google Gemini API key (for Gemini 2.0 & 2.5 Pro)

## Quick Setup (5 Minutes)

### 1. Set Up Environment

```bash
cd multi-agent-containers
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
GEMINI_API_KEY=your-gemini-key-here
```

### 2. Start All Containers

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database (port 5432)
- Claude Code agent (port 8091)
- Gemini 2.0 agent (port 8092)
- Gemini 2.5 Pro agent (port 8093)
- Orchestrator (port 8090)

### 3. Check Health

```bash
# Check all services are running
docker-compose ps

# Check orchestrator health
curl http://localhost:8090/health

# Check individual agents
curl http://localhost:8091/health  # Claude
curl http://localhost:8092/health  # Gemini 2.0
curl http://localhost:8093/health  # Gemini 2.5 Pro
```

### 4. Test the Workflow

```bash
curl -X POST http://localhost:8090/api/workflow/execute \
  -H "Content-Type: application/json" \
  -d '{
    "action": "AMPLIFY",
    "text": "Hello world",
    "context": "Make it more impressive"
  }'
```

You should get back:
```json
{
  "success": true,
  "workflowId": "uuid-here",
  "finalOutput": "The amplified content...",
  "agreement": true,
  "validationPassed": true,
  "steps": 6
}
```

### 5. Update Frontend

In your `.env.local`:
```env
VITE_ORCHESTRATOR_URL=http://localhost:8090
```

## How It Works

When a user clicks a Shunt button (e.g., "Amplify"), the workflow executes:

1. **Gemini 2.0** (Orchestrator) - Analyzes and delegates the task
2. **Gemini 2.5 Pro** (Processor) - Processes through:
   - Critique
   - Chain of Thought
   - Research (if needed)
   - Reflection
   - Conclusion
3. **Claude Code** (Validator) - Peer reviews and validates
4. **Orchestrator** - Checks agreement
5. **Gemini 2.5 Pro** (Refiner) - Refines if needed
6. **Final Output** - Returned to user

## Workflow Examples by Action

### AMPLIFY
- Gemini 2.0: "Amplify this content"
- Gemini 2.5 Pro: Expands and enriches
- Claude Code: Reviews for quality

### COMPRESS
- Gemini 2.0: "Compress to essentials"
- Gemini 2.5 Pro: Condenses intelligently
- Claude Code: Validates completeness

### MAKE_ACTIONABLE
- Gemini 2.0: "Convert to actionable items"
- Gemini 2.5 Pro: Deep research + action plan
- Claude Code: Reviews feasibility

### BUILD_A_SKILL
- Gemini 2.0: "Build skill package"
- Gemini 2.5 Pro: Creates skill architecture
- Claude Code: Code review + validation

## Viewing Logs

```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f claude-agent
docker-compose logs -f gemini-2-0-agent
docker-compose logs -f gemini-2-5-agent
docker-compose logs -f orchestrator
```

## Stopping the System

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (database will be wiped)
docker-compose down -v
```

## Development

### Rebuild After Code Changes

```bash
docker-compose up --build
```

### Run Individual Agent Locally

```bash
cd claude-agent
npm install
ANTHROPIC_API_KEY=your-key npm run dev
```

## Troubleshooting

### Containers won't start

```bash
# Check logs
docker-compose logs

# Restart
docker-compose restart
```

### "Orchestrator not available" error

1. Check containers are running: `docker-compose ps`
2. Check health: `curl http://localhost:8090/health`
3. Check logs: `docker-compose logs orchestrator`

### Database connection errors

```bash
# Restart database
docker-compose restart database

# Check database logs
docker-compose logs database
```

## Database Access

```bash
# Connect to PostgreSQL
docker exec -it workflow-database psql -U postgres -d workflow_db

# View workflows
SELECT * FROM workflows ORDER BY created_at DESC LIMIT 10;

# View workflow steps
SELECT * FROM workflow_steps WHERE workflow_id = 'your-workflow-id' ORDER BY step_number;
```

## Performance

- **Simple actions** (Amplify, Compress): ~5-10 seconds
- **Complex actions** (Make Actionable, Build Skill): ~15-30 seconds
- Depends on API response times

## Cost Tracking

Each workflow step logs token usage:
```sql
SELECT
  w.action,
  ws.agent,
  SUM(ws.tokens_used) as total_tokens
FROM workflows w
JOIN workflow_steps ws ON w.id = ws.workflow_id
GROUP BY w.action, ws.agent;
```

## Integration with Frontend

Update your Shunt component to use the multi-agent service:

```typescript
import { performMultiAgentShunt } from './services/multiAgentContainerService';

// Instead of direct Gemini call:
const result = await performMultiAgentShunt(text, action, model, context);
```

## Next Steps

- Monitor workflow success rates
- Tune agent prompts for better collaboration
- Add caching layer (Redis)
- Scale horizontally with Kubernetes
- Add circuit breakers for resilience

## Support

Check logs first:
```bash
docker-compose logs -f orchestrator
```

View workflow details:
```bash
curl http://localhost:8090/api/workflow/YOUR_WORKFLOW_ID
```
