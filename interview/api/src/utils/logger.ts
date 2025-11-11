import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), '../_logs');

export const logger = {
  info: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level: 'INFO', message, ...meta };
    console.log(JSON.stringify(logEntry));
  },

  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = { 
      timestamp, 
      level: 'ERROR', 
      message, 
      error: error?.message || error,
      stack: error?.stack 
    };
    console.error(JSON.stringify(logEntry));
  },

  warn: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level: 'WARN', message, ...meta };
    console.warn(JSON.stringify(logEntry));
  },

  logFeedback: (feedback: {
    name?: string;
    message: string;
    consentForward: boolean;
    userAgent?: string;
  }) => {
    try {
      if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
      }

      const feedbackPath = path.join(LOG_DIR, 'feedback.jsonl');
      const timestamp = new Date().toISOString();
      const entry = JSON.stringify({ timestamp, ...feedback });
      
      fs.appendFileSync(feedbackPath, entry + '\n', 'utf8');
      logger.info('Feedback logged', { name: feedback.name || 'anonymous' });
    } catch (error) {
      logger.error('Failed to log feedback', error);
      throw error;
    }
  },

  logChatSession: (session: {
    conversationId?: string;
    messageCount: number;
    tokens?: number;
    duration: number;
  }) => {
    try {
      if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
      }

      const sessionPath = path.join(LOG_DIR, 'chat-sessions.jsonl');
      const timestamp = new Date().toISOString();
      const entry = JSON.stringify({ timestamp, ...session });
      
      fs.appendFileSync(sessionPath, entry + '\n', 'utf8');
    } catch (error) {
      logger.error('Failed to log chat session', error);
    }
  }
};
