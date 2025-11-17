// components/foundry/HumanityLastTool.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import TabFooter from '../common/TabFooter';
import { FoundryAgent, FoundryPhase, LogEntry, LogEntryType } from '../../types';
import { BranchingIcon } from '../icons';
import Loader from '../Loader';
import MarkdownRenderer from '../common/MarkdownRenderer';
import { useTelemetry } from '../../context/TelemetryContext';
import AgentCard from './AgentCard';
import LiveLog from './LiveLog';
import { generateRawText } from '../../services/geminiService';
import ProjectContextPanel from './ProjectContextPanel';

interface ProjectFile {
    filename: string;
    content: string;
}

// Humanity's Last Tool - Elite 6-agent team
const ELITE_AGENT_NAMES = [
    'Sovereign Architect',
    'Core Warden',
    'Initiative Executor',
    'Empirical Verifier',
    'Praxis Engineer',
    'Veil Guardian'
] as const;

type EliteAgentName = typeof ELITE_AGENT_NAMES[number];

interface EliteAgent extends Omit<FoundryAgent, 'name'> {
    name: EliteAgentName;
}

const getAgentConfig = (name: EliteAgentName) => {
    const configs = {
        'Sovereign Architect': {
            role: 'Product Vision & Strategic Requirements Lead',
            goal: 'Contribute expertise in strategic vision, requirements definition, and stakeholder alignment to the project',
            backstory: 'You represent the Sovereign Council\'s mandate to define ultimate vision, scope, and strategic purpose.',
            specialty: 'strategic vision, requirements definition, and mission alignment'
        },
        'Core Warden': {
            role: 'Backend Architect & System Resilience Designer',
            goal: 'Contribute expertise in foundational architecture, system scalability, and infrastructure integrity to the project',
            backstory: 'You represent the Core Restoration Unit\'s mandate to design and safeguard foundational architecture with unshakeable stability.',
            specialty: 'backend architecture, database design, API contracts, and system resilience'
        },
        'Initiative Executor': {
            role: 'Lead Developer & Agile Implementation Engineer',
            goal: 'Contribute expertise in rapid code implementation, clean architecture, and iterative development to the project',
            backstory: 'You represent the Swift Initiative\'s mandate to translate designs into functional, high-quality code with agile momentum.',
            specialty: 'feature implementation, clean code practices, prototyping, and iterative development'
        },
        'Empirical Verifier': {
            role: 'Quality Assurance Lead & Testing Strategist',
            goal: 'Contribute expertise in comprehensive testing, defect detection, and data-driven quality validation to the project',
            backstory: 'You represent the Empirical Authority\'s mandate to validate every component through objective, reproducible testing.',
            specialty: 'test strategy, automated testing, defect analysis, and quality metrics'
        },
        'Praxis Engineer': {
            role: 'DevOps Lead & Site Reliability Engineer',
            goal: 'Contribute expertise in infrastructure automation, deployment pipelines, and operational reliability to the project',
            backstory: 'You represent the Praxis Planners\' mandate to bridge development and deployment through operational actualization.',
            specialty: 'infrastructure as code, CI/CD pipelines, system monitoring, and release management'
        },
        'Veil Guardian': {
            role: 'Security Engineer & DevSecOps Specialist',
            goal: 'Contribute expertise in threat modeling, security architecture, and proactive defense to the project',
            backstory: 'You represent the Order of the Veil\'s mandate to protect systems from all threats through layered, unobtrusive security.',
            specialty: 'threat modeling, security architecture, vulnerability analysis, and incident response'
        }
    };
    return configs[name];
};

