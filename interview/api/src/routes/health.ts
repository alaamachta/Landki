import { Router, Request, Response } from 'express';

const router = Router();

const VERSION = '1.0.0';
const BUILD_TIME = new Date().toISOString();

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    version: VERSION,
    buildTime: BUILD_TIME,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
