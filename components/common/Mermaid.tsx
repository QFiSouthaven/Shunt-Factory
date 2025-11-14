// components/common/Mermaid.tsx
import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

declare const mermaid: any;

interface MermaidProps {
    chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [id] = useState(() => `mermaid-svg-${uuidv4()}`);
    const [hasRendered, setHasRendered] = useState(false);

    useEffect(() => {
        if (typeof mermaid === 'undefined' || !containerRef.current || !chart) {
            return;
        }

        // Reset render state and imperatively set loading message
        setHasRendered(false);
        if (containerRef.current) {
            containerRef.current.innerHTML = '<div class="text-gray-400">Rendering diagram...</div>';
        }

        const renderChart = async () => {
            try {
                // Sanitize the chart string to remove potentially problematic HTML tags
                // that an AI might have inserted. This version avoids injecting newlines
                // which can break string literals in the Mermaid syntax. It replaces all
                // HTML-like tags with a space.
                const sanitizedChart = chart.replace(/<[^>]*>/g, ' ');

                // Ensure mermaid is initialized
                 mermaid.initialize({
                    startOnLoad: false,
                    theme: 'dark',
                    securityLevel: 'loose',
                    themeVariables: {
                        background: '#1f2937', // gray-800
                        primaryColor: '#374151', // gray-700
                        primaryTextColor: '#d1d5db', // gray-300
                        lineColor: '#6b7280', // gray-500
                        nodeBorder: '#a855f7', // purple-500
                    },
                });
                
                const { svg } = await mermaid.render(id, sanitizedChart);
                if (containerRef.current) {
                    containerRef.current.innerHTML = svg;
                    setHasRendered(true);
                }
            } catch (error) {
                let errorMessage = 'Unknown error';
                if (error instanceof Error) {
                    errorMessage = error.message;
                } else if (typeof error === 'string') {
                    errorMessage = error;
                } else if (typeof error === 'object' && error !== null && 'message' in error) {
                    errorMessage = String((error as {message: any}).message);
                } else {
                    try {
                        errorMessage = JSON.stringify(error, null, 2);
                    } catch {
                        errorMessage = 'Could not stringify the error object.';
                    }
                }
                console.error("Mermaid rendering error:", error);
                if (containerRef.current) {
                    containerRef.current.innerHTML = `<pre class="text-red-400">Mermaid rendering error:\n${errorMessage}</pre>`;
                }
            }
        };

        // Use a small timeout to allow the initial "rendering" message to appear before the potentially blocking mermaid call.
        setTimeout(renderChart, 10);

    }, [chart, id]);

    return (
        <div
            ref={containerRef}
            className={`mermaid-container ${!hasRendered ? 'opacity-0' : 'opacity-100 transition-opacity'}`}
            style={{ lineHeight: 'initial' }} // Prevents prose styles from messing up the diagram
        />
    );
};

export default React.memo(Mermaid);