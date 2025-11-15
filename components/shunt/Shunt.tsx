// components/shunt/Shunt.tsx
import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { v4 as uuidv4 } from 'uuid';
import JSZip from 'jszip';
import InputPanel from './InputPanel';
import ControlPanel from './ControlPanel';
import OutputPanel from './OutputPanel';
import PromptLifecyclePanel from './PromptLifecyclePanel';
import { performShunt, executeModularPrompt, gradeOutput, synthesizeDocuments } from '../../services/geminiService';
import { ShuntAction, TokenUsage, PromptModuleKey, HistoryEntry } from '../../types';
import { useValidation } from '../../hooks/useValidation';
import { useTelemetry } from '../../context/TelemetryContext';
import TabFooter from '../common/TabFooter';
import { audioService } from '../../services/audioService';
import { getPromptForAction, constructModularPrompt } from '../../services/prompts';
import { useMailbox } from '../../context/MailboxContext';
import { parseSkillPackagePlan } from '../../services/skillParser';
import { useMCPContext } from '../../context/MCPContext';
import { MCPConnectionStatus } from '../../types/mcp';
import { logFrontendError, ErrorSeverity, parseApiError } from '../../utils/errorLogger';
import Scratchpad from '../common/Scratchpad';
import BulletinBoardPanel from './BulletinBoardPanel';
import { useSubscription } from '../../context/SubscriptionContext';
import { useSettings } from '../../context/SettingsContext';
import { sanitizeInput } from '../../utils/security';
import WorkflowGuide from './WorkflowGuide';
import MobileViewSwitcher from './MobileViewSwitcher';
import { useDebounce } from '../../hooks/useDebounce';
import DocumentViewerModal from '../common/DocumentViewerModal';
import { useLmStudio } from '../../hooks/useLmStudio';
import Loader from '../Loader';
import { executeTool, ExecutionContext, ToolResult } from '../../services/toolApi';

const EvolveModal = lazy(() => import('./EvolveModal'));

const DEFAULT_INPUT_TEXT = `Refactoring \`auth.js\`: Callbacks to Async/Await

This plan assumes \`auth.js\` contains asynchronous operations (e.g., database calls, file I/O, API requests) that currently rely on callback functions for handling results and errors.


Phase 1: Preparation and Setup

1. Backup Your Code:

* Crucial first step! Before making any changes, ensure you have a working backup or commit your current \`auth.js\` to version control. This allows you to revert easily if anything goes wrong.


2. Identify Asynchronous Functions:

* Open \`auth.js\` and pinpoint all functions that take a callback as their last argument (e.g., \`getUser(id, callback)\`, \`saveUser(user, callback)\`, \`readFile(path, callback)\`).

* Note down the parameters passed to these callbacks (e.g., \`callback(err, data)\`). This is essential for converting them to Promises.


3. Understand Dependencies and External Libraries:

* Node.js Built-in Modules (e.g., \`fs\`): Node.js often has \`.../promises\` versions (e.g., \`fs.promises\`) or \`util.promisify\` for converting callback-based functions. Prioritize these if available.

* Database Libraries (e.g., Mongoose, Sequelize, \`node-postgres\`): Most modern database libraries return Promises by default or have methods like \`.exec()\` (Mongoose) that return Promises.

* HTTP Clients (e.g., \`request\`, \`axios\`): If using \`request\`, consider switching to a Promise-based client like \`axios\` or the built-in \`fetch\` API (for newer Node.js versions) if it's not already used.

* Custom Asynchronous Functions: These will be the primary candidates for manual Promisification.


4. Set Up Testing (If Applicable):

* If you have existing unit or integration tests for \`auth.js\` functionality, make sure they are runnable. You'll use them to verify correctness after refactoring.

* If not, plan for thorough manual testing of all authentication flows (login, registration, password reset, token validation, etc.).`;

