import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { format } from 'date-fns';
import { Message } from '../services/api';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const avatar = isUser ? '👤' : '🤖';
  const roleName = isUser ? 'Sie' : 'Interview Assistent';

  return (
    <div className={`message ${message.role}`}>
      <div className="message-avatar">{avatar}</div>
      <div className="message-content">
        <div className="message-header">
          <span className="message-role">{roleName}</span>
          <span className="message-time">
            {format(message.timestamp, 'HH:mm')}
          </span>
        </div>
        <div className="message-text">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
