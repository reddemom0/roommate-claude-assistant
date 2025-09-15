'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Users, Home, MessageSquare, Trash2, User, Menu, X, RotateCcw } from 'lucide-react';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [touchStartTime, setTouchStartTime] = useState<number>(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [lastTouchY, setLastTouchY] = useState<number>(0);
  
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

  // iOS Safe Area Support
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

  // Enhanced iOS gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const container = messagesContainerRef.current;
    
    if (container && container.scrollTop === 0) {
      touchStartY.current = touch.clientY;
      setTouchStartTime(Date.now());
      setIsScrolling(false);
    }
    setLastTouchY(touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const container = messagesContainerRef.current;
    const deltaY = Math.abs(touch.clientY - lastTouchY);
    
    if (deltaY > 5) {
      setIsScrolling(true);
    }
    
    if (container && container.scrollTop === 0 && !isRefreshing && !isScrolling) {
      const currentY = touch.clientY;
      const distance = Math.max(0, Math.min(120, currentY - touchStartY.current));
      
      // Add resistance curve like iOS
      const resistance = distance > 60 ? 60 + (distance - 60) * 0.3 : distance;
      setPullDistance(resistance);
      
      if (distance > 0) {
        e.preventDefault();
        // Add haptic feedback at threshold
        if (distance > 60 && pullDistance <= 60 && 'vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }
    }
    setLastTouchY(touch.clientY);
  };

  const handleTouchEnd = () => {
    const touchDuration = Date.now() - touchStartTime;
    
    if (pullDistance > 60 && !isRefreshing && touchDuration > 100) {
      handleRefresh();
      // Stronger haptic for action
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]);
      }
    }
    
    setPullDistance(0);
    setIsScrolling(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh with actual functionality
    await new Promise(resolve => setTimeout(resolve, 1200));
    setIsRefreshing(false);
  };

  const handleSetName = () => {
    if (userName.trim()) {
      setShowNameInput(false);
      // Welcome haptic
      if ('vibrate' in navigator) {
        navigator.vibrate([20, 100, 20]);
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
      return "Connection issues. Try again.";
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

    // Enhanced haptic feedback for iOS
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }

    // Reset input height
    if (inputRef.current) {
      inputRef.current.style.height = '48px';
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
      
      // Subtle haptic for received message
      if ('vibrate' in navigator) {
        navigator.vibrate(8);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "Error. Try again.",
        timestamp: new Date(),
        user: 'Claude'
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Error haptic pattern
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 100, 50]);
      }
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
    // Clear haptic
    if ('vibrate' in navigator) {
      navigator.vibrate(25);
    }
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
    // Quick prompt haptic
    if ('vibrate' in navigator) {
      navigator.vibrate(12);
    }
  };

  if (showNameInput) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4" 
           style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-white/20">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg transform hover:scale-105 transition-transform duration-200">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Barcelona Assistant</h1>
            <p className="text-gray-600 text-sm">Who's asking?</p>
          </div>
          
          <div className="space-y-4">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Chris, Emily, or Levi"
              className="w-full px-5 py-4 border-0 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none text-lg transition-all duration-200 transform focus:scale-105"
              autoFocus
            />
            <button
              onClick={handleSetName}
              disabled={!userName.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium text-lg shadow-lg transform active:scale-95 hover:scale-105"
            >
              Let's Go
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col" 
         style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      {/* iOS Status Bar Safe Area */}
      <div className="h-safe-top bg-white/95 backdrop-blur-xl"></div>
      
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl shadow-sm border-b border-white/20 flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <Home className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800">Claude</h1>
              <p className="text-xs text-gray-500">{userName}</p>
            </div>
          </div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-3 text-gray-500 hover:text-gray-700 transition-colors rounded-xl hover:bg-gray-100 active:scale-95 transform"
          >
            {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu */}
        {showMenu && (
          <div className="border-t border-white/20 bg-white/80 backdrop-blur-xl p-4 space-y-3 animate-in fade-in duration-200">
            <button
              onClick={clearChat}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors w-full text-left p-3 rounded-xl hover:bg-gray-100 active:scale-95 transform"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Chat</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-white/20 px-4 py-3 flex-shrink-0">
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-hide">
          {quickPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handleQuickPrompt(prompt)}
              className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 rounded-full text-sm font-medium hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 whitespace-nowrap border border-indigo-100 active:scale-95 transform shadow-sm"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Pull to Refresh Indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10">
          <div className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
            pullDistance > 60 || isRefreshing ? 'bg-green-500 scale-110' : 'bg-gray-200'
          }`}>
            <RotateCcw className={`w-5 h-5 transition-all duration-200 ${
              pullDistance > 60 || isRefreshing ? 'text-white' : 'text-gray-400'
            } ${isRefreshing ? 'animate-spin' : ''}`} 
                      style={{ transform: isRefreshing ? 'none' : `rotate(${Math.min(pullDistance * 3, 180)}deg)` }} />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <div 
          ref={messagesContainerRef}
          className="h-full overflow-y-auto px-4 py-4 space-y-4 scroll-smooth custom-scrollbar"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ 
            transform: `translateY(${pullDistance * 0.5}px)`,
            transition: pullDistance === 0 ? 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
          }}
        >
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom duration-300`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`max-w-[85%] px-4 py-3 rounded-3xl shadow-sm transform hover:scale-105 transition-all duration-200 ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-lg'
                  : 'bg-white/95 backdrop-blur-xl text-gray-800 rounded-bl-lg border border-white/20'
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
            <div className="flex justify-start animate-in slide-in-from-bottom">
              <div className="bg-white/95 backdrop-blur-xl text-gray-800 max-w-[85%] px-4 py-3 rounded-3xl rounded-bl-lg shadow-sm border border-white/20">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Enhanced for iOS */}
      <div className="bg-white/95 backdrop-blur-xl border-t border-white/20 p-4 flex-shrink-0 pb-safe">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Claude anything..."
              className="w-full px-4 py-3 border-0 bg-gray-50 rounded-3xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none resize-none text-base transition-all duration-200 focus:scale-105 transform"
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
            className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center flex-shrink-0 shadow-lg transform active:scale-95 hover:scale-110"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* iOS Home Indicator Safe Area */}
      <div className="h-safe-bottom bg-white/95 backdrop-blur-xl"></div>
    </div>
  );
}