const DEMO_TEXT = `### **Feature Specification: Senior Documentation Specialist Workflow**

#### **1. Objective**

This document outlines the functional requirements for a new user role, the **Senior Documentation Specialist**, and the implementation of a primary user interface element, the **"Create Documentation" button**. This feature is designed to streamline the documentation creation process by providing a dedicated entry point for authorized personnel, ensuring a structured and efficient workflow from initiation to publication.

#### **2. User Role Definition: Senior Documentation Specialist**

To properly contextualize the feature, we must first define the new user role and its associated permissions and responsibilities within the system.

*   **Role Name:** Senior Documentation Specialist
*   **Core Responsibility:** This user is responsible for the end-to-end lifecycle of technical and user-facing documentation. This includes creating new documents, editing existing content, managing version control, and publishing final articles.
*   **Permissions:**
    *   **Create:** Full ability to initiate new documentation artifacts of any type (e.g., User Guides, API References, Tutorials, Release Notes).
    *   **Read/Write:** Unrestricted access to edit and update all documentation drafts and published articles.
    *   **Delete:** Authority to archive or permanently delete documentation, subject to system-defined retention policies.
    *   **Publish:** Ability to change the status of a document from "Draft" to "Published," making it visible to its intended audience.
*   **Distinction from Other Roles:** This role is distinct from a "Contributor," who may only be able to suggest edits or work on assigned drafts, and a "Viewer," who has read-only access to published materials.

#### **3. UI Element: The "Create Documentation" Button**

This new button will serve as the primary call-to-action for the Senior Documentation Specialist to begin their workflow.

*   **Label:** The button will be clearly labeled **"Create Documentation"**.
*   **Location & Visibility:**
    *   The button will be prominently placed on the main application dashboard or within the global navigation header for easy access.
    *   **Conditional Rendering:** The button's visibility and state are strictly tied to user permissions.
        *   **Visible and Enabled:** For any user logged in with the "Senior Documentation Specialist" role.
        *   **Hidden or Disabled:** For all other user roles (e.g., Viewer, Contributor, Admin). If disabled, a tooltip on hover should state, "You do not have permission to create new documentation." Hiding the button is the preferred approach to maintain a clean UI for other users.
*   **Styling:** The button should use the application's primary action color and style to signify its importance as a key workflow initiator. It may be accompanied by a "plus" or "document-add" icon for enhanced visual recognition.

#### **4. Functional Workflow: From Click to Creation**

The following sequence of events occurs when the "Create Documentation" button is clicked by an authorized user.

**Step 1: Initiation**
The Senior Documentation Specialist clicks the "Create Documentation" button.

**Step 2: Present Creation Modal/Form**
The system presents a modal window or navigates to a dedicated "Create New Document" page. This form will contain the following fields to gather essential metadata for the new document:

*   **Document Title (Required):** A text input field for the document's primary title. The system must validate that this field is not empty.
*   **Document Type (Required):** A dropdown menu to classify the content. This ensures proper categorization and application of templates.
    *   *Examples:* \`User Guide\`, \`API Reference\`, \`Tutorial\`, \`Release Notes\`, \`FAQ\`.
*   **Associated Product/Project (Optional but Recommended):** A searchable dropdown or tag field to link the documentation to a specific product, feature, or project within the system. This is crucial for organization and context.
*   **Initial Template (Optional):** A dropdown allowing the user to start from a pre-defined structure.
    *   *Examples:* \`Blank Document\`, \`Standard Article Template\`, \`API Endpoint Template\`. Selecting a template will pre-populate the editor with a foundational structure (e.g., headings, boilerplate text).

**Step 3: Submission and System Processing**
Upon the user filling out the required fields and clicking a "Create & Continue" or similar confirmation button:
1.  **Client-Side Validation:** The form validates that all required fields are complete.
2.  **Server-Side Action:** The system creates a new, unique documentation entity in the database with the provided metadata.
3.  **Default State:** The new document is automatically assigned an initial status of **"Draft"**.
4.  **Ownership:** The user who initiated the creation is assigned as the **"Owner"** or "Primary Author."

**Step 4: Redirection to Editor**
Immediately following successful creation, the user is automatically redirected to the rich-text editor interface for the newly created document. This provides a seamless transition from initiation to the act of writing, eliminating unnecessary clicks and navigation.

**Step 5: User Confirmation**
A non-intrusive success notification (e.g., a "toast" message) appears on the editor screen, confirming the action.
*   *Example Message:* "Success! '*How to Configure the New Widget*' has been created. You can start writing now."`;

const TOOL_DEMO_TEXT = JSON.stringify({
  toolName: "read_file",
  args: {
    "path": "src/auth.js"
  }
}, null, 2);

const MAX_INPUT_LENGTH = 600000;
const RATE_LIMIT_COUNT = 5;
const RATE_LIMIT_WINDOW_MS = 10000; // 10 seconds

interface BulletinDocument {
    name: string;
    content: string;
}

