// /var/www/landki/interview/frontend/src/App.jsx
import { useCallback, useEffect, useState } from 'react'
import { ChatKit, useChatKit } from '@openai/chatkit-react'
import './App.css'

const CREATE_SESSION_ENDPOINT = '/interview/api/chatkit/session'
const WORKFLOW_ID = 'wf_6910af26c670819097b24c11ebbe0b380a5bfa9945431f22'

const STARTER_PROMPTS = [
  { label: 'Welche Erfahrungen haben Sie mit KI und Machine Learning?', prompt: 'Welche Erfahrungen haben Sie mit KI und Machine Learning?' },
  { label: 'Erzählen Sie mir über Ihre wichtigsten Projekte',            prompt: 'Erzählen Sie mir über Ihre wichtigsten Projekte' },
  { label: 'Welche Technologien beherrschen Sie?',                       prompt: 'Welche Technologien beherrschen Sie?' },
]

const GREETING    = 'Hallo! Ich bin der Interview-Assistent für Alaa Mashta. Fragen Sie mich gerne über seinen beruflichen Werdegang, Projekte und Fähigkeiten.'
const PLACEHOLDER = 'Stellen Sie Ihre Frage...'

export default function App() {
  const [sessionError, setSessionError] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [debugInfo, setDebugInfo] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastAssistantReply, setLastAssistantReply] = useState('')
  const [lastUserQuestion, setLastUserQuestion] = useState('')
  const OUT_OF_SCOPE_MARKERS = [
    'außerhalb meines aktuellen Wissensbereichs',
    'keine Informationen dazu',
    'nicht in meinem aktuellen Kontext'
  ]

  // Global dark hint (hilft dem Host-Dokument)
  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-theme', 'dark')
    html.style.colorScheme = 'dark'
  }, [])

  const getClientSecret = useCallback(async (currentSecret) => {
    setDebugInfo('Erstelle Session...')
    setSessionError(null)
    if (!currentSecret) setIsInitializing(true)

    try {
      const response = await fetch(CREATE_SESSION_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow: { id: WORKFLOW_ID },
          chatkit_configuration: { file_upload: { enabled: false } }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Session creation failed: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      if (!data.client_secret) throw new Error('Missing client_secret in response')

      setDebugInfo('Session erfolgreich erstellt!')
      setIsInitializing(false)
      return data.client_secret
    } catch (error) {
      setSessionError(error.message)
      setDebugInfo(`Fehler: ${error.message}`)
      setIsInitializing(false)
      throw error
    }
  }, [])

  // ❗️Nur erlaubte Keys im Hook verwenden
  const chatkit = useChatKit({
    api: { getClientSecret },
    startScreen: {
      greeting: GREETING,
      prompts: STARTER_PROMPTS.map(p => ({ label: p.label || p.prompt, prompt: p.prompt })),
    },
    composer: {
      placeholder: PLACEHOLDER,
      attachments: { enabled: false },
    },
    onResponseEnd: () => {},
    onResponseStart: () => {},
    onThreadChange: () => {},
    onError: ({ error }) => {
      setSessionError(error?.message || 'Ein Fehler ist aufgetreten')
    },
  })

  // Feedback-Heuristik
  useEffect(() => {
    if (isInitializing) return
    const interval = setInterval(() => {
      try {
        const nodes = Array.from(document.querySelectorAll('[data-role="message"], .chatkit-message'))
        if (!nodes.length) return
        const texts = nodes.map(n => n.innerText.trim()).filter(Boolean)
        if (!texts.length) return
        const last = texts[texts.length - 1]
        if (last && last !== lastAssistantReply) {
          setLastAssistantReply(last)
          if (texts.length > 1) setLastUserQuestion(texts[texts.length - 2])
          const lower = last.toLowerCase()
          const outOfScope = OUT_OF_SCOPE_MARKERS.some(m => lower.includes(m))
          setShowFeedback(outOfScope)
        }
      } catch {}
    }, 1500)
    return () => clearInterval(interval)
  }, [isInitializing, lastAssistantReply])

  const sendFeedback = async () => {
    try {
      const payload = {
        session_id: chatkit.control?.session?.id || undefined,
        user_question: lastUserQuestion,
        assistant_reply: lastAssistantReply,
        category: 'out_of_scope',
        comment: 'Automatisch markiert (Demo)'
      }
      const res = await fetch('/interview/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(await res.text())
      setShowFeedback(false)
      setDebugInfo('Feedback gesendet. Danke!')
    } catch (e) {
      setDebugInfo('Feedback Fehler: ' + e.message)
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Interview Assistent</h1>
        <p>Stellen Sie Ihre Fragen zu meinem beruflichen Werdegang</p>
      </header>

      {sessionError && (
        <div className="error-message">
          <strong>Fehler:</strong> {sessionError}
        </div>
      )}

      <div className="chat-wrapper">
        {/* 👉 data-theme auf ChatKit Custom Element setzen */}
        <ChatKit
          control={chatkit.control}
          data-theme="dark"
          data-color-scheme="dark"
          className={isInitializing ? 'opacity-0' : 'opacity-100'}
        />

        {isInitializing && (
          <div className="loading-overlay">
            <div><strong>Lädt Chat-Assistent...</strong></div>
            {debugInfo && <div className="loading-hint">{debugInfo}</div>}
          </div>
        )}

        {showFeedback && !isInitializing && (
          <div className="feedback-wrap">
            <button
              onClick={sendFeedback}
              className="feedback-btn"
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 10px 25px -5px rgba(0,0,0,.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 6px 20px -5px rgba(0,0,0,.5)'; }}
            >
              Out-of-Scope Feedback senden
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
