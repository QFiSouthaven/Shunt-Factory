# Multi-Agent Docker Container Architecture

## Overview

This implements the **test workflow.png** architecture with THREE separate AI agents running in Docker containers:

1. **Claude Code Agent** (Yellow layer) - Peer review, validation, research
2. **Gemini 2.0 Agent** (Green layer) - Task orchestration, delegation
3. **Gemini 2.5 Pro Agent** (Purple layer) - Main processing pipeline

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     User clicks Shunt Button                     │
│                  (Amplify, Compress, Make Actionable, etc.)      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Orchestrator Service                          │
│                   (Node.js + Express)                            │
│  - Receives Shunt action from frontend                          │
│  - Routes to appropriate agent workflow                          │
│  - Manages workflow state in PostgreSQL                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│   Gemini 2.0 Agent      │   │  PostgreSQL Database    │
│   (Docker Container)    │   │  (Workflow State)       │
│                         │   │                         │
│ - Task delegation       │   │ - Stores workflow steps │
│ - Peer review          │◄──┤ - Agent communication   │
│ - Orchestration        │   │ - Task history          │
└───────────┬─────────────┘   └─────────────────────────┘
            │                             ▲
            │ delegates                   │
            ▼                             │
┌─────────────────────────┐              │
│  Gemini 2.5 Pro Agent   │              │
│  (Docker Container)     │              │
│                         │              │
│ - Main processing       │──────────────┘
│ - Research              │   stores state
│ - Reflect               │
│ - Conclude              │
│ - Refinement            │
└───────────┬─────────────┘
            │
            │ sends for validation
            ▼
┌─────────────────────────┐
│   Claude Code Agent     │
│   (Docker Container)    │
│   (Anthropic API)       │
│                         │
│ - Peer review           │
│ - Validation            │
│ - Code analysis         │
│ - Final approval        │
└───────────┬─────────────┘
            │
            │ validated result
            ▼
┌─────────────────────────┐
│    Orchestrator         │
│  (Aggregates results)   │
└───────────┬─────────────┘
            │
            ▼
        Frontend UI
```

## Components

### 1. Orchestrator Service
- **Port**: 8090
- **Role**: Workflow coordination
- **Stack**: Node.js, Express, TypeScript
- **Responsibilities**:
  - Accept Shunt action from frontend
  - Route to appropriate agents
  - Manage workflow state
  - Aggregate results

### 2. Claude Code Agent
- **Port**: 8091
- **Role**: Peer review & validation
- **API**: Anthropic Claude API
- **Responsibilities**:
  - Code review
  - Validation
  - Technical critique
  - Final approval

### 3. Gemini 2.0 Agent
- **Port**: 8092
- **Role**: Task orchestration
- **API**: Google Gemini 2.0 API
- **Responsibilities**:
  - Task delegation
  - High-level orchestration
  - Peer review coordination

### 4. Gemini 2.5 Pro Agent
- **Port**: 8093
- **Role**: Main processing
- **API**: Google Gemini 2.5 Pro API
- **Responsibilities**:
  - Deep reasoning
  - Research & analysis
  - Content generation
  - Collaborative refinement

### 5. PostgreSQL Database
- **Port**: 5432
- **Role**: Workflow state storage
- **Data**:
  - Workflow steps
  - Agent communications
  - Task history
  - Intermediate results

## Workflow Execution

### Example: User clicks "Amplify" button

```
1. Frontend → POST /api/workflow/execute
   {
     "action": "AMPLIFY",
     "text": "User input text",
     "context": "..."
   }

2. Orchestrator creates workflow:
   - workflow_id: uuid
   - action: AMPLIFY
   - status: in_progress

3. Orchestrator → Gemini 2.0 Agent
   POST /delegate
   → Gemini 2.0 analyzes and creates task plan

4. Orchestrator → Gemini 2.5 Pro Agent
   POST /process
   → Processes through: task → critique → research → reflect → conclude

5. Orchestrator → Claude Code Agent
   POST /review
   → Peer reviews the output

6. Orchestrator checks agreement:
   - Compare Gemini 2.5 Pro output vs Claude Code feedback
   - If agreement > 80%: PASS
   - If not: Reconcile and retry

7. Orchestrator returns final result to frontend
```

## API Endpoints

### Orchestrator (8090)
- `POST /api/workflow/execute` - Start new workflow
- `GET /api/workflow/:id` - Get workflow status
- `GET /api/workflow/:id/steps` - Get all steps

### Claude Agent (8091)
- `POST /review` - Peer review content
- `POST /validate` - Validate output
- `POST /analyze` - Deep code analysis

### Gemini 2.0 Agent (8092)
- `POST /delegate` - Delegate task
- `POST /orchestrate` - Orchestrate workflow
- `POST /peer-review` - Peer review

### Gemini 2.5 Pro Agent (8093)
- `POST /process` - Main processing
- `POST /research` - Research task
- `POST /reflect` - Reflection
- `POST /conclude` - Generate conclusion
- `POST /refine` - Collaborative refinement

## Environment Variables

```env
# Orchestrator
DATABASE_URL=postgresql://postgres:password@database:5432/workflow_db
CLAUDE_AGENT_URL=http://claude-agent:8091
GEMINI_2_0_AGENT_URL=http://gemini-2-0-agent:8092
GEMINI_2_5_AGENT_URL=http://gemini-2-5-agent:8093

# Claude Agent
ANTHROPIC_API_KEY=your_key_here

# Gemini Agents
GEMINI_API_KEY=your_key_here
```

## Running the System

```bash
# Start all containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all containers
docker-compose down

# Rebuild containers
docker-compose up --build
```

## Development

```bash
# Run individual agent for testing
cd claude-agent
npm install
npm run dev

# Test agent endpoint
curl -X POST http://localhost:8091/review \
  -H "Content-Type: application/json" \
  -d '{"text": "test content", "action": "AMPLIFY"}'
```

## Monitoring

Each agent exposes health endpoints:
- `GET /health` - Basic health check
- `GET /metrics` - Prometheus metrics

## Deployment

For production:
1. Use Kubernetes instead of Docker Compose
2. Add Redis for caching
3. Add message queue (RabbitMQ/Kafka) for async communication
4. Scale agents horizontally based on load
5. Add circuit breakers and retry logic

## Testing

```bash
# Run integration tests
npm run test:integration

# Test workflow end-to-end
npm run test:workflow
```
