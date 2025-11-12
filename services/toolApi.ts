// services/toolApi.ts
import { createPatch } from 'diff';

// --- v3 Architecture: Interfaces & Types ---

export interface ExecutionContext {
    agentId: string;
    permissions: string[];
}

export interface StructuredError {
    type: 'VALIDATION' | 'EXECUTION' | 'NOT_FOUND' | 'AUTHORIZATION';
    message: string;
    details: object | null;
}

export interface ToolResult {
    success: boolean;
    data: any | null;
    error: StructuredError | null;
}

// The contract for all tools
interface Tool {
    getName(): string;
    getDescription(): string;
    getInputSchema(): object; // Using object for simplicity, could be JSONSchema
    getRequiredPermissions(): string[];
    execute(args: any): Promise<any>;
}


// --- Mock State ---
const initialFileSystem: Record<string, string> = {
    'src/auth.js': `
// Callback-based authentication
const db = require('./utils/db');

function loginUser(email, password, callback) {
    db.findUser({ email: email }, (err, user) => {
        if (err) { return callback(err); }
        if (!user || user.password !== password) { return callback(new Error('Invalid credentials')); }
        return callback(null, user);
    });
}

module.exports = { loginUser };
`,
    'src/utils/db.js': `
// Mock DB utility
const users = [{ email: 'test@example.com', password: 'password123' }];

function findUser(query) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const user = users.find(u => u.email === query.email);
            resolve(user || null);
        }, 300);
    });
}
module.exports = { findUser };
`,
    'package.json': JSON.stringify({ name: 'test-project', version: '1.0.0', scripts: { test: 'echo "Running tests..." && exit 0' } }, null, 2),
};

// These represent the "committed" state of the files
let committedFileSystem: Record<string, string> = { ...initialFileSystem };
// This represents the live, working directory
let mockFileSystem: Record<string, string> = { ...initialFileSystem };
let mockScratchpad: Record<string, any> = {};
let mockVCS = {
    currentBranch: 'main',
    status: { staged: [] as string[], unstaged: [] as string[], untracked: [] as string[] },
};

// --- Helper Functions ---
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- v3 Architecture: Tool Implementations ---

class ReadFileTool implements Tool {
    getName = () => 'read_file';
    getDescription = () => 'Reads the content of a specific file.';
    getInputSchema = () => ({ type: 'object', properties: { path: { type: 'string' } }, required: ['path'] });
    getRequiredPermissions = () => ['filesystem:read'];
    async execute({ path }: { path: string }): Promise<string> {
        await sleep(200);
        if (path in mockFileSystem) return mockFileSystem[path];
        throw new Error(`File not found: ${path}`);
    }
}

class WriteFileTool implements Tool {
    getName = () => 'write_file';
    getDescription = () => 'Writes content to a specific file.';
    getInputSchema = () => ({ type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] });
    getRequiredPermissions = () => ['filesystem:write'];
    async execute({ path, content }: { path: string, content: string }): Promise<{ path: string, diff: string }> {
        await sleep(500);
        const oldContent = mockFileSystem[path] || '';
        mockFileSystem[path] = content;
        
        // Update VCS status
        if (!mockVCS.status.unstaged.includes(path)) {
            mockVCS.status.unstaged.push(path);
        }
        // If it was staged, a new edit makes it unstaged again
        mockVCS.status.staged = mockVCS.status.staged.filter(p => p !== path);

        const diff = createPatch(path, oldContent, content, '', '');
        return { path, diff };
    }
}

class RunTestsTool implements Tool {
    getName = () => 'run_tests';
    getDescription = () => 'Runs the project\'s test suite.';
    getInputSchema = () => ({});
    getRequiredPermissions = () => ['execution:tests'];
    async execute() {
        await sleep(2000);
        return { success: true, passed: 12, failed: 0 };
    }
}

class ExecuteScriptTool implements Tool {
    getName = () => 'execute_script';
    getDescription = () => 'Executes a script file.';
    getInputSchema = () => ({ type: 'object', properties: { path: { type: 'string' } }, required: ['path'] });
    getRequiredPermissions = () => ['execution:scripts'];
    async execute({ path }: { path: string }) {
        await sleep(1500);
        if (path.startsWith('tests/')) return { stdout: 'Login test successful!', exit_code: 0 };
        throw new Error(`Cannot execute script: ${path}`);
    }
}

class ScratchpadSetTool implements Tool {
    getName = () => 'scratchpad.set';
    getDescription = () => 'Saves a key-value pair to the scratchpad.';
    getInputSchema = () => ({});
    getRequiredPermissions = () => ['scratchpad:write'];
    async execute({ key, value }: { key: string, value: any }) {
        await sleep(100);
        mockScratchpad[key] = value;
        return { status: 'ok', key, value };
    }
}

