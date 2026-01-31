import axios from 'axios';
import ollamaService from '../src/services/ollamaService.js';

jest.mock('axios');

describe('OllamaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkConnection', () => {
    it('should return success when Ollama is reachable', async () => {
      axios.get.mockResolvedValue({
        data: { models: [{ name: 'llama2' }, { name: 'mistral' }] }
      });

      const result = await ollamaService.checkConnection();

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('models');
      expect(result.models).toHaveLength(2);
    });

    it('should return failure when Ollama is not reachable', async () => {
      axios.get.mockRejectedValue(new Error('Connection refused'));

      const result = await ollamaService.checkConnection();

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });
  });

  describe('listModels', () => {
    it('should return list of models', async () => {
      axios.get.mockResolvedValue({
        data: {
          models: [
            { name: 'llama2' },
            { name: 'mistral' },
            { name: 'codellama' }
          ]
        }
      });

      const result = await ollamaService.listModels();

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('models');
      expect(result.models).toEqual(['llama2', 'mistral', 'codellama']);
    });

    it('should return empty array if no models', async () => {
      axios.get.mockResolvedValue({ data: {} });

      const result = await ollamaService.listModels();

      expect(result).toHaveProperty('success', true);
      expect(result.models).toEqual([]);
    });

    it('should handle errors', async () => {
      axios.get.mockRejectedValue(new Error('API error'));

      const result = await ollamaService.listModels();

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error', 'API error');
    });
  });

  describe('generateResponse', () => {
    it('should generate response successfully', async () => {
      axios.post.mockResolvedValue({
        data: {
          message: { content: 'Hello! How can I help you?' },
          done: true
        }
      });

      const result = await ollamaService.generateResponse('Hello');

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('response', 'Hello! How can I help you?');
      expect(result).toHaveProperty('model', 'llama2');
      expect(result).toHaveProperty('done', true);
    });

    it('should use custom model when provided', async () => {
      axios.post.mockResolvedValue({
        data: {
          message: { content: 'Response from mistral' },
          done: true
        }
      });

      const result = await ollamaService.generateResponse('Hello', 'mistral');

      expect(result).toHaveProperty('success', true);
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ model: 'mistral' }),
        expect.any(Object)
      );
    });

    it('should send conversation history', async () => {
      axios.post.mockResolvedValue({
        data: {
          message: { content: 'Response' },
          done: true
        }
      });

      const history = [
        { role: 'user', content: 'First message' },
        { role: 'assistant', content: 'First response' }
      ];

      await ollamaService.generateResponse('Third message', 'llama2', history);

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          messages: [
            { role: 'user', content: 'First message' },
            { role: 'assistant', content: 'First response' },
            { role: 'user', content: 'Third message' }
          ]
        }),
        expect.any(Object)
      );
    });

    it('should handle invalid response', async () => {
      axios.post.mockResolvedValue({ data: {} });

      const result = await ollamaService.generateResponse('Hello');

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error', 'Invalid response from Ollama');
    });

    it('should handle API errors', async () => {
      const error = new Error('API error');
      error.response = { data: { error: 'Model not found' } };
      axios.post.mockRejectedValue(error);

      const result = await ollamaService.generateResponse('Hello');

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error', 'Model not found');
    });
  });
});
