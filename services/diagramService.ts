// services/diagramService.ts

interface ProjectFile {
    filename: string;
    content: string;
}

/**
 * Generates a text-based file tree from a list of file paths.
 */
export const generateFileTree = (files: { filename: string }[]): string => {
    const root: any = {};

    for (const file of files) {
        const parts = file.filename.split('/');
        let current = root;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!current[part]) {
                current[part] = i === parts.length - 1 ? null : {};
            }
            current = current[part];
        }
    }

    const buildTreeString = (node: any, prefix = ''): string => {
        let result = '';
        const keys = Object.keys(node);
        keys.forEach((key, index) => {
            const isLast = index === keys.length - 1;
            result += `${prefix}${isLast ? '└── ' : '├── '}${key}\n`;
            if (node[key] !== null) {
                result += buildTreeString(node[key], `${prefix}${isLast ? '    ' : '│   '}`);
            }
        });
        return result;
    };

    return `\`\`\`
${buildTreeString(root)}
\`\`\``;
};

/**
 * Generates a Mermaid.js graph syntax for the component hierarchy.
 */
export const generateComponentDiagram = (files: ProjectFile[]): string => {
    // A more robust regex to capture component names (including dot notation like React.Fragment)
    // and avoid capturing attributes or other characters.
    const componentRegex = /<([A-Z][a-zA-Z0-9_.]*)/g;
    const dependencies: { [parent: string]: Set<string> } = {};

    const getComponentName = (path: string): string => {
        const parts = path.split('/');
        const filename = parts[parts.length - 1];
        if (filename === 'index.tsx' && parts.length > 1) {
            return parts[parts.length - 2];
        }
        return filename.replace(/\.tsx$/, '');
    };

    for (const file of files) {
        if (!file.filename.endsWith('.tsx')) continue;

        const parentComponent = getComponentName(file.filename);
        if (!dependencies[parentComponent]) {
            dependencies[parentComponent] = new Set();
        }

        // Strip comments to avoid matching component-like syntax inside them
        const contentWithoutComments = file.content
            .replace(/\/\*[\s\S]*?\*\//g, '') // strip multiline comments
            .replace(/\/\/.*/g, '');          // strip single line comments

        let match;
        // Reset regex state for each new file content being processed.
        componentRegex.lastIndex = 0;
        while ((match = componentRegex.exec(contentWithoutComments)) !== null) {
            const childComponent = match[1];

            // Explicitly skip self-references to prevent cycles.
            if (childComponent === parentComponent) {
                continue;
            }
            
            // The regex already ensures the name starts with a capital,
            // so we just add it to the dependency set.
            dependencies[parentComponent].add(childComponent);
        }
    }

    let mermaidGraph = 'graph TD;\n';
    for (const parent in dependencies) {
        if (dependencies[parent].size > 0) {
            dependencies[parent].forEach(child => {
                // Final safeguard against cycles before writing to the graph string.
                if (parent !== child) {
                    // Ensure strings are properly quoted to handle names like `React.Fragment`.
                    mermaidGraph += `    "${parent}" --> "${child}";\n`;
                }
            });
        }
    }

    return mermaidGraph;
};

/**
 * Generates a Mermaid flowchart showing transformation experiments
 * Same input branching into multiple component transformations
 */
import { WorkflowSession, TransformationGroup, TransformationNode } from './contentFlowTracker';

export const generateWorkflowDiagram = (session: WorkflowSession): string => {
    if (session.allTransformations.length === 0) {
        return 'graph TD;\n    Start[No transformation data yet]:::empty';
    }

    let mermaid = 'graph TD;\n';

    // Define color schemes for different component types
    const componentStyles: Record<string, string> = {
        'DeepResearch': 'fill:#dae8fc,stroke:#6c8ebf,color:#000',
        'Shunt': 'fill:#006ABC,stroke:#003d73,color:#fff',
        'Tool for AI': 'fill:#E20ABE,stroke:#8B0067,color:#fff',
        'ToolForAI': 'fill:#E20ABE,stroke:#8B0067,color:#fff',
        'Chat': 'fill:#60a5fa,stroke:#3b82f6,color:#fff',
        'Weaver': 'fill:#a78bfa,stroke:#8b5cf6,color:#fff',
        'Foundry': 'fill:#f97316,stroke:#ea580c,color:#fff',
    };

    let nodeIndex = 0;

    // For each transformation group (same input)
    session.transformationGroups.forEach((group, groupIdx) => {
        const inputNodeId = `input${groupIdx}`;
        const sanitizedInput = group.inputPreview
            .replace(/"/g, "'")
            .replace(/\n/g, ' ')
            .substring(0, 60);

        // Create input node
        mermaid += `    ${inputNodeId}["📝 INPUT<br/>${sanitizedInput}..."]:::input\n`;

        // Create transformation nodes for each experiment
        group.transformations.forEach((t, tIdx) => {
            const transNodeId = `trans${groupIdx}_${tIdx}`;
            const compLabel = t.actionName ? `${t.componentName}<br/>${t.actionName}` : t.componentName;
            const attemptLabel = t.attemptNumber > 1 ? ` (Try ${t.attemptNumber})` : '';

            const sanitizedOutput = t.outputPreview
                .replace(/"/g, "'")
                .replace(/\n/g, ' ')
                .substring(0, 50);

            const label = `${compLabel}${attemptLabel}<br/><small>${sanitizedOutput}...</small>`;

            // Determine style
            let styleClass = 'default';
            for (const [key, _] of Object.entries(componentStyles)) {
                if (t.componentName.includes(key)) {
                    styleClass = key.replace(/[^a-zA-Z0-9]/g, '');
                    break;
                }
            }

            // Create transformation node
            mermaid += `    ${transNodeId}["${label}"]:::${styleClass}\n`;

            // Link input to transformation
            const tokenInfo = t.tokenUsage ? ` ${t.tokenUsage} tokens` : '';
            mermaid += `    ${inputNodeId} -->|transform${tokenInfo}| ${transNodeId}\n`;

            nodeIndex++;
        });

        mermaid += '\n';
    });

    // Add style definitions
    mermaid += '    %% Styles\n';
    mermaid += '    classDef input fill:#fef3c7,stroke:#f59e0b,color:#000,stroke-width:3px\n';
    Object.entries(componentStyles).forEach(([name, style]) => {
        const className = name.replace(/[^a-zA-Z0-9]/g, '');
        mermaid += `    classDef ${className} ${style}\n`;
    });
    mermaid += '    classDef default fill:#374151,stroke:#6b7280,color:#fff\n';
    mermaid += '    classDef empty fill:#1f2937,stroke:#4b5563,color:#9ca3af\n';

    return mermaid;
};

/**
 * Generate a comparison table for transformations of the same input
 */
export const generateTransformationComparisonTable = (group: TransformationGroup): string => {
    let markdown = `# Transformation Experiments\n\n`;
    markdown += `**Input:** ${group.inputPreview}\n\n`;
    markdown += `**Total Attempts:** ${group.transformations.length}\n\n`;
    markdown += `| # | Component | Action | Attempt | Output Preview | Tokens |\n`;
    markdown += `|---|-----------|--------|---------|----------------|--------|\n`;

    group.transformations.forEach((t, idx) => {
        const comp = t.componentName;
        const action = t.actionName || '-';
        const attempt = t.attemptNumber;
        const output = t.outputPreview.substring(0, 80).replace(/\|/g, '\\|');
        const tokens = t.tokenUsage || '-';

        markdown += `| ${idx + 1} | ${comp} | ${action} | ${attempt} | ${output}... | ${tokens} |\n`;
    });

    return markdown;
};
