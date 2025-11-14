// components/documentation/Documentation.tsx
import React, { useState, useCallback, useEffect } from 'react';
import TabFooter from '../common/TabFooter';
import MarkdownRenderer from '../common/MarkdownRenderer';
import FileUpload from '../common/FileUpload';
import Loader from '../Loader';
import { generateRawText, generateProjectTome, generateApiDocumentation, generateQualityReport } from '../../services/geminiService';
import { generateFileTree, generateComponentDiagram } from '../../services/diagramService';
import { BookIcon, XMarkIcon, SparklesIcon, CopyIcon, CheckIcon, ChatBubbleLeftRightIcon, DocumentChartBarIcon, GlobeAltIcon } from '../icons';
import { audioService } from '../../services/audioService';
import { parseApiError } from '../../utils/errorLogger';
import DocumentViewerModal from '../common/DocumentViewerModal';

interface ProjectFile {
    filename: string;
    content: string;
}

const Documentation: React.FC = () => {
    const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(() => {
        try {
            const saved = localStorage.getItem('documentation_projectFiles');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [generatedDoc, setGeneratedDoc] = useState<string | null>(() => localStorage.getItem('documentation_generatedDoc'));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [docTitle, setDocTitle] = useState<string>(() => localStorage.getItem('documentation_docTitle') || 'Generated Documentation');
    const [manualFilename, setManualFilename] = useState<string>('');
    const [manualContent, setManualContent] = useState<string>('');
    const [viewingFile, setViewingFile] = useState<ProjectFile | null>(null);

    useEffect(() => { localStorage.setItem('documentation_projectFiles', JSON.stringify(projectFiles)); }, [projectFiles]);
    useEffect(() => { generatedDoc ? localStorage.setItem('documentation_generatedDoc', generatedDoc) : localStorage.removeItem('documentation_generatedDoc'); }, [generatedDoc]);
    useEffect(() => { localStorage.setItem('documentation_docTitle', docTitle); }, [docTitle]);

    const handleFilesUploaded = useCallback((files: Array<{ filename: string; content: string; file: File }>) => {
        const newFiles = files.map(f => ({ filename: f.filename, content: f.content }));
        setProjectFiles(prev => [...prev, ...newFiles]);
        audioService.playSound('success');
    }, []);

    const removeFile = (filename: string) => {
        setProjectFiles(prev => prev.filter(f => f.filename !== filename));
    };
    
    const handleAddManualFile = () => {
        if (!manualFilename.trim() || !manualContent.trim()) return;
        const newFile: ProjectFile = {
            filename: manualFilename.trim(),
            content: manualContent.trim(),
        };
        setProjectFiles(prev => [...prev, newFile]);
        setManualFilename('');
        setManualContent('');
        audioService.playSound('success');
    };

    const handleGenerateDocumentation = useCallback(async () => {
        if (projectFiles.length === 0 || isLoading) return;

        setIsLoading(true);
        setError(null);
        setGeneratedDoc(null);
        setDocTitle('README.md');
        audioService.playSound('send');

        try {
            const projectContext = projectFiles
                .map(file => `--- FILE: ${file.filename} ---\n\n${file.content}`)
                .join('\n\n---\n\n');
            
            const prompt = `
You are a senior software engineer tasked with creating a high-quality README.md documentation file for an existing project.
Analyze the following source code from multiple files and generate a comprehensive README.md in Markdown format.

The README should include the following sections:
1.  **Project Title**: A clear and concise title.
2.  **Overview**: A brief summary of what the project does and its purpose.
3.  **Features**: A bulleted list of key features and capabilities.
4.  **Tech Stack**: The main technologies, frameworks, and libraries used.
5.  **Project Structure**: An explanation of the key directories and files and their roles.
6.  **Getting Started**: Simple instructions on how to set up and run the project locally (if discernible from the context).
7.  **Key Components**: A detailed look at 2-3 of the most important components and their responsibilities.

Here is the entire project source code, with each file clearly demarcated:
---
${projectContext}
---
`;

            const { resultText } = await generateRawText(prompt, 'gemini-2.5-pro');
            setGeneratedDoc(resultText);
            audioService.playSound('receive');
        } catch (e) {
            const userFriendlyMessage = parseApiError(e);
            setError(userFriendlyMessage);
            audioService.playSound('error');
        } finally {
            setIsLoading(false);
        }
    }, [projectFiles, isLoading]);

    const handleGenerateBlueprint = useCallback(async () => {
        if (projectFiles.length === 0 || isLoading) return;

        setIsLoading(true);
        setError(null);
        setGeneratedDoc(null);
        setDocTitle('Architectural Blueprint');
        audioService.playSound('send');

        try {
            const projectContext = projectFiles
                .map(file => `--- FILE: ${file.filename} ---\n\n${file.content}`)
                .join('\n\n---\n\n');

            const prompt = `
You are a world-class senior software architect with deep expertise in React, TypeScript, and modern frontend design patterns. Your task is to analyze a complete project's source code and generate a comprehensive "Architectural Blueprint" document.

This blueprint is intended for ingestion into a knowledge base system (like AnythingLLM) to allow other developers to ask questions about the project's architecture. Therefore, it must be extremely detailed, clear, and structured in plain Markdown format. Do not use complex markdown that might not be parsed correctly (e.g., tables). Use headings, lists, and code blocks.

Analyze the following collection of project files and produce a document with the following strict structure:

# Architectural Blueprint: [Project Name - Infer from context]

## 1. High-Level Architecture Overview
- Provide a summary of the application's purpose.
- Describe the core architectural pattern (e.g., Component-based, Context API for state management).
- Explain the overall folder structure and the role of key directories (\`components\`, \`services\`, \`context\`, \`hooks\`, \`types\`).

## 2. Core Components Analysis
For each of the most important components (e.g., \`MissionControl\`, \`Shunt\`, \`Weaver\`, \`MiaAssistant\`), provide a detailed breakdown:
- **Component:** \`[ComponentName]\`
- **Purpose:** What is the primary responsibility of this component?
- **State Management:** Describe the \`useState\`, \`useRef\`, etc., hooks it uses and what they manage.
- **Key Functions:** Detail the main functions/callbacks within the component (e.g., \`handleGeneratePlan\`, \`handleShunt\`) and what they do.
- **Child Components:** List the major child components it renders.
- **Interactions:** How does it interact with services and contexts?

## 3. State Management & Data Flow
- **Global State (Contexts):** Detail each React Context (\`SettingsContext\`, \`TelemetryContext\`, \`MiaContext\`, etc.). Explain what state it holds and its purpose.
- **Data Flow:** Describe how data flows through the application. For example, how does a user action in a component trigger a service call and update the UI? Use a key feature (like the Shunt) as an example.

## 4. Service Layer & External Interactions
- **Service:** \`[ServiceName].ts\` (e.g., \`geminiService.ts\`, \`telemetry.service.ts\`)
- **Purpose:** What is the responsibility of this service?
- **Key Functions:** List and explain the primary functions exported by the service (e.g., \`performShunt\`, \`generateDevelopmentPlan\`, \`recordEvent\`).
- **API Calls:** Detail the calls made to external APIs (like Google's Gemini API), including the models used and the structure of the requests.

## 5. Hooks & Reusable Logic
- List and describe any custom hooks (\`useValidation\`, \`useDebounce\`, etc.).
- Explain the problem each hook solves and how it's used.

## 6. Type Definitions & Schemas
- **File:** \`types.ts\`, \`types/schemas.ts\`, etc.
- **Purpose:** Explain the role of key TypeScript types, interfaces, and Zod schemas.
- **Key Types:** Highlight 3-5 of the most important types (e.g., \`MiaMessage\`, \`InteractionEvent\`, \`FoundryAgent\`) and explain their structure.

## 7. UI/UX Philosophy
- Based on the code, infer the application's UI/UX principles.
- Mention aspects like responsiveness, accessibility, animations, and the overall aesthetic.

---
Here is the entire project source code, with each file clearly demarcated:
---
${projectContext}
---
`;
            const { resultText } = await generateRawText(prompt, 'gemini-2.5-pro');
            setGeneratedDoc(resultText);
            audioService.playSound('receive');
        } catch (e) {
            const userFriendlyMessage = parseApiError(e);
            setError(userFriendlyMessage);
            audioService.playSound('error');
        } finally {
            setIsLoading(false);
        }
    }, [projectFiles, isLoading]);

    const handleConvertToNaturalLanguage = useCallback(async () => {
        if (projectFiles.length === 0 || isLoading) return;

        setIsLoading(true);
        setError(null);
        setGeneratedDoc(null);
        setDocTitle('Natural Language Code Explanations');
        audioService.playSound('send');

        try {
            const projectContext = projectFiles
                .map(file => `--- FILE: ${file.filename} ---\n\n${file.content}`)
                .join('\n\n---\n\n');
            
            const prompt = `
You are an expert software engineer with a talent for explaining complex code in simple, easy-to-understand natural language. Your task is to analyze an entire project's source code and produce a document that explains what every part of the code does. This document is for a non-technical audience, like a project manager.

**Instructions:**
1.  Start with a **High-Level Project Summary** that explains the application's overall purpose in one or two paragraphs.
2.  Then, go through each file one by one.
3.  For each file, create a heading (e.g., \`## File: components/shunt/Shunt.tsx\`).
4.  Beneath the heading, explain the **purpose of the file** in a single sentence.
5.  After the file's purpose, create a bulleted list of the **key functions, components, or parts** of that file.
6.  For each item in the list, explain what it does in plain English, avoiding jargon as much as possible.

Here is the entire project source code, with each file clearly demarcated:
---
${projectContext}
---
`;

            const { resultText } = await generateRawText(prompt, 'gemini-2.5-pro');
            setGeneratedDoc(resultText);
            audioService.playSound('receive');
        } catch (e) {
            const userFriendlyMessage = parseApiError(e);
            setError(userFriendlyMessage);
            audioService.playSound('error');
        } finally {
            setIsLoading(false);
        }
    }, [projectFiles, isLoading]);

    const handleGenerateBuildPlan = useCallback(async () => {
        if (projectFiles.length === 0 || isLoading) return;

        setIsLoading(true);
        setError(null);
        setGeneratedDoc(null);
        setDocTitle('Development Build Plan');
        audioService.playSound('send');

        try {
            const projectContext = projectFiles
                .map(file => `--- FILE: ${file.filename} ---\n\n${file.content}`)
                .join('\n\n---\n\n');
            
            const prompt = `
You are a senior DevOps engineer and project manager. Your task is to analyze the provided project source code and generate a comprehensive "Development Build Plan" in Markdown format.

This plan should be a practical guide for a development team to build, test, and deploy the application, as well as plan for the next logical feature.

Analyze the following collection of project files and produce a document with the following strict structure:

# Development Build Plan

## 1. Objective
State a clear, high-level objective for the current development cycle. Based on the project's nature, this could be "Prepare for version 2.1 release, focusing on stability and adding a user-requested feature."

## 2. Dependency Audit & Recommendations
- List the key dependencies found in the project (e.g., from package.json or import maps).
- Suggest any potential version updates or new libraries that could be beneficial (e.g., "Consider upgrading 'reactflow' to the latest version for performance improvements.").

## 3. Build & Execution Steps
Provide a clear, numbered list of command-line steps to get the project running from a fresh checkout.
1.  \`npm install\` - Install dependencies.
2.  \`npm run build\` - Build the production assets (if applicable).
3.  \`npm start\` - Run the development server.

## 4. Testing Strategy
Outline a simple but effective testing plan.
- **Unit Tests:** Recommend key components or functions that should have unit tests.
- **End-to-End (E2E) Tests:** Suggest 2-3 critical user flows to test (e.g., "User successfully performs a Shunt action," "User generates a Weaver plan").

## 5. Deployment Strategy
Describe a high-level deployment process.
- **Artifacts:** What files need to be deployed? (e.g., "The static contents of the 'dist' folder").
- **Process:** Briefly describe the steps (e.g., "Upload artifacts to a static web host like Vercel or AWS S3").

## 6. Proposed Next Feature: Task Breakdown
Based on the existing codebase, propose one logical, small new feature and provide a task breakdown for implementing it.
- **Proposed Feature:** [e.g., "Add a 'Copy to Clipboard' button for Weaver plan tasks."]
- **Task 1: UI Component:** [e.g., "Create a new 'CopyIcon' and add a button to 'PlanDisplay.tsx'."]
- **Task 2: Logic:** [e.g., "Implement the 'navigator.clipboard.writeText' functionality in the button's onClick handler."]
- **Task 3: State Management:** [e.g., "Add a 'copied' state to provide user feedback."]

---
Here is the entire project source code, with each file clearly demarcated:
---
${projectContext}
---
`;

            const { resultText } = await generateRawText(prompt, 'gemini-2.5-pro');
            setGeneratedDoc(resultText);
            audioService.playSound('receive');
        } catch (e) {
            const userFriendlyMessage = parseApiError(e);
            setError(userFriendlyMessage);
            audioService.playSound('error');
        } finally {
            setIsLoading(false);
        }
    }, [projectFiles, isLoading]);

    const handleGenerateProjectTome = useCallback(async () => {
        if (projectFiles.length === 0 || isLoading) return;

        setIsLoading(true);
        setError(null);
        setGeneratedDoc(null);
        setDocTitle('Project Tome');
        audioService.playSound('send');

        try {
            // Step 1: Generate diagrams
            const fileTree = generateFileTree(projectFiles);
            const componentDiagram = generateComponentDiagram(projectFiles);

            // Step 2: Generate the main text content from AI
            const projectContext = projectFiles
                .map(file => `--- FILE: ${file.filename} ---\n\n${file.content}`)
                .join('\n\n---\n\n');
            
            const { resultText } = await generateProjectTome(projectContext, fileTree, componentDiagram);

            setGeneratedDoc(resultText);
            audioService.playSound('receive');

        } catch (e) {
            const userFriendlyMessage = parseApiError(e);
            setError(userFriendlyMessage);
            audioService.playSound('error');
        } finally {
            setIsLoading(false);
        }
    }, [projectFiles, isLoading]);

    const handleGenerateApiDocs = useCallback(async () => {
        if (projectFiles.length === 0 || isLoading) return;
        setIsLoading(true);
        setError(null);
        setGeneratedDoc(null);
        setDocTitle('API Documentation');
        audioService.playSound('send');
        try {
            const projectContext = projectFiles.map(f => `--- FILE: ${f.filename} ---\n\n${f.content}`).join('\n\n---\n\n');
            const { resultText } = await generateApiDocumentation(projectContext);
            setGeneratedDoc(resultText);
            audioService.playSound('receive');
        } catch (e) {
            const userFriendlyMessage = parseApiError(e);
            setError(userFriendlyMessage);
            audioService.playSound('error');
        } finally {
            setIsLoading(false);
        }
    }, [projectFiles, isLoading]);

    const handleGenerateQualityReport = useCallback(async () => {
        if (projectFiles.length === 0 || isLoading) return;
        setIsLoading(true);
        setError(null);
        setGeneratedDoc(null);
        setDocTitle('Code Quality & Refactoring Report');
        audioService.playSound('send');
        try {
            const projectContext = projectFiles.map(f => `--- FILE: ${f.filename} ---\n\n${f.content}`).join('\n\n---\n\n');
            const { resultText } = await generateQualityReport(projectContext);
            setGeneratedDoc(resultText);
            audioService.playSound('receive');
        } catch (e) {
            const userFriendlyMessage = parseApiError(e);
            setError(userFriendlyMessage);
            audioService.playSound('error');
        } finally {
            setIsLoading(false);
        }
    }, [projectFiles, isLoading]);
    
    const handleClear = () => {
        setProjectFiles([]);
        setGeneratedDoc(null);
        setError(null);
    };

    const handleCopy = () => {
        if (generatedDoc && !copied) {
            navigator.clipboard.writeText(generatedDoc);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };


    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
                {/* Left Panel: Upload & Control */}
                <div className="flex flex-col gap-6 overflow-y-auto">
                    {/* File Upload Panel */}
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 flex-shrink-0">
                        <h3 className="text-lg font-semibold text-white mb-4">Upload Project Files or Folder</h3>
                        <FileUpload
                            onFilesUploaded={handleFilesUploaded}
                            acceptedFileTypes={['.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.css', '.md', '.txt', '.py', '.sh', 'dockerfile', '.yml', '.yaml', '.svg', '.gitignore', '.xml', '.xsd', '.zip']}
                            maxFileSizeMB={20}
                            enableDirectoryUpload={true}
                        />
                    </div>
                    {/* Manual Text Input Panel */}
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 flex-shrink-0">
                        <h3 className="text-lg font-semibold text-white mb-4">Add Text Manually</h3>
                        <div className="flex flex-col gap-4">
                            <input
                                type="text"
                                value={manualFilename}
                                onChange={(e) => setManualFilename(e.target.value)}
                                placeholder="Enter a filename (e.g., notes.md)"
                                className="w-full bg-gray-900/50 rounded-md border border-gray-700 p-2 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                                disabled={isLoading}
                            />
                            <textarea
                                value={manualContent}
                                onChange={(e) => setManualContent(e.target.value)}
                                placeholder="Paste or type content here..."
                                className="w-full h-32 bg-gray-900/50 rounded-md border border-gray-700 p-2 text-gray-300 placeholder-gray-500 resize-y focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                                rows={4}
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleAddManualFile}
                                disabled={isLoading || !manualFilename.trim() || !manualContent.trim()}
                                className="w-full px-4 py-2 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                            >
                                Add to Project Files
                            </button>
                        </div>
                    </div>
                    {/* Staged Files and Controls */}
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 flex flex-col flex-grow min-h-[200px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white">Staged Files ({projectFiles.length})</h3>
                             {projectFiles.length > 0 && (
                                <button onClick={handleClear} disabled={isLoading} className="text-xs bg-red-600/50 text-red-200 px-2 py-1 rounded hover:bg-red-600/80 transition-colors">
                                    Clear All
                                </button>
                            )}
                        </div>
                        {projectFiles.length > 0 ? (
                            <div className="flex-grow overflow-y-auto space-y-2 pr-2 mb-4">
                                {projectFiles.map(file => (
                                    <div key={file.filename} className="flex items-center justify-between bg-gray-900/50 p-2 rounded text-sm group">
                                        <button onClick={() => setViewingFile(file)} className="text-left flex-grow truncate">
                                            <span className="text-gray-300 group-hover:text-cyan-400 transition-colors font-mono text-xs" title={file.filename}>{file.filename}</span>
                                        </button>
                                        <button onClick={() => removeFile(file.filename)} className="p-1 text-gray-500 hover:text-red-400">
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-grow flex items-center justify-center text-gray-500">
                                <p>No files staged for documentation.</p>
                            </div>
                        )}
                        <div className="mt-auto flex-shrink-0 flex flex-col gap-4">
                             <button
                                onClick={handleGenerateProjectTome}
                                disabled={isLoading || projectFiles.length === 0}
                                className="w-full flex items-center justify-center gap-2 text-md font-semibold text-center p-3 rounded-md border transition-all duration-200 bg-purple-600/80 border-purple-500 text-white shadow-lg hover:bg-purple-600 hover:border-purple-400 hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader /> : <GlobeAltIcon className="w-5 h-5" />}
                                Generate Project Tome
                            </button>
                             <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <button
                                    onClick={handleGenerateDocumentation}
                                    disabled={isLoading || projectFiles.length === 0}
                                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-center p-2 rounded-md border transition-all duration-200 bg-fuchsia-600/80 border-fuchsia-500 text-white shadow-lg hover:bg-fuchsia-600 hover:border-fuchsia-400 hover:shadow-fuchsia-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <SparklesIcon className="w-5 h-5" />
                                    README
                                </button>
                                <button
                                    onClick={handleGenerateBlueprint}
                                    disabled={isLoading || projectFiles.length === 0}
                                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-center p-2 rounded-md border transition-all duration-200 bg-gray-700/80 border-gray-600 text-white shadow-lg hover:bg-gray-700 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <BookIcon className="w-5 h-5" />
                                    Blueprint
                                </button>
                                <button
                                    onClick={handleConvertToNaturalLanguage}
                                    disabled={isLoading || projectFiles.length === 0}
                                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-center p-2 rounded-md border transition-all duration-200 bg-gray-700/80 border-gray-600 text-white shadow-lg hover:bg-gray-700 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                    Explain
                                </button>
                                <button
                                    onClick={handleGenerateBuildPlan}
                                    disabled={isLoading || projectFiles.length === 0}
                                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-center p-2 rounded-md border transition-all duration-200 bg-gray-700/80 border-gray-600 text-white shadow-lg hover:bg-gray-700 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <DocumentChartBarIcon className="w-5 h-5" />
                                    Build Plan
                                </button>
                                <button
                                    onClick={handleGenerateApiDocs}
                                    disabled={isLoading || projectFiles.length === 0}
                                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-center p-2 rounded-md border transition-all duration-200 bg-cyan-600/80 border-cyan-500 text-white shadow-lg hover:bg-cyan-600 hover:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <GlobeAltIcon className="w-5 h-5" />
                                    API Docs
                                </button>
                                <button
                                    onClick={handleGenerateQualityReport}
                                    disabled={isLoading || projectFiles.length === 0}
                                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-center p-2 rounded-md border transition-all duration-200 bg-green-600/80 border-green-500 text-white shadow-lg hover:bg-green-600 hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <DocumentChartBarIcon className="w-5 h-5" />
                                    Quality Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Output */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg shadow-lg flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-700/50 flex justify-between items-center flex-shrink-0">
                        <h3 className="text-lg font-semibold text-white">{docTitle}</h3>
                        {generatedDoc && (
                            <button
                                onClick={handleCopy}
                                aria-label={copied ? 'Documentation copied' : 'Copy documentation'}
                                className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md transition-all duration-200 ${copied ? 'bg-green-500/20 text-green-300' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700/80'}`}
                            >
                                {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                                <span>{copied ? 'Copied!' : 'Copy'}</span>
                            </button>
                        )}
                    </div>
                    <div className="p-4 flex-grow relative overflow-y-auto">
                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col justify-center items-center bg-gray-800/80 backdrop-blur-sm z-10 rounded-b-lg">
                                <Loader />
                                <p className="mt-4 text-gray-400">Parsing project and generating docs...</p>
                            </div>
                        )}
                        {error && (
                            <div className="text-center text-red-400 p-4">
                                <p className="font-semibold">Generation Failed</p>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                        )}
                        {!isLoading && !error && !generatedDoc && (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                <BookIcon className="w-12 h-12 mb-4" />
                                <p className="font-semibold">Documentation will appear here.</p>
                                <p className="text-sm mt-1">Upload your project files to get started.</p>
                            </div>
                        )}
                        {generatedDoc && (
                            <MarkdownRenderer content={generatedDoc} />
                        )}
                    </div>
                </div>
            </div>
            <TabFooter />
            {viewingFile && (
                <DocumentViewerModal
                    isOpen={!!viewingFile}
                    onClose={() => setViewingFile(null)}
                    // FIX: Map the `ProjectFile` type to the `Document` type expected by `DocumentViewerModal`.
                    document={{ name: viewingFile.filename, content: viewingFile.content }}
                />
            )}
        </div>
    );
};

export default Documentation;