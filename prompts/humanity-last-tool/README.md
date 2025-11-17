# Humanity's Last Tool - Complete Prompt Template Suite

## Overview

**Humanity's Last Tool** is an elite, multi-disciplinary AI agent task force designed to conceptualize, architect, build, and deploy critical systems with unparalleled precision. This suite represents a perfect analogue to a full-stack software development team, with each agent being an absolute master in their respective domain.

---

## Team Composition

This task force consists of **6 specialized agents**, each representing a governing body and bringing fundamental strengths to the operational lifecycle:

| # | Agent Name | Governing Body | SDLC Role | Core Mandate |
|---|------------|----------------|-----------|--------------|
| 1 | **Sovereign Architect** | The Sovereign Council | Product Owner / Lead Strategist | Define ultimate vision, scope, and strategic purpose |
| 2 | **Core Warden** | The Core Restoration Unit | Backend Architect / Systems Designer | Design and safeguard foundational architecture with stability and resilience |
| 3 | **Initiative Executor** | The Swift Initiative | Lead Developer / Senior Engineer | Rapidly translate designs into functional, high-quality code |
| 4 | **Empirical Verifier** | The Empirical Authority | QA Lead / Test Engineer | Objectively validate every component through data-driven testing |
| 5 | **Praxis Engineer** | The Praxis Planners | DevOps / Site Reliability Engineer | Bridge development and deployment through operational actualization |
| 6 | **Veil Guardian** | The Order of the Veil | Security Engineer / DevSecOps | Protect systems from all threats through layered, proactive defense |

---

## Workflow Architecture

Each agent follows the **Foundry 4-Phase Process**:

### Phase 1: AUDIT
- **Purpose:** Analyze project goal from the agent's unique domain perspective
- **Model:** gemini-2.5-flash
- **Output:** One-paragraph audit findings identifying key considerations and risks

### Phase 2: DESIGN
- **Purpose:** Create initial high-level design proposal based on audit findings
- **Model:** gemini-2.5-pro
- **Output:** Comprehensive markdown design proposal with self-assessed score (0-100)

### Phase 3: REVIEW (2 Rounds)
- **Step 3A - Peer Review:** Review another agent's design and provide constructive feedback
  - **Model:** gemini-2.5-flash
  - **Output:** One paragraph of actionable feedback
- **Step 3B - Refinement:** Incorporate peer feedback to refine own design
  - **Model:** gemini-2.5-pro
  - **Output:** Improved design with new self-assessed score

### Phase 4: CONVERGENCE
- **Purpose:** Compare all final designs and select the highest-scoring proposal
- **Output:** Final converged design representing the team's best collective solution

---

## Agent Specializations

### 1. Sovereign Architect
**Specialty:** Strategic vision, requirements definition, and mission alignment

**Focus Areas:**
- Strategic Vision & Scope Definition
- Requirements Backlog & User Stories
- Success Metrics & KPIs
- Stakeholder Alignment
- High-level Roadmapping

**Key Deliverables:** Product vision, prioritized requirements, acceptance criteria, communication plan

---

### 2. Core Warden
**Specialty:** Backend architecture, database design, API contracts, and system resilience

**Focus Areas:**
- System Architecture & Component Design
- Database Schema & Data Integrity
- API Specifications (REST/GraphQL)
- Technology Stack Selection
- Scalability & Performance Strategy

**Key Deliverables:** System architecture diagram, database schema, API contracts, scalability plan

---

### 3. Initiative Executor
**Specialty:** Feature implementation, clean code practices, prototyping, and iterative development

**Focus Areas:**
- Feature Breakdown & Sprint Planning
- Implementation Strategy & Design Patterns
- Code Organization & Module Structure
- Development Standards & Best Practices
- Unit Testing & Code Review

**Key Deliverables:** Sprint plan, implementation roadmap, coding standards, refactoring strategy

---

### 4. Empirical Verifier
**Specialty:** Test strategy, automated testing, defect analysis, and quality metrics

**Focus Areas:**
- Comprehensive Test Planning (Unit, Integration, E2E, Regression)
- Automated Testing Framework
- Test Coverage Goals
- Defect Management & Triage
- Performance & Load Testing

**Key Deliverables:** Test plan, automation strategy, quality metrics, acceptance criteria validation

---

### 5. Praxis Engineer
**Specialty:** Infrastructure as code, CI/CD pipelines, system monitoring, and release management

