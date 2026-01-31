import { Router } from 'express';
import { chatController } from '../controllers/chatController.js';

const router = Router();

router.get('/health', chatController.checkHealth);
router.get('/models', chatController.listModels);
router.post('/message', chatController.sendMessage);
router.post('/message/stream', chatController.sendMessageStream);
router.get('/conversation/:id', chatController.getConversation);
router.delete('/conversation/:id', chatController.clearConversation);

export default router;
