import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MessageList = ({ messages, darkMode }) => {
  const [copiedId, setCopiedId] = useState(null);

  const lightTheme = {
    'code[class*="language-"]': {
      color: '#1e293b',
      background: 'none',
      fontFamily: '"JetBrains Mono", Consolas, Monaco, "Andale Mono", monospace',
      fontSize: '14px',
      textAlign: 'left',
      whiteSpace: 'pre',
      wordSpacing: 'normal',
      wordBreak: 'normal',
      wordWrap: 'normal',
      lineHeight: '1.7',
      tabSize: '4',
      hyphens: 'none',
    },
    'pre[class*="language-"]': {
      color: '#1e293b',
      background: '#fafafa',
      fontFamily: '"JetBrains Mono", Consolas, Monaco, "Andale Mono", monospace',
      fontSize: '14px',
      textAlign: 'left',
      whiteSpace: 'pre',
      wordSpacing: 'normal',
      wordBreak: 'normal',
      wordWrap: 'normal',
      lineHeight: '1.7',
      tabSize: '4',
      hyphens: 'none',
      padding: '1.25rem',
      margin: '0',
      overflow: 'auto',
    },
    'comment': { color: '#64748b', fontStyle: 'italic' },
    'prolog': { color: '#64748b', fontStyle: 'italic' },
    'doctype': { color: '#64748b', fontStyle: 'italic' },
    'cdata': { color: '#64748b', fontStyle: 'italic' },
    'punctuation': { color: '#475569' },
    'namespace': { opacity: '.7' },
    'property': { color: '#2563eb' },
    'tag': { color: '#2563eb' },
    'boolean': { color: '#2563eb' },
    'number': { color: '#2563eb' },
    'constant': { color: '#2563eb' },
    'symbol': { color: '#2563eb' },
    'deleted': { color: '#2563eb' },
    'selector': { color: '#059669' },
    'attr-name': { color: '#059669' },
    'string': { color: '#059669' },
    'char': { color: '#059669' },
    'builtin': { color: '#059669' },
    'inserted': { color: '#059669' },
    'operator': { color: '#475569' },
    'entity': { color: '#475569', cursor: 'help' },
    'url': { color: '#475569' },
    'variable': { color: '#475569' },
    'atrule': { color: '#7c3aed' },
    'attr-value': { color: '#7c3aed' },
    'keyword': { color: '#7c3aed' },
    'function': { color: '#7c3aed' },
    'class-name': { color: '#7c3aed' },
    'regex': { color: '#ea580c' },
    'important': { color: '#ea580c', fontWeight: 'bold' },
    'bold': { fontWeight: 'bold' },
    'italic': { fontStyle: 'italic' },
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const handleCopy = async (content, id) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const CodeBlock = ({ inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';
    const codeString = String(children).replace(/\n$/, '');
    
    if (!inline && match) {
      return (
        <div className={`my-4 rounded-xl overflow-hidden border shadow-lg ${darkMode ? 'border-slate-700 shadow-black/30' : 'border-slate-200 shadow-slate-200/50'}`}>
          <div className={`flex items-center justify-between px-4 py-2.5 text-xs ${darkMode ? 'bg-slate-800/90 border-b border-slate-700' : 'bg-slate-100 border-b border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400/90" />
                <span className="w-3 h-3 rounded-full bg-amber-400/90" />
                <span className="w-3 h-3 rounded-full bg-emerald-400/90" />
              </div>
              <span className={`font-mono ml-3 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {language}
              </span>
            </div>
            <button
              onClick={() => handleCopy(codeString, `code-${Math.random()}`)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all text-xs font-medium ${
                darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
          </div>
          <SyntaxHighlighter
            style={darkMode ? vscDarkPlus : lightTheme}
            language={language}
            PreTag="div"
            customStyle={{ 
              margin: 0, 
              borderRadius: 0,
              fontSize: '14px',
              lineHeight: '1.7',
              padding: '1.25rem',
              backgroundColor: darkMode ? 'var(--code-background)' : '#fafafa',
            }}
            showLineNumbers={true}
            lineNumberStyle={{
              minWidth: '2.5em',
              paddingRight: '1em',
              color: darkMode ? 'var(--contrast-muted)' : '#94a3b8',
              textAlign: 'right',
              backgroundColor: darkMode ? 'var(--code-background)' : '#fafafa',
            }}
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      );
    }
    
    return (
      <code 
        className={`px-1.5 py-0.5 rounded-md text-sm font-mono ${
          darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800'
        }`} 
        {...props}
      >
        {children}
      </code>
    );
  };

  const getMessageStyles = (role) => {
    switch (role) {
      case 'user':
        return {
          container: 'justify-end',
          bubble: darkMode 
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white' 
            : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
          icon: 'bg-gradient-to-br from-blue-500 to-blue-700',
          label: 'You',
          textColor: 'text-white',
          timeColor: darkMode ? 'text-blue-200' : 'text-blue-100',
          labelColor: darkMode ? 'text-blue-100' : 'text-blue-50'
        };
      case 'assistant':
        return {
          container: 'justify-start',
          bubble: darkMode 
            ? 'bg-slate-800/90 border border-slate-700 text-slate-100' 
            : 'bg-white border border-slate-200 text-slate-800',
          icon: darkMode 
            ? 'bg-gradient-to-br from-violet-500 to-blue-500' 
            : 'bg-gradient-to-br from-violet-500 to-blue-600',
          label: 'AI',
          textColor: darkMode ? 'text-slate-100' : 'text-slate-800',
          timeColor: darkMode ? 'text-slate-500' : 'text-slate-400',
          labelColor: darkMode ? 'text-slate-400' : 'text-slate-500'
        };
      case 'system':
        return {
          container: 'justify-center',
          bubble: darkMode 
            ? 'bg-red-500/10 border border-red-500/20 text-red-300' 
            : 'bg-red-50 border border-red-200 text-red-600',
          icon: 'bg-red-500',
          label: 'System',
          textColor: darkMode ? 'text-red-300' : 'text-red-600',
          timeColor: darkMode ? 'text-red-400/60' : 'text-red-400',
          labelColor: darkMode ? 'text-red-400' : 'text-red-500'
        };
      default:
        return {
          container: 'justify-start',
          bubble: darkMode 
            ? 'bg-slate-800 border-slate-700 text-slate-200' 
            : 'bg-white border-slate-200 text-slate-800',
          icon: 'bg-slate-500',
          label: 'Unknown',
          textColor: darkMode ? 'text-slate-200' : 'text-slate-800',
          timeColor: darkMode ? 'text-slate-500' : 'text-slate-400',
          labelColor: darkMode ? 'text-slate-400' : 'text-slate-500'
        };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="space-y-6 py-6">
        {messages.map((message, index) => {
          const styles = getMessageStyles(message.role);
          const isLast = index === messages.length - 1;
          const isAssistant = message.role === 'assistant';
          
          return (
            <div
              key={message.id}
              className={`flex ${styles.container} ${isLast ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`flex gap-3 max-w-[88%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {message.role !== 'system' && (
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${styles.icon} flex items-center justify-center shadow-lg`}>
                    {message.role === 'user' ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    )}
                  </div>
                )}
                
                <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 mb-1.5 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <span className={`text-xs font-semibold ${styles.labelColor}`}>
                      {styles.label}
                    </span>
                    <span className={`text-xs ${styles.timeColor}`}>
                      {formatTime(message.timestamp)}
                    </span>
                    {message.isStreaming && (
                      <span className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400">
                        <span className="flex gap-0.5">
                          <span className="w-1 h-1 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-1 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-1 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                        Generating...
                      </span>
                    )}
                  </div>
                  
                  <div className={`relative px-5 py-3.5 rounded-2xl shadow-sm ${styles.bubble} ${message.role === 'user' ? 'rounded-br-md shadow-blue-500/25' : message.role === 'assistant' ? 'rounded-bl-md' : ''}`}>
                    {isAssistant ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{ code: CodeBlock }}
                        className={styles.textColor}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <p className={`m-0 whitespace-pre-wrap leading-relaxed ${message.role === 'user' ? 'text-white' : darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        {message.content}
                      </p>
                    )}
                  </div>
                  
                  {isAssistant && (
                    <button
                      onClick={() => handleCopy(message.content, message.id)}
                      className={`mt-2 p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                        darkMode ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {copiedId === message.id ? (
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MessageList;