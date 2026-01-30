import React, { useState, useRef, useEffect } from 'react';

const MessageInput = ({ onSend, isLoading, disabled, textareaRef: externalRef, darkMode }) => {
  const [message, setMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const internalRef = useRef(null);
  const textareaRef = externalRef || internalRef;
  const MAX_CHARS = 4000;

  useEffect(() => {
    setCharCount(message.length);
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading && !disabled && message.length <= MAX_CHARS) {
      onSend(message);
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 200) + 'px';
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [message, textareaRef]);

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      <div 
        className={`relative flex gap-3 items-end 
          rounded-2xl 
          border-2
          transition-all duration-200
          ${isFocused 
            ? 'border-blue-500 shadow-lg shadow-blue-500/10' 
            : 'border-transparent'
          }
          ${darkMode 
            ? 'bg-slate-800 shadow-slate-900/50' 
            : 'bg-white shadow-slate-200/50'
          }
          shadow-xl
        `}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={disabled ? "Server not connected..." : "Message AI..."}
          disabled={isLoading || disabled}
          maxLength={MAX_CHARS}
          className={`flex-1 
            bg-transparent 
            resize-none 
            outline-none 
            min-h-[56px] 
            max-h-[200px] 
            py-4 
            px-4
            text-base 
            leading-relaxed
            placeholder:text-slate-400
            ${darkMode 
              ? 'text-slate-100' 
              : 'text-slate-700'
            } 
            disabled:cursor-not-allowed`}
          rows={1}
          style={{ height: 'auto' }}
        />
        
        {/* Action Buttons */}
        <div className="flex items-center gap-1 pb-3 pr-3">
          {/* Stop Button when Loading */}
          {isLoading && (
            <button
              type="button"
              onClick={() => {/* TODO: Implement stop */}}
              className="p-2.5 rounded-xl 
                text-red-500 
                hover:bg-red-50 dark:hover:bg-red-900/20 
                transition-all duration-200
                hover:scale-105"
              title="Stop generating"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          )}
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || isLoading || disabled || message.length > MAX_CHARS}
            className={`p-3 rounded-xl transition-all duration-200 
              ${!message.trim() || isLoading || disabled || message.length > MAX_CHARS
                ? `${darkMode 
                    ? 'bg-slate-700 text-slate-500' 
                    : 'bg-slate-100 text-slate-400'
                  } cursor-not-allowed`
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105'
              }`}
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className={`flex items-center justify-between mt-3 px-1`}>
        <p className={`text-xs flex items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          <span className="hidden sm:inline-flex items-center gap-1">
            <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
              darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
            }`}>Enter</kbd>
            to send
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
          <span className="hidden sm:inline-flex items-center gap-1">
            <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
              darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
            }`}>Shift + Enter</kbd>
            for new line
          </span>
        </p>
        <p className={`text-xs transition-colors ${
          charCount > MAX_CHARS * 0.9 
            ? 'text-red-500 font-medium' 
            : darkMode ? 'text-slate-500' : 'text-slate-400'
        }`}>
          {charCount.toLocaleString()}/{MAX_CHARS.toLocaleString()}
        </p>
      </div>
    </form>
  );
};

export default MessageInput;
