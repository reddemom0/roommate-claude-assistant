'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MoreHorizontal, Sparkles } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  user: string;
}

export default function RoommateClaudeAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content: "Barcelona household assistant ready. How can I help?",
      timestamp: new Date(),
      user: 'Claude'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSetName = () => {
    if (userName.trim()) {
      setShowNameInput(false);
    }
  };

  const sendMessageToClaude = async (conversationHistory: any[]) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationHistory
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error calling Claude API:', error);
      return "Connection error. Try again.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      user: userName
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    const conversationHistory = updatedMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.role === 'user' ? `${msg.user}: ${msg.content}` : msg.content
    }));

    try {
      const claudeResponse = await sendMessageToClaude(conversationHistory);
      
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: claudeResponse,
        timestamp: new Date(),
        user: 'Claude'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "Error. Try again.",
        timestamp: new Date(),
        user: 'Claude'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showNameInput) {
        handleSetName();
      } else {
        handleSendMessage();
      }
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        role: 'assistant',
        content: "Barcelona household assistant ready. How can I help?",
        timestamp: new Date(),
        user: 'Claude'
      }
    ]);
    setShowMenu(false);
  };

  const quickPrompts = [
    "Who's turn for groceries?",
    "Split this bill 3 ways", 
    "Settle this debate",
    "Find Barcelona info",
    "Plan weekend activity",
    "Assign this task"
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
    inputRef.current?.focus();
  };

  if (showNameInput) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-medium text-gray-900 mb-2">Claude Assistant</h1>
            <p className="text-gray-600">Barcelona household helper</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Chris, Emily, or Levi"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-900"
                autoFocus
              />
            </div>
            <button
              onClick={handleSetName}
              disabled={!userName.trim()}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Start conversation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      
      {/* Header - Claude style */}
      <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-gray-900">Claude</h1>
            <p className="text-sm text-gray-500">{userName}</p>
          </div>
        </div>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Menu */}
      {showMenu && (
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <button
            onClick={clearChat}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Clear conversation
          </button>
        </div>
      )}

      {/* Quick Actions - Claude style */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex space-x-2 overflow-x-auto">
          {quickPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handleQuickPrompt(prompt)}
              className="flex-shrink-0 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Messages - Claude style */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-blue-500' 
                    : 'bg-orange-500'
                }`}>
                  {message.role === 'user' ? (
                    <span className="text-white text-xs font-medium">
                      {message.user.charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <Sparkles className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className="font-medium text-gray-900">
                  {message.role === 'user' ? message.user : 'Claude'}
                </span>
              </div>
              <div className="ml-8">
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="font-medium text-gray-900">Claude</span>
              </div>
              <div className="ml-8">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - Claude style */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message Claude..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none text-gray-900 placeholder-gray-500"
              rows={1}
              style={{
                minHeight: '48px',
                maxHeight: '120px',
                height: 'auto'
              }}
              disabled={isLoading}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="absolute right-2 bottom-2 w-8 h-8 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
