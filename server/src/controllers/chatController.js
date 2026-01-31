import ollamaService from '../services/ollamaService.js';
import { v4 as uuidv4 } from 'uuid';

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

      conversation.messages.push({
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      const result = await ollamaService.generateResponse(
        message,
        conversation.model,
        conversation.messages
      );

      if (!result.success) {
        return res.status(500).json(result);
      }

      const assistantMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date()
      };
      conversation.messages.push(assistantMessage);

      conversations.set(conversation.id, conversation);

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

  async sendMessageStream(req, res) {
    try {
      const { message, model, conversationId } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Message is required' 
        });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

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

      conversation.messages.push({
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date()
      });

      let fullResponse = '';
      let assistantMessageId = uuidv4();

      const result = await ollamaService.generateStreamResponse(
        message,
        conversation.model,
        conversation.messages,
        (chunk, partialResponse, done) => {
          fullResponse = partialResponse;
          res.write(`data: ${JSON.stringify({ 
            success: true, 
            chunk: chunk,
            conversationId: conversation.id,
            messageId: assistantMessageId,
            done: done
          })}\n\n`);
        }
      );

      if (!result.success) {
        res.write(`data: ${JSON.stringify({ 
          success: false, 
          error: result.error 
        })}\n\n`);
        res.end();
        return;
      }

      const assistantMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date()
      };
      conversation.messages.push(assistantMessage);

      conversations.set(conversation.id, conversation);

      if (conversations.size > 100) {
        const oldestKey = conversations.keys().next().value;
        conversations.delete(oldestKey);
      }

      res.write(`data: ${JSON.stringify({ 
        success: true, 
        conversationId: conversation.id,
        done: true 
      })}\n\n`);
      
      res.end();
    } catch (error) {
      console.error('Stream error:', error);
      try {
        res.write(`data: ${JSON.stringify({ 
          success: false, 
          error: 'Failed to process message' 
        })}\n\n`);
      } catch (e) {
        // Ignore if response already closed
      }
      try {
        res.end();
      } catch (e) {
        // Ignore
      }
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
