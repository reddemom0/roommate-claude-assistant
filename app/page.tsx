'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, MoreHorizontal, RefreshCw } from 'lucide-react';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // iOS viewport height fix
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  // Pull to refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (messagesContainerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (messagesContainerRef.current?.scrollTop === 0 && !isRefreshing) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, Math.min(80, currentY - touchStartY.current));
      setPullDistance(distance);
      
      if (distance > 0) {
        e.preventDefault();
        if (distance > 50 && 'vibrate' in navigator) {
          navigator.vibrate(5);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 50 && !isRefreshing) {
      handleRefresh();
    }
    setPullDistance(0);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsRefreshing(false);
  };

  const handleSetName = () => {
    if (userName.trim()) {
      setShowNameInput(false);
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
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

    if ('vibrate' in navigator) {
      navigator.vibrate(8);
    }

    if (inputRef.current) {
      inputRef.current.style.height = '44px';
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

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const quickPrompts = [
    "Groceries?",
    "Split bill",
    "Settle debate",
    "Barcelona info",
    "Weekend plans",
    "Assign task"
  ];

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
    inputRef.current?.focus();
  };

  if (showNameInput) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6" 
           style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
        <div className="bg-gray-900/90 backdrop-blur-2xl rounded-3xl p-8 w-full max-w-sm border border-gray-800">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-medium text-white mb-2">Assistant</h1>
            <p className="text-gray-400 text-sm">Who's this?</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Chris, Emily, or Levi"
              className="w-full px-4 py-4 bg-gray-800 border border-gray-700 rounded-2xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-white placeholder-gray-500 text-base"
              autoFocus
            />
            <button
              onClick={handleSetName}
              disabled={!userName.trim()}
              className="w-full bg-blue-500 text-white py-4 rounded-2xl hover:bg-blue-600 disabled:bg-gray-800 disabled:text-gray-500 transition-colors font-medium text-base"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col" 
         style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      
      {/* Header */}
      <div className="bg-gray-900/90 backdrop-blur-xl border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-medium">Claude</h1>
            <p className="text-gray-400 text-xs">{userName}</p>
          </div>
        </div>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Menu */}
      {showMenu && (
        <div className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-800 px-4 py-3">
          <button
            onClick={clearChat}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            Clear conversation
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-900/80 backdrop-blur-xl border-b border-gray-800 px-4 py-3">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
          {quickPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handleQuickPrompt(prompt)}
              className="flex-shrink-0 px-3 py-1.5 bg-gray-800 text-gray-300 rounded-full text-sm hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Pull to refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
          <div className={`w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center ${
            isRefreshing ? 'animate-spin' : ''
          }`}>
            <RefreshCw className="w-3 h-3 text-gray-400" />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <div 
          ref={messagesContainerRef}
          className="h-full overflow-y-auto px-4 py-6 space-y-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ 
            transform: `translateY(${pullDistance * 0.3}px)`,
            transition: pullDistance === 0 ? 'transform 0.2s ease-out' : 'none'
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] px-4 py-3 rounded-3xl ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white ml-12'
                  : 'bg-gray-800 text-gray-100 mr-12'
              }`}>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium opacity-70">{message.user}</span>
                  <span className="text-xs opacity-50">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-gray-100 max-w-[80%] px-4 py-3 rounded-3xl mr-12">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-gray-900/90 backdrop-blur-xl border-t border-gray-800 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-3xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-white placeholder-gray-500 text-base"
              rows={1}
              style={{
                minHeight: '44px',
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
            className="w-11 h-11 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 transition-colors flex items-center justify-center flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
