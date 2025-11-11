#!/usr/bin/env node
'use strict';

require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');

const app = express();
const PORT = 3101;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());

// CORS for same-origin only (landki.com)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && origin.includes('landki.com')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// ChatKit Session Endpoint
app.post('/api/chatkit/session', async (req, res) => {
  try {
    const workflowId = req.body?.workflow || process.env.CHATKIT_WORKFLOW_ID;
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!workflowId || !apiKey) {
      console.error('❌ Missing configuration');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create session using workflow deployment
    const response = await fetch(`https://api.openai.com/v1/workflows/${workflowId}/deploy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', errorText);
      
      // Fallback: create realtime session
      const fallbackResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview-2024-12-17'
        })
      });
      
      if (!fallbackResponse.ok) {
        const fallbackError = await fallbackResponse.text();
        console.error('❌ Fallback error:', fallbackError);
        return res.status(500).json({ error: 'Failed to create session', details: fallbackError });
      }
      
      const session = await fallbackResponse.json();
      console.log('✅ Realtime session created:', session.id);
      return res.json({ client_secret: session.client_secret });
    }

    const session = await response.json();
    console.log('✅ Workflow session created:', session.id || 'N/A');
    
    res.json({
      client_secret: session.client_secret || session.session?.client_secret
    });
    
  } catch (error) {
    console.error('❌ ChatKit session error:', error.message);
    res.status(500).json({ 
      error: 'Failed to create session',
      details: error.message 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'chatkit-interview', port: PORT });
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 ChatKit Interview Server running on http://127.0.0.1:${PORT}`);
  console.log(`📋 Workflow: ${process.env.CHATKIT_WORKFLOW_ID}`);
});