const Shunt: React.FC = () => {
  const [inputText, setInputText] = useState(() => localStorage.getItem('shunt_inputText') || DEFAULT_INPUT_TEXT);
  const [outputText, setOutputText] = useState(() => localStorage.getItem('shunt_outputText') || '');
  const [priority, setPriority] = useState(() => localStorage.getItem('shunt_priority') || 'Medium');
  const [isLoading, setIsLoading] = useState(false);
  const [isEvolving, setIsEvolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeShunt, setActiveShunt] = useState<string | null>(null);
  const [lastTokenUsage, setLastTokenUsage] = useState<TokenUsage | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-pro');
  const [modulesForLastRun, setModulesForLastRun] = useState<string[] | null>(null);
  const [showAmplifyX2, setShowAmplifyX2] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
        const saved = localStorage.getItem('shunt_history');
        return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [initialPrompt, setInitialPrompt] = useState(() => localStorage.getItem('shunt_initialPrompt') || '');
  const [isScratchpadVisible, setIsScratchpadVisible] = useState(false);
  const [scratchpadPosition, setScratchpadPosition] = useState({ x: 100, y: 100 });
  const [isScratchpadMinimized, setIsScratchpadMinimized] = useState(false);
  const [scratchpadContent, setScratchpadContent] = useState(() => localStorage.getItem('shunt_scratchpadContent') || '');
  const [bulletinDocuments, setBulletinDocuments] = useState<BulletinDocument[]>(() => {
      try {
          const saved = localStorage.getItem('shunt_bulletinDocuments');
          return saved ? JSON.parse(saved) : [];
      } catch { return []; }
  });
  const [panelStates, setPanelStates] = useState({
    bulletin: false, // false = not minimized
    input: false,
    output: false,
    control: false,
    lifecycle: false,
  });
  const [guideStatus, setGuideStatus] = useState<'visible' | 'fading' | 'hidden'>('visible');
  const [mobileActiveView, setMobileActiveView] = useState<'input' | 'controls' | 'output'>('input');
  const [viewingDocument, setViewingDocument] = useState<BulletinDocument | null>(null);
  const [isChainMode, setIsChainMode] = useState(() => {
    try {
        const saved = localStorage.getItem('shunt_isChainMode');
        return saved ? JSON.parse(saved) : false;
    } catch { return false; }
  });
  const [isEvolveModalOpen, setIsEvolveModalOpen] = useState(false);

  const shuntContainerRef = useRef<HTMLDivElement>(null);
  const isEvolvingRef = useRef(false);
  const requestTimestamps = useRef<number[]>([]);

  const { telemetryService, versionControlService } = useTelemetry();
  const { deliverFiles } = useMailbox();
  const { extensionApi, status: mcpStatus } = useMCPContext();
  const { usage, tierDetails, incrementUsage } = useSubscription();
  const { settings } = useSettings();
  const { callLmStudio, isLmStudioLoading, lmStudioError } = useLmStudio();

  useEffect(() => {
    if (lmStudioError) {
        setError(lmStudioError);
    }
  }, [lmStudioError]);


  const { errors, isTouched, validate, markAsTouched, reset } = useValidation(
    inputText,
    { required: true, maxLength: MAX_INPUT_LENGTH },
    { required: 'Input cannot be empty.', maxLength: `Input cannot exceed ${MAX_INPUT_LENGTH} characters.` }
  );

  const isShuntEmpty = !inputText && !outputText && !isLoading && !error && bulletinDocuments.length === 0;
  
  // Debounce state for localStorage persistence
  const debouncedInputText = useDebounce(inputText, 500);
  const debouncedOutputText = useDebounce(outputText, 500);
  const debouncedPriority = useDebounce(priority, 500);
  const debouncedHistory = useDebounce(history, 500);
  const debouncedInitialPrompt = useDebounce(initialPrompt, 500);
  const debouncedScratchpadContent = useDebounce(scratchpadContent, 500);
  const debouncedBulletinDocuments = useDebounce(bulletinDocuments, 500);
  const debouncedIsChainMode = useDebounce(isChainMode, 500);

  // Persist state to localStorage using debounced values
  useEffect(() => { localStorage.setItem('shunt_inputText', debouncedInputText); }, [debouncedInputText]);
  useEffect(() => { localStorage.setItem('shunt_outputText', debouncedOutputText); }, [debouncedOutputText]);
  useEffect(() => { localStorage.setItem('shunt_priority', debouncedPriority); }, [debouncedPriority]);
  useEffect(() => { localStorage.setItem('shunt_history', JSON.stringify(debouncedHistory)); }, [debouncedHistory]);
  useEffect(() => { localStorage.setItem('shunt_initialPrompt', debouncedInitialPrompt); }, [debouncedInitialPrompt]);
  useEffect(() => { localStorage.setItem('shunt_scratchpadContent', debouncedScratchpadContent); }, [debouncedScratchpadContent]);
  useEffect(() => { localStorage.setItem('shunt_bulletinDocuments', JSON.stringify(debouncedBulletinDocuments)); }, [debouncedBulletinDocuments]);
  useEffect(() => { localStorage.setItem('shunt_isChainMode', JSON.stringify(debouncedIsChainMode)); }, [debouncedIsChainMode]);
  

  useEffect(() => {
    if (outputText && !isLoading && window.innerWidth < 1280) {
        setMobileActiveView('output');
    }
  }, [outputText, isLoading]);

  useEffect(() => {
    if (isShuntEmpty) {
        setGuideStatus('visible'); // Reset if it becomes empty again
        const fadeTimer = setTimeout(() => {
            setGuideStatus('fading');
        }, 3000); // Start fading after 3 seconds

        const hideTimer = setTimeout(() => {
            setGuideStatus('hidden');
        }, 4000); // Hide completely after another second (1s fade)

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(hideTimer);
        };
    } else {
        setGuideStatus('hidden');
    }
}, [isShuntEmpty]);

  const togglePanel = (panel: keyof typeof panelStates) => {
    setPanelStates(prev => ({ ...prev, [panel]: !prev[panel] }));
    audioService.playSound('click');
  };

  const handleApiError = useCallback((e: any, telemetryContext: Record<string, any>) => {
    logFrontendError(e, ErrorSeverity.High, telemetryContext);
    
    const userFriendlyMessage = parseApiError(e);

    setError(userFriendlyMessage);
    setShowAmplifyX2(false);
    audioService.playSound('error');
  }, []);

  const checkRateLimit = useCallback(() => {
      if (!settings.clientSideRateLimitingEnabled) return false;

      const now = Date.now();
      requestTimestamps.current = requestTimestamps.current.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
      
      if (requestTimestamps.current.length >= RATE_LIMIT_COUNT) {
          setError(`Rate limit exceeded. Please wait a moment before sending another request.`);
          audioService.playSound('error');
          return true;
      }
      
      requestTimestamps.current.push(now);
      return false;

  }, [settings.clientSideRateLimitingEnabled]);

  const resetChain = useCallback(() => {
    setHistory([]);
    setInitialPrompt('');
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(event.target.value);
     if (!isEvolvingRef.current) {
        resetChain();
    }
  };
  
  const handleFileLoad = (text: string) => {
    setInputText(text);
    resetChain();
  };

  const getBulletinContext = useCallback(() => {
    if (bulletinDocuments.length === 0) return undefined;
    return bulletinDocuments
      .map(doc => `--- Reference Document: ${doc.name} ---\n\n${doc.content}`)
      .join('\n\n---\n\n');
  }, [bulletinDocuments]);

  const handleGradeAndIterate = useCallback(async () => {
    if (!outputText) return;
    setIsEvolving(true);
    isEvolvingRef.current = true;
    try {
        const { score } = await gradeOutput(outputText, history.length > 0 ? history[history.length-1].prompt : initialPrompt);
        const newHistoryEntry: HistoryEntry = {
            id: uuidv4(),
            prompt: history.length > 0 ? history[history.length-1].output : initialPrompt,
            output: outputText,
            score: score,
        };
        setHistory(prev => [...prev, newHistoryEntry]);
        setInputText(outputText);
        setOutputText('');
        setError(null);
        setModulesForLastRun(null);
    } catch (e: any) {
        handleApiError(e, { context: 'Shunt.handleGradeAndIterate' });
    } finally {
        setIsEvolving(false);
        setTimeout(() => { isEvolvingRef.current = false; }, 500);
    }
  }, [outputText, initialPrompt, history, handleApiError]);

  // Auto-evolve logic for Chain Mode
  useEffect(() => {
    if (isChainMode && outputText && !isLoading && !error) {
        const chainTimeout = setTimeout(() => {
            handleGradeAndIterate();
        }, 1500); // 1.5-second delay for user to read output

        return () => clearTimeout(chainTimeout);
    }
  }, [outputText, isChainMode, isLoading, error, handleGradeAndIterate]);

  const handleShunt = useCallback(async (action: ShuntAction | string, textToProcess: string = inputText) => {
    if (tierDetails.shuntRuns !== 'unlimited' && usage.shuntRuns >= tierDetails.shuntRuns) {
        setError("You've reached your monthly limit for Shunt runs. Please upgrade your plan in the Subscription tab.");
        audioService.playSound('error');
        return;
    }
    if (checkRateLimit()) return;

    markAsTouched();
    if (!validate() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setOutputText('');
    setModulesForLastRun(null);
    setShowAmplifyX2(false);
    setActiveShunt(action);
    audioService.playSound('send');
    
    if (history.length === 0) {
        setInitialPrompt(textToProcess);
    }

    if (action === ShuntAction.CALL_TOOL) {
        try {
            const { toolName, args } = JSON.parse(textToProcess);
            if (!toolName || typeof toolName !== 'string') {
                throw new Error("Invalid input format. Missing or invalid 'toolName'.");
            }
            if (args === undefined) {
                 throw new Error("Invalid input format. Missing 'args' object.");
            }

            const executionContext: ExecutionContext = {
                agentId: 'shunt-direct-caller',
                permissions: ['system:admin', 'filesystem:read', 'filesystem:write', 'scratchpad:write', 'vcs:read', 'vcs:stage', 'vcs:branch', 'vcs:commit', 'execution:tests', 'execution:scripts'],
            };

            const result: ToolResult = await executeTool(toolName, args, executionContext);
            setOutputText(JSON.stringify(result, null, 2));
            audioService.playSound(result.success ? 'receive' : 'error');
            
            telemetryService?.recordEvent({
                eventType: 'system_action',
                interactionType: 'tool_call',
                tab: 'Shunt',
                userInput: textToProcess.substring(0, 200),
                aiOutput: JSON.stringify(result).substring(0, 200),
                outcome: result.success ? 'success' : 'failure',
                customData: { action, toolName, args }
            });
        } catch (e: any) {
            const errorMessage = e instanceof SyntaxError ? "Invalid JSON in input." : e.message;
            handleApiError({ message: errorMessage }, { context: 'Shunt.handleShunt.tool_call', action });
        } finally {
            setIsLoading(false);
            setActiveShunt(null);
        }
        return;
    }
    
    const sanitizedText = settings.inputSanitizationEnabled ? sanitizeInput(textToProcess) : textToProcess;
    const bulletinContext = getBulletinContext();

    try {
        const { resultText, tokenUsage } = await performShunt(sanitizedText, action as ShuntAction, selectedModel, bulletinContext, priority, settings.promptInjectionGuardEnabled);

        if (action === ShuntAction.BUILD_A_SKILL) {
            const files = parseSkillPackagePlan(resultText);
            if (files.length > 0) {
                await deliverFiles(files);
                const skillName = files[0].path.split('/')[0] || 'skill-package';
                
                if (mcpStatus === MCPConnectionStatus.Connected && extensionApi?.fs) {
                    setOutputText(`MCP extension connected. Shunting skill '${skillName}' directly to your computer...`);
                    await Promise.all(
                        files.map(file => extensionApi.fs!.saveFile(file.path, file.content))
                    );
                    setOutputText(`✅ Skill package '${skillName}' shunted directly to your computer!\n\n${files.length} file(s) are now on your local filesystem and also available in your Mailbox.`);
                } else {
                    const zip = new JSZip();
                    files.forEach(file => { zip.file(file.path, file.content); });
                    const zipBlob = await zip.generateAsync({ type: 'blob' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(zipBlob);
                    link.download = `${skillName}.zip`;
                    link.click();
                    URL.revokeObjectURL(link.href);
                    setOutputText(`✅ Skill package generated successfully!\n\n${files.length} file(s) have been delivered to your Mailbox and downloaded as \`${skillName}.zip\`.\n\n(Tip: Connect the MCP Browser Extension to shunt files directly to your computer).`);
                }
                audioService.playSound('success');
            } else {
                setOutputText(`⚠️ Could not parse any files from the AI's response.\n\nThe raw output is shown below for debugging:\n\n---\n\n${resultText}`);
                audioService.playSound('error');
            }
        } else {
            setOutputText(resultText);
            if (action === ShuntAction.AMPLIFY && resultText) {
                setShowAmplifyX2(true);
            }
            audioService.playSound('receive');
        }
      
        incrementUsage('shuntRuns');
        setLastTokenUsage(tokenUsage);
      
        telemetryService?.recordEvent({
            eventType: 'ai_response',
            interactionType: 'shunt_action',
            tab: 'Shunt',
            userInput: textToProcess.substring(0, 200),
            aiOutput: resultText.substring(0, 200),
            outcome: 'success',
            tokenUsage: tokenUsage ?? undefined,
            modelUsed: tokenUsage.model,
            customData: { action, priority }
        });
        versionControlService?.captureVersion('shunt_interaction', 'shunt_output', JSON.stringify({ input: textToProcess, output: resultText, action, model: tokenUsage.model, tokenUsage, priority }, null, 2), 'ai_response', `Shunt action: ${action}`);

    } catch (e: any) {
        const apiError = parseApiError(e);
        if (settings.localModelFallbackEnabled && (apiError.includes('rate limit') || apiError.includes('429'))) {
            try {
                console.warn(`Gemini rate limit hit. Falling back to local model for action: ${action}.`);
                setError(null);
                setActiveShunt(`Fallback: ${action}`);
                const promptForLocal = getPromptForAction(sanitizedText, action as ShuntAction, bulletinContext, priority, settings.promptInjectionGuardEnabled);
                const { resultText } = await callLmStudio(promptForLocal, settings.lmStudioEndpoint);
                
                setOutputText(`[LOCAL MODEL FALLBACK]\n\n---\n\n${resultText}`);
                setLastTokenUsage(null);
                audioService.playSound('receive');
                telemetryService?.recordEvent({ eventType: 'ai_response', interactionType: 'shunt_action_fallback', tab: 'Shunt', outcome: 'success', modelUsed: 'local-model', customData: { action, priority } });
            } catch (fallbackError: any) {
                const telemetryContext = { context: 'Shunt.handleShunt.fallback', action, selectedModel, priority };
                handleApiError(fallbackError, telemetryContext);
            }
        } else {
            const telemetryContext = { context: 'Shunt.handleShunt', action, selectedModel, priority };
            handleApiError(e, telemetryContext);
            telemetryService?.recordEvent({ eventType: 'ai_response', interactionType: 'shunt_action', tab: 'Shunt', outcome: 'error', customData: { action, priority, error: e.message || 'An unknown error occurred.' } });
        }
    } finally {
        setIsLoading(false);
        setActiveShunt(null);
    }
  }, [inputText, isLoading, validate, markAsTouched, telemetryService, selectedModel, versionControlService, deliverFiles, mcpStatus, extensionApi, history.length, getBulletinContext, usage, tierDetails, incrementUsage, checkRateLimit, settings, handleApiError, priority, callLmStudio]);
  
  const handleAmplifyX2 = useCallback(async () => {
    if (!outputText || isLoading) return;
    setInputText(outputText);
    await handleShunt(ShuntAction.AMPLIFY_X2, outputText);
  }, [outputText, isLoading, handleShunt]);


  const handleModularShunt = useCallback(async (modules: Set<PromptModuleKey>) => {
    if (tierDetails.shuntRuns !== 'unlimited' && usage.shuntRuns >= tierDetails.shuntRuns) {
        setError("You've reached your monthly limit for Shunt runs. Please upgrade your plan in the Subscription tab.");
        audioService.playSound('error');
        return;
    }
    if (checkRateLimit()) return;

    markAsTouched();
    if (!validate() || isLoading) {
        return;
    }

    setIsLoading(true);
    setError(null);
    setOutputText('');
    setShowAmplifyX2(false);
    setActiveShunt('Modular Prompt');
    audioService.playSound('send');
    
    if (history.length === 0) {
        setInitialPrompt(inputText);
    }
    
    const sanitizedText = settings.inputSanitizationEnabled ? sanitizeInput(inputText) : inputText;
    const bulletinContext = getBulletinContext();
    const moduleNames = Array.from(modules).map(key => key);

    try {
      setModulesForLastRun(moduleNames);

      const { resultText, tokenUsage } = await executeModularPrompt(sanitizedText, modules, bulletinContext, priority, settings.promptInjectionGuardEnabled);
      
      setOutputText(resultText);
      audioService.playSound('receive');
      
      incrementUsage('shuntRuns');
      setLastTokenUsage(tokenUsage);
      
      telemetryService?.recordEvent({
        eventType: 'ai_response',
        interactionType: 'shunt_modular',
        tab: 'Shunt',
        userInput: inputText.substring(0, 200),
        aiOutput: resultText.substring(0, 200),
        outcome: 'success',
        tokenUsage,
        modelUsed: 'gemini-2.5-pro',
        customData: { modules: Array.from(modules), priority }
      });

    } catch (e: any) {
        const apiError = parseApiError(e);
        if (settings.localModelFallbackEnabled && (apiError.includes('rate limit') || apiError.includes('429'))) {
            try {
                console.warn(`Gemini rate limit hit. Falling back to local model for modular prompt: ${moduleNames.join(', ')}.`);
                setError(null);
                setActiveShunt(`Fallback: Modular Prompt`);

                const fullPrompt = constructModularPrompt(sanitizedText, modules, bulletinContext, priority, settings.promptInjectionGuardEnabled);
                const { resultText } = await callLmStudio(fullPrompt, settings.lmStudioEndpoint);

                setOutputText(`[LOCAL MODEL FALLBACK]\n\n---\n\n${resultText}`);
                setLastTokenUsage(null);
                audioService.playSound('receive');
                telemetryService?.recordEvent({ eventType: 'ai_response', interactionType: 'shunt_modular_fallback', tab: 'Shunt', outcome: 'success', modelUsed: 'local-model', customData: { modules: moduleNames, priority } });
            } catch (fallbackError: any) {
                const telemetryContext = { context: 'Shunt.handleModularShunt.fallback', modules: moduleNames, priority };
                handleApiError(fallbackError, telemetryContext);
            }
        } else {
            const telemetryContext = { context: 'Shunt.handleModularShunt', modules: moduleNames, priority, };
            handleApiError(e, telemetryContext);
            telemetryService?.recordEvent({ eventType: 'ai_response', interactionType: 'shunt_modular', tab: 'Shunt', outcome: 'error', customData: { modules: moduleNames, priority, error: e.message || 'An unknown error occurred.' } });
        }
    } finally {
      setIsLoading(false);
      setActiveShunt(null);
    }
  }, [inputText, isLoading, validate, markAsTouched, telemetryService, getBulletinContext, history.length, checkRateLimit, handleApiError, incrementUsage, settings, tierDetails.shuntRuns, usage.shuntRuns, priority, callLmStudio]);

  const handleCombinedShunt = useCallback(async (draggedAction: ShuntAction, targetAction: ShuntAction) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setOutputText('');
    setActiveShunt(`${draggedAction} & ${targetAction}`);
    audioService.playSound('send');
    
    try {
        const firstPass = await performShunt(inputText, draggedAction, selectedModel, getBulletinContext(), priority, settings.promptInjectionGuardEnabled);
        const secondPass = await performShunt(firstPass.resultText, targetAction, selectedModel, getBulletinContext(), priority, settings.promptInjectionGuardEnabled);

        setOutputText(secondPass.resultText);
        audioService.playSound('receive');
        setLastTokenUsage({
            prompt_tokens: firstPass.tokenUsage.prompt_tokens + secondPass.tokenUsage.prompt_tokens,
            completion_tokens: firstPass.tokenUsage.completion_tokens + secondPass.tokenUsage.completion_tokens,
            total_tokens: firstPass.tokenUsage.total_tokens + secondPass.tokenUsage.total_tokens,
            model: selectedModel,
        });

    } catch (e: any) {
        handleApiError(e, { context: 'Shunt.handleCombinedShunt', actions: [draggedAction, targetAction], priority });
    } finally {
        setIsLoading(false);
        setActiveShunt(null);
    }
  }, [inputText, isLoading, selectedModel, handleApiError, getBulletinContext, priority, settings.promptInjectionGuardEnabled]);
  
    const handleSynthesize = useCallback(async () => {
    if (tierDetails.shuntRuns !== 'unlimited' && usage.shuntRuns >= tierDetails.shuntRuns) {
        setError("You've reached your monthly limit for Shunt runs. Please upgrade your plan in the Subscription tab.");
        audioService.playSound('error');
        return;
    }
    if (checkRateLimit()) return;
    if (bulletinDocuments.length === 0 || isLoading) return;

    setIsLoading(true);
    setError(null);
    setOutputText('');
    setModulesForLastRun(null);
    setShowAmplifyX2(false);
    setActiveShunt('Synthesize Notes');
    audioService.playSound('send');

    try {
        const combinedContent = bulletinDocuments
            .map(doc => `--- Document: ${doc.name} ---\n\n${doc.content}`)
            .join('\n\n---\n\n');
        
        const { resultText, tokenUsage } = await synthesizeDocuments(combinedContent, selectedModel);

        const newDocument: BulletinDocument = {
            name: `synthesis-${new Date().toLocaleTimeString()}.md`,
            content: resultText,
        };

        setBulletinDocuments(prev => [...prev, newDocument]);
        setInputText(resultText); // Put the result in the input panel for immediate use
        setOutputText(`✅ Synthesis complete!\n\nThe synthesized document has been added to the Bulletin Board and loaded into the Input Panel for you.`);
        audioService.playSound('success');

        incrementUsage('shuntRuns');
        setLastTokenUsage(tokenUsage);

        telemetryService?.recordEvent({
            eventType: 'ai_response',
            interactionType: 'synthesize_documents',
            tab: 'Shunt',
            aiOutput: resultText.substring(0, 200),
            outcome: 'success',
            tokenUsage: tokenUsage ?? undefined,
            modelUsed: tokenUsage.model,
            customData: { documentCount: bulletinDocuments.length }
        });

    } catch (e: any) {
        const telemetryContext = { context: 'Shunt.handleSynthesize', selectedModel };
        handleApiError(e, telemetryContext);
        telemetryService?.recordEvent({ 
            eventType: 'ai_response', 
            interactionType: 'synthesize_documents', 
            tab: 'Shunt', 
            outcome: 'error', 
            customData: { error: e.message || 'An unknown error occurred.' } 
        });
    } finally {
        setIsLoading(false);
        setActiveShunt(null);
    }
  }, [bulletinDocuments, isLoading, checkRateLimit, handleApiError, incrementUsage, selectedModel, telemetryService, tierDetails.shuntRuns, usage.shuntRuns]);

  const handleAttachScratchpad = useCallback((content: string) => {
    if (!content.trim()) return;
    const newDoc: BulletinDocument = {
        name: `Scratchpad Note - ${new Date().toLocaleTimeString()}`,
        content: content,
    };
    setBulletinDocuments(prev => [...prev, newDoc]);
    setScratchpadContent('');
    setIsScratchpadVisible(false);
    audioService.playSound('success');
  }, []);

  const handleEvolveWorkflow = () => {
      if (outputText) {
          setIsEvolveModalOpen(true);
      }
  };

  const handleEvolveComplete = (finalText: string) => {
      setOutputText(finalText);
      setInputText(finalText); // Also update input for chaining
      setIsEvolveModalOpen(false);
      // Create a history entry for the completed workflow
      const newHistoryEntry: HistoryEntry = {
        id: uuidv4(),
        prompt: `Evolve Workflow on: ${outputText.substring(0, 50)}...`,
        output: finalText,
        score: 0, // No score for workflow
      };
      setHistory(prev => [...prev, newHistoryEntry]);
  };

  const combinedIsLoading = isLoading || isLmStudioLoading;

  return (
    <div ref={shuntContainerRef} className="flex flex-col h-full relative">
      {isShuntEmpty && guideStatus !== 'hidden' && <WorkflowGuide isFading={guideStatus === 'fading'} />}

      <MobileViewSwitcher
          activeView={mobileActiveView}
          onViewChange={setMobileActiveView}
          hasOutput={!!outputText}
          hasError={!!error}
          isLoading={combinedIsLoading}
      />

      <div className="flex-grow p-2 sm:p-4 md:p-6 overflow-hidden">
        {/* Desktop Layout */}
        <div className="hidden xl:grid xl:grid-cols-3 gap-6 h-full">
            <div className="flex flex-col gap-6 overflow-y-auto">
                <BulletinBoardPanel
                    documents={bulletinDocuments}
                    onUpdateDocuments={setBulletinDocuments}
                    isMinimized={panelStates.bulletin}
                    onToggleMinimize={() => togglePanel('bulletin')}
                    isLoading={combinedIsLoading}
                    onSynthesize={handleSynthesize}
                    onViewDocument={setViewingDocument}
                />
                <InputPanel
                    value={inputText}
                    onChange={handleInputChange}
                    onBlur={markAsTouched}
                    onPasteDemo={() => { setInputText(DEMO_TEXT); resetChain(); }}
                    onPasteToolDemo={() => { setInputText(TOOL_DEMO_TEXT); resetChain(); }}
                    onFileLoad={handleFileLoad}
                    onClearFile={() => { setInputText(''); resetChain(); }}
                    error={isTouched ? errors.required || errors.maxLength : null}
                    maxLength={MAX_INPUT_LENGTH}
                    isLoading={combinedIsLoading}
                    onToggleScratchpad={() => setIsScratchpadVisible(!isScratchpadVisible)}
                    isMinimized={panelStates.input}
                    onToggleMinimize={() => togglePanel('input')}
                    priority={priority}
                    onPriorityChange={setPriority}
                />
            </div>
            <div className="overflow-y-auto">
                <ControlPanel
                    onShunt={handleShunt}
                    onModularShunt={handleModularShunt}
                    onCombinedShunt={handleCombinedShunt}
                    isLoading={combinedIsLoading}
                    activeShunt={activeShunt}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    showAmplifyX2={showAmplifyX2}
                    onAmplifyX2={handleAmplifyX2}
                    usage={usage}
                    tierDetails={tierDetails}
                    isMinimized={panelStates.control}
                    onToggleMinimize={() => togglePanel('control')}
                    isChainMode={isChainMode}
                    onChainModeChange={setIsChainMode}
                />
            </div>
            <div className="flex flex-col overflow-y-auto">
                <OutputPanel
                    text={outputText}
                    isLoading={combinedIsLoading}
                    error={error}
                    activeShunt={activeShunt}
                    modulesUsed={modulesForLastRun}
                    onGradeAndIterate={handleGradeAndIterate}
                    onEvolveWorkflow={handleEvolveWorkflow}
                    isEvolving={isEvolving}
                    isMinimized={panelStates.output}
                    onToggleMinimize={() => togglePanel('output')}
                    isChainMode={isChainMode}
                />
            </div>
        </div>

        {/* Mobile Layout */}
        <div className="xl:hidden h-full overflow-y-auto">
            {mobileActiveView === 'input' && (
                <div className="flex flex-col gap-3 h-full">
                    <BulletinBoardPanel
                        documents={bulletinDocuments}
                        onUpdateDocuments={setBulletinDocuments}
                        isMinimized={panelStates.bulletin}
                        onToggleMinimize={() => togglePanel('bulletin')}
                        isLoading={combinedIsLoading}
                        onSynthesize={handleSynthesize}
                        onViewDocument={setViewingDocument}
                    />
                    <InputPanel
                        value={inputText}
                        onChange={handleInputChange}
                        onBlur={markAsTouched}
                        onPasteDemo={() => { setInputText(DEMO_TEXT); resetChain(); }}
                        onPasteToolDemo={() => { setInputText(TOOL_DEMO_TEXT); resetChain(); }}
                        onFileLoad={handleFileLoad}
                        onClearFile={() => { setInputText(''); resetChain(); }}
                        error={isTouched ? errors.required || errors.maxLength : null}
                        maxLength={MAX_INPUT_LENGTH}
                        isLoading={combinedIsLoading}
                        onToggleScratchpad={() => setIsScratchpadVisible(!isScratchpadVisible)}
                        isMinimized={panelStates.input}
                        onToggleMinimize={() => togglePanel('input')}
                        priority={priority}
                        onPriorityChange={setPriority}
                    />
                </div>
            )}
            {mobileActiveView === 'controls' && (
                <ControlPanel
                    onShunt={handleShunt}
                    onModularShunt={handleModularShunt}
                    onCombinedShunt={handleCombinedShunt}
                    isLoading={combinedIsLoading}
                    activeShunt={activeShunt}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    showAmplifyX2={showAmplifyX2}
                    onAmplifyX2={handleAmplifyX2}
                    usage={usage}
                    tierDetails={tierDetails}
                    isMinimized={panelStates.control}
                    onToggleMinimize={() => togglePanel('control')}
                    isChainMode={isChainMode}
                    onChainModeChange={setIsChainMode}
                />
            )}
            {mobileActiveView === 'output' && (
                 <OutputPanel
                    text={outputText}
                    isLoading={combinedIsLoading}
                    error={error}
                    activeShunt={activeShunt}
                    modulesUsed={modulesForLastRun}
                    onGradeAndIterate={handleGradeAndIterate}
                    onEvolveWorkflow={handleEvolveWorkflow}
                    isEvolving={isEvolving}
                    isMinimized={panelStates.output}
                    onToggleMinimize={() => togglePanel('output')}
                    isChainMode={isChainMode}
                />
            )}
        </div>
      </div>

      {/* Bottom Panel: Prompt Lifecycle */}
      <div className="flex-shrink-0 p-4 md:px-6 md:pb-2">
        <PromptLifecyclePanel
            history={history}
            initialPrompt={initialPrompt}
            isMinimized={panelStates.lifecycle}
            onToggleMinimize={() => togglePanel('lifecycle')}
        />
      </div>
      
      <Scratchpad
        isVisible={isScratchpadVisible}
        onClose={() => setIsScratchpadVisible(false)}
        isMinimized={isScratchpadMinimized}
        onToggleMinimize={() => setIsScratchpadMinimized(!isScratchpadMinimized)}
        position={scratchpadPosition}
        onDrag={setScratchpadPosition}
        content={scratchpadContent}
        onContentChange={setScratchpadContent}
        boundsRef={shuntContainerRef}
        onAttach={handleAttachScratchpad}
      />
      
      {viewingDocument && (
        <DocumentViewerModal
            isOpen={!!viewingDocument}
            onClose={() => setViewingDocument(null)}
            document={viewingDocument}
        />
      )}
      
      <Suspense fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <Loader />
                <p className="text-gray-400">Loading Evolve Module...</p>
            </div>
        </div>
      }>
        {isEvolveModalOpen && (
            <EvolveModal
                isOpen={isEvolveModalOpen}
                onClose={() => setIsEvolveModalOpen(false)}
                initialText={outputText}
                onComplete={handleEvolveComplete}
            />
        )}
      </Suspense>

      <TabFooter />
    </div>
  );
};

export default Shunt;