import { Router, Request, Response } from 'express';
import { streamChatCompletion } from '../utils/openai.js';
import { logger } from '../utils/logger.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const { message, conversationId, locale } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let tokenCount = 0;

  try {
    await streamChatCompletion({
      message: message.trim(),
      conversationId,
      locale: locale || 'de-DE',
      onToken: (token: string) => {
        tokenCount++;
        res.write(`data: ${JSON.stringify({ content: token })}\n\n`);
      },
      onComplete: (suggestions: string[]) => {
        if (suggestions.length > 0) {
          res.write(`data: ${JSON.stringify({ suggestions })}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();

        // Log session
        const duration = Date.now() - startTime;
        logger.logChatSession({
          conversationId,
          messageCount: 1,
          tokens: tokenCount,
          duration,
        });
      },
      onError: (error: Error) => {
        logger.error('Chat stream error', error);
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      },
    });
  } catch (error) {
    logger.error('Chat endpoint error', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

export default router;