**Focus Areas:**
- Infrastructure as Code (IaC)
- CI/CD Pipeline Architecture
- Containerization & Orchestration
- System Monitoring & Observability
- Release Management & Disaster Recovery

**Key Deliverables:** IaC templates, CI/CD pipelines, monitoring dashboards, deployment strategy

---

### 6. Veil Guardian
**Specialty:** Threat modeling, security architecture, vulnerability analysis, and incident response

**Focus Areas:**
- Security Architecture & Layered Defense
- Threat Model & Attack Surface Analysis
- Authentication & Authorization Framework
- Data Encryption Strategy
- Security Testing & Compliance

**Key Deliverables:** Security architecture, threat model, compliance plan, incident response procedures

---

## Total Resource Usage Per Agent

Each agent makes **5 AI API calls** during the complete workflow:

1. **1 Audit** (gemini-2.5-flash)
2. **1 Initial Design** (gemini-2.5-pro)
3. **2 Peer Reviews** (gemini-2.5-flash × 2)
4. **2 Refinements** (gemini-2.5-pro × 2)

**Total for full 6-agent team: 30 AI calls**
- 18 calls using gemini-2.5-flash (Audit + Reviews)
- 12 calls using gemini-2.5-pro (Design + Refinements)

---

## Integration with Foundry

To integrate "Humanity's Last Tool" into the Foundry system:

### 1. Update Agent Names Array
```typescript
const AGENT_NAMES: AgentName[] = [
  'Sovereign Architect',
  'Core Warden',
  'Initiative Executor',
  'Empirical Verifier',
  'Praxis Engineer',
  'Veil Guardian'
];
```

### 2. Update Agent Initialization
```typescript
const initialAgents: FoundryAgent[] = AGENT_NAMES.map(name => ({
  name,
  status: 'Idle',
  role: getRoleForAgent(name),
  goal: getGoalForAgent(name),
  backstory: getBackstoryForAgent(name),
  allowedTools: ['read_file', 'search_codebase'],
}));
```

### 3. Update Specialty Mapping
```typescript
const getSpecialtyForAgent = (name: AgentName): string => {
  switch(name) {
    case 'Sovereign Architect': return 'strategic vision, requirements definition, and mission alignment';
    case 'Core Warden': return 'backend architecture, database design, API contracts, and system resilience';
    case 'Initiative Executor': return 'feature implementation, clean code practices, prototyping, and iterative development';
    case 'Empirical Verifier': return 'test strategy, automated testing, defect analysis, and quality metrics';
    case 'Praxis Engineer': return 'infrastructure as code, CI/CD pipelines, system monitoring, and release management';
    case 'Veil Guardian': return 'threat modeling, security architecture, vulnerability analysis, and incident response';
    default: return 'system expertise';
  }
};
```

---

## Template Files

Each agent has a dedicated prompt template file:

1. [`01-sovereign-architect.md`](./01-sovereign-architect.md) - Product vision & requirements
2. [`02-core-warden.md`](./02-core-warden.md) - Backend architecture & system design
3. [`03-initiative-executor.md`](./03-initiative-executor.md) - Implementation & development
4. [`04-empirical-verifier.md`](./04-empirical-verifier.md) - Quality assurance & testing
5. [`05-praxis-engineer.md`](./05-praxis-engineer.md) - DevOps & infrastructure
6. [`06-veil-guardian.md`](./06-veil-guardian.md) - Security & compliance

---

## Usage

To run a "Humanity's Last Tool" workflow in Foundry:

1. **Set Project Goal** - Define the mission objective
2. **Add Project Context** - Upload relevant files and documentation
3. **Start Forging** - Initiate the 4-phase workflow
4. **Review Results** - Examine the final converged design from the winning agent

The system will automatically:
- Run all 6 agents through Audit → Design → Review → Refinement cycles
- Generate comprehensive designs from each perspective
- Select the highest-scoring final design
- Display the complete workflow log and agent activities

---

## Philosophy

The name of each agent's governing body does not define their personality, but rather the **fundamental strength** they bring to the operational lifecycle. Together, they form a complete, self-sufficient development team capable of handling any software project from inception to long-term maintenance.

**Humanity's Last Tool** represents the pinnacle of AI-driven software development - a team that combines strategic vision, technical excellence, rapid execution, rigorous validation, operational reliability, and proactive security into a unified force.

---

**Version:** 1.0.0
**Created:** 2025-11-17
**License:** MIT
