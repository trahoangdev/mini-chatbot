import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import chatRoutes from '../src/routes/chat.js';
import ollamaService from '../src/services/ollamaService.js';

jest.mock('../src/services/ollamaService.js');

const createApp = () => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.get('/health', (req, res) => {
    res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
  });
  app.use('/api/v1/chat', chatRoutes);
  app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });
  app.use((err, req, res, next) => {
    res.status(500).json({ success: false, error: err.message });
  });
  return app;
};

describe('Server Health Check', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /health', () => {
    it('should return server health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Server is running');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/v1/chat/health', () => {
    it('should return chat health status', async () => {
      ollamaService.checkConnection.mockResolvedValue({ success: true, message: 'Connected' });

      const response = await request(app)
        .get('/api/v1/chat/health')
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });
  });

  describe('POST /api/v1/chat/message', () => {
    it('should return 400 if message is missing', async () => {
      const response = await request(app)
        .post('/api/v1/chat/message')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Message is required');
    });

    it('should return 400 if message is empty string', async () => {
      const response = await request(app)
        .post('/api/v1/chat/message')
        .send({ message: '   ' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Message is required');
    });

    it('should create a new conversation and return message', async () => {
      ollamaService.generateResponse.mockResolvedValue({
        success: true,
        response: 'Hello! How can I help you?',
        model: 'llama2'
      });

      const response = await request(app)
        .post('/api/v1/chat/message')
        .send({ message: 'Hello' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('conversationId');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toHaveProperty('role', 'assistant');
      expect(response.body.message).toHaveProperty('content');
    });

    it('should continue existing conversation', async () => {
      ollamaService.generateResponse.mockResolvedValue({
        success: true,
        response: 'I understand',
        model: 'llama2'
      });

      const firstResponse = await request(app)
        .post('/api/v1/chat/message')
        .send({ message: 'First message' })
        .expect(200);

      const conversationId = firstResponse.body.conversationId;

      const secondResponse = await request(app)
        .post('/api/v1/chat/message')
        .send({ message: 'Second message', conversationId })
        .expect(200);

      expect(secondResponse.body.conversationId).toBe(conversationId);
    });
  });

  describe('GET /api/v1/chat/conversation/:id', () => {
    it('should return 404 for non-existent conversation', async () => {
      const response = await request(app)
        .get('/api/v1/chat/conversation/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Conversation not found');
    });

    it('should return conversation by id', async () => {
      ollamaService.generateResponse.mockResolvedValue({
        success: true,
        response: 'Test response',
        model: 'llama2'
      });

      const createResponse = await request(app)
        .post('/api/v1/chat/message')
        .send({ message: 'Test message' })
        .expect(200);

      const conversationId = createResponse.body.conversationId;

      const getResponse = await request(app)
        .get(`/api/v1/chat/conversation/${conversationId}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('success', true);
      expect(getResponse.body).toHaveProperty('conversation');
      expect(getResponse.body.conversation.id).toBe(conversationId);
      expect(getResponse.body.conversation.messages).toBeInstanceOf(Array);
    });
  });

  describe('DELETE /api/v1/chat/conversation/:id', () => {
    it('should return success when clearing conversation', async () => {
      ollamaService.generateResponse.mockResolvedValue({
        success: true,
        response: 'Test response',
        model: 'llama2'
      });

      const createResponse = await request(app)
        .post('/api/v1/chat/message')
        .send({ message: 'Test message to clear' })
        .expect(200);

      const conversationId = createResponse.body.conversationId;

      const clearResponse = await request(app)
        .delete(`/api/v1/chat/conversation/${conversationId}`)
        .expect(200);

      expect(clearResponse.body).toHaveProperty('success', true);
      expect(clearResponse.body).toHaveProperty('message', 'Conversation cleared');
    });

    it('should return success even if conversation does not exist', async () => {
      const response = await request(app)
        .delete('/api/v1/chat/conversation/already-deleted-id')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/v1/chat/models', () => {
    it('should return models list', async () => {
      ollamaService.listModels.mockResolvedValue({
        success: true,
        models: ['llama2', 'mistral']
      });

      const response = await request(app)
        .get('/api/v1/chat/models')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('models');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/v1/unknown-route')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Route not found');
    });
  });
});
