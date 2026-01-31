import axios from 'axios';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'llama2';

class OllamaService {
  constructor() {
    this.baseURL = OLLAMA_BASE_URL;
    this.model = DEFAULT_MODEL;
  }

  async checkConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, { timeout: 5000 });
      return { 
        success: true, 
        models: response.data.models,
        connected: true 
      };
    } catch (error) {
      let errorMessage = 'Cannot connect to Ollama. Please ensure Ollama is running.';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = `Cannot connect to Ollama at ${this.baseURL}. Please start Ollama.`;
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        errorMessage = 'Connection to Ollama timed out. Please check if Ollama is responsive.';
      }
      
      return { 
        success: false, 
        error: errorMessage,
        connected: false
      };
    }
  },

  async listModels() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, { timeout: 10000 });
      return { 
        success: true, 
        models: response.data.models?.map(m => m.name) || [],
        connected: true
      };
    } catch (error) {
      let errorMessage = error.message;
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Ollama API endpoint not found. Please update Ollama to latest version.';
        } else {
          errorMessage = error.response.data?.error || `Ollama API error: ${error.response.status}`;
        }
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = `Cannot connect to Ollama at ${this.baseURL}.`;
      }
      
      return { success: false, error: errorMessage, connected: false };
    }
  },

  async generateResponse(message, model = this.model, conversationHistory = []) {
    try {
      const messages = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      messages.push({ role: 'user', content: message });

      const response = await axios.post(
        `${this.baseURL}/api/chat`,
        {
          model: model,
          messages: messages,
          stream: false
        },
        { timeout: 180000 }
      );

      if (response.data && response.data.message) {
        return {
          success: true,
          response: response.data.message.content,
          model: model,
          done: response.data.done
        };
      }

      return { success: false, error: 'Invalid response from Ollama' };
    } catch (error) {
      console.error('Ollama API Error:', error.message);
      
      let errorMessage = 'Failed to generate response';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Ollama API endpoint not found. Please check Ollama version.';
        } else if (error.response.status === 500) {
          errorMessage = error.response.data?.error || 'Ollama server error';
        } else {
          errorMessage = error.response.data?.error || error.message;
        }
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = `Cannot connect to Ollama at ${this.baseURL}. Please start Ollama.`;
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  },

  async generateStreamResponse(message, model = this.model, conversationHistory = [], onData) {
    try {
      const messages = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      messages.push({ role: 'user', content: message });

      const response = await axios.post(
        `${this.baseURL}/api/chat`,
        {
          model: model,
          messages: messages,
          stream: true
        },
        {
          responseType: 'stream',
          timeout: 180000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      let fullResponse = '';
      let buffer = '';

      return new Promise((resolve, reject) => {
        let hasError = false;

        response.data.on('data', (chunk) => {
          if (hasError) return;
          
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim() || line.startsWith(':')) continue;
            
            try {
              const data = JSON.parse(line);
              if (data.message && data.message.content) {
                fullResponse += data.message.content;
                onData(data.message.content, fullResponse, data.done || false);
              }
              
              if (data.error) {
                hasError = true;
                reject({ success: false, error: data.error });
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        });

        response.data.on('end', () => {
          if (hasError) return;
          
          if (buffer.trim()) {
            try {
              const data = JSON.parse(buffer);
              if (data.message && data.message.content) {
                fullResponse += data.message.content;
                onData(data.message.content, fullResponse, true);
              }
            } catch (e) {
              // Ignore
            }
          }
          resolve({ success: true, response: fullResponse, model, done: true });
        });

        response.data.on('error', (error) => {
          if (!hasError) {
            hasError = true;
            reject({ success: false, error: error.message });
          }
        });

        response.data.on('close', () => {
          if (!hasError && buffer.trim()) {
            try {
              const data = JSON.parse(buffer);
              if (data.message && data.message.content) {
                fullResponse += data.message.content;
                onData(data.message.content, fullResponse, true);
              }
            } catch (e) {
              // Ignore
            }
          }
        });
      });
    } catch (error) {
      let errorMessage = 'Failed to generate response';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Ollama API endpoint not found. Please check Ollama version.';
        } else if (error.response.status === 500) {
          errorMessage = error.response.data?.error || 'Ollama server error';
        } else {
          errorMessage = error.response.data?.error || `HTTP error: ${error.response.status}`;
        }
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = `Cannot connect to Ollama at ${this.baseURL}`;
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Ollama may be overloaded.';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }
}

export default new OllamaService();
