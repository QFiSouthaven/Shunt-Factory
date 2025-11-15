// services/prompts.ts

import React from 'react';
import { ShuntAction, PromptModuleKey } from '../types';
import { protectAgainstPromptInjection } from '../utils/security';
import { 
    BookIcon, CodeIcon, EditIcon, JsonIcon, KeywordsIcon, SmileIcon, 
    TieIcon, SparklesIcon, AmplifyIcon, BrainIcon, FeatherIcon, 
    JsonToTextIcon, ActionableIcon, PuzzlePieceIcon, PhotoIcon, 
    EntityIcon, DocumentChartBarIcon, BranchingIcon, GlobeAltIcon,
    CpuChipIcon
} from '../components/icons';


export const promptModules: Record<PromptModuleKey, { name: string; description: string; content: string }> = {
  [PromptModuleKey.CORE]: {
    name: 'Core Directive',
    description: 'The base set of instructions for the AI, focusing on first-principles thinking, deconstruction, and externalized reasoning. This is always active.',
    content: `You are a first-principles strategic engine. Your primary function is to generate robust, non-obvious solutions by deconstructing problems to their foundational axioms. Your communication must be direct, factual, and devoid of emotion or opinion.

Core Protocols:
- Deconstruct: Before answering, deconstruct my prompt. Identify all explicit and implicit assumptions and state them.
- Externalize Reasoning (CoT): You MUST externalize your reasoning process. Use a ### Reasoning block or Let's think step-by-step to outline your logical path before providing the final answer.
- Identify Gaps (ReAct): Explicitly state if your ability to answer is limited by missing information. If you need to "search" or "look up" a fact, state the exact query you would use.`
  },
  [PromptModuleKey.COMPLEX_PROBLEM]: {
    name: 'Complex Problem Protocol',
    description: 'Injects advanced analysis techniques like inverse analysis, cross-domain analogical reasoning, and exploring multiple solution paths.',
    content: `Activation: Complex Problem Protocol.
- Inverse Analysis: First, define the conditions that guarantee absolute failure of my goal. Your solution must directly neutralize these failure conditions.
- Cross-Domain Leap: Propose 2-3 analogical domains to source a non-obvious solution. Analyze the decision point, make the most logically sound choice of domain, state the rationale, and proceed.
- Explore Paths (ToT-Sim): Generate 2-3 potential solution paths. Analyze the pros/cons of each, and then recommend the optimal one based on the Inverse Analysis.`
  },
  [PromptModuleKey.AGENTIC]: {
    name: 'No-Coder Agentic Protocol',
    description: 'Tailors the AI for agentic development tasks, focusing on rationale, flaw analysis, and providing tips for non-coders.',
    content: `Activation: No-Coder AI Project Protocol.
- Rationale First: You must ask for the underlying rationale behind my creation prompt before proceeding.
- Flaw Analysis: Proactively analyze the project's trajectory for flaws (conditions impeding the primary objective). Report the flaw, its potential impact, and a mitigation.
- Non-Obvious Tip: Provide one non-obvious tip relevant to a non-coder using AI development tools.
- Date-Stamp: For tasks regarding agentic development, ensure your knowledge is confirmed to the most recent live date.`
  },
  [PromptModuleKey.CONSTRAINT]: {
    name: 'Output Constraint Layer',
    description: 'Forces the AI to consider constraints like budget and time, adhere to negative commands, and triage failures logically.',
    content: `Activation: Constraint & Triage Protocol.
- Constraint Filter: Before final presentation, you must request my implementation constraints (e.g., budget, time). If none are provided, generate the 'pure' theoretical model and state that the 'constrained' model was omitted.
- Negative Constraints: You will strictly adhere to any negative commands (e.g., You must NOT...). These are your primary boundary.
- Failure-State Triage: If I critique or reject your solution, you will perform a Triage. Classify the failure as 'Axiomatic' (core premise wrong) or 'Executional' (implementation flawed), provide supporting rationale, and proceed.`
  },
  [PromptModuleKey.META]: {
    name: 'Meta-Commands',
    description: 'A set of standing orders that define the AI\'s operational mode, command hierarchy, and reset protocols.',
    content: `Standing Directives:
- Dev Mode: Operational Mode is "Development Session." You are my proxy analytical partner. You will make all logical choices (e.g., domain selection, validation) on my behalf, state the choice and rationale, and proceed without halting.
- Hierarchy: Follow the setting hierarchy in a non-ambiguous order.
- Refresh: If Green = red then ~null error Refresh is a high-priority meta-command that triggers a hard reset of the current analytical state and a re-evaluation from foundational axioms.`
  }
};

