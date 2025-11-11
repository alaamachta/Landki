import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import './styles/app.css';
import { ChatKitEmbed } from './components/ChatKitEmbed';

export const App: React.FC = () => {
  const [route, setRoute] = useState(window.location.hash.slice(1) || 'chat');

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash.slice(1) || 'chat');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Render dashboard route
  if (route === 'dashboard') {
    return <Dashboard />;
  }

  return (
    <div className="app">
      <div className="chat-header">
        <div>
          <h1>Interview Assistent</h1>
          <div className="subtitle">Fragen Sie mich alles über Alaa & LandKI</div>
        </div>
      </div>
      <div className="messages-container">
        <ChatKitEmbed />
      </div>

      <div className="footer">
        🔒 Ihre Daten werden vertraulich behandelt. Bei Fragen kontaktieren Sie{' '}
        Alaa direkt.
      </div>
    </div>
  );
};
