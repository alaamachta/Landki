import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { FollowUpSuggestions } from './components/FollowUpSuggestions';
import { MessageInput } from './components/MessageInput';
import { FeedbackModal } from './components/FeedbackModal';
import { apiService, Message } from './services/api';
import './styles/app.css';

export const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [conversationId] = useState(() => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSendMessage = async (content: string) => {
    setError('');
    setStreamingContent('');
    setIsStreaming(true);
    
    // Add user message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setCurrentSuggestions([]);

    let assistantContent = '';
    let suggestions: string[] = [];
    let noKnowledgeFound = false;

    try {
      await apiService.streamChat(
        {
          message: content,
          conversationId,
          locale: 'de-DE',
        },
        // onMessage
        (chunk: string) => {
          assistantContent += chunk;
          setStreamingContent(assistantContent);
          
          // Check for knowledge gap indicators
          if (assistantContent.toLowerCase().includes('leider') || 
              assistantContent.toLowerCase().includes('keine information') ||
              assistantContent.toLowerCase().includes('nicht beantworten')) {
            noKnowledgeFound = true;
          }
        },
        // onSuggestions
        (newSuggestions: string[]) => {
          suggestions = newSuggestions.slice(0, 3); // Max 3 suggestions
        },
        // onError
        (err: Error) => {
          setError(err.message);
          setIsLoading(false);
          setIsStreaming(false);
        },
        // onComplete
        () => {
          const assistantMessage: Message = {
            id: `msg_${Date.now()}_assistant`,
            role: 'assistant',
            content: assistantContent || 'Entschuldigung, ich konnte keine Antwort generieren.',
            timestamp: new Date(),
            suggestions,
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          setCurrentSuggestions(suggestions);
          setStreamingContent('');
          setIsStreaming(false);
          setIsLoading(false);

          // If no knowledge found, open feedback modal after a short delay
          if (noKnowledgeFound) {
            setTimeout(() => {
              setIsFeedbackOpen(true);
            }, 1000);
          }
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <div className="app">
      <div className="chat-header">
        <div>
          <h1>Interview Assistent</h1>
          <div className="subtitle">Fragen Sie mich alles über Alaa & LandKI</div>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 && !isStreaming && (
          <div className="welcome-message">
            <h2>👋 Willkommen!</h2>
            <p>
              Ich bin Ihr Interview-Assistent. Ich kann Ihnen Fragen zu Alaa und
              LandKI beantworten. Stellen Sie mir eine Frage, um zu beginnen!
            </p>
          </div>
        )}

        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {isStreaming && streamingContent && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-role">Interview Assistent</span>
              </div>
              <div className="message-text">
                {streamingContent}
                <span className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {currentSuggestions.length > 0 && !isLoading && (
          <FollowUpSuggestions
            suggestions={currentSuggestions}
            onSelect={handleSuggestionClick}
            disabled={isLoading}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        onSend={handleSendMessage}
        disabled={isLoading}
        placeholder={isLoading ? 'Warte auf Antwort...' : 'Ihre Frage...'}
      />

      <div className="footer">
        🔒 Ihre Daten werden vertraulich behandelt. Bei Fragen kontaktieren Sie{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); setIsFeedbackOpen(true); }}>
          Alaa direkt
        </a>
        .
      </div>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </div>
  );
};
