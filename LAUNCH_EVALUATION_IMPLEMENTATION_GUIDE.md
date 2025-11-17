# Product Launch Evaluation: Implementation Guide & Templates

## Quick Start (5 Minutes to First Assessment)

### Step 1: Choose Your Launch Type
- **Internal MVP** → Use "Fast-Track Template" (20 items, 2-week launch)
- **Public Beta** → Use "Standard Template" (50 items, 4-week launch)
- **GA with SLA** → Use "Full Framework" (100 items, 8-week launch)

### Step 2: Assemble Your Review Team
- Product Manager (owner)
- Engineering Lead (technical validation)
- Security Engineer (if customer-facing)
- Operations Lead (deployment/support)
- Executive Sponsor (final go/no-go)

### Step 3: Complete Assessment (2 hours)
- Each team member scores their dimension independently
- Compare scores in review meeting
- Identify discrepancies (often reveals blind spots)
- Agree on final score

### Step 4: Make Decision
- Score ≥85 → Launch approved
- Score 75-84 → Limited launch (beta only)
- Score <75 → Block launch, iterate 2-4 weeks

---

## Template 1: Fast-Track Launch Evaluation (Internal MVP)

**Use When:** Internal tool, <100 users, 95% uptime acceptable, <2 week launch timeline

### Pre-Launch Checklist (20 Critical Items)

**TECHNICAL (10 items)**
- [ ] Load tested at expected peak traffic (even if small)
- [ ] API authentication implemented (API keys minimum)
- [ ] Rate limiting configured (prevent cost runaway)
- [ ] Input validation enforced (max size, required fields)
- [ ] Monitoring configured (latency, errors, cost)
- [ ] Alerts configured with owner (not just logs)
- [ ] Rollback procedure documented (even if manual)
- [ ] Health check endpoint implemented (/health or /status)
- [ ] Error messages helpful (not just "500 error")
- [ ] Zero critical (P0) bugs in staging

**OPERATIONAL (5 items)**
- [ ] On-call person defined (who gets paged?)
- [ ] Deployment procedure documented (repeatable)
- [ ] Support channel defined (email/Slack/etc.)
- [ ] Incident response plan (who does what when it breaks)
- [ ] Rollback tested once in staging

**BUSINESS/USER (5 items)**
- [ ] User documentation complete (README minimum)
- [ ] Success metrics defined (what does "working" mean?)
- [ ] User testing with ≥3 target users
- [ ] Feedback mechanism (how users report issues)
- [ ] Executive sponsor approved launch

**GO/NO-GO DECISION:**
- 20/20 items: ✅ Launch
- 18-19/20: ✅ Launch with risk acknowledgment
- 16-17/20: ⚠️ Launch to <10 internal users only
- <16/20: ❌ Do not launch

**Timeline:** If <16 items checked, expect +1-2 weeks to address gaps.

---

## Template 2: Standard Beta Launch Evaluation

**Use When:** Public beta, 100-10K users, 99% uptime target, 4-week launch timeline

### Scoring Worksheet

#### DIMENSION 1: Technical Readiness (25 points)

**Performance (5 pts)**
- [ ] Load test at 3x peak (2 pts)
- [ ] p95 latency meets SLO (2 pts)
- [ ] 24-hour soak test passed (1 pt)

**Security (8 pts)**
- [ ] Authentication implemented (2 pts)
- [ ] Rate limiting configured (2 pts)
- [ ] Input validation enforced (2 pts)
- [ ] Secrets in Secret Manager (1 pt)
- [ ] Dependency CVE scan clean (1 pt)

**Reliability (7 pts)**
- [ ] SLO defined (1 pt)
- [ ] Multi-zone deployment (2 pts)
- [ ] Health checks configured (1 pt)
- [ ] Rollback tested <5min (2 pts)
- [ ] Dependency failure tested (1 pt)

**Observability (5 pts)**
- [ ] Metrics: latency, errors, throughput (2 pts)
- [ ] Structured logging (1 pt)
- [ ] Alerts with runbooks (2 pts)

