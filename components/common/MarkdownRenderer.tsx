import React from 'react';
import Mermaid from './Mermaid';

interface MarkdownRendererProps {
  content: string;
}

const SAFE_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'p', 'br', 'hr', 'blockquote'];

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    // 1. Split by code blocks first to preserve their content without processing
    const parts = content.split(/(```[\s\S]*?```)/g);

    const renderText = (text: string) => {
        // Basic HTML entity escaping for security
        let sanitizedHtml = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Process markdown syntax to whitelisted HTML tags
        // Headings
        sanitizedHtml = sanitizedHtml.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        sanitizedHtml = sanitizedHtml.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        sanitizedHtml = sanitizedHtml.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Bold
        sanitizedHtml = sanitizedHtml.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic
        sanitizedHtml = sanitizedHtml.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
        // Unordered lists
        sanitizedHtml = sanitizedHtml.replace(/^\* (.*$)/gim, '<li>$1</li>');
        sanitizedHtml = sanitizedHtml.replace(/((?:<li>.*<\/li>\s*(?:\n|$))+)/g, '<ul>$1</ul>');

        // Replace escaped tags with real, whitelisted tags
        const tagRegex = /&lt;(\/?)([^&;\s>]+).*?&gt;/g;
        sanitizedHtml = sanitizedHtml.replace(tagRegex, (match, closingSlash, tagName) => {
            const lowerTagName = tagName.toLowerCase();
            if (SAFE_TAGS.includes(lowerTagName)) {
                return `<${closingSlash}${lowerTagName}>`;
            }
            return match; // Return the escaped version if not safe
        });
        
        // Paragraphs: Wrap lines that aren't part of other blocks
        const finalHtml = sanitizedHtml.split('\n').map(line => {
            if (line.trim() === '') return '<br />';
            if (line.match(/^\s*<(\/)?(h[1-6]|ul|li|p|br|hr|blockquote)/)) { 
                return line;
            }
            return `<p>${line}</p>`;
        }).join('');
    
        return <div dangerouslySetInnerHTML={{ __html: finalHtml }} />;
    };

    return (
        <div className="prose prose-invert prose-sm max-w-none">
            {parts.map((part, index) => {
                if (!part) return null;
                if (part.startsWith('```') && part.endsWith('```')) {
                    const code = part.slice(3, -3).trim();
                    const languageMatch = code.match(/^[a-z]+\n/);
                    const language = languageMatch ? languageMatch[0].trim() : '';
                    const actualCode = language ? code.substring(code.indexOf('\n') + 1) : code;

                    if (language === 'mermaid') {
                        return (
                            <div key={index} className="my-4 not-prose bg-gray-900/50 p-4 rounded-lg flex justify-center">
                                <Mermaid chart={actualCode} />
                            </div>
                        );
                    }
                    
                    return (
                        <div key={index} className="bg-black/50 rounded-lg my-4 not-prose">
                            {language && <div className="text-xs text-gray-400 px-4 py-2 border-b border-gray-600/50">{language}</div>}
                            <pre className="p-4 text-sm text-gray-200 overflow-x-auto whitespace-pre-wrap font-mono">
                                <code>{actualCode}</code>
                            </pre>
                        </div>
                    );
                }
                return <div key={index}>{renderText(part)}</div>;
            })}
        </div>
    );
};

export default React.memo(MarkdownRenderer);