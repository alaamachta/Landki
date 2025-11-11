import { ChatKit, useChatKit } from '@openai/chatkit-react'

export default function App() {
  const { control } = useChatKit({
    api: {
      async getClientSecret(existing) {
        // For production, implement session refresh
        if (existing) {
          return existing
        }

        // Create a new session via our backend API
        // In production, the path includes /interview/ prefix due to base href
        const apiPath = import.meta.env.MODE === 'production' 
          ? '/interview/api/chatkit/session'
          : '/api/chatkit/session'
        
        const response = await fetch(apiPath, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to create session: ${response.statusText}`)
        }

        const { client_secret } = await response.json()
        return client_secret
      },
    },
  })

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <ChatKit control={control} className="h-full w-full" />
    </div>
  )
}
