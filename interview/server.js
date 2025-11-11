import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

const WORKFLOW_ID = process.env.VITE_WORKFLOW_ID
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

app.post('/api/chatkit/session', async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY' })
    }

    if (!WORKFLOW_ID) {
      return res.status(500).json({ error: 'Missing WORKFLOW_ID' })
    }

    // Generate a unique user ID (in production, use proper session management)
    const userId = crypto.randomUUID()

    const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit_beta=v1',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        workflow: { id: WORKFLOW_ID },
        user: userId,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI API error:', error)
      return res.status(response.status).json({ error: 'Failed to create session' })
    }

    const data = await response.json()
    res.json({ client_secret: data.client_secret })
  } catch (error) {
    console.error('Session creation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`ChatKit session server running on port ${PORT}`)
})