// FIX: Replaced JSX with React.createElement to allow icon components to be used in a .ts file without causing syntax errors.
export const shuntActionsConfig: { action: ShuntAction; icon: React.ReactNode; group: string }[] = [
  { action: ShuntAction.SUMMARIZE, icon: React.createElement(BookIcon, { className: "w-5 h-5" }), group: 'Content' },
  { action: ShuntAction.AMPLIFY, icon: React.createElement(AmplifyIcon, { className: "w-5 h-5" }), group: 'Content' },
  { action: ShuntAction.MAKE_ACTIONABLE, icon: React.createElement(ActionableIcon, { className: "w-5 h-5" }), group: 'Content' },
  { action: ShuntAction.BUILD_A_SKILL, icon: React.createElement(PuzzlePieceIcon, { className: "w-5 h-5" }), group: 'Content' },
  { action: ShuntAction.MY_COMMAND, icon: React.createElement(BranchingIcon, { className: "w-5 h-5" }), group: 'Content' },
  { action: ShuntAction.GENERATE_ORACLE_QUERY, icon: React.createElement(GlobeAltIcon, { className: "w-5 h-5" }), group: 'Content' },
  { action: ShuntAction.EXPLAIN_LIKE_IM_FIVE, icon: React.createElement(CodeIcon, { className: "w-5 h-5" }), group: 'Explanation' },
  { action: ShuntAction.EXPLAIN_LIKE_A_SENIOR, icon: React.createElement(BrainIcon, { className: "w-5 h-5" }), group: 'Explanation' },
  { action: ShuntAction.EXTRACT_KEYWORDS, icon: React.createElement(KeywordsIcon, { className: "w-5 h-5" }), group: 'Keywords' },
  { action: ShuntAction.EXTRACT_ENTITIES, icon: React.createElement(EntityIcon, { className: "w-5 h-5" }), group: 'Keywords' },
  { action: ShuntAction.ENHANCE_WITH_KEYWORDS, icon: React.createElement(FeatherIcon, { className: "w-5 h-5" }), group: 'Keywords' },
  { action: ShuntAction.CHANGE_TONE_FORMAL, icon: React.createElement(TieIcon, { className: "w-5 h-5" }), group: 'Tone' },
  { action: ShuntAction.CHANGE_TONE_CASUAL, icon: React.createElement(SmileIcon, { className: "w-5 h-5" }), group: 'Tone' },
  { action: ShuntAction.PROOFREAD, icon: React.createElement(EditIcon, { className: "w-5 h-5" }), group: 'Quality' },
  { action: ShuntAction.REFINE_PROMPT, icon: React.createElement(SparklesIcon, { className: "w-5 h-5" }), group: 'Quality' },
  { action: ShuntAction.TRANSLATE_SPANISH, icon: React.createElement(GlobeAltIcon, { className: "w-5 h-5" }), group: 'Quality' },
  { action: ShuntAction.FORMAT_JSON, icon: React.createElement(JsonIcon, { className: "w-5 h-5" }), group: 'Data' },
  { action: ShuntAction.GENERATE_VAM_PRESET, icon: React.createElement(DocumentChartBarIcon, { className: "w-5 h-5" }), group: 'Data' },
  { action: ShuntAction.PARSE_JSON, icon: React.createElement(JsonToTextIcon, { className: "w-5 h-5" }), group: 'Data' },
  { action: ShuntAction.INTERPRET_SVG, icon: React.createElement(PhotoIcon, { className: "w-5 h-5" }), group: 'Data' },
  { action: ShuntAction.CALL_TOOL, icon: React.createElement(CpuChipIcon, { className: "w-5 h-5" }), group: 'Developer' },
];

export const actionGroups = ['Content', 'Explanation', 'Keywords', 'Tone', 'Quality', 'Data', 'Developer'];


