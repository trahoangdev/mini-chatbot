import ollamaService from '../services/ollamaService.js';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for conversations (in production, use a database)
const conversations = new Map();

export const chatController = {
  async checkHealth(req, res) {
    const result = await ollamaService.checkConnection();
    res.json(result);
  },

  async listModels(req, res) {
    const result = await ollamaService.listModels();
    res.json(result);
  },

  async sendMessage(req, res) {
    try {
      const { message, model, conversationId } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Message is required' 
        });
      }

      // Get or create conversation
      let conversation;
      if (conversationId && conversations.has(conversationId)) {
        conversation = conversations.get(conversationId);
      } else {
        conversation = {
          id: uuidv4(),
          messages: [],
          createdAt: new Date(),
          model: model || process.env.DEFAULT_MODEL || 'llama2'
        };
      }

      // Add user message to conversation
      conversation.messages.push({
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      // Generate response from Ollama
      const result = await ollamaService.generateResponse(
        message,
        conversation.model,
        conversation.messages
      );

      if (!result.success) {
        return res.status(500).json(result);
      }

      // Add assistant response to conversation
      const assistantMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date()
      };
      conversation.messages.push(assistantMessage);

      // Save conversation
      conversations.set(conversation.id, conversation);

      // Clean up old conversations (keep last 100)
      if (conversations.size > 100) {
        const oldestKey = conversations.keys().next().value;
        conversations.delete(oldestKey);
      }

      res.json({
        success: true,
        conversationId: conversation.id,
        message: assistantMessage,
        model: result.model
      });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to process message' 
      });
    }
  },

  async getConversation(req, res) {
    try {
      const { id } = req.params;
      const conversation = conversations.get(id);

      if (!conversation) {
        return res.status(404).json({ 
          success: false, 
          error: 'Conversation not found' 
        });
      }

      res.json({
        success: true,
        conversation
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to retrieve conversation' 
      });
    }
  },

  async clearConversation(req, res) {
    try {
      const { id } = req.params;
      
      if (conversations.has(id)) {
        conversations.delete(id);
      }

      res.json({
        success: true,
        message: 'Conversation cleared'
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to clear conversation' 
      });
    }
  }
};
