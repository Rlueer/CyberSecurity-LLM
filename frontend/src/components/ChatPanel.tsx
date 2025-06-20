import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import QuestionCard from './QuestionCard';
import FeedbackMessage from './FeedBackMessage';

const EditForm: React.FC<{
  originalText: string;
  onSave: (newText: string) => void;
  onCancel: () => void;
}> = ({ originalText, onSave, onCancel }) => {
  const [text, setText] = useState(originalText);
  const handleSave = () => { if (text.trim()) onSave(text); };

  return (
    <div className="p-4 rounded-lg bg-[#043d2b] border-l-4 border-green-500">
      <textarea
        className="w-full bg-[#0f0f23] border border-gray-600 rounded-md p-2 text-sm text-gray-100 resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
        value={text} onChange={(e) => setText(e.target.value)} rows={3}
      />
      <div className="flex items-center gap-2 mt-2">
        <button onClick={handleSave} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition">Save</button>
        <button onClick={onCancel} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs font-semibold rounded-md transition">Cancel</button>
      </div>
    </div>
  );
};

interface ChatPanelProps {
    messages: Message[];
    onSendMessage: (prompt: string) => void;
    isLoading: boolean;
    currentQuestionId: number | null;
    editingMessageId: string | null;
    setEditingMessageId: (id: string | null) => void;
    onEditMessage: (messageId: string, newText: string) => void;
    onNavigateAttempt: (messageId: string, direction: 'prev' | 'next') => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  currentQuestionId,
  editingMessageId,
  setEditingMessageId,
  onEditMessage,
  onNavigateAttempt
}) => {
  const [prompt, setPrompt] = useState("");
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    chatWindowRef.current?.scrollTo({ top: chatWindowRef.current.scrollHeight, behavior: 'smooth' }); 
  }, [messages]);
  
  const handleSend = () => { 
    if (prompt.trim() && !isLoading) { 
      onSendMessage(prompt); 
      setPrompt(""); 
    } 
  };

  return (
    <main className="flex-1 bg-[#1a1a2e] flex flex-col min-h-0">
      <div className="p-5 border-b border-[#2d2d5f] bg-[#16213e]">
        <h1 className="text-xl font-bold text-gray-100">AI Security Analyst</h1>
        <p className="text-sm text-gray-400">Adaptive Cybersecurity Maturity Assessment</p>
      </div>
      
      <div ref={chatWindowRef} className="flex-1 p-6 overflow-y-auto bg-[#0f0f23] font-mono">
        {messages.map((msg) => {
          if (msg.type === 'question' || msg.type === 'error') {
            return (
              <div key={msg.id} className="mb-4 animate-fadeIn">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold bg-blue-500 text-white flex-shrink-0">AI</div>
                  <span className="font-semibold text-sm">Security Analyst</span>
                </div>
                {msg.question ? (
                  <QuestionCard question={msg.question}/>
                ) : (
                  <div className={`p-4 rounded-lg border-l-4 ${msg.type === 'error' ? 'bg-red-900/50 border-red-500' : 'bg-indigo-900/50 border-indigo-500'}`}>
                    <p>{msg.text}</p>
                  </div>
                )}
              </div>
            );
          }

          if (msg.type === 'user_response') {
            const activeAttempt = msg.attempts?.[msg.activeAttemptIndex ?? 0];
            if (!activeAttempt) return null;

            return (
              <div key={msg.id} className="mb-4 animate-fadeIn">
                <div className="mb-2 group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold bg-green-600 text-white flex-shrink-0">You</div>
                    <span className="font-semibold text-sm">You</span>
                  </div>
                  
                  {editingMessageId === msg.id ? (
                    <EditForm
                      originalText={activeAttempt.text}
                      onSave={(newText) => onEditMessage(msg.id, newText)}
                      onCancel={() => setEditingMessageId(null)}
                    />
                  ) : (
                    <div className="flex items-start gap-2">
                      <div className="flex-1 p-4 rounded-lg bg-[#064e3b] border-l-4 border-green-500">
                        <p className="text-white whitespace-pre-wrap">{activeAttempt.text}</p>
                      </div>
                      <button 
                        onClick={() => setEditingMessageId(msg.id)} 
                        className="p-1 text-gray-500 hover:text-white transition opacity-0 group-hover:opacity-100"
                        title="Edit Answer"
                        disabled={isLoading}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd"></path></svg>
                      </button>
                    </div>
                  )}
                </div>
                
                <FeedbackMessage 
                  messageId={msg.id}
                  attempt={activeAttempt}
                  attemptCount={msg.attempts?.length ?? 0}
                  activeAttemptIndex={msg.activeAttemptIndex ?? 0}
                  onNavigate={onNavigateAttempt}
                  isLoading={isLoading}
                />
              </div>
            );
          }
          return null;
        })}
        {isLoading && <div className="text-center text-gray-400 py-2">Analyst is thinking...</div>}
      </div>
      
      <div className="p-4 border-t border-[#2d2d5f] bg-[#16213e]">
        <div className="flex gap-3 items-end">
          <textarea 
            className="flex-1 bg-[#0f0f23] border border-gray-700 rounded-lg p-3 text-gray-100 text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" 
            placeholder={isLoading ? "Please wait..." : "Type your response here..."} 
            rows={2} 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
            disabled={isLoading || currentQuestionId === null}
          />
          <button 
            onClick={handleSend} 
            disabled={isLoading || !prompt.trim() || currentQuestionId === null} 
            className="bg-blue-600 text-white font-medium rounded-lg px-5 py-3 transition hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
};

export default ChatPanel;