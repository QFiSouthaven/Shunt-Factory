// components/chat/Chat.tsx
// SECURITY NOTE: This component previously used direct API key access which has been removed.
// Chat streaming requires backend implementation. Currently disabled for security.
// TODO: Implement /api/gemini/chat endpoint with streaming support in backend

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TabFooter from '../common/TabFooter';
import { useTelemetry } from '../../context/TelemetryContext';
import { audioService } from '../../services/audioService';
import { executeCode } from '../../services/codeExecutor';
import { parseApiError } from '../../utils/errorLogger';
import { generateContent } from '../../services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'model' | 'error' | 'system-progress' | 'code-output';
  content: string;
  isLoading?: boolean;
}

const CHAT_HISTORY_STORAGE_KEY = 'gemini-chat-history';

const loadMessages = (): Message[] => {
    try {
        const stored = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Failed to load chat history:", e);
    }
    return [{ id: 'init', role: 'model', content: "Hello! I'm a Gemini-powered chat assistant. How can I help you today?" }];
};


const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { versionControlService } = useTelemetry();

  useEffect(() => {
    try {
        localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
        console.error("Failed to save chat history:", e);
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const saveChatHistory = useCallback(() => {
      versionControlService?.captureVersion(
          'chat_export',
          `chat_session_${new Date().toISOString()}`,
          JSON.stringify(messages, null, 2),
          'user_action',
          'User saved chat session'
      );
      alert('Chat history saved to Chronicle!');
  }, [messages, versionControlService]);
  
  const onClearHistory = useCallback(() => {
      setMessages([{ id: 'init', role: 'model', content: "History cleared. How can I help you?" }]);
      localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
      audioService.playSound('click');
  }, []);

  const handleExecuteCode = useCallback(async (language: string, code: string) => {
    const executionId = Date.now().toString();
    const progressMessage: Message = {
      id: executionId,
      role: 'system-progress',
      content: `Executing ${language} code...`
    };
    setMessages(prev => [...prev, progressMessage]);
    audioService.playSound('send');
    
    const result = await executeCode(language, code);

    setMessages(prev => prev.map(msg => msg.id === executionId ? {
      ...msg,
      role: result.startsWith('Error:') ? 'error' : 'code-output',
      content: result,
    } : msg));
    audioService.playSound('receive');
  }, []);

  const onSendMessage = useCallback(async (messageText: string) => {
    setIsLoading(true);
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    audioService.playSound('send');

    // SECURITY: Use backend API proxy instead of direct API key access
    // Build conversation context from message history
    const conversationHistory = messages
      .filter(m => m.role === 'user' || m.role === 'model')
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');

    const fullPrompt = conversationHistory
      ? `${conversationHistory}\n\nuser: ${messageText}\n\nmodel:`
      : messageText;

    try {
      // Use backend proxy for AI chat (non-streaming for security)
      const response = await generateContent(fullPrompt, {
        model: 'gemini-2.5-pro',
        temperature: 0.7,
      });

      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'model',
        content: response,
        isLoading: false
      };

      setMessages(prev => [...prev, assistantMessage]);
      audioService.playSound('receive');

    } catch (error) {
      console.error(error);
      const userFriendlyMessage = parseApiError(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'error',
        content: userFriendlyMessage
      };
      setMessages(prev => [...prev, errorMessage]);
      audioService.playSound('error');
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gray-800/30">
        <div className="flex-grow p-4 md:p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} role={msg.role} content={msg.content} isLoading={msg.isLoading} onExecuteCode={handleExecuteCode} />
                ))}
                {isLoading && messages[messages.length-1]?.role !== 'model' && (
                     <ChatMessage key="loading" role="model" content="" isLoading={true} />
                )}
                 <div ref={messagesEndRef} />
            </div>
        </div>
        <div className="flex-shrink-0 p-4 md:p-6 bg-gray-900/50 border-t border-gray-700/50">
            <div className="max-w-4xl mx-auto">
                 <div className="flex items-center gap-4 mb-2">
                    {messages.length > 1 && <button onClick={saveChatHistory} className='text-xs text-gray-400 hover:text-white'>Save Chat History</button>}
                    {messages.length > 1 && <button onClick={onClearHistory} className='text-xs text-red-400 hover:text-red-300'>Clear History</button>}
                </div>
                <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
            </div>
        </div>
        <TabFooter />
    </div>
  );
};

export default Chat;