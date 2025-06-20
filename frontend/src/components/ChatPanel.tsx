import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import QuestionCard from './QuestionCard';
import FeedbackMessage from './FeedBackMessage';

interface ChatPanelProps {
    messages: Message[];
    onSendMessage: (prompt: string) => void;
    isLoading: boolean;
    currentQuestionId: number | null;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isLoading, currentQuestionId }) => {
  const [prompt, setPrompt] = useState("");
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatWindowRef.current?.scrollTo({ top: chatWindowRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);
  
  const handleSend = () => { if (prompt.trim() && !isLoading) { onSendMessage(prompt); setPrompt(""); } };

  return (
    <main className="flex-1 bg-[#1a1a2e] flex flex-col">
      <div className="p-5 border-b border-[#2d2d5f] bg-[#16213e]"><h1 className="text-xl font-bold text-gray-100">AI Security Analyst</h1><p className="text-sm text-gray-400">Adaptive Cybersecurity Maturity Assessment</p></div>
      <div ref={chatWindowRef} className="flex-1 p-6 overflow-y-auto bg-[#0f0f23] font-mono">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-4 animate-fadeIn">
            {(msg.type === 'question' || msg.type === 'user_response' || msg.type === 'error') && (
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${msg.sender === 'AI' ? 'bg-blue-500' : 'bg-green-600'} text-white flex-shrink-0`}>{msg.sender === 'AI' ? 'AI' : 'You'}</div>
                  <span className="font-semibold text-sm">{msg.sender === 'AI' ? 'Security Analyst' : 'You'}</span>
                </div>
                {msg.type === 'question' && msg.question ? <QuestionCard question={msg.question}/> : msg.type === 'error' ? <div className="p-4 rounded-lg bg-red-900/50 border-l-4 border-red-500"><p>{msg.text}</p></div> : <div className="p-4 rounded-lg bg-[#064e3b] border-l-4 border-green-500"><p className="text-white whitespace-pre-wrap">{msg.text}</p></div>}
              </div>
            )}
            {msg.type === 'feedback' && <FeedbackMessage message={msg} />}
          </div>
        ))}
        {isLoading && <div className="text-center text-gray-400 py-2">Analyst is thinking...</div>}
      </div>
      <div className="p-4 border-t border-[#2d2d5f] bg-[#16213e]">
        <div className="flex gap-3 items-end">
          <textarea className="flex-1 bg-[#0f0f23] border border-gray-700 rounded-lg p-3 text-gray-100 text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" placeholder={isLoading ? "Please wait..." : "Type your response here..."} rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} disabled={isLoading || currentQuestionId === null}/>
          <button onClick={handleSend} disabled={isLoading || !prompt.trim() || currentQuestionId === null} className="bg-blue-600 text-white font-medium rounded-lg px-5 py-3 transition hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed">Send</button>
        </div>
      </div>
    </main>
  );
};

export default ChatPanel;