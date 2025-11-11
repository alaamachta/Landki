import { Router, Request, Response } from 'express';

const router = Router();

const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY || '';
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || '';

// Speech-to-Text endpoint
router.post('/stt', async (req: Request, res: Response) => {
  if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
    return res.status(501).json({ 
      error: 'Speech-to-Text not configured',
      message: 'Azure Speech credentials are not set'
    });
  }

  // TODO: Implement Azure STT proxy
  res.status(501).json({ error: 'STT endpoint not yet implemented' });
});

// Text-to-Speech endpoint
router.post('/tts', async (req: Request, res: Response) => {
  if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
    return res.status(501).json({ 
      error: 'Text-to-Speech not configured',
      message: 'Azure Speech credentials are not set'
    });
  }

  // TODO: Implement Azure TTS proxy
  res.status(501).json({ error: 'TTS endpoint not yet implemented' });
});

export default router;