**SUBTOTAL: ___ / 25**

---

#### DIMENSION 2: User Readiness (15 points)

**UX Validation (8 pts)**
- [ ] User testing ≥10 target users (3 pts)
- [ ] Onboarding <10 minutes (2 pts)
- [ ] Error messages helpful (2 pts)
- [ ] Mobile/responsive tested (1 pt)

**Documentation (7 pts)**
- [ ] User docs (getting started, FAQs) (3 pts)
- [ ] API docs if applicable (2 pts)
- [ ] Support channel defined (1 pt)
- [ ] Feedback mechanism (1 pt)

**SUBTOTAL: ___ / 15**

---

#### DIMENSION 3: Operational Readiness (20 points)

**Incident Management (10 pts)**
- [ ] On-call rotation defined (3 pts)
- [ ] Runbooks for common failures (3 pts)
- [ ] Communication plan (2 pts)
- [ ] Post-mortem template (2 pts)

**Deployment (10 pts)**
- [ ] Automated deployment (3 pts)
- [ ] Tested in staging (2 pts)
- [ ] Rollback <5min (3 pts)
- [ ] Feature flags (2 pts)

**SUBTOTAL: ___ / 20**

---

#### DIMENSION 4: Business Readiness (10 points)

- [ ] Value proposition validated (3 pts)
- [ ] Target persona defined (2 pts)
- [ ] Success metrics defined (2 pts)
- [ ] GTM assets ready (3 pts)

**SUBTOTAL: ___ / 10**

---

#### DIMENSION 5: Risk & Compliance (10 points)

**Risk (5 pts)**
- [ ] Pre-mortem conducted (2 pts)
- [ ] Top 5 risks identified (1 pt)
- [ ] Cost overrun protection (2 pts)

**Legal (5 pts)**
- [ ] ToS/Privacy updated (2 pts)
- [ ] GDPR/compliance validated (2 pts)
- [ ] Legal review if needed (1 pt)

**SUBTOTAL: ___ / 10**

---

### TOTAL SCORE: ___ / 80

**Convert to 100-point scale:** (Score / 80) × 100 = ___

**GO/NO-GO DECISION:**
- 85-100: ✅ **Launch to beta**
- 75-84: ⚠️ **Limited beta** (<1000 users, extend 2 weeks)
- 65-74: ⚠️ **Internal alpha only**
- <65: ❌ **Block launch** (iterate 3-4 weeks)

---

## Template 3: Executive Launch Review (1-Page Summary)

**Use When:** Presenting to executive sponsor for go/no-go approval

---

### PRODUCT LAUNCH READINESS REVIEW

**Product:** _____________________
**Launch Date:** _____________________
**Review Date:** _____________________
**Owner:** _____________________
**Executive Sponsor:** _____________________

---

### LAUNCH READINESS SCORE: ___ / 100

| Dimension | Score | Status | Top Risk |
|-----------|-------|--------|----------|
| Technical | ___/25 | 🟢🟡🔴 | ___________ |
| User | ___/15 | 🟢🟡🔴 | ___________ |
| Operational | ___/20 | 🟢🟡🔴 | ___________ |
| Business | ___/10 | 🟢🟡🔴 | ___________ |
| Risk/Legal | ___/10 | 🟢🟡🔴 | ___________ |

🟢 = ≥80% | 🟡 = 60-79% | 🔴 = <60%

---

### RECOMMENDATION: ☐ LAUNCH  ☐ LIMITED LAUNCH  ☐ DELAY

**Rationale:**
- **If Launch:** Score ≥85, all BLOCKERS resolved, risks acceptable
- **If Limited:** Score 75-84, launch to <1000 users, resolve gaps in 2 weeks
- **If Delay:** Score <75 OR critical BLOCKER present

---

### TOP 3 RISKS

1. **[Risk Category]:** [Description]
   - **Likelihood:** High / Medium / Low
   - **Impact:** High / Medium / Low
   - **Mitigation:** [Action taken]

