import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageAuthor } from '../types';
import { UserIcon, BotIcon } from '../components/icons/Icons';
import MermaidDiagram from '../components/chat/MermaidDiagram';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_CHAT_API_URL || "http://127.0.0.1:9000/run_sse";
const SESSION_API_BASE = import.meta.env.VITE_SESSION_API_URL || "http://127.0.0.1:9000";

function generateUserId() {
  return 'user-' + Math.random().toString(36).substring(2, 12);
}

function generateSessionId() {
  return 'session-' + Math.random().toString(36).substring(2, 12);
}

const APP_NAME = "chat_agent";

// Reference implementation for calling /run_sse and parsing response
export const sendMessageToAgent = async (message: string, userId: string, sessionId: string): Promise<string> => {
  try {
    const payload = {
      appName: APP_NAME,
      userId,
      sessionId,
      newMessage: {
        parts: [
          { text: message }
        ],
        role: "user"
      },
      streaming: false
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream; charset=utf-8'
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split('\n').filter(line => line.startsWith('data: '));
    let toolText: string | null = null;
    let modelText: string | null = null;
    for (const line of lines) {
      const jsonText = line.slice(6);
      const data = JSON.parse(jsonText);

      const toolResponse = (data.tool_response ?? data.function_response ?? data.response ?? data.result ?? null) as any;
      if (toolResponse && typeof toolResponse === 'object') {
        if (typeof toolResponse.final_text === 'string' && toolResponse.final_text.trim().length > 0) {
          toolText = toolResponse.final_text;
        }
      }

      // Always check for modelText and return if present
      if (
        data.content &&
        Array.isArray(data.content.parts) &&
        typeof data.content.parts[0]?.text === 'string'
      ) {
        modelText = data.content.parts[0].text as string;
        // Return modelText immediately if toolText is not present
        if (!toolText) {
          return modelText;
        }
      }

      if (toolText) {
        return toolText;
      }

      if (data.error) {
        throw new Error(data.error);
      }
    }

    try {
      const lastLine = lines[lines.length - 1];
      if (lastLine && lastLine.startsWith('data: ')) {
        const lastData = JSON.parse(lastLine.slice(6));
        const lastTool = (lastData.tool_response ?? lastData.function_response ?? lastData.response ?? lastData.result ?? null) as any;
        if (lastTool && lastTool.render_suggestions && lastTool.render_suggestions.title) {
          const title = lastTool.render_suggestions.title as string;
          const rsLines = (lastTool.render_suggestions.lines as string[]) || [];
          const groups = (lastTool.render_suggestions.groups as { term: string; lines: string[] }[]) || [];
          if (title && Array.isArray(rsLines) && rsLines.length > 0) {
            const composed = [title, ...rsLines.map((l: string, i: number) => `${i + 1}. ${l}`)].join('\n');
            return composed;
          }
          if (title && Array.isArray(groups) && groups.length > 0) {
            const parts: string[] = [title];
            for (const g of groups) {
              parts.push('');
              parts.push(g.term);
              if (Array.isArray(g.lines) && g.lines.length > 0) {
                parts.push('Best match for your search is:');
                parts.push(`1. ${g.lines[0]}`);
                if (g.lines.length > 1) {
                  parts.push('Other related suggestions:');
                  for (let i = 1; i < g.lines.length; i++) {
                    parts.push(`${i + 1}. ${g.lines[i]}`);
                  }
                }
              }
            }
            return parts.join('\n');
          }
        }
      }
    } catch {}

    throw new Error('No valid function response or text found in SSE stream.');
  } catch (error) {
    console.error("Failed to communicate with the agent backend:", error);
    throw error;
  }
};

const ChatMessageComponent: React.FC<{ message: { author: string; text: string } }> = ({ message }) => {
  const isUser = message.author === MessageAuthor.USER;
  const isMermaid = message.text.trim().startsWith('```mermaid');
  const Icon = isUser ? UserIcon : BotIcon;
  const bgColor = isUser ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-800';
  const alignment = isUser ? 'items-end' : 'items-start';
  const bubbleAlignment = isUser ? 'rounded-br-none' : 'rounded-bl-none';

  const extractMermaidCode = (text: string): string => {
    const match = text.match(/```mermaid\n([\s\S]*?)\n```/);
    return match ? match[1] : '';
  };

  return (
    <div className={`flex flex-col ${alignment} mb-6`}>
      <div className="flex items-start max-w-2xl w-full">
        {!isUser && (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
            <Icon className="w-6 h-6 text-gray-600" />
          </div>
        )}
        <div className={`px-5 py-3 ${bgColor} rounded-lg ${bubbleAlignment} w-auto`}>
          {isMermaid ? (
            <MermaidDiagram code={extractMermaidCode(message.text)} />
          ) : (
            <p className="whitespace-pre-wrap">{message.text}</p>
          )}
        </div>
        {isUser && (
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center ml-3">
            <Icon className="w-6 h-6 text-gray-600" />
          </div>
        )}
      </div>
    </div>
  );
};

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<{ author: string; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Session state
  const [userId, setUserId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    const storedUserId = localStorage.getItem('chat_user_id');
    const user_id = storedUserId || generateUserId();
    if (!storedUserId) localStorage.setItem('chat_user_id', user_id);

    // Generate a unique sessionId for each load/refresh
    const newSessionId = generateSessionId();
    setUserId(user_id);
    setSessionId(newSessionId);

    fetch(`/apps/${APP_NAME}/users/${user_id}/sessions/${newSessionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to establish session');
        return res.json();
      })
      .then(data => {
        setSessionId(data.sessionId || newSessionId);
      })
      .catch(err => {
        setSessionId(newSessionId);
        console.error("Session error:", err);
      });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      setIsLoading(true);
      setMessages(prev => [...prev, { author: MessageAuthor.USER, text: input }, { author: MessageAuthor.AI, text: '...' }]);
      try {
        const agentReply = await sendMessageToAgent(input, userId, sessionId);
        setMessages(prev => prev.slice(0, -1).concat({ author: MessageAuthor.AI, text: agentReply }));
      } catch (error) {
        setMessages(prev => prev.slice(0, -1).concat({ author: MessageAuthor.AI, text: "Sorry, I encountered an error." }));
      } finally {
        setIsLoading(false);
        setInput('');
      }
    },
    [input, isLoading, userId, sessionId]
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-md border border-gray-200 shadow-sm">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <ChatMessageComponent key={index} message={msg} />
          ))}
          {isLoading && messages[messages.length - 1]?.author === MessageAuthor.USER && (
            <ChatMessageComponent message={{ author: MessageAuthor.AI, text: '...' }} />
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-md">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            placeholder="Ask to generate a diagram or paste your Mermaid code here..."
            className="flex-1 p-3 bg-gray-100 text-gray-800 rounded-md resize-none border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-700 text-white font-semibold rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-800 transition"
          >
            {isLoading ? 'Generating...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;