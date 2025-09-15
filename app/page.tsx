'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Users, Home, MessageSquare, Trash2, User, Menu, X } from 'lucide-react';

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
      content: "Alright Vancouver crew, your Barcelona household assistant is online. Got drama? Need decisions made? Want me to settle who's washing dishes this week? Let's go.",
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
      return "Sorry, I'm having trouble connecting right now. Please try again in a moment.";
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

    // Prepare conversation history for Claude
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
        content: "I encountered an error processing your request. Please try again.",
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
        content: "Alright Vancouver crew, your Barcelona household assistant is online. Got drama? Need decisions made? Want me to settle who's washing dishes this week? Let's go.",
        timestamp: new Date(),
        user: 'Claude'
      }
    ]);
    setShowMenu(false);
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Barcelona Roommate Assistant</h1>
            <p className="text-gray-600 text-sm">Enter your name to start chatting with Claude</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Your name (Chris, Emily, or Levi)"
              className="w-full px-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg"
              autoFocus
            />
            <button
              onClick={handleSetName}
              disabled={!userName.trim()}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-lg"
            >
              Start Chatting
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <Home className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Claude Assistant</h1>
              <p className="text-xs text-gray-500">{userName}</p>
            </div>
          </div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="border-t bg-gray-50 p-4 space-y-3">
            <button
              onClick={clearChat}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors w-full text-left"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Chat</span>
            </button>
            <div className="text-xs text-gray-500 pt-2 border-t">
              Sassy AI helper for your Barcelona household
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="bg-white border-b px-4 py-3 flex-shrink-0">
        <div className="flex space-x-2 overflow-x-auto pb-1">
          {quickPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handleQuickPrompt(prompt)}
              className="flex-shrink-0 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-md'
                    : 'bg-white text-gray-800 shadow-sm rounded-bl-md'
                }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    {message.role === 'user' ? (
                      <User className="w-3 h-3" />
                    ) : (
                      <MessageSquare className="w-3 h-3" />
                    )}
                    <span className="text-xs font-medium">{message.user}</span>
                    <span className={`text-xs ${
                      message.role === 'user' ? 'text-indigo-200' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t bg-white p-4 flex-shrink-0">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Claude anything..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-base"
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
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="w-12 h-12 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