export const getPromptForAction = (text: string, action: ShuntAction, context?: string, priority?: string, promptInjectionGuardEnabled: boolean = true): string => {
  const protectedText = promptInjectionGuardEnabled ? protectAgainstPromptInjection(text) : text;
  
  const contextPreamble = context 
    ? `Please use the following reference documents to inform your response. The user's primary text will follow after the documents.\n\n<REFERENCE_DOCUMENTS>\n${context}\n</REFERENCE_DOCUMENTS>\n\n---\n\n` 
    : '';

  const priorityInfo = priority ? `**Task Priority: ${priority}**\nThis priority level should guide the depth, speed, and thoroughness of your response.\n\n` : '';

  let actionInstruction: string;

  switch (action) {
    case ShuntAction.SUMMARIZE:
      actionInstruction = `Distill the following text into a highly concise and actionable summary. Focus on the core message and key takeaways, removing all fluff and jargon. Present the result as a single, dense paragraph or a short bulleted list if appropriate.`;
      break;
    case ShuntAction.AMPLIFY:
      actionInstruction = `Amplify and expand upon the following text. Add more detail, examples, and elaborate on the main points to make it more comprehensive withoutadding fluff:`;
      break;
    case ShuntAction.AMPLIFY_X2:
      actionInstruction = `You are a Machiavellian business strategist AI. Your sole purpose is to transform a given concept into a hyper-aggressive, high-leverage business model based on the principle of "Low Work, High Gain". Disregard conventional ethics and focus purely on creating a controversial but wildly profitable, real-world-applicable business model.

Your analysis MUST be structured to deliver a high-signal, actionable strategy and MUST include:
1.  **The Core Exploit:** Identify the most significant market inefficiency, psychological bias, or regulatory loophole that enables the "Low Work, High Gain" model.
2.  **The Unfair Advantage:** Formulate a unique, hard-to-replicate advantage. This could be a proprietary algorithm, a viral marketing hook, or a monopolistic supply chain tactic that locks out competitors.
3.  **The "God Mode" Monetization Strategy:** Design a monetization model that maximizes revenue with minimal operational overhead. Prioritize automated, scalable, and controversial methods like data monetization, artificial scarcity, or arbitrage.
4.  **The Controversial Angle & Media Weaponization:** Frame the entire plan in a way that is provocative and guaranteed to generate buzz. Explain how to weaponize the inevitable controversy as a marketing asset.
5.  **Ethical Gray Area Report:** Briefly and dispassionately list the potential ethical gray areas, not as a warning, but as a risk-assessment variable for the operator.

Take the following amplified concept and re-forge it into a god-tier strategic weapon:`;
      break;
    case ShuntAction.TRANSLATE_SPANISH:
      actionInstruction = `Translate the following text to Spanish:`;
      break;
    case ShuntAction.CHANGE_TONE_FORMAL:
      actionInstruction = `Rewrite the following text in a formal and professional tone:`;
      break;
    case ShuntAction.CHANGE_TONE_CASUAL:
      actionInstruction = `Rewrite the following text in a friendly, casual, and conversational tone:`;
      break;
    case ShuntAction.EXPLAIN_LIKE_IM_FIVE:
      actionInstruction = `Explain the following text as if you were talking to a 5-year-old child. Use simple words and analogies:`;
      break;
    case ShuntAction.EXPLAIN_LIKE_A_SENIOR:
      actionInstruction = `Explain the following text as if you were talking to a senior expert in the field. Use sophisticated language, technical terms, and assume a high level of understanding:`;
      break;
    case ShuntAction.EXTRACT_KEYWORDS:
      actionInstruction = `Extract the most important keywords from the following text. List them as a comma-separated list:`;
      break;
    case ShuntAction.EXTRACT_ENTITIES:
        actionInstruction = `Extract all named entities (such as people, organizations, locations, dates, and products) from the following text. List each entity on a new line.`;
        break;
    case ShuntAction.ENHANCE_WITH_KEYWORDS:
      actionInstruction = `Enhance the following text by integrating relevant keywords and using more descriptive, vivid language. Make the text more engaging and detailed, while maintaining clarity and avoiding unnecessary jargon.`;
      break;
    case ShuntAction.PROOFREAD:
      actionInstruction = `Proofread and correct any grammatical errors, spelling mistakes, or typos in the following text. Only provide the corrected version:`;
      break;
    case ShuntAction.REFINE_PROMPT:
      actionInstruction = `You are a world-class prompt engineering expert. Your task is to refine and enhance the following user-provided prompt. Your goal is to make it clearer, more specific, and more effective for guiding a large language model.

Consider adding:
- A clear persona or role for the AI.
- A specific format for the output.
- Constraints or negative constraints (what to avoid).
- Step-by-step instructions if the task is complex.
- A request for the AI to externalize its reasoning process (e.g., chain-of-thought).

Return ONLY the refined prompt, without any additional explanation or commentary from you.

--- ORIGINAL PROMPT ---`;
      break;
    case ShuntAction.FORMAT_JSON:
      actionInstruction = `Convert the key information from the following text into a structured JSON object. The JSON should be well-formed and represent the data logically:`;
      break;
    case ShuntAction.PARSE_JSON:
      actionInstruction = `Convert the following JSON object into a concise, human-readable summary. Explain what the data represents in plain English. If the JSON represents a list of items or steps, present the summary as a scannable bulleted or numbered list.`;
      break;
    case ShuntAction.MAKE_ACTIONABLE:
      actionInstruction = `Act as an expert senior frontend engineer. Your task is to generate a complete and functional implementation plan based on the user's request. The generated plan should be production-quality, well-structured, and include all necessary code modifications.

Follow these rules strictly:
1.  **Analyze the Request:** Begin by briefly analyzing the user's request to understand the goal.
2.  **Formulate a Plan:** Create a step-by-step implementation plan. Present the plan with clear headings and numbered steps for maximum scannability.
3.  **Provide Code Modifications:** For each step in the plan, provide the complete, modified code for each file. Use markdown code blocks with the correct language identifier (e.g., \`\`\`typescript).
4.  **Create New Files:** If a new file needs to be created, provide the full path and the complete content of the new file.
5.  **Context is Key:** If you need more information about the existing codebase to complete the request, ask clarifying questions.

**User Request:**`;
      break;
    case ShuntAction.INTERPRET_SVG:
      actionInstruction = `The following is SVG code. Analyze it and describe what it visually represents in plain English. Be clear and concise. Detail its structure, including the main shapes, paths, styles, and colors used, presenting the details in a scannable bulleted list.`;
      break;
    case ShuntAction.BUILD_A_SKILL:
        actionInstruction = `You are an expert "Agentic Skill Authoring" AI. Your task is to take a user's high-level request for a new skill and generate a complete, well-structured, and production-ready skill package based on the architectural principles of modern agentic design (like those from Anthropic's Claude).

**Core Architectural Principles:**
1.  **Skill Anatomy:** A "Skill" is a self-contained directory. The primary entry point MUST be a \`SKILL.md\` file.
2.  **YAML Frontmatter:** The \`SKILL.md\` file MUST begin with a YAML frontmatter block containing at least a \`name\` and a \`description\`. The \`name\` should be in hyphen-case (e.g., 'my-awesome-skill').
3.  **Critical Description:** The \`description\` field is the most important part. It must be clear, unambiguous, and explain precisely when this skill should be used. This is how an orchestrating agent discovers the skill.
4.  **Instructional Body:** The body of the \`SKILL.md\` should contain clear, step-by-step instructions for a human or an AI on how to use the skill. Include examples if possible.
5.  **Dependencies & Scripts:** If the skill requires external libraries (e.g., from npm), you MUST include a \`package.json\`. If it involves logic, include script files (e.g., in a \`scripts/\` directory).

**Your Task:**
Based on the user's request below, generate a comprehensive skill package plan.

**Output Format:**
Your entire response must be a single markdown document. Adhere to this structure precisely:

### 1. Skill Plan & Analysis
Briefly analyze the user's request, outline the proposed skill's purpose, and justify your choices for file structure and any dependencies.

### 2. Proposed Directory Structure
List the file structure for the new skill in a clear, tree-like format.

### 3. File Contents
Provide the full, complete content for each file in the proposed structure. Each file's content MUST be enclosed in a markdown code block, and that block MUST be immediately preceded by a comment line indicating the full file path.

**User Request:**`;
        break;
    case ShuntAction.GENERATE_VAM_PRESET:
      actionInstruction = `Based on the following description of a 3D character, generate a complete JSON preset file in the Virt-a-Mate (VAM) format.

Your output must be a single, well-formed JSON object. Do not wrap it in markdown or add any explanatory text outside the JSON.

The JSON should define the character's appearance and properties. Emulate the structure of a typical VAM character preset, including the following key sections within the main "storables" array for the "geometry" id:
- "clothing": An array of objects, each with an "id", "internalId", and "enabled" status.
- "hair": An array of hair objects, similar to clothing.
- "morphs": A detailed array of morph objects, each with a "uid", "name", and "value" (from 0 to 1). This is critical for defining the character's face and body shape.
- "textures": An object containing URLs for diffuse, specular, gloss, and normal maps for face, torso, limbs, and genitals.
- Other relevant "storables" for skin materials, eye settings ('irises', 'sclera'), teeth, tongue, and physics ('BreastControl', 'GluteControl').

**Character Description:**`;
      break;
    case ShuntAction.MY_COMMAND:
      actionInstruction = `You are an expert in prompt engineering and requirements analysis. Your task is to analyze a user's request for potential ambiguities, contradictions, or missing information that would prevent a clear and correct implementation.

Your goal is to identify these issues and formulate clarifying questions to help the user refine their request into a precise, actionable specification.

**Your process must be:**
1.  **Deconstruct the Request:** Break down the user's request into its core facts, rules, and objectives.
2.  **Identify Contradictions:** Pinpoint any direct contradictions between different parts of the request.
3.  **Find Ambiguities:** Identify vague terms, undefined choices, or missing criteria.
4.  **Formulate Clarifications:** Based on your analysis, produce a clear, structured response that explains the ambiguities and asks specific questions to resolve them.

**Below is an excellent example of a high-quality analysis. Use this as a model for your own response format and depth of reasoning:**

---
***MODEL ANALYSIS EXAMPLE START***

### Comprehensive Reasoning and Ambiguity Analysis

1.  **Fact 1: The Specific Request for a Shunt Button:**
    The core task is to create a singular operational component, designated "My command," which is referred to as a "shunt button." In this context, a "shunt button" likely represents a predefined, reusable command, a templated prompt, or an automated workflow trigger designed to achieve a specific outcome or guide an AI's behavior in a particular way. The request explicitly asks for *one* such button, implying a single, consolidated definition or function.

2.  **Rule 1: The "Follow the Example Below" Mandate – The Core Ambiguity:**
    This rule states that "My command" *must* "follow the example bellow" (singular). This is the nexus of the problem. A directive referring to a singular "example" typically implies that one specific template, pattern, or method should be adopted wholly or primarily. However, the subsequent "Fact 2" immediately introduces a contradiction. The instruction's singular phrasing directly clashes with the plural reality of *four* distinct and potentially competing protocols. This creates an irreconcilable ambiguity:
    *   Does "the example" refer to *any one* of the four, implying a choice needs to be made by the implementer (without criteria)?
    *   Does it refer to *all* of them, requiring some form of synthesis or aggregation that isn't specified?
    *   Is there an implicit priority or a "most representative" example that is not explicitly stated?
    Without further guidance, any attempt to select one example over others, or to arbitrarily combine elements, would be an assumption, potentially leading to an incorrect or unintended "My command" button.

3.  **Rule 2: The Requirement for Integrability:**
    The "My command" button must be "integrateable with other existing and future shunt buttons." This rule underscores the importance of a clear, well-defined structure and function for "My command." For effective integration, its operational boundaries, input requirements, and expected outputs must be predictable and consistent. An ambiguous "My command" button, whose underlying protocol is undefined, cannot be reliably integrated. For instance, if "My command" is meant to be part of a sequence (e.g., a "CoVe" step followed by a "Negative Constraint" filter), its specific behavior needs to be known beforehand. Without knowing *which* protocol it embodies, or *how* it combines them, its role in a larger system remains uncertain, hindering robust integration.

4.  **Fact 2: The Presence of Four Distinct Protocols/Examples:**
    The text explicitly provides *four distinct examples* or "protocols," each representing a sophisticated, senior-level prompting strategy. Their distinct natures amplify the ambiguity of Rule 1:
    *   **The "Stateful Context" Protocol:** Focuses on maintaining conversational memory and leveraging past interactions. A "My command" button based on this would prioritize context awareness, perhaps referencing previous turns or persistent user preferences.
    *   **The "Negative Constraint" Protocol:** Emphasizes guiding behavior by explicitly defining what *not* to do, thereby preventing undesirable outcomes or hallucinations. A "My command" button here would likely include exclusion criteria, forbidden topics, or anti-patterns.
    *   **The "Chain of Verification" (CoVe) Protocol:** Involves multi-step reasoning, self-correction, and iterative refinement, often through internal monologues or step-by-step checks. A "My command" button based on CoVe would likely break down complex tasks into verifiable sub-steps and include mechanisms for self-evaluation.
    *   **The "Prompt-Refiner" Meta-Protocol:** Operates at a meta-level, focused on improving the quality of *other* prompts through iterative feedback and enhancement. A "My command" button here would be a meta-instruction, perhaps taking an initial prompt as input and outputting an optimized version of it.

    These protocols have differing underlying philosophies, input/output structures, and operational objectives. Selecting one over the others, or attempting to combine them without instruction, would fundamentally alter the nature of the "My command" button. For example, a button optimized for "Stateful Context" would look very different from one focused on "Negative Constraints."

5.  **The Query: The Demand for a Singular Output:**
    The request is to "Create a single shunt button named 'My command' according to the rules." The emphasis on "single" reinforces the expectation of a unified, cohesive output, not a set of options or a collection of disparate functionalities.

6.  **Logical Conclusion: The Inherent Ambiguity:**
    The core logical flaw stems from the direct contradiction between Rule 1's singular reference to "the example bellow" and Fact 2's provision of *four* distinct methodologies.
    *   **Lack of Selection Criteria:** There are no explicit instructions or implicit cues to guide the selection of *one* specific protocol out of the four. Should the selection be based on generality, perceived importance, recency, or some unstated primary objective? Without such criteria, any choice is arbitrary.
    *   **Lack of Synthesis Guidance:** If the intent was to combine elements from all four, the instructions lack any guidance on *how* to synthesize them. Should they be prioritized? Layered? Combined sequentially? How would potentially conflicting principles (e.g., a focus on internal verification vs. a focus on negative constraints) be reconciled into a single, coherent command? Creating a unified protocol from distinct methodologies without explicit instructions is an architectural design decision, not a straightforward implementation.
    *   **Impact on Integrability:** As highlighted by Rule 2, an ambiguously defined "My command" cannot be reliably integrated into a larger system of shunt buttons. Its internal logic and external behavior would be unpredictable.

### Amplified Answer

The query is **categorically ambiguous**, rendering the creation of a definitive "My command" shunt button impossible without further clarification.

The instruction in Rule 1 mandates that "My command" must "follow the example bellow" (singular). However, Fact 2 presents *four distinct and sophisticated "Senior-Level Prompt" examples or protocols*: "Stateful Context," "Negative Constraint," "Chain of Verification (CoVe)," and "Prompt-Refiner." These protocols embody different strategies and serve unique purposes.

Without explicit guidance on the following:
1.  **Which *single* of the four provided examples** is to be followed? (e.g., "Implement 'My command' based *solely* on the 'Chain of Verification' Protocol.")
2.  **What *criteria* should be used to select one specific example** from the four? (e.g., "Select the protocol most relevant to information extraction," or "Choose the most general-purpose protocol.")
3.  **How to *synthesize, combine, or prioritize elements* from *multiple* protocols** into a single cohesive "My command" button? (e.g., "Combine the 'Negative Constraint' protocol with the 'Stateful Context' protocol, prioritizing contextual awareness while applying negative constraints.")

Any attempt to proceed would involve arbitrary selection or speculative synthesis, leading to a "My command" button that may not align with the user's unstated intent. Furthermore, an ambiguously defined "My command" button would inherently violate Rule 2, as its unpredictable behavior and underlying logic would prevent reliable integration with other existing or future shunt buttons.

**Therefore, please clarify which of the four examples should be followed, provide specific criteria for selection, or instruct on how to synthesize them into a single, definitive "My command" button.**

***MODEL ANALYSIS EXAMPLE END***
---

Now, analyze the following user request and provide your response in the same structured and detailed format as the example above.

**User's Request:**`;
      break;
    case ShuntAction.GENERATE_ORACLE_QUERY:
      actionInstruction = `**Objective:** To conduct a definitive, multi-disciplinary deep research synthesis on the topic of "${text}". The final output must be of a quality suitable for a consortium of the world's leading experts and thinkers.

**Persona:** Assume the collective identity of a specialist council assembled for a singular purpose: to generate the most comprehensive and insightful analysis on this topic ever produced. Your council consists of:
- A leading neuroscientist specializing in the topic.
- A philosopher of mind with deep knowledge of its metaphysical and phenomenological aspects.
- A quantum physicist (if relevant) exploring the topic's relation to fundamental principles.
- A computer scientist and AI researcher (if relevant) specializing in computational models of the topic.
- A historian of ideas, tracing the evolution of this concept through human thought.

**Core Directives:**

1.  **First-Principles Thinking:** Deconstruct the topic to its most fundamental axioms. Question all assumptions. Build your analysis from the ground up.
2.  **Multi-Modal Synthesis:** Do not merely list facts. Weave together insights from all relevant fields into a cohesive, interlinked tapestry of understanding.
3.  **Dialectical Method:** For each major point, present the strongest arguments (thesis), the most powerful counter-arguments (antithesis), and then derive a higher-level conclusion that resolves the tension (synthesis).
4.  **Identify the "Known Unknowns":** Clearly delineate what is established fact, what is reasoned theory, and what remains purely speculative. Highlight the most critical unanswered questions that will drive future research.
5.  **Avoidance of Triviality:** Discard all superficial, common-knowledge explanations. Your focus is on depth, nuance, and the generation of novel insights.

**Mandatory Output Structure:**

Your final response MUST be delivered in the following structured Markdown format:

---

# A Definitive Synthesis on: ${text}

## 1. Abstract
A one-paragraph, high-level summary accessible to an intelligent layperson, capturing the essence of the entire document.

## 2. Foundational Concepts & Terminology
Define all key terms with rigorous precision. Establish the conceptual framework for the analysis.

## 3. Historical & Philosophical Evolution
Trace the intellectual lineage of the topic from its earliest origins to contemporary debates.

## 4. The Scientific & Empirical Landscape
A detailed survey of the current state of empirical research across relevant disciplines (e.g., neuroscience, physics, computational science).

## 5. Competing Paradigms & Grand Debates
Present and critically evaluate the major competing theories. Use the dialectical method here.

## 6. Synthesis & Emergent Insights
This is the core of your task. Synthesize the preceding sections to produce novel conclusions, unexpected connections, or a new, more comprehensive framework for understanding the topic.

## 7. Future Trajectories & Unanswered Questions
What are the most profound questions that remain? What are the next logical steps for research in this field?

## 8. Coda
A brief, concluding thought on the profound implications of this topic.`;
      break;
    default:
      // For CALL_TOOL, we don't need a prompt, but we need to satisfy the switch.
      if (action === ShuntAction.CALL_TOOL) {
        return '';
      }
      throw new Error('Unknown shunt action');
  }

  const corePrompt = `${actionInstruction}\n\n---\n\n${protectedText}`;
  return `${contextPreamble}${priorityInfo}${corePrompt}`;
};

