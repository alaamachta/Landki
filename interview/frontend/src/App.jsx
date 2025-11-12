import { useCallback, useEffect, useState } from 'react'
import { ChatKit, useChatKit } from '@openai/chatkit-react'
import './App.css'

const CREATE_SESSION_ENDPOINT = '/interview/api/chatkit/session';
const WORKFLOW_ID = 'wf_6910af26c670819097b24c11ebbe0b380a5bfa9945431f22';

const STARTER_PROMPTS = [
  {
    label: 'Welche Erfahrungen haben Sie mit KI und Machine Learning?',
    prompt: 'Welche Erfahrungen haben Sie mit KI und Machine Learning?',
  },
  {
    label: 'Erzählen Sie mir über Ihre wichtigsten Projekte',
    prompt: 'Erzählen Sie mir über Ihre wichtigsten Projekte',
  },
  {
    label: 'Welche Technologien beherrschen Sie?',
    prompt: 'Welche Technologien beherrschen Sie?',
  },
];

const GREETING = 'Hallo! Ich bin der Interview-Assistent für Alaa Mashta. Fragen Sie mich gerne über seinen beruflichen Werdegang, Projekte und Fähigkeiten.';
const PLACEHOLDER = 'Stellen Sie Ihre Frage...';

function App() {
  const [sessionError, setSessionError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [debugInfo, setDebugInfo] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAssistantReply, setLastAssistantReply] = useState('');
  const [lastUserQuestion, setLastUserQuestion] = useState('');
  const OUT_OF_SCOPE_MARKERS = [
    'außerhalb meines aktuellen Wissensbereichs',
    'keine Informationen dazu',
    'nicht in meinem aktuellen Kontext'
  ];
  
  const getClientSecret = useCallback(async (currentSecret) => {
    console.log('[App] getClientSecret called', { hasCurrentSecret: !!currentSecret });
    setDebugInfo('Erstelle Session...');
    
    setSessionError(null);
    if (!currentSecret) {
      setIsInitializing(true);
    }
    
    try {
      setDebugInfo('Sende Anfrage an Server...');
      const response = await fetch(CREATE_SESSION_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow: { id: WORKFLOW_ID },
          chatkit_configuration: {
            file_upload: {
              enabled: false,
            },
          },
        }),
      });
      
      setDebugInfo('Server hat geantwortet...');
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Session creation failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[App] Session created successfully', data);
      
      if (!data.client_secret) {
        throw new Error('Missing client_secret in response');
      }
      
      setDebugInfo('Session erfolgreich erstellt!');
      setIsInitializing(false);
      
      return data.client_secret;
      
    } catch (error) {
      console.error('[App] Session creation error:', error);
      setSessionError(error.message);
      setDebugInfo(`Fehler: ${error.message}`);
      setIsInitializing(false);
      throw error;
    }
  }, []);
  
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
    onResponseEnd: () => console.log('[App] Response ended'),
    onResponseStart: () => console.log('[App] Response started'),
    onThreadChange: () => console.log('[App] Thread changed'),
    onError: ({ error }) => {
      console.error('[App] ChatKit error (hook)', error);
      setSessionError(error?.message || 'Ein Fehler ist aufgetreten');
    },
  });

  // Poll DOM for latest messages after each response end
  useEffect(() => {
    if (isInitializing) return;
    const interval = setInterval(() => {
      try {
        const messageNodes = Array.from(document.querySelectorAll('[data-role="message"], .chatkit-message'));
        if (messageNodes.length < 1) return;
        // Extract plaintext content
        const texts = messageNodes.map(n => n.innerText.trim()).filter(Boolean);
        if (texts.length < 1) return;
        const assistantCandidates = texts.slice().reverse();
        const assistantReply = assistantCandidates.find(t => t.length > 0) || '';
        if (assistantReply && assistantReply !== lastAssistantReply) {
          setLastAssistantReply(assistantReply);
          // naive heuristic for user question: previous message
          const idx = texts.lastIndexOf(assistantReply);
          if (idx > 0) setLastUserQuestion(texts[idx - 1]);
          const lower = assistantReply.toLowerCase();
          const outOfScope = OUT_OF_SCOPE_MARKERS.some(m => lower.includes(m));
          setShowFeedback(outOfScope);
        }
      } catch (e) {
        // Silent
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [isInitializing, lastAssistantReply]);

  const sendFeedback = async () => {
    try {
      const payload = {
        session_id: chatkit.control?.session?.id || undefined,
        user_question: lastUserQuestion,
        assistant_reply: lastAssistantReply,
        category: 'out_of_scope',
        comment: 'Automatisch markiert (Demo)'
      };
      const res = await fetch('/interview/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      setShowFeedback(false);
      setDebugInfo('Feedback gesendet. Danke!');
    } catch (e) {
      setDebugInfo('Feedback Fehler: ' + e.message);
    }
  };
  
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
        <ChatKit 
          control={chatkit.control}
          className={isInitializing ? 'opacity-0' : 'opacity-100'}
        />
        {isInitializing && (
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.85)', fontSize:'1rem', color:'#444' }}>
            <div><strong>Lädt Chat-Assistent...</strong></div>
            {debugInfo && <div style={{ marginTop: '8px', fontSize: '0.8em' }}>{debugInfo}</div>}
          </div>
        )}
        {showFeedback && !isInitializing && (
          <div style={{ position:'absolute', bottom:14, right:14, display:'flex', gap:'10px', alignItems:'center' }}>
            <button onClick={sendFeedback} style={{
              background:'linear-gradient(135deg,#ef4444,#dc2626)',
              border:'none',
              color:'#fff',
              padding:'12px 18px',
              fontSize:'.85rem',
              fontWeight:600,
              letterSpacing:'.5px',
              borderRadius:'14px',
              cursor:'pointer',
              boxShadow:'0 6px 20px -5px rgba(0,0,0,.5)',
              transition:'transform .25s ease, box-shadow .25s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 10px 25px -5px rgba(0,0,0,.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 6px 20px -5px rgba(0,0,0,.5)'; }}
            >Out-of-Scope Feedback senden</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App
