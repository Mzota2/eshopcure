'use client';

import React from 'react';
import { X, Bot, Send } from 'lucide-react';

interface AdminAiModalProps {
  open: boolean;
  onClose: () => void;
}

export const AdminAiModal: React.FC<AdminAiModalProps> = ({ open, onClose }) => {
  const [aiMessages, setAiMessages] = React.useState<Array<{ sender: 'user' | 'ai'; text: string }>>([]);
  const [aiInput, setAiInput] = React.useState('');
  const [aiLoading, setAiLoading] = React.useState(false);
  const messagesRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }, 50);
    }
  }, [open, aiMessages]);

  const sendAiMessage = async () => {
    const trimmed = aiInput.trim();
    if (!trimmed) return;
    setAiMessages(prev => [...prev, { sender: 'user', text: trimmed }]);
    setAiLoading(true);
    setAiInput('');

    try {
      const res = await fetch('/api/ai-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, topic: 'admin' }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setAiMessages(prev => [...prev, { sender: 'ai', text: `AI error: ${json?.error || 'unknown'}` }]);
      } else {
        setAiMessages(prev => [...prev, { sender: 'ai', text: json.reply || 'No response' }]);
      }
    } catch (err) {
      console.error('AI error', err);
      setAiMessages(prev => [...prev, { sender: 'ai', text: 'Error contacting AI support.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl mx-4 bg-card rounded-lg border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <h3 className="font-semibold">Admin AI Support</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="p-2" aria-label="Close AI chat">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div ref={messagesRef} className="h-64 overflow-y-auto bg-background p-2 rounded mb-3">
            {aiMessages.length === 0 ? (
              <p className="text-sm text-text-secondary">Ask about using the admin panel, managing orders, bookings, or refunds.</p>
            ) : (
              aiMessages.map((m, idx) => (
                <div key={idx} className={`mb-2 ${m.sender === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block rounded-md p-2 ${m.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'}`}>
                    {m.text}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void sendAiMessage(); }}
              className="flex-1 border border-border rounded px-2 py-1"
              placeholder="Ask AI about admin tasks"
              aria-label="Ask AI about admin tasks"
            />
            <button
              onClick={() => void sendAiMessage()}
              disabled={aiLoading || !aiInput.trim()}
              className="px-3 py-1 rounded bg-primary text-primary-foreground"
              aria-label="Send message to AI"
            >
              {aiLoading ? '...' : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
