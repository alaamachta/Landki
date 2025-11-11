import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, message, consentForward, userAgent } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!consentForward) {
      return res.status(400).json({ error: 'Consent is required' });
    }

    logger.logFeedback({
      name: name || 'Anonymous',
      message: message.trim(),
      consentForward,
      userAgent: userAgent || req.get('User-Agent'),
    });

    res.json({ success: true, message: 'Feedback received' });
  } catch (error) {
    logger.error('Feedback endpoint error', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

export default router;
