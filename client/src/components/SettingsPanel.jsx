import React, { useState, useEffect } from 'react';

const SettingsPanel = ({ 
  isOpen, 
  onClose, 
  darkMode, 
  setDarkMode,
  selectedModel,
  setSelectedModel,
  availableModels,
  fontSize,
  setFontSize,
  compactMode,
  setCompactMode,
  streamingEnabled,
  setStreamingEnabled
}) => {
  const [localSettings, setLocalSettings] = useState({
    darkMode,
    fontSize,
    compactMode,
    streamingEnabled
  });

  useEffect(() => {
    setLocalSettings({
      darkMode,
      fontSize,
      compactMode,
      streamingEnabled
    });
  }, [darkMode, fontSize, compactMode, streamingEnabled]);

  const handleSave = () => {
    setDarkMode(localSettings.darkMode);
    setFontSize(localSettings.fontSize);
    setCompactMode(localSettings.compactMode);
    setStreamingEnabled(localSettings.streamingEnabled);
    
    // Save to localStorage
    localStorage.setItem('settings', JSON.stringify(localSettings));
    onClose();
  };

  const handleReset = () => {
    setLocalSettings({
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      fontSize: 'medium',
      compactMode: false,
      streamingEnabled: true
    });
  };

  if (!isOpen) return null;

  const fontSizeOptions = [
    { value: 'small', label: 'Small', description: '12px' },
    { value: 'medium', label: 'Medium', description: '14px' },
    { value: 'large', label: 'Large', description: '16px' },
    { value: 'xlarge', label: 'Extra Large', description: '18px' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          {/* Appearance Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Appearance
            </h3>
            
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between py-2">
              <div className="pr-4">
                <p className="font-medium text-slate-800 dark:text-slate-200">Dark Mode</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Use dark theme for the interface
                </p>
              </div>
              <button
                onClick={() => setLocalSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${
                  localSettings.darkMode ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                role="switch"
                aria-checked={localSettings.darkMode}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${
                    localSettings.darkMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <p className="font-medium text-slate-800 dark:text-slate-200">Font Size</p>
              <div className="grid grid-cols-4 gap-2">
                {fontSizeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setLocalSettings(prev => ({ ...prev, fontSize: option.value }))}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      localSettings.fontSize === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Compact Mode */}
            <div className="flex items-center justify-between py-2">
              <div className="pr-4">
                <p className="font-medium text-slate-800 dark:text-slate-200">Compact Mode</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Reduce spacing for more messages
                </p>
              </div>
              <button
                onClick={() => setLocalSettings(prev => ({ ...prev, compactMode: !prev.compactMode }))}
                className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${
                  localSettings.compactMode ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                role="switch"
                aria-checked={localSettings.compactMode}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${
                    localSettings.compactMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Chat Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Chat
            </h3>

            {/* Streaming */}
            <div className="flex items-center justify-between py-2">
              <div className="pr-4">
                <p className="font-medium text-slate-800 dark:text-slate-200">Streaming Responses</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Show AI responses in real-time
                </p>
              </div>
              <button
                onClick={() => setLocalSettings(prev => ({ ...prev, streamingEnabled: !prev.streamingEnabled }))}
                className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${
                  localSettings.streamingEnabled ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                role="switch"
                aria-checked={localSettings.streamingEnabled}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform ${
                    localSettings.streamingEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Model Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Default Model
            </h3>
            
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200"
            >
              {availableModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              About
            </h3>
            
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <p className="font-medium text-slate-800 dark:text-slate-200">
                Local Chatbot
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Version 1.0.0
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                AI-powered chat interface for local models
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Reset to Default
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;