import React, { useState } from 'react';

const ExportImportPanel = ({ 
  isOpen, 
  onClose, 
  conversations,
  onImportConversations
}) => {
  const [exportFormat, setExportFormat] = useState('json');
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState(null);

  if (!isOpen) return null;

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedConversations([]);
    } else {
      setSelectedConversations(conversations.map(c => c.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectConversation = (id) => {
    if (selectedConversations.includes(id)) {
      setSelectedConversations(prev => prev.filter(convId => convId !== id));
      setSelectAll(false);
    } else {
      setSelectedConversations(prev => [...prev, id]);
    }
  };

  const handleExport = () => {
    const conversationsToExport = selectedConversations.length > 0
      ? conversations.filter(c => selectedConversations.includes(c.id))
      : conversations;

    let content, filename, type;

    if (exportFormat === 'json') {
      content = JSON.stringify(conversationsToExport, null, 2);
      filename = `conversations-${new Date().toISOString().split('T')[0]}.json`;
      type = 'application/json';
    } else if (exportFormat === 'markdown') {
      content = conversationsToExport.map(conv => {
        return `# ${conv.title}\n\n` +
          `Date: ${new Date(conv.timestamp).toLocaleString()}\n\n` +
          (conv.messages || []).map(msg => 
            `**${msg.role}:** ${msg.content}`
          ).join('\n\n') + 
          '\n\n---\n\n';
      }).join('\n\n');
      filename = `conversations-${new Date().toISOString().split('T')[0]}.md`;
      type = 'text/markdown';
    } else if (exportFormat === 'csv') {
      const headers = 'Title,Date,Messages,First Message\n';
      const rows = conversationsToExport.map(conv => {
        const firstMessage = conv.messages?.[0]?.content?.slice(0, 100) || '';
        return `"${conv.title}","${new Date(conv.timestamp).toISOString()}",${conv.messageCount || conv.messages?.length || 0},"${firstMessage.replace(/"/g, '""')}"`;
      }).join('\n');
      content = headers + rows;
      filename = `conversations-${new Date().toISOString().split('T')[0]}.csv`;
      type = 'text/csv';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      setImportStatus(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setImportStatus({ type: 'error', message: 'Please select a file first' });
      return;
    }

    try {
      const text = await importFile.text();
      let importedConversations;

      if (importFile.name.endsWith('.json')) {
        importedConversations = JSON.parse(text);
        
        if (!Array.isArray(importedConversations)) {
          throw new Error('Invalid JSON format');
        }
      } else {
        setImportStatus({ type: 'error', message: 'Please select a JSON file' });
        return;
      }

      // Validate and transform imported conversations
      const validConversations = importedConversations.map(conv => ({
        id: conv.id || crypto.randomUUID(),
        title: conv.title || 'Imported Chat',
        timestamp: conv.timestamp || new Date().toISOString(),
        messageCount: conv.messageCount || conv.messages?.length || 0,
        messages: conv.messages || []
      }));

      onImportConversations(validConversations);
      setImportStatus({ type: 'success', message: `Successfully imported ${validConversations.length} conversations` });
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setImportStatus({ type: 'error', message: `Failed to import: ${error.message}` });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            Export / Import Conversations
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
          {/* Export Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Export Conversations
            </h3>
            
            {/* Select Conversations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedConversations.length} of {conversations.length} selected
                </p>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  {selectAll ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              
              <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                {conversations.slice(0, 10).map(conv => (
                  <label
                    key={conv.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedConversations.includes(conv.id)}
                      onChange={() => handleSelectConversation(conv.id)}
                      className="w-4 h-4 text-blue-500 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1">
                      {conv.title}
                    </span>
                    <span className="text-xs text-slate-400">
                      {conv.messageCount || conv.messages?.length || 0} msgs
                    </span>
                  </label>
                ))}
                {conversations.length > 10 && (
                  <p className="text-xs text-slate-500 text-center py-2">
                    +{conversations.length - 10} more conversations
                  </p>
                )}
              </div>
            </div>

            {/* Export Format */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Export Format
              </p>
              <div className="grid grid-cols-3 gap-2">
                {['json', 'markdown', 'csv'].map(format => (
                  <button
                    key={format}
                    onClick={() => setExportFormat(format)}
                    className={`px-4 py-2 rounded-lg text-sm capitalize transition-all ${
                      exportFormat === format
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={conversations.length === 0}
              className="w-full py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export {selectedConversations.length > 0 ? `${selectedConversations.length} ` : ''}Conversations
            </button>
          </div>

          {/* Import Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Import Conversations
            </h3>
            
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-blue-500 hover:text-blue-600">Click to upload</span> or drag and drop
                </div>
                <p className="text-xs text-slate-400">JSON files only</p>
              </label>
            </div>

            {importFile && (
              <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {importFile.name}
                  </span>
                </div>
                <button
                  onClick={() => setImportFile(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {importStatus && (
              <div className={`p-3 rounded-lg text-sm ${
                importStatus.type === 'error' 
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                  : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
              }`}>
                {importStatus.message}
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={!importFile}
              className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Conversations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportImportPanel;