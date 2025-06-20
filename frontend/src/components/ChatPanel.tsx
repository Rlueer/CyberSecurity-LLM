import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import QuestionCard from './QuestionCard'; // Ayrılmış bileşeni import et

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (prompt: string) => void;
  isLoading: boolean; // Yüklenme durumunu al
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isLoading }) => {
  // ... (useState ve handleSend mantığı aynı kalacak)
  const [prompt, setPrompt] = React.useState("");
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatWindowRef.current) {
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSend = () => { if (prompt.trim() && !isLoading) { onSendMessage(prompt); setPrompt(""); } };

  return (
    <main className="flex-1 bg-[#1a1a2e] flex flex-col">
        {/* ... (Header aynı) */}
        <div ref={chatWindowRef} className="flex-1 p-6 overflow-y-auto bg-[#0f0f23] font-mono">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-6 animate-fadeIn">
            {/* Geleneksel AI ve Kullanıcı mesajları */}
            {(msg.type === 'question' || msg.type === 'user_response') && (
              <>
                <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${msg.sender === 'AI' ? 'bg-blue-500' : 'bg-green-600'} text-white`}>{msg.sender === 'AI' ? 'AI' : 'U'}</div>
                    <span className="font-semibold text-sm">{msg.sender === 'AI' ? 'Security Analyst' : 'User'}</span>
                </div>
                {msg.type === 'question' && msg.question ? (
                  <QuestionCard question={msg.question} ai_comment={msg.ai_comment} />
                ) : (
                  <div className="p-4 rounded-lg bg-[#064e3b] border-l-4 border-green-500"><p>{msg.text}</p></div>
                )}
              </>
            )}

            {/* YENİ: Görev Onay Mesajı */}
            {msg.type === 'task_confirmation' && (
                <div className="p-3 mt-[-10px] ml-8 text-sm text-gray-400 border-l-2 border-gray-700/50">
                    <p className="text-emerald-400/80 font-medium">✅ Answer recorded</p>
                    <p>📌 <span className="font-semibold">New Task:</span> {msg.text}</p>
                </div>
            )}
          </div>
        ))}
        {isLoading && <div className="text-center text-gray-400">Analyst is thinking...</div>}
      </div>
      <div className="p-6 border-t border-[#2d2d5f] bg-[#16213e]">
        {/* ... (textarea ve send butonu aynı) */}
      </div>
    </main>
  );
};

export default ChatPanel;