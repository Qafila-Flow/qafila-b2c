const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('qafila_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PersistedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  pdfId?: string;
  pdfDownloadUrl?: string;
  createdAt: string;
}

export async function getHistory(): Promise<PersistedMessage[]> {
  const response = await fetch(`${API_URL}/v1/ai-research/history`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!response.ok) return [];
  return response.json();
}

export async function resetHistory(): Promise<void> {
  await fetch(`${API_URL}/v1/ai-research/history`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export interface Source {
  url: string;
  title: string;
  snippet?: string;
}

export interface StreamEventPayload {
  type:
    | 'token'
    | 'clear_tokens'
    | 'tool_call'
    | 'tool_result'
    | 'source'
    | 'pdf_ready'
    | 'done'
    | 'error';
  data: string;
}

export interface PdfReadyData {
  pdfId: string;
  downloadUrl: string;
}

export async function streamChat(
  message: string,
  _history: ChatMessage[],
  callbacks: {
    onToken: (text: string) => void;
    onClearTokens: () => void;
    onToolCall: (tool: string, query: string) => void;
    onSource: (source: Source) => void;
    onPdfReady: (pdfId: string, url: string) => void;
    onDone: () => void;
    onError: (error: string) => void;
  },
): Promise<void> {
  const response = await fetch(`${API_URL}/v1/ai-research/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      // NestJS errors: { message: string | string[] } — plan-limit errors
      // carry the human-readable reason (e.g. daily query limit reached).
      const bodyMessage = Array.isArray(body?.message)
        ? body.message.join(', ')
        : body?.message;
      if (typeof bodyMessage === 'string' && bodyMessage) {
        message = bodyMessage;
      }
    } catch {
      // Non-JSON body — keep the generic status message
    }
    callbacks.onError(message);
    return;
  }

  if (!response.body) {
    callbacks.onError('No response body');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === '[DONE]') continue;

      try {
        const event = JSON.parse(raw) as StreamEventPayload;
        const payload = JSON.parse(event.data || '{}');

        switch (event.type) {
          case 'token':
            callbacks.onToken(payload.text || '');
            break;
          case 'clear_tokens':
            callbacks.onClearTokens();
            break;
          case 'tool_call':
            callbacks.onToolCall(payload.tool || '', payload.query || '');
            break;
          case 'source':
            callbacks.onSource({
              url: payload.url,
              title: payload.title,
              snippet: payload.snippet,
            });
            break;
          case 'pdf_ready':
            callbacks.onPdfReady(payload.pdfId, payload.downloadUrl);
            break;
          case 'done':
            callbacks.onDone();
            break;
          case 'error':
            callbacks.onError(payload.message || 'Unknown error');
            break;
        }
      } catch {
        // Ignore parse errors
      }
    }
  }
}

export async function generatePdf(
  title: string,
  content: string,
  locale: 'en' | 'ar' = 'en',
): Promise<{ pdfId: string; downloadUrl: string }> {
  const response = await fetch(`${API_URL}/v1/ai-research/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ title, content, locale }),
  });

  if (!response.ok) {
    throw new Error(`PDF generation failed: ${response.status}`);
  }

  return response.json();
}

export function getPdfDownloadUrl(pdfId: string): string {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('qafila_token') : null;
  return `${API_URL}/v1/ai-research/pdf/${pdfId}${token ? `?token=${token}` : ''}`;
}