2. **[Risk Category]:** [Description]
   - **Likelihood:** High / Medium / Low
   - **Impact:** High / Medium / Low
   - **Mitigation:** [Action taken]

3. **[Risk Category]:** [Description]
   - **Likelihood:** High / Medium / Low
   - **Impact:** High / Medium / Low
   - **Mitigation:** [Action taken]

---

### ROLLOUT PLAN

**Phase 1: Internal Alpha** (Week 1)
- Users: 10-50 employees
- Goal: Find critical bugs
- Success: Zero P0 bugs after 3 days

**Phase 2: Closed Beta** (Week 2-3)
- Users: 100-500 invited users
- Goal: Validate value prop
- Success: NPS >30, <2% error rate

**Phase 3: Open Beta** (Week 4-6)
- Users: 1,000-5,000
- Goal: Stress test, refine UX
- Success: 99% uptime, p95 <SLO

**Phase 4: GA** (Week 7+)
- Users: Unlimited
- Goal: Scale
- Success: All SLOs met, cost per user <target

---

### ROLLBACK PLAN

**If launch fails:**
1. **Detection:** [How we know - alerts, metrics, user reports]
2. **Decision:** [Who decides to rollback - on-call, PM, exec?]
3. **Execution:** [How to rollback - blue/green switch, feature flag, redeploy?]
4. **Time:** [Target time-to-rollback - 5 min? 30 min? 2 hours?]
5. **Communication:** [How we notify users - status page, email, in-app?]

---

### POST-LAUNCH METRICS (30-Day Targets)

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Availability (uptime) | ___% | ___% | 🟢🟡🔴 |
| p95 Latency | ___ms | ___ms | 🟢🟡🔴 |
| Error Rate | ___% | ___% | 🟢🟡🔴 |
| User Adoption (DAU) | ___ | ___ | 🟢🟡🔴 |
| Support Tickets | ___ | ___ | 🟢🟡🔴 |
| NPS / CSAT | ___ | ___ | 🟢🟡🔴 |
| Cost per User | $___ | $___ | 🟢🟡🔴 |

---

### SIGN-OFF

**Product Manager:** _________________ Date: _____
**Engineering Lead:** _________________ Date: _____
**Operations Lead:** _________________ Date: _____
**Executive Sponsor:** _________________ Date: _____

**Decision:** ☐ APPROVED  ☐ APPROVED WITH CONDITIONS  ☐ REJECTED

**Conditions (if applicable):**
- _________________________________________
- _________________________________________

---

## Template 4: Pre-Mortem Worksheet

**Use When:** 2-3 weeks before launch, gather team to imagine failure

### PRE-MORTEM: "It's 30 days post-launch. We failed. Why?"

**Instructions:**
1. Each team member independently writes 3-5 failure scenarios
2. Group shares and clusters similar failures
3. Vote on top 5 most likely failures
4. Create mitigation plan for each

---

### FAILURE SCENARIO BRAINSTORM

**Team Member:** ___________________

**Imagine the launch failed catastrophically. What happened?**

1. _________________________________________
2. _________________________________________
3. _________________________________________
4. _________________________________________
5. _________________________________________

---

### TOP 5 FAILURE SCENARIOS (After Team Discussion)

#### Failure #1: _________________________________________

**Why it happened:**
- Root cause: _________________________________________
- Warning signs we missed: _________________________________________

**Likelihood:** ☐ High (>30%)  ☐ Medium (10-30%)  ☐ Low (<10%)

**Impact:** ☐ Catastrophic (company-threatening)  ☐ Severe (major revenue/reputation loss)  ☐ Moderate (recoverable)

