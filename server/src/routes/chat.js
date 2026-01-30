import { Router } from 'express';
import { chatController } from '../controllers/chatController.js';

const router = Router();

// Health check
router.get('/health', chatController.checkHealth);

// List available models
router.get('/models', chatController.listModels);

// Send message
router.post('/message', chatController.sendMessage);

// Get conversation history
router.get('/conversation/:id', chatController.getConversation);

// Clear conversation
router.delete('/conversation/:id', chatController.clearConversation);

export default router;
