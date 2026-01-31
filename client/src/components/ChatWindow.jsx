import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import SettingsPanel from './SettingsPanel';
import ExportImportPanel from './ExportImportPanel';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [isStreaming, setIsStreaming] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [streamedContent, setStreamedContent] = useState('');
  const messagesEndRef = useRef(null);
  // eslint-disable-next-line no-unused-vars
  const abortControllerRef = useRef(null);
  const textareaRef = useRef(null);

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('fontSize') || 'medium';
  });
  const [compactMode, setCompactMode] = useState(() => {
    return localStorage.getItem('compactMode') === 'true';
  });
  const [streamingEnabled, setStreamingEnabled] = useState(() => {
    return localStorage.getItem('streamingEnabled') !== 'false';
  });
  
  // Export/Import state
  const [exportImportOpen, setExportImportOpen] = useState(false);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = conversations.filter(conv => {
      // Search in title
      if (conv.title.toLowerCase().includes(query)) {
        return true;
      }
      // Search in messages
      if (conv.messages) {
        return conv.messages.some(msg => 
          msg.content.toLowerCase().includes(query)
        );
      }
      return false;
    });

    setSearchResults(results);
  }, [searchQuery, conversations]);

  // Filtered conversations based on search
  const filteredConversations = useMemo(() => {
    if (searchQuery.trim() === '') {
      return conversations;
    }
    return searchResults;
  }, [conversations, searchResults, searchQuery]);

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
    setIsStreaming(true);
    setStreamedContent('');

    // Create a placeholder message for streaming
    const streamingMessageId = uuidv4();
    const streamingMessage = {
      id: streamingMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, streamingMessage]);

    try {
      let streamConversationId = conversationId;
      
      const result = await chatService.sendMessageStream(
        content,
        selectedModel,
        conversationId,
        (chunk, msgId, done, data) => {
          if (data?.conversationId) {
            streamConversationId = data.conversationId;
            setConversationId(data.conversationId);
          }
          setMessages(prev => prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, content: chunk, isStreaming: !done } 
              : msg
          ));
        }
      );
      
      console.log('Stream result:', result);

      if (result.success) {
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, isStreaming: false } 
            : msg
        ));

        const currentConvId = streamConversationId || conversationId;
        if (!currentConvId) return;
        
        const title = messages[0]?.content.slice(0, 50) + (messages[0]?.content.length > 50 ? '...' : '') || 'New Chat';
        const updatedMessages = messages.map(m => 
          m.id === streamingMessageId 
            ? { ...m, isStreaming: false } 
            : m
        );
        
        setConversations(prev => {
          const exists = prev.find(c => c.id === currentConvId);
          if (exists) {
            return prev.map(c => c.id === currentConvId ? {
              ...c,
              title,
              timestamp: new Date(),
              messageCount: updatedMessages.length,
              messages: updatedMessages
            } : c);
          }
          return [{
            id: currentConvId,
            title,
            timestamp: new Date(),
            messageCount: updatedMessages.length,
            messages: updatedMessages
          }, ...prev].slice(0, 20);
        });
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== streamingMessageId));
        const errorMessage = {
          id: uuidv4(),
          role: 'system',
          content: `Error: ${result.error || 'Failed to get response'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.id !== streamingMessageId));
      const errorMessage = {
        id: uuidv4(),
        role: 'system',
        content: 'Error: Failed to connect to server. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamedContent('');
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
    setConversations(prevConversations => {
      if (conversationId && messages.length > 0) {
        const title = messages[0].content.slice(0, 50) + (messages[0].content.length > 50 ? '...' : '');
        const exists = prevConversations.find(c => c.id === conversationId);
        
        if (exists) {
          return prevConversations.map(c => c.id === conversationId ? {
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
        }, ...prevConversations].slice(0, 20);
      }
      return prevConversations;
    });
    
    setMessages([]);
    setConversationId(null);
    textareaRef.current?.focus();
  };

  const handleLoadConversation = (conv) => {
    setConversations(prevConversations => {
      if (conversationId && messages.length > 0 && conversationId !== conv.id) {
        const title = messages[0].content.slice(0, 50) + (messages[0].content.length > 50 ? '...' : '');
        const exists = prevConversations.find(c => c.id === conversationId);
        if (exists) {
          return prevConversations.map(c => c.id === conversationId ? {
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
        }, ...prevConversations].slice(0, 20);
      }
      return prevConversations;
    });
    
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

  const handleImportConversations = useCallback((importedConversations) => {
    setConversations(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const newConversations = importedConversations.filter(
        c => !existingIds.has(c.id)
      );
      return [...newConversations, ...prev].slice(0, 20);
    });
  }, []);

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

  // Search helper functions
  const highlightMatch = (text, query) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const getMatchPreview = (conv, query) => {
    const queryLower = query.toLowerCase();
    
    // Search in messages for preview
    if (conv.messages) {
      for (const msg of conv.messages) {
        if (msg.content.toLowerCase().includes(queryLower)) {
          const content = msg.content;
          const index = content.toLowerCase().indexOf(queryLower);
          const start = Math.max(0, index - 30);
          const end = Math.min(content.length, index + query.length + 30);
          let preview = content.slice(start, end);
          
          if (start > 0) preview = '...' + preview;
          if (end < content.length) preview = preview + '...';
          
          return preview;
        }
      }
    }
    
    return '';
  };

  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

        {/* Search Input */}
        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 pl-10 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200 transition-colors"
            />
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {filteredConversations.length} result{filteredConversations.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredConversations.length === 0 ? (
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
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleLoadConversation(conv)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadConversation(conv)}
                  role="button"
                  tabIndex={0}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 group relative cursor-pointer ${
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
                      {highlightMatch(conv.title, searchQuery)}
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
                  {searchQuery && conv.messages && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {getMatchPreview(conv, searchQuery)}
                    </div>
                  )}
                  
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
                </div>
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
              <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          
          {/* Export/Import Button */}
          <button
            onClick={() => setExportImportOpen(true)}
            className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Export / Import
          </button>
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

            {/* Settings Button */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Settings"
            >
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
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

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        availableModels={availableModels}
        fontSize={fontSize}
        setFontSize={setFontSize}
        compactMode={compactMode}
        setCompactMode={setCompactMode}
        streamingEnabled={streamingEnabled}
        setStreamingEnabled={setStreamingEnabled}
      />

      {/* Export/Import Panel */}
      <ExportImportPanel
        isOpen={exportImportOpen}
        onClose={() => setExportImportOpen(false)}
        conversations={conversations}
        onImportConversations={handleImportConversations}
      />
    </div>
  );
};

export default ChatWindow;