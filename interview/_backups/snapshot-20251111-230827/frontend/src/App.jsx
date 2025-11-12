import { useEffect, useRef } from 'react'
import './App.css'

function App() {
  const mountedRef = useRef(false);

  // Simple toast utility
  const showToast = (msg) => {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '16px';
      toast.style.right = '16px';
      toast.style.maxWidth = '360px';
      toast.style.padding = '12px 14px';
      toast.style.borderRadius = '8px';
      toast.style.background = 'rgba(0,0,0,0.85)';
      toast.style.color = '#fff';
      toast.style.fontSize = '14px';
      toast.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
      toast.style.zIndex = '9999';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.transition = 'opacity 400ms';
      toast.style.opacity = '0';
    }, 4000);
  };

  const ensureChatKit = () => {
    // If already present, resolve immediately
    if (typeof window !== 'undefined' && window.ChatKit && typeof window.ChatKit.mount === 'function') {
      return Promise.resolve(window.ChatKit);
    }

    // Check if a script tag already exists
    const existing = Array.from(document.getElementsByTagName('script')).find(s =>
      (s.src || '').includes('cdn.platform.openai.com/deployments/chatkit/chatkit.js')
    );

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out loading ChatKit'));
      }, 10000);

      const onReady = () => {
        if (window.ChatKit && typeof window.ChatKit.mount === 'function') {
          clearTimeout(timeout);
          resolve(window.ChatKit);
        }
      };

      if (existing) {
        // If the script is already in the DOM, wait for it to finish loading or poll
        if (existing.getAttribute('data-loaded') === 'true') {
          onReady();
        } else {
          existing.addEventListener('load', () => {
            existing.setAttribute('data-loaded', 'true');
            onReady();
          });
          existing.addEventListener('error', () => {
            clearTimeout(timeout);
            reject(new Error('Failed to load ChatKit CDN script'));
          });
        }
        // Fallback polling in case load already fired
        const poll = setInterval(() => {
          if (window.ChatKit) {
            clearInterval(poll);
            onReady();
          }
        }, 200);
      } else {
        // Inject the script
        const script = document.createElement('script');
        script.src = 'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js';
        script.async = true;
        script.onload = () => {
          script.setAttribute('data-loaded', 'true');
          onReady();
        };
        script.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load ChatKit CDN script'));
        };
        document.head.appendChild(script);
      }
    });
  };

  useEffect(() => {
    // Mount ChatKit widget using workflow ID from environment
    const workflowId = import.meta.env.VITE_OPENAI_WORKFLOW_ID;
    
    if (!workflowId) {
      console.error('VITE_OPENAI_WORKFLOW_ID is required');
      showToast('Konfiguration fehlt: Workflow ID ist nicht gesetzt.');
      return;
    }
    
    if (mountedRef.current) return;

    ensureChatKit()
      .then((ChatKit) => {
        const container = document.getElementById('chat');
        if (!container) {
          console.error('Chat container element #chat not found.');
          showToast('Fehler: Chat-Container nicht gefunden.');
          return;
        }
        ChatKit.mount({
          element: container,
          workflow: workflowId,
        });
        mountedRef.current = true;
        console.log('ChatKit mounted with workflow:', workflowId);
      })
      .catch((err) => {
        console.error('ChatKit load/mount failed:', err);
        showToast('Chat konnte nicht geladen werden. Bitte laden Sie die Seite neu.');
      });
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Interview Assistent</h1>
        <p>Stellen Sie Ihre Fragen zu meinem beruflichen Werdegang</p>
      </header>
      <div id="chat" className="chat-container">
        {/* ChatKit will mount here */}
      </div>
    </div>
  );
}

export default App