**Mitigation Plan:**
- Prevention: [What can we do NOW to prevent this?]
- Detection: [How will we know if this is starting to happen?]
- Response: [If it happens, what's the playbook?]

**Owner:** ___________________
**Deadline:** ___________________

---

#### Failure #2: _________________________________________
[Repeat structure above]

---

#### Failure #3: _________________________________________
[Repeat structure above]

---

#### Failure #4: _________________________________________
[Repeat structure above]

---

#### Failure #5: _________________________________________
[Repeat structure above]

---

### COMMON PRE-MORTEM FINDINGS (Learn from others)

**Category: Technical**
- "Database couldn't handle write volume, site crashed"
- "Third-party API we depend on went down, our service failed"
- "Auto-scaling didn't trigger fast enough, requests timed out"
- "Memory leak in production caused cascading failures"

**Category: User**
- "Users didn't understand the value prop, never came back"
- "Onboarding too complex, 80% dropped off"
- "Mobile app had critical bug we didn't test on Android"
- "Users exploited feature in unintended way, created chaos"

**Category: Operational**
- "On-call got overwhelmed, response time >2 hours"
- "Rollback procedure didn't work, took 6 hours to recover"
- "We didn't have enough support coverage, tickets piled up"
- "Documentation was out of date, confused users and support"

**Category: Business**
- "We launched same week as competitor, got no attention"
- "Pricing was too high, no conversions"
- "We targeted wrong persona, no product-market fit"
- "Our messaging was unclear, press coverage was negative"

**Category: External**
- "AWS region outage took us down for 8 hours"
- "Security vulnerability disclosed, had to take site offline"
- "Legal/compliance issue we didn't anticipate, forced shutdown"
- "Key team member quit mid-launch, knowledge loss"

---

## Template 5: Post-Launch Retrospective (90 Days)

**Use When:** 90 days post-launch, evaluate what we predicted vs. reality

### POST-LAUNCH RETROSPECTIVE

**Product:** _____________________
**Launch Date:** _____________________
**Retrospective Date:** (Launch + 90 days)
**Attendees:** _____________________

---

### PREDICTED VS. ACTUAL PERFORMANCE

**Pre-Launch Readiness Score:** ___ / 100

| Dimension | Pre-Launch Score | Predicted Success? | Actual Success? | Variance Explanation |
|-----------|------------------|-------------------|-----------------|---------------------|
| Technical | ___/25 | 🟢🟡🔴 | 🟢🟡🔴 | ________________ |
| User | ___/15 | 🟢🟡🔴 | 🟢🟡🔴 | ________________ |
| Operational | ___/20 | 🟢🟡🔴 | 🟢🟡🔴 | ________________ |
| Business | ___/10 | 🟢🟡🔴 | 🟢🟡🔴 | ________________ |
| Risk/Legal | ___/10 | 🟢🟡🔴 | 🟢🟡🔴 | ________________ |

---

### KEY METRICS: PREDICTED VS. ACTUAL

| Metric | Pre-Launch Prediction | 30-Day Actual | 90-Day Actual | Variance |
|--------|----------------------|---------------|---------------|----------|
| Uptime | ___% | ___% | ___% | ___% |
| p95 Latency | ___ms | ___ms | ___ms | ___ms |
| Error Rate | ___% | ___% | ___% | ___% |
| DAU/MAU | ___ | ___ | ___ | ___% |
| NPS/CSAT | ___ | ___ | ___ | ___ |
| Support Tickets/Day | ___ | ___ | ___ | ___% |
| Cost per User | $___ | $___ | $___ | ___% |
| P0/P1 Bugs | ___ | ___ | ___ | ___ |

---

### WHAT WENT WELL (Keep Doing)

1. _________________________________________
   - Why it worked: _________________________
   - Pattern to repeat: _____________________

2. _________________________________________
   - Why it worked: _________________________
   - Pattern to repeat: _____________________

3. _________________________________________
   - Why it worked: _________________________
   - Pattern to repeat: _____________________

---

### WHAT WENT WRONG (Learn From)

1. _________________________________________
   - Why it failed: _________________________
   - What we'll change: _____________________
   - Who owns improvement: _________________

2. _________________________________________
   - Why it failed: _________________________
   - What we'll change: _____________________
   - Who owns improvement: _________________

3. _________________________________________
   - Why it failed: _________________________
   - What we'll change: _____________________
   - Who owns improvement: _________________

---

### FRAMEWORK CALIBRATION

**Dimensions We Overestimated (Scored too high pre-launch):**
- [ ] Technical - (We thought ___ but reality was ___)
- [ ] User - (We thought ___ but reality was ___)
- [ ] Operational - (We thought ___ but reality was ___)
- [ ] Business - (We thought ___ but reality was ___)
- [ ] Risk/Legal - (We thought ___ but reality was ___)

**Dimensions We Underestimated (Scored too low pre-launch):**
- [ ] Technical - (We worried about ___ but it was fine)
- [ ] User - (We worried about ___ but it was fine)
- [ ] Operational - (We worried about ___ but it was fine)
- [ ] Business - (We worried about ___ but it was fine)
- [ ] Risk/Legal - (We worried about ___ but it was fine)

**Missing Criteria (What we should add to framework for next launch):**
1. _________________________________________
2. _________________________________________
3. _________________________________________

**Weight Adjustments (Should we change dimension weights?):**
- Increase weight for: _____________________ (because _________________)
- Decrease weight for: ____________________ (because _________________)

---

### OVERALL LAUNCH ASSESSMENT

**Did we achieve our goals?**
☐ Exceeded expectations
☐ Met expectations
☐ Partially met expectations
☐ Did not meet expectations

**Would we launch again with same readiness score?**
☐ Yes, score was accurate predictor
☐ No, we needed higher score (should have been ___)
☐ No, we were over-prepared (could have launched at ___)

**Top lesson learned:**
_________________________________________________________

**Action items for next launch:**
1. _________________________________________
2. _________________________________________
3. _________________________________________

---

## Real-World Example: AI/ML Product Launch

### Case Study: "SmartRecommend" ML-Powered Product Recommender

**Context:**
- B2C e-commerce feature
- 1M+ daily users
- Sub-200ms latency requirement
- 99.9% uptime SLA

---

### LAUNCH READINESS ASSESSMENT (Pre-Launch)

#### Technical Readiness: 68/75 (91%)

**Performance:**
- ✅ Load tested at 3,000 QPS (3x peak)
- ✅ p95 latency 145ms (target <200ms)
- ✅ 72-hour soak test passed
- ✅ Auto-scaling tested 100 → 1000 → 100 QPS
- ⚠️ Stress test at 10x showed degradation (acceptable)

**Security:**
- ✅ API key authentication
- ✅ Rate limiting (100 req/min per user)
- ✅ Input validation (product ID format, max 10 IDs per request)
- ✅ Model artifact signed and versioned
- ✅ Dependency CVE scan clean
- ✅ OWASP Top 10 validated

**Reliability:**
- ✅ SLO: 99.9% uptime, p95 <200ms, error <0.1%
- ✅ Multi-zone (3 zones in us-east-1)
- ✅ Health check endpoint
- ✅ Rollback tested (2.5 minutes)
- ✅ Vertex AI dependency failure tested (fallback to random recommendations)

**Observability:**
- ✅ Metrics: latency, errors, throughput, model prediction confidence
- ✅ Structured logging (JSON)
- ✅ Distributed tracing (Cloud Trace)
- ✅ Alerts with runbooks (5 alerts configured)
- ✅ Cost tracking per recommendation

**Model-Specific:**
- ✅ Model accuracy validated on holdout (85% precision@5)
- ✅ Bias testing (no gender/race bias in recommendations)
- ✅ A/B test framework ready
- ⚠️ Model drift monitoring configured (but not battle-tested)
- ⚠️ Explainability (model card created, but not user-facing)

**Score: 68/75**

---

#### User Readiness: 13/15 (87%)

**UX:**
- ✅ User testing with 25 target users
- ✅ Onboarding <5 min (recommendations appear immediately)
- ✅ Error messages ("No recommendations available, try again")
- ✅ Mobile + desktop tested
- ⚠️ Loading states implemented but not optimized

**Documentation:**
- ✅ User docs (FAQ: "Why these recommendations?")
- ✅ API docs for internal teams
- ✅ Support trained on common questions
- ⚠️ Feedback mechanism (thumbs up/down, but no text feedback)

**Score: 13/15**

---

#### Operational Readiness: 18/20 (90%)

**Incident Management:**
- ✅ On-call rotation (3 engineers, 24/7)
- ✅ Runbooks for: rollback, scale up, model re-deployment, latency spike
- ✅ Communication plan (status page, in-app banner)
- ✅ Post-mortem template

**Deployment:**
- ✅ Automated (Cloud Build → Vertex AI)
- ✅ Tested in staging (mirrors production)
- ✅ Rollback <5 min (traffic switch via load balancer)
- ✅ Feature flag (can disable recommendations without redeploying)
- ✅ Database migrations tested (N/A for this product)
- ⚠️ Canary deployment (configured but not tested end-to-end)

**Score: 18/20**

---

#### Business Readiness: 14/15 (93%)

- ✅ Value prop validated (A/B test showed +12% CTR vs random)
- ✅ Target persona defined (casual shoppers, not power users)
- ✅ Success metrics (CTR, conversion rate, revenue per user)
- ✅ GTM assets (blog post, in-app announcement, email campaign)
- ✅ Differentiation (personalized vs random, better than existing algo)
- ⚠️ Pricing impact (free feature, but cost per recommendation modeled)

**Score: 14/15**

---

#### Risk & Legal: 9/10 (90%)

**Risk:**
- ✅ Pre-mortem conducted (top 5 risks identified)
- ✅ Cost overrun protection (budget alert at $10K/month)
- ✅ Blast radius limited (5% → 25% → 100% rollout)
- ✅ Kill switch (feature flag)

**Legal:**
- ✅ Privacy policy updated (ML model usage disclosed)
- ✅ GDPR compliant (recommendations not based on sensitive data)
- ✅ Legal review completed
- ⚠️ Bias monitoring (tested pre-launch, but no ongoing monitoring)

**Score: 9/10**

---

### AGGREGATE SCORE: 122/135 = **90/100**

**DECISION: ✅ LAUNCH APPROVED**

**Conditions:**
1. Launch to 5% of users for 48 hours before scaling to 100%
2. Monitor model drift alerts daily for first 2 weeks
3. Add text feedback mechanism within 30 days post-launch

---

### 90-DAY RETROSPECTIVE RESULTS

**Predicted:** 90/100 readiness score
**Actual Success:** 🟢 Exceeded expectations

| Metric | Predicted | 30-Day Actual | 90-Day Actual | Status |
|--------|-----------|---------------|---------------|--------|
| Uptime | 99.9% | 99.94% | 99.92% | ✅ Met SLO |
| p95 Latency | <200ms | 158ms | 162ms | ✅ Met SLO |
| Error Rate | <0.1% | 0.08% | 0.09% | ✅ Met SLO |
| CTR Lift | +12% | +14% | +15% | ✅ Exceeded |
| Conversion Lift | +5% | +7% | +8% | ✅ Exceeded |
| Cost/Recommendation | $0.002 | $0.0018 | $0.0019 | ✅ Under budget |
| Support Tickets | <50/week | 12/week | 8/week | ✅ Under estimate |
| P0 Bugs | 0 | 0 | 0 | ✅ |
| P1 Bugs | <3 | 1 | 2 | ✅ |

**What Went Well:**
1. **Phased rollout** (5% → 100%) caught a caching bug at 25% that would have been catastrophic at 100%
2. **Model drift monitoring** detected shift in user behavior during holiday season, triggered retraining
3. **Cost modeling** was accurate within 5%, avoided budget surprises

**What Went Wrong:**
1. **Model explainability** - Users asked "why this recommendation?" more than expected. Added in week 4.
2. **Mobile latency** - p95 on mobile was 220ms (vs 160ms desktop). Required model optimization.
3. **International rollout** - Didn't plan for non-English languages, delayed EU launch by 6 weeks.

**Framework Calibration:**
- **Increase weight** for "User Readiness" (explainability should have been mandatory, not nice-to-have)
- **Add criterion:** "Internationalization readiness" (language support, regional compliance)
- **Score was accurate:** 90/100 predicted success, and we succeeded. Would launch again at same score.

---

**This case study demonstrates: A 90/100 score is not perfect, but it's ready. The gaps we had were manageable post-launch.**

---

## Appendix: Launch Failure Post-Mortems (Learn from Others)

### Failure Case #1: HealthCare.gov (2013)

**Predicted Score (if framework existed):** ~40/100

**Actual Result:** Catastrophic failure, $2B spent on fixes

**Dimension Breakdown:**
- Technical: 25/75 (not load tested, crashed instantly)
- User: 5/15 (confusing UX, not tested with real users)
- Operational: 8/20 (no incident plan, no rollback)
- Business: 12/15 (clear value, but...)
- Risk: 0/10 (big-bang launch, no phasing, no contingency)

**Top Failures:**
1. **Not load tested** - Assumed 50K concurrent users, got 250K, site crashed
2. **No phased rollout** - All states launched simultaneously, maximum blast radius
3. **No rollback plan** - When it failed, stuck in broken state for weeks
4. **Contractor coordination** - 55 contractors, no integration testing

**Lesson:** Score <50 = DO NOT LAUNCH. Period.

---

### Failure Case #2: Knight Capital Trading Glitch (2012)

**Predicted Score:** ~55/100

**Actual Result:** $440M loss in 45 minutes, company nearly bankrupt

**Dimension Breakdown:**
- Technical: 35/75 (code deployed, but not tested in production-like environment)
- Operational: 5/20 (NO ROLLBACK PLAN)
- Risk: 2/10 (no kill switch, no circuit breaker)

**Top Failures:**
1. **Deployment procedure failure** - Old code wasn't fully removed, conflicted with new code
2. **No rollback** - Once deployed, no mechanism to undo quickly
3. **No kill switch** - Took 45 minutes to manually stop trading
4. **No testing** - Deployment not tested in staging that mirrored production

**Lesson:** Operational Readiness is NOT optional. Rollback is MANDATORY.

---

### Failure Case #3: Cyberpunk 2077 (2020)

**Predicted Score:** ~38/100

**Actual Result:** Delisted from PlayStation Store, massive refunds, reputation destroyed

**Dimension Breakdown:**
- Technical: 20/75 (game-breaking bugs, crashes, poor performance on consoles)
- User: 6/15 (unplayable on base consoles, not tested)
- Operational: 10/20 (overwhelmed support)
- Risk: 0/10 (launched despite knowing it was broken)

**Top Failures:**
1. **No QA on target platforms** - Tested on high-end PCs, not base consoles (80% of market)
2. **Ignored feedback** - Delay signals ignored, shipped anyway
3. **No phased rollout** - Big-bang launch, maximum damage
4. **Optimism bias** - "We'll patch it post-launch" (didn't work)

**Lesson:** User Readiness is NOT optional. If target users can't use it, don't launch.

---

## Final Recommendations

### Use This Framework To:
✅ Prevent catastrophic launches (score <65 = block)
✅ Make data-driven go/no-go decisions (not gut feel)
✅ Identify blind spots (pre-mortem surfaces risks)
✅ Calibrate over time (retrospectives improve future predictions)
✅ Build organizational muscle (repeatable, not one-off)

### Do NOT Use This Framework To:
❌ Delay launches indefinitely (perfect is enemy of good)
❌ Avoid calculated risks (90/100 is launch-ready, not 100/100)
❌ Replace judgment (context matters, adapt framework)
❌ Blame individuals (blameless post-mortems)

---

**Remember: Launching at 85/100 with known, managed risks beats waiting for 100/100 and losing market opportunity.**

**The goal is not a perfect score. The goal is a successful launch. This framework helps you know the difference.**
