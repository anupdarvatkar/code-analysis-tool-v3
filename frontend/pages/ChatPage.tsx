import React, { useState, useRef, useEffect, useCallback } from 'react';
import { streamChatResponse } from '../services/geminiService';
import type { ChatMessage } from '../types';
import { MessageAuthor } from '../types';
import { UserIcon, BotIcon } from '../components/icons/Icons';
import MermaidDiagram from '../components/chat/MermaidDiagram';

const ChatMessageComponent: React.FC<{ message: ChatMessage }> = ({ message }) => {
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
                <Icon className="w-6 h-6 text-gray-600"/>
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
                <Icon className="w-6 h-6 text-gray-600"/>
            </div>
        )}
      </div>
    </div>
  );
};


const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { author: MessageAuthor.USER, text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    setMessages(prev => [...prev, { author: MessageAuthor.AI, text: '...' }]);
    
    try {
        const stream = await streamChatResponse([...messages, userMessage], input);
        let firstChunk = true;
        for await (const chunk of stream) {
            if (firstChunk) {
                 setMessages(prev => prev.slice(0, -1).concat({ author: MessageAuthor.AI, text: chunk }));
                 firstChunk = false;
            } else {
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    const updatedText = lastMessage.text + chunk;
                    return prev.slice(0, -1).concat({ ...lastMessage, text: updatedText });
                });
            }
        }
    } catch (error) {
        console.error("Error streaming response:", error);
        setMessages(prev => prev.slice(0, -1).concat({author: MessageAuthor.AI, text: "Sorry, I encountered an error."}));
    } finally {
        setIsLoading(false);
    }
  }, [input, isLoading, messages]);


  return (
    <div className="flex flex-col h-full bg-white rounded-md border border-gray-200 shadow-sm">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <ChatMessageComponent key={index} message={msg} />
          ))}
          {isLoading && messages[messages.length-1].author === MessageAuthor.USER && (
             <ChatMessageComponent message={{ author: MessageAuthor.AI, text: '...'}} />
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