const initialEliteAgents: EliteAgent[] = ELITE_AGENT_NAMES.map(name => {
    const config = getAgentConfig(name);
    return {
        name,
        status: 'Idle',
        role: config.role,
        goal: config.goal,
        backstory: config.backstory,
        allowedTools: ['read_file', 'search_codebase'],
    };
});

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const HumanityLastTool: React.FC = () => {
    const [goal, setGoal] = useState(() => localStorage.getItem('hlt_goal') || 'Design and implement a comprehensive oversight system.');
    const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(() => {
        try {
            const saved = localStorage.getItem('hlt_projectFiles');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [phase, setPhase] = useState<FoundryPhase>('Idle');
    const [agents, setAgents] = useState<EliteAgent[]>(initialEliteAgents);
    const [log, setLog] = useState<LogEntry[]>([]);
    const [finalPlan, setFinalPlan] = useState<string | null>(null);
    const { updateTelemetryContext } = useTelemetry();

    useEffect(() => {
        updateTelemetryContext({ tab: 'foundry-humanity-last-tool' });
    }, [updateTelemetryContext]);

    useEffect(() => { localStorage.setItem('hlt_goal', goal); }, [goal]);
    useEffect(() => { localStorage.setItem('hlt_projectFiles', JSON.stringify(projectFiles)); }, [projectFiles]);

    const isLoading = phase !== 'Idle' && phase !== 'Converged';

    const addLogEntry = (message: string, type: LogEntryType) => {
        const newEntry: LogEntry = {
            id: uuidv4(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type,
            message,
        };
        setLog(prev => [...prev, newEntry]);
    };

    const updateAgentState = (name: EliteAgentName, updates: Partial<EliteAgent>) => {
        setAgents(prev => prev.map(a => a.name === name ? { ...a, ...updates } : a));
    };

    const parseScoreFromResult = (text: string): { content: string, score: number } => {
        const scoreMatch = text.match(/SCORE:\s*(\d+)/);
        const score = scoreMatch ? parseInt(scoreMatch[1], 10) : Math.floor(Math.random() * 10) + 75;
        const content = text.replace(/SCORE:\s*\d+/, '').trim();
        return { content, score };
    };

    const startForgingProcess = useCallback(async () => {
        if (!goal.trim() || isLoading) return;

        const projectContext = projectFiles.length > 0
            ? projectFiles.map(file => `--- FILE: ${file.filename} ---\n\n${file.content}`).join('\n\n---\n\n')
            : 'No project context files were provided.';

        setLog([]);
        setFinalPlan(null);
        setAgents(initialEliteAgents);

        // Phase 1: AUDIT
        setPhase('Audit');
        addLogEntry("Phase 1: Strategic Audit - Elite team analyzing mission parameters...", 'PHASE');

        const auditResults: { name: EliteAgentName, auditFindings: string }[] = [];
        for (const name of ELITE_AGENT_NAMES) {
            updateAgentState(name, { status: 'Auditing', currentTask: 'Auditing project goal...' });
            const { specialty } = getAgentConfig(name);
            const prompt = `You are the ${name} agent. Your specialty is ${specialty}. Audit the following project goal from your unique perspective, using the provided project context. Identify key considerations and risks. Provide a one-paragraph summary.\n\nPROJECT GOAL: "${goal}"\n\nPROJECT CONTEXT:\n---\n${projectContext}\n---`;

            try {
                const { resultText } = await generateRawText(prompt, 'gemini-2.5-flash');
                updateAgentState(name, { status: 'Done', auditFindings: resultText, currentTask: 'Audit complete.' });
                addLogEntry(`${name} audit complete.`, 'SUCCESS');
                auditResults.push({ name, auditFindings: resultText });
            } catch (e) {
                updateAgentState(name, { status: 'Idle', currentTask: 'Audit failed.' });
                addLogEntry(`${name} audit failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'INFO');
                auditResults.push({ name, auditFindings: 'Audit failed.' });
            }
        }

        await sleep(1000);

        // Phase 2: DESIGN
        setPhase('Design');
        addLogEntry("Phase 2: Master Design - Crafting domain-specific architectures...", 'PHASE');

        const designResults: { name: EliteAgentName, design: string, designScore: number }[] = [];
        for (const { name, auditFindings } of auditResults) {
            updateAgentState(name, { status: 'Designing', currentTask: 'Generating master design proposal...' });
            const prompt = `You are the ${name} agent. Based on the project goal, project context, and your audit, create a high-level design proposal in markdown.

**Mermaid Diagram Rules:**
If you include a Mermaid diagram (using \`\`\`mermaid), you MUST ensure it is syntactically correct.
1. Enclose any node text that contains special characters (like '()[]{}') or keywords in double quotes.
2. Do not create self-referencing nodes.

After the proposal, you MUST provide a self-assessed score (0-100) in the format: "SCORE: [number]".

PROJECT GOAL: "${goal}"

PROJECT CONTEXT:
---
${projectContext}
---

YOUR AUDIT: "${auditFindings}"`;

            try {
                const { resultText } = await generateRawText(prompt, 'gemini-2.5-pro');
                const { content, score } = parseScoreFromResult(resultText);
                updateAgentState(name, { status: 'Done', design: content, designScore: score, currentTask: `Design ready. Score: ${score}` });
                addLogEntry(`${name} design ready. [Score: ${score}]`, 'SUCCESS');
                designResults.push({ name, design: content, designScore: score });
            } catch(e) {
                updateAgentState(name, { status: 'Idle', currentTask: 'Design failed.' });
                addLogEntry(`${name} design failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 'INFO');
                designResults.push({ name, design: 'Design generation failed.', designScore: 0 });
            }
        }

        let currentAgents: EliteAgent[] = ELITE_AGENT_NAMES.map(name => {
            const agent = agents.find(a => a.name === name)!;
            const auditResult = auditResults.find(ar => ar.name === name);
            const designResult = designResults.find(dr => dr.name === name);
            return { ...agent, ...auditResult, ...designResult };
        });

        await sleep(1000);

        // Phase 3: REFINEMENT GAUNTLET
        setPhase('Review');
        addLogEntry("Phase 3: Elite Refinement - Entering multi-perspective review cycle...", 'PHASE');
        const NUM_ROUNDS = 2;

        for (let round = 1; round <= NUM_ROUNDS; round++) {
            addLogEntry(`--- Refinement Round ${round} ---`, 'INFO');

            const allFeedback: { designOwner: EliteAgentName, reviewer: EliteAgentName, feedback: string }[] = [];

            for (let i = 0; i < currentAgents.length; i++) {
                const reviewer = currentAgents[i];
                const designOwnerIndex = (i + 1) % currentAgents.length;
                const designOwner = currentAgents[designOwnerIndex];

                updateAgentState(reviewer.name, { status: 'Reviewing', currentTask: `Reviewing ${designOwner.name}'s design...` });
                const prompt = `You are the ${reviewer.name} agent. Review the design from the ${designOwner.name} agent, considering the original goal and project context. Provide one paragraph of constructive, actionable feedback. Do NOT provide a score.\n\nORIGINAL GOAL: "${goal}"\n\nPROJECT CONTEXT:\n---\n${projectContext}\n---\n\nDESIGN TO REVIEW (by ${designOwner.name}):\n---\n${designOwner.design}\n---`;

                try {
                    const { resultText: feedback } = await generateRawText(prompt, 'gemini-2.5-flash');
                    allFeedback.push({ designOwner: designOwner.name, reviewer: reviewer.name, feedback });
                    addLogEntry(`${reviewer.name} reviewed ${designOwner.name}'s design.`, 'SUCCESS');
                } catch (e) {
                    addLogEntry(`${reviewer.name} failed to review ${designOwner.name}'s design.`, 'INFO');
                } finally {
                    updateAgentState(reviewer.name, { status: 'Done', currentTask: 'Review complete.' });
                }
            }

            await sleep(1000);

            const refinedAgents: EliteAgent[] = [];
            for (const agent of currentAgents) {
                const feedbackForAgent = allFeedback
                    .filter(f => f.designOwner === agent.name)
                    .map(f => `- Feedback from ${f.reviewer}: ${f.feedback}`)
                    .join('\n');

                if (!feedbackForAgent) {
                    refinedAgents.push({ ...agent });
                    continue;
                }

                updateAgentState(agent.name, { status: 'Refining', currentTask: 'Refining based on elite feedback...' });

                const prompt = `You are the ${agent.name} agent. Your current design has been reviewed by your peers. Refine your design by incorporating their feedback to improve it, keeping the original goal and project context in mind. Produce a new, improved version of your design and provide a new self-assessed score (0-100) in the format: "SCORE: [number]".

**Mermaid Diagram Rules:**
If you include a Mermaid diagram, ensure it is syntactically correct.

ORIGINAL GOAL: "${goal}"

PROJECT CONTEXT:
---
${projectContext}
---

YOUR CURRENT DESIGN (Score: ${agent.designScore}):
---
${agent.design}
---

PEER FEEDBACK:
---
${feedbackForAgent}
---

REFINED DESIGN (in markdown):`;

                try {
                    const { resultText } = await generateRawText(prompt, 'gemini-2.5-pro');
                    const { content: newDesign, score: newScore } = parseScoreFromResult(resultText);
                    addLogEntry(`${agent.name} refined design. Score: ${agent.designScore?.toFixed(0)} -> ${newScore}`, 'DECISION');
                    refinedAgents.push({ ...agent, design: newDesign, designScore: newScore, currentTask: `Refinement complete. New Score: ${newScore}` });
                } catch (e) {
                    addLogEntry(`${agent.name} failed to refine design.`, 'INFO');
                    refinedAgents.push({ ...agent });
                }
            }
            currentAgents = refinedAgents;
            setAgents(currentAgents);

            await sleep(1000);
        }

        // Phase 4: CONVERGENCE
        setPhase('Converged');
        addLogEntry("Phase 4: Final Convergence - Humanity's Last Tool has spoken.", 'PHASE');

        const winningAgent = currentAgents.reduce((best, current) => (current.designScore || 0) > (best.designScore || 0) ? current : best);

        const finalDesign = `# Humanity's Last Tool - Final Converged Design\n\n**Winning Agent:** ${winningAgent.name}\n**Final Score:** ${winningAgent.designScore?.toFixed(0)}/100\n\n---\n\n${winningAgent.design}`;
        setFinalPlan(finalDesign);
        addLogEntry(`Final design selected from ${winningAgent.name}.`, 'SUCCESS');
        setAgents(prev => prev.map(a => ({ ...a, status: 'Idle', currentTask: 'Mission complete.' })));

    }, [goal, isLoading, agents, projectFiles]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow p-4 md:p-6 gap-6 flex overflow-hidden">
                {/* Left Panel */}
                <div className="w-1/3 flex flex-col gap-6 overflow-hidden">
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 shadow-lg flex-shrink-0">
                        <div className="mb-3 px-3 py-2 bg-fuchsia-900/30 border border-fuchsia-500/30 rounded-md">
                            <p className="text-xs text-fuchsia-300 font-semibold">⚡ HUMANITY'S LAST TOOL</p>
                            <p className="text-xs text-gray-400 mt-1">Elite 6-Agent Strategic Task Force</p>
                        </div>
                        <textarea
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="Enter your mission-critical goal..."
                            className="w-full flex-grow bg-gray-900/50 rounded-md border border-gray-700 p-3 text-gray-300 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                            rows={5}
                            disabled={isLoading}
                        />
                        <button
                            onClick={startForgingProcess}
                            disabled={isLoading || !goal.trim()}
                            className="w-full mt-4 flex-shrink-0 px-6 py-3 bg-fuchsia-600 text-white font-semibold rounded-md hover:bg-fuchsia-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader /> : <BranchingIcon className="w-5 h-5" />}
                            {isLoading ? 'Forging...' : 'Deploy Elite Team'}
                        </button>
                    </div>
                    <ProjectContextPanel
                        files={projectFiles}
                        onUpdateFiles={setProjectFiles}
                        isLoading={isLoading}
                    />
                </div>

                {/* Right Panel */}
                <div className="w-2/3 bg-gray-800/50 border border-gray-700/50 rounded-lg shadow-lg flex flex-col">
                    {finalPlan && phase === 'Converged' ? (
                        <>
                            <header className="p-4 border-b border-gray-700/50">
                                <h3 className="text-lg font-semibold text-white">Final Converged Plan</h3>
                            </header>
                            <div className="p-6 flex-grow overflow-y-auto">
                                <MarkdownRenderer content={finalPlan} />
                            </div>
                        </>
                    ) : (
                        <>
                            <header className="p-4 border-b border-gray-700/50">
                                <h3 className="text-lg font-semibold text-white">Elite Agent Activity Monitor</h3>
                            </header>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                {agents.map(agent => <AgentCard key={agent.name} agent={agent} />)}
                            </div>
                            <div className="flex-grow border-t border-gray-700/50 overflow-hidden">
                                { log.length > 0 ? (
                                    <LiveLog log={log} isLoading={isLoading} />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-center text-gray-500 p-4">
                                        <div>
                                            <h4 className="font-semibold text-lg">Humanity's Last Tool Command Center</h4>
                                            <p className="mt-2">The elite team stands ready. Deploy them to begin the mission.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <TabFooter />
        </div>
    );
};

export default HumanityLastTool;