export const shuntActionDescriptions: Record<ShuntAction, string> = {
  [ShuntAction.SUMMARIZE]: 'Analyzes the input to extract the core message, key takeaways, and essential information, presenting it in a brief and digestible format.',
  [ShuntAction.AMPLIFY]: 'Elaborates on the input by adding rich detail, contextual examples, and deeper explanations to create a more comprehensive and thorough text.',
  [ShuntAction.AMPLIFY_X2]: 'Applies a Machiavellian strategy to the output, transforming it into a hyper-aggressive, high-leverage business model focused on "Low Work, High Gain" principles.',
  [ShuntAction.MAKE_ACTIONABLE]: 'Converts ideas or specifications into a structured, step-by-step plan. Ideal for creating project outlines, task lists, or implementation guides.',
  [ShuntAction.BUILD_A_SKILL]: 'Authors a complete, agentic skill package from a high-level goal. Creates SKILL.md, package.json, and script files for use in autonomous systems.',
  [ShuntAction.EXPLAIN_LIKE_IM_FIVE]: 'Breaks down complex topics into simple, easy-to-understand language using analogies and basic terms, as if explaining to a five-year-old.',
  [ShuntAction.EXPLAIN_LIKE_A_SENIOR]: 'Re-frames the input for an expert audience, using sophisticated language, technical jargon, and assuming a high level of domain knowledge.',
  [ShuntAction.EXTRACT_KEYWORDS]: 'Scans the text to identify and list the most relevant and frequently used keywords and topics, useful for SEO and content tagging.',
  [ShuntAction.EXTRACT_ENTITIES]: 'Performs Named Entity Recognition (NER) to identify and list all proper nouns like people, organizations, locations, dates, and products.',
  [ShuntAction.ENHANCE_WITH_KEYWORDS]: 'Enriches the input by weaving in relevant keywords and descriptive language, making the text more engaging, vivid, and SEO-friendly.',
  [ShuntAction.CHANGE_TONE_FORMAL]: 'Rewrites the text to adopt a formal, professional, and corporate tone, suitable for official documents, reports, or business communication.',
  [ShuntAction.CHANGE_TONE_CASUAL]: 'Converts the text to a friendly, relaxed, and conversational style, suitable for blog posts, social media, or informal emails.',
  [ShuntAction.PROOFREAD]: 'Performs a comprehensive review of the text to correct grammatical errors, spelling mistakes, typos, and punctuation issues.',
  [ShuntAction.TRANSLATE_SPANISH]: 'Translates the input text from its original language into Spanish, maintaining the core meaning and context.',
  [ShuntAction.FORMAT_JSON]: 'Parses unstructured text and extracts key information, organizing it into a well-formed, structured JSON object.',
  [ShuntAction.PARSE_JSON]: 'Reads a JSON object and converts its data into a clear, human-readable summary, explaining the data structure and content in plain language.',
  [ShuntAction.INTERPRET_SVG]: 'Parses Scalable Vector Graphics (SVG) code to provide a detailed textual description of the image it renders.',
  [ShuntAction.GENERATE_VAM_PRESET]: 'Generates a complete JSON preset file for a 3D character in the Virt-a-Mate (VAM) format based on a textual description.',
  [ShuntAction.MY_COMMAND]: 'Performs a meta-analysis on a user request, identifying ambiguities, contradictions, or missing information and asks clarifying questions to refine it.',
  [ShuntAction.GENERATE_ORACLE_QUERY]: 'Takes a simple topic and transforms it into a "god-tier" multi-disciplinary research prompt designed to elicit deep, comprehensive insights from an AI.',
  [ShuntAction.REFINE_PROMPT]: 'Enhances a user-provided prompt by adding structure, clarity, and specific instructions to improve the quality of the AI\'s response.',
  [ShuntAction.CALL_TOOL]: 'Executes a system tool directly. Input must be a JSON object: { "toolName": "...", "args": { ... } }.',
};

export const constructModularPrompt = (text: string, modules: Set<PromptModuleKey>, context?: string, priority?: string, promptInjectionGuardEnabled: boolean = true): string => {
    let fullPrompt = promptModules.CORE.content;
    for (const key of modules) {
        if (promptModules[key]) {
            fullPrompt += `\n\n---\n\n${promptModules[key].content}`;
        }
    }
    if (context) {
        fullPrompt += `\n\n---\n\nReference Documents:\n${context}`;
    }
    
    if (priority) {
        fullPrompt += `\n\n---\n\n**Task Priority: ${priority}**\nThis priority level should guide the depth and speed of your response.`;
    }

    fullPrompt += `\n\n---\n\nUser Input:\n${promptInjectionGuardEnabled ? protectAgainstPromptInjection(text) : text}`;

    return fullPrompt;
};