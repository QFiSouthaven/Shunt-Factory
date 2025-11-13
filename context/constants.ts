
import { Documentation } from '../types';

export const INITIAL_DOCUMENTATION: Documentation = {
  geminiContext: `
# High-Level Design Proposal: Aether Shunt Enhancement Framework (Refined)

This document outlines a refined high-level design to transform the strategic vision of the Aether Shunt project into an actionable, scalable, and secure engineering plan. This version incorporates peer feedback to fortify the architecture, focusing on explicit agent state management during enhancements, security, and detailed performance monitoring.


#### 1. Guiding Principles


*   **Decoupling:** Components (Simulation, Frameworks UI, Agents) must be loosely coupled via well-defined contracts (APIs, data models) to allow independent development, deployment, and evolution.
*   **Safety First:** Applying changes to live agents is a high-risk operation. The system must include robust, non-negotiable mechanisms for state backup, health validation, and automated rollback.
*   **Declarative Enhancements:** The nature of an enhancement should be described by data (e.g., a configuration manifest), not imperative code. This makes the system easier to manage, validate, and extend.
*   **Extensibility:** The architecture must anticipate future enhancement types without requiring a full system redesign.
*   **Secure by Design:** Security is a core requirement, not an afterthought. All components, APIs, and communications must be built with robust security controls to protect our live systems from unauthorized access or modification.

#### 2. Core Components & Architecture
The service-oriented architecture remains centered around three core components:


1.  **Enhancement Registry:** A centralized service and database that acts as the source of truth for all "successfully simulated" enhancements. It stores, versions, and serves \`Enhancement Manifests\`.

2.  **Frameworks Service:** The backend for the "Frameworks" UI tab, responsible for orchestrating the entire enhancement lifecycle, enforcing business logic (conflicts, dependencies), and applying security policies.

3.  **Agent Fleet & The Common API:** Each live agent must implement the standardized, versioned "Common Agent API," which provides the secure contract for interaction with the Frameworks Service.


#### 3. The Enhancement Manifest: A Standardized Data Model


The link between simulation and action is the standardized \`Enhancement Manifest\`. This versioned JSON/YAML document declaratively defines an enhancement, explicitly stating its operational impact and including the necessary metadata for validation and conflict resolution.


**Example \`EnhancementManifest_v1.0.json\`:**


\`\`\`json
{
  "manifestVersion": "1.0",
  "id": "enh-_2024_fast_compress",
  "name": "Enable Zstandard Compression",
  "description": "Swaps the default Gzip compression for the faster Zstandard algorithm. Increases CPU but reduces latency.",
  "type": "ALGORITHMIC_SWAP",
  "targetAgentType": "DataProcessorAgent",
  "version": "1.2.0",
  "stateManagementStrategy": "GRACEFUL_RESTART",
  "dependencies": [],
  "conflicts": ["profile-low_power"],
  "payload": {
    "type": "docker_env_update",
    "variables": {
      "COMPRESSION_LIB": "zstd"
    }
  },
  "validation": {
    "metric": "processing_latency_p95_ms",
    "condition": "lessThan",
    "baseline": 150,
    "target": 100
  },
  "signature": "JWS_SIGNATURE_HERE"
}
\`\`\`


#### 4. The Common Agent API Contract (v1.0)


To ensure scalability and uniform management, every agent must expose the following REST endpoints. All endpoints require authentication and must be served over HTTPS.


| Method | Endpoint | Description |
| :--- | :--- | :--- |
| \`GET\` | \`/status\` | Returns the agent's current health (e.g., \`UP\`, \`DEGRADED\`), state, and applied enhancements. |
| \`GET\` | \`/metrics\` | Returns a standardized JSON object of key performance indicators (KPIs) for performance monitoring. |
| \`GET\` | \`/capabilities\` | Describes supported \`payload\` types and \`stateManagementStrategy\`s for applying enhancements. |
| \`POST\` | \`/enhancements/apply\` | (Asynchronous) Initiates the enhancement application process. Accepts an \`EnhancementManifest\`. |
| \`POST\` | \`/enhancements/rollback\` | (Asynchronous) Reverts the last applied enhancement. |
| \`GET\` | \`/jobs/{job_id}\` | Checks the status of an asynchronous \`apply\` or \`rollback\` operation. |


**Example \`/capabilities\` Response:**


\`\`\`json
{
  "supportedPayloadTypes": ["docker_env_update", "config_file_swap"],
  "supportedStateStrategies": ["IN_PLACE", "GRACEFUL_RESTART"]
}
\`\`\`


#### 5. Transactional Workflow & State Management


This section details the operational protocol for applying enhancements, with a focus on safety and preserving the agent's state.


##### 5.1. The Enhancement Lifecycle


1.  **Pre-flight Check:** The Frameworks Service calls the agent's \`GET /capabilities\` endpoint to confirm it supports the \`payload.type\` and \`stateManagementStrategy\` defined in the manifest. It also verifies authorization.

2.  **State Snapshot:** Frameworks Service commands the agent to snapshot its current configuration and state. The agent is responsible for defining what constitutes a "state" (e.g., config files, in-memory queue data to be persisted).

3.  **Apply Enhancement:** The agent executes the state management strategy (see 5.2) and applies the action defined in the manifest's \`payload\`.

4.  **Health Validation:** After the agent signals completion, the Frameworks Service polls the \`GET /metrics\` endpoint. It compares the returned KPIs against the \`validation\` criteria in the manifest for a pre-defined "validation period" (e.g., 5 minutes).

5.  **Commit or Rollback:**
    *   **On Success:** If metrics meet the validation target and the agent remains healthy (\`/status\` is \`UP\`), the transaction is "committed."
    *   **On Failure:** If the agent fails health checks, metrics degrade, or the validation fails, the Frameworks Service automatically triggers a \`POST /enhancements/rollback\` command.


##### 5.2. Agent State Management Strategies


To address the operational impact of different enhancements, the agent's behavior during application is explicitly defined by the \`stateManagementStrategy\`:


*   **\`IN_PLACE\`:** For non-disruptive changes (e.g., tuning a parameter). The agent applies the update to its running process without a restart. In-memory state and active tasks are unaffected.
*   **\`GRACEFUL_RESTART\`:** For disruptive changes requiring a restart (e.g., \`ALGORITHMIC_SWAP\`). The agent MUST perform the following sequence:
    1.  Stop accepting new tasks.
    2.  Finish processing all in-flight tasks.
    3.  Persist its critical state (e.g., write in-memory queues to disk).
    4.  Shut down.
    5.  The orchestration platform (e.g., Kubernetes) restarts the agent with the new configuration (from the \`payload\`).
    6.  On startup, the agent reloads its persisted state and resumes normal operation.
*   **\`HOT_SWAP\`:** Reserved for highly sophisticated agents that can dynamically reload code modules or components without a full process restart, preserving all in-memory state. This is an advanced capability that agents must explicitly advertise.

#### 6. Security & Access Control
**Authentication:**
*   **User-to-System:** Human users authenticating to the Frameworks UI will use the corporate single sign-on (SSO) solution (e.g., OIDC/OAuth 2.0).
*   **Service-to-Service:** All communication between the Frameworks Service, Enhancement Registry, and Agent Fleet will use mutual TLS (mTLS) for strong, certificate-based authentication.


**Authorization:**
*   The Frameworks Service will implement Role-Based Access Control (RBAC) based on user roles derived from SSO group membership.
*   **Defined Roles:** \`Viewer\`, \`Operator\` (non-prod), \`Administrator\` (prod).


**Secure Communication & Manifest Integrity:**
*   All network traffic MUST be encrypted using TLS 1.2+.
*   \`Enhancement Manifests\` can be digitally signed using JSON Web Signature (JWS), and the Frameworks Service will verify this signature before use.


#### 7. Managing Granularity, Dependencies & Conflicts


This logic remains unchanged. The Frameworks Service will use the \`dependencies\` and \`conflicts\` metadata within manifests to build a valid enhancement plan. The UI will dynamically enable or disable options based on user selections to prevent invalid combinations. Extensibility is maintained by allowing new \`type\` and \`payload\` schemas, which agents can advertise via their \`/capabilities\` endpoint.
`,
  progressLog: `
# Progress Log
- **2024-10-16**: Initial project setup and merger of the Shunt and Orchestrator applications.
- **2024-10-17**: Implemented the "Make Actionable" feature with an advanced AI prompt.
`,
  decisions: `
# Architectural Decisions
- **State Management**: Chose React's built-in hooks for simplicity.
- **UI**: Opted for a tab-based interface within a single \`MissionControl\` component.
`,
  issuesAndFixes: `
# Issues and Fixes
- **Issue**: The initial orchestrator was a non-functional placeholder.
- **Fix**: Replaced the placeholder with the fully interactive \`reactflow\`-based component.
`,
  featureTimeline: `
# Feature Timeline
- **Q4 2024**: Core Shunt and Orchestrator functionality.
- **Q1 2025**: Integration of the Aetherium Weaver agentic development module.
`,
};
