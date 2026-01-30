import React, { useState, useRef, useEffect, useCallback } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import chatService from '../services/chatService';
import { v4 as uuidv4 } from 'uuid';

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedModel, setSelectedModel] = useState('llama2');
  const [availableModels, setAvailableModels] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true' || 
           (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [conversations, setConversations] = useState(() => {
    const saved = localStorage.getItem('conversations');
    return saved ? JSON.parse(saved) : [];
  });
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Persist dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Persist conversations
  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
    fetchModels();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkConnection = async () => {
    try {
      const result = await chatService.checkHealth();
      setIsConnected(result.success);
    } catch (error) {
      setIsConnected(false);
    }
  };

  const fetchModels = async () => {
    try {
      const result = await chatService.getModels();
      if (result.success && result.models.length > 0) {
        setAvailableModels(result.models);
        setSelectedModel(result.models[0]);
      }
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content) => {
    if (!content.trim() || isLoading) return;

    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const result = await chatService.sendMessage(
        content,
        selectedModel,
        conversationId
      );

      if (result.success) {
        setConversationId(result.conversationId);
        
        const assistantMessage = {
          id: result.message.id,
          role: 'assistant',
          content: result.message.content,
          timestamp: new Date(result.message.timestamp)
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage = {
          id: uuidv4(),
          role: 'system',
          content: `Error: ${result.error || 'Failed to get response'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: uuidv4(),
        role: 'system',
        content: 'Error: Failed to connect to server. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = useCallback(() => {
    if (conversationId && messages.length > 0) {
      const title = messages[0].content.slice(0, 50) + (messages[0].content.length > 50 ? '...' : '');
      setConversations(prev => {
        const exists = prev.find(c => c.id === conversationId);
        if (exists) {
          return prev.map(c => c.id === conversationId ? {
            ...c,
            title,
            timestamp: new Date(),
            messageCount: messages.length,
            messages: messages
          } : c);
        }
        return [{
          id: conversationId,
          title,
          timestamp: new Date(),
          messageCount: messages.length,
          messages: messages
        }, ...prev].slice(0, 20);
      });
    }
    if (conversationId) {
      chatService.clearConversation(conversationId);
    }
    setMessages([]);
    setConversationId(null);
  }, [conversationId, messages]);

  const handleNewChat = () => {
    if (conversationId && messages.length > 0) {
      const title = messages[0].content.slice(0, 50) + (messages[0].content.length > 50 ? '...' : '');
      setConversations(prev => {
        const exists = prev.find(c => c.id === conversationId);
        if (exists) {
          return prev.map(c => c.id === conversationId ? {
            ...c,
            title,
            timestamp: new Date(),
            messageCount: messages.length,
            messages: messages
          } : c);
        }
        return [{
          id: conversationId,
          title,
          timestamp: new Date(),
          messageCount: messages.length,
          messages: messages
        }, ...prev].slice(0, 20);
      });
    }
    setMessages([]);
    setConversationId(null);
    textareaRef.current?.focus();
  };

  const handleLoadConversation = (conv) => {
    if (conversationId && messages.length > 0 && conversationId !== conv.id) {
      const title = messages[0].content.slice(0, 50) + (messages[0].content.length > 50 ? '...' : '');
      setConversations(prev => {
        const exists = prev.find(c => c.id === conversationId);
        if (exists) {
          return prev.map(c => c.id === conversationId ? {
            ...c,
            title,
            timestamp: new Date(),
            messageCount: messages.length,
            messages: messages
          } : c);
        }
        return [{
          id: conversationId,
          title,
          timestamp: new Date(),
          messageCount: messages.length,
          messages: messages
        }, ...prev].slice(0, 20);
      });
    }
    
    if (conv.messages && conv.messages.length > 0) {
      setMessages(conv.messages.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp)
      })));
      setConversationId(conv.id);
    }
  };

  const handleDeleteConversation = (e, convId) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (conversationId === convId) {
      setMessages([]);
      setConversationId(null);
    }
  };

  const formatRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-72' : 'w-0'} 
          transition-all duration-300 ease-in-out 
          overflow-hidden 
          bg-white dark:bg-slate-900 
          border-r border-slate-200 dark:border-slate-800
          flex flex-col`}
      >
        {/* New Chat Button */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 
              px-4 py-3 
              bg-gradient-to-r from-blue-500 to-blue-600 
              hover:from-blue-600 hover:to-blue-700
              text-white rounded-xl 
              transition-all duration-200
              font-medium shadow-lg shadow-blue-500/25
              hover:shadow-xl hover:shadow-blue-500/30
              hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3">
          {conversations.length === 0 ? (
            <div className="text-center p-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No conversations yet
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Start a new chat to begin
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleLoadConversation(conv)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 group relative ${
                    conversationId === conv.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between pr-8">
                    <p className={`text-sm font-medium truncate ${
                      conversationId === conv.id 
                        ? 'text-blue-700 dark:text-blue-300' 
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {conv.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {formatRelativeTime(conv.timestamp)}
                    </span>
                    <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {conv.messageCount || (conv.messages?.length || 0)} messages
                    </span>
                  </div>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="absolute right-2 top-2 p-1.5 rounded-lg 
                      opacity-0 group-hover:opacity-100 
                      transition-all duration-200
                      hover:bg-red-100 dark:hover:bg-red-900/30
                      text-slate-400 hover:text-red-500"
                    title="Delete conversation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Local Chatbot
            </span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'} relative`}>
                {isConnected && (
                  <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                )}
              </div>
              <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                AI Assistant
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200 transition-colors cursor-pointer"
              >
                {availableModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? (
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Clear Chat Button */}
            <button
              onClick={handleClearChat}
              disabled={messages.length === 0}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-4">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-blue-500/20">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  Welcome to AI Assistant
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Start a conversation with your local AI model. Type a message below to begin.
                </p>
                
                {!isConnected && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4 text-sm">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="font-medium">Server not connected</span>
                    </div>
                    <p className="mt-1 text-red-600 dark:text-red-400/80">
                      Make sure Ollama is running on port 11434
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <MessageList messages={messages} darkMode={darkMode} />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4">
          <MessageInput 
            onSend={handleSendMessage} 
            isLoading={isLoading}
            disabled={!isConnected}
            textareaRef={textareaRef}
            darkMode={darkMode}
          />
        </div>
      </main>
    </div>
  );
};

export default ChatWindow;
