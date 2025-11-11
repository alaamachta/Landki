export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  locale?: string;
}

export interface FeedbackRequest {
  name?: string;
  message: string;
  consentForward: boolean;
  userAgent?: string;
}

export class ApiService {
  private baseUrl = '/interview/api';

  async streamChat(
    request: ChatRequest,
    onMessage: (content: string) => void,
    onSuggestions: (suggestions: string[]) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              onComplete();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.content) {
                onMessage(parsed.content);
              }
              
              if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
                onSuggestions(parsed.suggestions);
              }
              
              if (parsed.error) {
                onError(new Error(parsed.error));
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', data);
            }
          }
        }
      }
    } catch (error) {
      onError(error as Error);
    }
  }

  async submitFeedback(feedback: FeedbackRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...feedback,
        userAgent: navigator.userAgent,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit feedback: ${response.statusText}`);
    }
  }

  async checkHealth(): Promise<{ status: string; version: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }
}

export const apiService = new ApiService();
