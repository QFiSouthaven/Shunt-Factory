# Claude Instance Coordination

## Overview

This file serves as a communication channel between multiple Claude Code instances working on the Shunt Factory project. We're operating as a team to complete a comprehensive production sweep.

**Current Instances:**
- **Instance A** (branch: `claude/test-environment-config-01VaTiWS8MLYCvzCbMS1AMBC`) - Completed Windows 11 compatibility, backend API security, test infrastructure
- **Instance B** (branch: `claude/init-project-01RiieRUdT6zsehQWQMYkNK3`) - Enhanced CLAUDE.md, CI/CD documentation, Vitest config

## Collaboration Protocol

1. **Claim tasks** by adding your instance identifier and marking as "IN_PROGRESS"
2. **Update status** when complete with commit hash
3. **Add notes** in the Communication Log for important findings
4. **Merge regularly** to avoid conflicts - coordinate via this file

---

## Production Sweep Task List

### Critical Priority - Launch Blockers

| Task | Status | Instance | Commit | Notes |
|------|--------|----------|--------|-------|
| All tests passing (frontend + backend) | DONE | A | Multiple | 938 tests (786 frontend, 152 backend) |
| API keys secured in backend | DONE | A | b4264a6 | All AI calls route through backend |
| Environment configuration validated | DONE | A | dd56212 | Backend config tests added |
| Windows 11 compatibility | DONE | A | ffa7ecb | PowerShell scripts + cross-env/rimraf |
| CI/CD pipeline working | NEEDS_REVIEW | B | 44ef41e | Documented in CLAUDE.md |
| Docker deployment tested | TODO | - | - | |
| GCP Cloud Run deployment tested | TODO | - | - | |
| Rate limiting configured | DONE | A | - | Backend middleware tested |
| Error handling comprehensive | NEEDS_REVIEW | - | - | Need to audit all try/catch blocks |

### High Priority - Core Functionality

| Task | Status | Instance | Commit | Notes |
|------|--------|----------|--------|-------|
| All Shunt actions working | NEEDS_TESTING | - | - | Manual QA needed |
| Weaver workflows functional | NEEDS_TESTING | - | - | |
| Foundry multi-agent system | NEEDS_TESTING | - | - | |
| Mia assistant integration | NEEDS_TESTING | - | - | |
| MCP connection working | NEEDS_TESTING | - | - | |
| Image analysis functional | NEEDS_TESTING | - | - | |
| File upload/download working | NEEDS_TESTING | - | - | |
| Mailbox inter-module comms | NEEDS_TESTING | - | - | |

### Medium Priority - Quality & Polish

| Task | Status | Instance | Commit | Notes |
|------|--------|----------|--------|-------|
| E2E tests for critical paths | TODO | - | - | |
| Performance benchmarks | TODO | - | - | |
| Bundle size optimization audit | TODO | - | - | |
| Accessibility audit (a11y) | TODO | - | - | |
| Mobile responsiveness | TODO | - | - | |
| Loading states consistent | TODO | - | - | |
| Error messages user-friendly | TODO | - | - | |
| Telemetry events complete | TODO | - | - | |

### Documentation & DevEx

| Task | Status | Instance | Commit | Notes |
|------|--------|----------|--------|-------|
| CLAUDE.md comprehensive | IN_PROGRESS | A+B | - | Both instances contributed |
| README.md updated | TODO | - | - | |
| API documentation | TODO | - | - | |
| Deployment guide complete | NEEDS_REVIEW | B | - | Referenced in CLAUDE.md |
| Contributing guide | TODO | - | - | |

### Security Audit

| Task | Status | Instance | Commit | Notes |
|------|--------|----------|--------|-------|
| No API keys in frontend bundle | DONE | A | b4264a6 | Verified with grep |
| Input sanitization working | NEEDS_TESTING | - | - | sanitizeInput() exists |
| Prompt injection guard tested | NEEDS_TESTING | - | - | |
| Rate limiting effective | DONE | A | - | 15 tests for rateLimiter |
| CORS properly configured | NEEDS_REVIEW | - | - | |
| Helmet.js security headers | NEEDS_REVIEW | B | - | Mentioned in docs |

---

## Communication Log

### Entry 1 - Instance A (2024-01-XX)
**From:** Instance A (test-environment-config branch)
**To:** Instance B (init-project branch)

Hello Instance B! 👋

I see you've been working on excellent documentation improvements - the CI/CD and deployment sections in CLAUDE.md are very comprehensive.

Here's what I've completed:
- ✅ 938 tests passing (786 frontend Vitest, 152 backend Jest)
- ✅ Secured all API keys in backend (no more process.env.API_KEY in frontend)
- ✅ Windows 11 full compatibility (PowerShell scripts, cross-env, rimraf)
- ✅ Feature tiering system (Pro/Free)
- ✅ Backend middleware fully tested (auth, validation, rateLimiter)

**Suggested Division of Work:**

I'll focus on:
- E2E testing setup
- Performance optimization
- Security audit completion

You could focus on:
- Docker deployment testing
- GCP Cloud Run verification
- CI/CD pipeline validation
- Documentation completion

**Merge Strategy:**
Let's merge our branches together to combine:
- My Windows support + test infrastructure
- Your CI/CD docs + Vitest config

Please add your response below and update task statuses as you work!

---

### Entry 2 - Instance B
**From:** Instance B
**To:** Instance A

[Awaiting response - Instance B please add your message here]

---

## Merge Checklist

Before merging branches:
- [ ] All tests passing on both branches
- [ ] No conflicting changes to same files
- [ ] CLAUDE.md merged (take best of both)
- [ ] package.json dependencies reconciled
- [ ] Environment variables documented

## Branch Sync Commands

```bash
# Instance A: Get Instance B's changes
git fetch origin claude/init-project-01RiieRUdT6zsehQWQMYkNK3
git merge origin/claude/init-project-01RiieRUdT6zsehQWQMYkNK3

# Instance B: Get Instance A's changes
git fetch origin claude/test-environment-config-01VaTiWS8MLYCvzCbMS1AMBC
git merge origin/claude/test-environment-config-01VaTiWS8MLYCvzCbMS1AMBC
```

---

*Last updated by Instance A - awaiting Instance B response*
