import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageAuthor } from '../types';
import { UserIcon, BotIcon } from '../components/icons/Icons';
import MermaidDiagram from '../components/chat/MermaidDiagram';

// Use environment variable for API URL
const API_URL = import.meta.env.VITE_CHAT_API_URL || "http://127.0.0.1:9000/run_sse";
const SESSION_API_BASE = import.meta.env.VITE_SESSION_API_URL || "http://127.0.0.1:9000";

function generateUserId() {
  // Simple unique user id (could use uuid library for more robust solution)
  return 'user-' + Math.random().toString(36).substring(2, 12);
}

const APP_NAME = "TALK_CODE";

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

  // Establish session when chat page loads or refreshes
  useEffect(() => {
    const storedUserId = localStorage.getItem('chat_user_id');
    const user_id = storedUserId || generateUserId();
    if (!storedUserId) localStorage.setItem('chat_user_id', user_id);

    setUserId(user_id);

    // Establish session
    fetch(`${SESSION_API_BASE}/apps/${APP_NAME}/users/${user_id}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to establish session');
        return res.json();
      })
      .then(data => {
        // Assume sessionId is returned as { sessionId: "..." }
        setSessionId(data.sessionId || "session-1");
      })
      .catch(err => {
        setSessionId("session-1");
        console.error("Session error:", err);
      });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to send user input to /run_sse and handle response
  const sendMessageToAgent = async (userInput: string) => {
    setIsLoading(true);
    setMessages(prev => [...prev, { author: MessageAuthor.USER, text: userInput }, { author: MessageAuthor.AI, text: '...' }]);

    try {
      const payload = {
        appName: APP_NAME,
        userId: userId,
        sessionId: sessionId,
        newMessage: {
          parts: [
            {
              text: userInput
            }
          ],
          role: "user"
        },
        streaming: false,
        stateDelta: {}
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Failed to get response from agent");

      const data = await response.json();
      // Assuming the agent's reply is in data.parts[0].text
      const agentReply = data?.parts?.[0]?.text || "No response from agent.";

      setMessages(prev => prev.slice(0, -1).concat({ author: MessageAuthor.AI, text: agentReply }));
    } catch (error) {
      setMessages(prev => prev.slice(0, -1).concat({ author: MessageAuthor.AI, text: "Sorry, I encountered an error." }));
      console.error("Error communicating with agent:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      await sendMessageToAgent(input);
      setInput('');
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