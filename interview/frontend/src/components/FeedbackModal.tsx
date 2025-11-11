import React, { useState } from 'react';
import { apiService, FeedbackRequest } from '../services/api';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextMessage?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  contextMessage,
}) => {
  const [name, setName] = useState('');
  const [message, setMessage] = useState(contextMessage || '');
  const [consentForward, setConsentForward] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const feedback: FeedbackRequest = {
        name: isAnonymous ? undefined : name || 'Anonym',
        message: message.trim(),
        consentForward,
      };

      await apiService.submitFeedback(feedback);
      setSubmitSuccess(true);
      
      setTimeout(() => {
        onClose();
        setSubmitSuccess(false);
        setName('');
        setMessage('');
        setIsAnonymous(false);
        setConsentForward(true);
      }, 2000);
    } catch (err) {
      setError('Fehler beim Senden. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setError('');
      setSubmitSuccess(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Nachricht an Alaa</h2>
        <p>
          Leider konnte ich Ihre Frage nicht beantworten. Gerne können Sie Ihre
          Nachricht direkt an Alaa weiterleiten.
        </p>

        {submitSuccess ? (
          <div className="success-message" style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid #10b981',
            padding: '1rem',
            borderRadius: '0.5rem',
            color: '#10b981',
            textAlign: 'center'
          }}>
            ✓ Nachricht erfolgreich gesendet! Vielen Dank.
          </div>
        ) : (
          <form className="modal-form" onSubmit={handleSubmit}>
            <label>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <span>Anonym senden</span>
            </label>

            {!isAnonymous && (
              <label>
                Name (optional)
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ihr Name"
                  disabled={isSubmitting}
                />
              </label>
            )}

            <label>
              Nachricht *
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ihre Nachricht..."
                required
                disabled={isSubmitting}
              />
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={consentForward}
                onChange={(e) => setConsentForward(e.target.checked)}
              />
              <span>Ich bin einverstanden, dass meine Nachricht an Alaa weitergeleitet wird</span>
            </label>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!message.trim() || !consentForward || isSubmitting}
              >
                {isSubmitting ? 'Wird gesendet...' : 'Senden'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