class GitAddTool implements Tool {
    getName = () => 'git.add';
    getDescription = () => 'Stages file changes for the next commit.';
    getInputSchema = () => ({ type: 'object', properties: { paths: { type: 'array', items: { type: 'string' } } }, required: ['paths'] });
    getRequiredPermissions = () => ['vcs:stage'];
    async execute({ paths }: { paths: string[] }) {
        await sleep(300);
        paths.forEach(path => {
            if (mockVCS.status.unstaged.includes(path)) {
                mockVCS.status.unstaged = mockVCS.status.unstaged.filter(p => p !== path);
                if (!mockVCS.status.staged.includes(path)) {
                    mockVCS.status.staged.push(path);
                }
            }
        });
        return { message: `Staged ${paths.length} file(s).` };
    }
}

class GitCreateBranchTool implements Tool {
    getName = () => 'git.create_branch';
    getDescription = () => 'Creates a new git branch.';
    getInputSchema = () => ({ type: 'object', properties: { branch_name: { type: 'string' } }, required: ['branch_name'] });
    getRequiredPermissions = () => ['vcs:branch'];
    async execute({ branch_name }: { branch_name: string }) {
        await sleep(400);
        mockVCS.currentBranch = branch_name;
        return { message: `Switched to a new branch '${branch_name}'` };
    }
}

class GitCommitTool implements Tool {
    getName = () => 'git.commit_changes';
    getDescription = () => 'Commits staged changes.';
    getInputSchema = () => ({ type: 'object', properties: { commit_message: { type: 'string' } }, required: ['commit_message'] });
    getRequiredPermissions = () => ['vcs:commit'];
    async execute({ commit_message }: { commit_message: string }) {
        await sleep(600);
        if (mockVCS.status.staged.length === 0) {
            return { message: "nothing to commit, working tree clean" };
        }
        // Update the "committed" state to match the current working directory for staged files
        mockVCS.status.staged.forEach(path => {
            committedFileSystem[path] = mockFileSystem[path];
        });
        mockVCS.status.staged = [];
        return { message: `Committed with message: "${commit_message}"` };
    }
}

class GetStatusTool implements Tool {
    getName = () => 'git.get_status';
    getDescription = () => 'Gets the git status by diffing against the last commit.';
    getInputSchema = () => ({});
    getRequiredPermissions = () => ['vcs:read'];
    async execute() {
        await sleep(200);
        // Recalculate unstaged based on diff with committed state, but preserve staged files
        const unstaged: string[] = [];
        for (const path in mockFileSystem) {
            if (mockFileSystem[path] !== committedFileSystem[path] && !mockVCS.status.staged.includes(path)) {
                unstaged.push(path);
            }
        }
        mockVCS.status.unstaged = unstaged;
        return mockVCS;
    }
}

class ResetStateTool implements Tool {
    getName = () => 'resetState';
    getDescription = () => 'Resets the entire simulation state.';
    getInputSchema = () => ({});
    getRequiredPermissions = () => ['system:admin'];
    async execute() {
        committedFileSystem = { ...initialFileSystem };
        mockFileSystem = { ...initialFileSystem };
        mockScratchpad = {};
        mockVCS = { currentBranch: 'main', status: { staged: [], unstaged: [], untracked: [] } };
        await sleep(100);
        return "State has been reset.";
    }
}

// --- v3 Architecture: Core Components ---

class ToolRegistry {
    private tools = new Map<string, Tool>();

    constructor() {
        [
            new ReadFileTool(), new WriteFileTool(), new RunTestsTool(),
            new ExecuteScriptTool(), new ScratchpadSetTool(), new GitAddTool(), 
            new GitCreateBranchTool(), new GitCommitTool(), new GetStatusTool(), 
            new ResetStateTool()
        ].forEach(tool => this.register(tool));
    }

    register(tool: Tool) { this.tools.set(tool.getName(), tool); }
    getTool(name: string): Tool | undefined { return this.tools.get(name); }
}

export const toolRegistry = new ToolRegistry();

export async function executeTool(toolName: string, args: any, context: ExecutionContext): Promise<ToolResult> {
    const tool = toolRegistry.getTool(toolName);
    if (!tool) {
        return { success: false, data: null, error: { type: 'NOT_FOUND', message: `Tool '${toolName}' not found.`, details: null } };
    }

    // 1. Authorization Check
    const requiredPermissions = tool.getRequiredPermissions();
    const missingPermissions = requiredPermissions.filter(p => !context.permissions.includes(p));
    if (missingPermissions.length > 0) {
        return { success: false, data: null, error: { type: 'AUTHORIZATION', message: `Agent lacks required permissions.`, details: { required: requiredPermissions, missing: missingPermissions } } };
    }

    // 2. Input Validation (Simplified for demo)
    const schema = tool.getInputSchema() as any;
    if (schema.required) {
        for (const key of schema.required) {
            if (!(key in args)) {
                 return { success: false, data: null, error: { type: 'VALIDATION', message: `Missing required argument: '${key}'.`, details: { missing: key } } };
            }
        }
    }
    
    // 3. Safe Execution
    try {
        const data = await tool.execute(args);
        return { success: true, data, error: null };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown execution error occurred.';
        return { success: false, data: null, error: { type: 'EXECUTION', message, details: null } };
    }
}