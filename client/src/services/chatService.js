import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

const chatService = {
  async checkHealth() {
    try {
      const response = await axios.get(`${API_URL}/chat/health`, { timeout: 10000 });
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          return { success: false, error: 'API endpoint not found. Please check server configuration.' };
        }
        return { success: false, error: error.response.data?.error || error.message };
      } else if (error.request) {
        return { success: false, error: 'Cannot connect to server. Please ensure server is running.' };
      }
      return { success: false, error: error.message };
    }
  },

  async getModels() {
    try {
      const response = await axios.get(`${API_URL}/chat/models`, { timeout: 10000 });
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          return { success: false, error: 'Models endpoint not found.' };
        }
        return { success: false, error: error.response.data?.error || error.message };
      } else if (error.request) {
        return { success: false, error: 'Cannot connect to server.' };
      }
      return { success: false, error: error.message };
    }
  },

  async sendMessage(message, model, conversationId = null) {
    try {
      const response = await axios.post(`${API_URL}/chat/message`, {
        message,
        model,
        conversationId
      });
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  },

  async sendMessageStream(message, model, conversationId = null, onChunk) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(`${API_URL}/chat/message/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          model,
          conversationId
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';
      let messageId = null;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;
            
            try {
              const data = JSON.parse(dataStr);
              
              if (!data.success && data.error) {
                throw new Error(data.error);
              }

              if (data.messageId) {
                messageId = data.messageId;
              }

              if (data.conversationId) {
                conversationId = data.conversationId;
              }

              if (data.chunk !== undefined) {
                fullResponse += data.chunk;
                if (onChunk && !data.done) {
                  onChunk(fullResponse, messageId, data.done, data);
                }
              }

              if (data.done) {
                if (onChunk) {
                  onChunk(fullResponse, messageId, true, data);
                }
                break;
              }
            } catch (e) {
              console.warn('Failed to parse streaming data:', e.message);
            }
          }
        }
      }

      return { success: true, content: fullResponse };
    } catch (error) {
      if (error.name === 'AbortError') {
        return { 
          success: false, 
          error: 'Request timed out. Please try again.' 
        };
      }
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  async getConversation(id) {
    try {
      const response = await axios.get(`${API_URL}/chat/conversation/${id}`);
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  },

  async clearConversation(id) {
    try {
      const response = await axios.delete(`${API_URL}/chat/conversation/${id}`);
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }
};

export default chatService;
