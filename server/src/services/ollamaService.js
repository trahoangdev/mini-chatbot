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
      return { success: true, models: response.data.models };
    } catch (error) {
      return { 
        success: false, 
        error: 'Cannot connect to Ollama. Please ensure Ollama is running.' 
      };
    }
  }

  async listModels() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      return { 
        success: true, 
        models: response.data.models?.map(m => m.name) || [] 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async generateResponse(message, model = this.model, conversationHistory = []) {
    try {
      // Build messages array from conversation history
      const messages = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add current message
      messages.push({ role: 'user', content: message });

      const response = await axios.post(
        `${this.baseURL}/api/chat`,
        {
          model: model,
          messages: messages,
          stream: false
        },
        { timeout: 60000 } // 60 second timeout for LLM response
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
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Failed to generate response'
      };
    }
  }

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
          timeout: 60000
        }
      );

      let fullResponse = '';

      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message && data.message.content) {
              fullResponse += data.message.content;
              onData(data.message.content, fullResponse, data.done);
            }
          } catch (e) {
            // Ignore non-JSON lines
          }
        }
      });

      return new Promise((resolve, reject) => {
        response.data.on('end', () => {
          resolve({ success: true, response: fullResponse, model, done: true });
        });

        response.data.on('error', (error) => {
          reject({ success: false, error: error.message });
        });
      });
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message || 'Failed to generate response'
      };
    }
  }
}

export default new OllamaService();
