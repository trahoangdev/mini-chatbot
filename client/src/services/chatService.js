import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

const chatService = {
  async checkHealth() {
    try {
      const response = await axios.get(`${API_URL}/chat/health`);
      return response.data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getModels() {
    try {
      const response = await axios.get(`${API_URL}/chat/models`);
      return response.data;
    } catch (error) {
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
