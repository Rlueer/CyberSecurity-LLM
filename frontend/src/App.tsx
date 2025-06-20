import React, { useEffect, useState, useRef, useLayoutEffect, useCallback } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { v4 as uuidv4 } from 'uuid'; // YENİ: Benzersiz ID için

// Chart.js'in ihtiyaç duyduğu modülleri "kaydediyoruz".
ChartJS.register(ArcElement, Tooltip, Legend);


// =========== GÜNCELLENMİŞ VERİ TİPLERİ =========== //

interface Question {
  id: number;
  domain_name: string;
  related_nist_category: string;
  nist_function: string;
  iso27001_controls: string[];
  maturity_level: number;
  criticality: 'high' | 'medium' | 'low';
  question_text: string;
  question_type: string;
  hint: string;
  tags: string[];
}

// GÜNCELLENDİ: Mesaj arayüzü yeni özellikleri içerecek şekilde güncellendi.
interface Message {
  id: string;
  sender: 'AI' | 'User';
  text: string;
  type: 'question' | 'user_response' | 'task_confirmation' | 'error';
  question?: Question;
  ai_comment?: string;
  ai_task?: string;
}

interface DomainStatus {
  name: string;
  status: 'Complete' | 'In Progress' | 'Pending';
  score: number;
}


// =========== YENİ: Tekrar Kullanılabilir Popover Hook'u =========== //
// Popover'ların (Hint, AI Comment) mantığını yönetir.
const usePopover = () => {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsVisible(false), []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isVisible &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
        popoverRef.current && !popoverRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isVisible, close]);

  const toggle = () => setIsVisible(prev => !prev);

  return { isVisible, toggle, close, triggerRef, popoverRef };
};


// =========== YARDIMCI BİLEŞENLER (GÜNCELLENMİŞ) =========== //

const Header: React.FC = () => (
  <header className="h-[60px] bg-[#1e1e3f] border-b border-[#2d2d5f] z-50 flex items-center justify-between px-6 flex-shrink-0">
    <div className="text-lg font-semibold text-blue-400">CyberSec Assessment Platform</div>
    <div className="text-sm text-gray-400">Assessment Session #2025-001</div>
  </header>
);

const ProgressChart: React.FC<{ statuses: DomainStatus[] }> = ({ statuses }) => {
    const data = {
        labels: statuses.map(s => s.name),
        datasets: [{
            data: statuses.map(s => s.score || 0.1), // 0 olunca chart.js'te görünmüyor, o yüzden küçük bir değer
            backgroundColor: statuses.map(s => s.status === 'Complete' ? '#10b981' : s.status === 'In Progress' ? '#3b82f6' : '#6b7280'),
            borderWidth: 2,
            borderColor: '#1e1e3f',
            cutout: '75%',
        }]
    };
    const options = { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } };
    return <Doughnut data={data} options={options} />;
};


const Sidebar: React.FC<{ statuses: DomainStatus[], overallScore: number }> = ({ statuses, overallScore }) => {
  const getStatusDotColor = (status: DomainStatus['status']) => ({
    'Complete': 'bg-green-500', 'In Progress': 'bg-blue-500', 'Pending': 'bg-gray-500',
  }[status]);

  const currentDomain = statuses.find(s => s.status === 'In Progress');

  return (
    <aside className="hidden lg:flex w-full lg:w-[400px] bg-[#1e1e3f] flex-col border-t lg:border-t-0 lg:border-l border-[#2d2d5f] overflow-y-auto">
      <div className="p-6 border-b border-[#2d2d5f]">
        <h2 className="text-base font-semibold text-gray-100 mb-4">Assessment Progress</h2>
        <div className="flex flex-col items-center gap-4">
          <div className="w-[180px] h-[180px]">
            <ProgressChart statuses={statuses} />
          </div>
          <div className="text-center -mt-2">
            <div className="text-4xl font-bold text-blue-400">{overallScore.toFixed(1)}</div>
            <div className="text-sm text-gray-400 mt-1">Overall Maturity Score</div>
          </div>
        </div>
      </div>
      
      {currentDomain && (
        <div className="p-6 border-b border-[#2d2d5f]">
          <h2 className="text-base font-semibold text-gray-100 mb-4">Current Domain: {currentDomain.name}</h2>
          <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${currentDomain.score}%` }}></div>
              </div>
              <span className="text-xs font-semibold text-gray-300">{currentDomain.score.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 border-b border-[#2d2d5f]">
        <h2 className="text-base font-semibold text-gray-100 mb-4">Status Indicators</h2>
        <div className="flex flex-col gap-3">
          {statuses.map((domain) => (
            <div key={domain.name} className="flex items-center gap-2.5 p-2 rounded-md bg-[#0f172a] border border-[#334155]">
              <div className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(domain.status)} flex-shrink-0`}></div>
              <span className="text-sm text-gray-300 truncate">{domain.name} - {domain.status}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

// YENİ: Popover için ayrı bir bileşen. Kapatma butonu içerir.
const Popover: React.FC<{
  content: string;
  popoverRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}> = ({ content, popoverRef, onClose }) => (
    <div
      ref={popoverRef}
      className="absolute z-50 w-72 bg-[#2a3a51] rounded-lg shadow-xl ring-1 ring-black/5 bottom-full mb-3 left-1/2 -translate-x-1/2 p-3 animate-fadeIn"
    >
      <button onClick={onClose} className="absolute top-1 right-1 text-gray-400 hover:text-white transition-colors">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
      </button>
      <p className="text-sm text-gray-200 pr-4">{content}</p>
    </div>
);

// GÜNCELLENDİ: QuestionCard artık AI yorumunu gösterebilir ve popover'ları daha iyi yönetir.
const QuestionCard: React.FC<{ question: Question, ai_comment?: string }> = ({ question, ai_comment }) => {
    const { isVisible: isHintVisible, toggle: toggleHint, close: closeHint, triggerRef: hintTriggerRef, popoverRef: hintPopoverRef } = usePopover();
    const { isVisible: isCommentVisible, toggle: toggleComment, close: closeComment, triggerRef: commentTriggerRef, popoverRef: commentPopoverRef } = usePopover();

    const getCriticalityColor = (level: string) => ({
        'high': 'bg-red-500/20 text-red-400 border-red-500/30',
        'medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'low': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    }[level] || 'bg-gray-500/20 text-gray-400 border-gray-500/30');

    return (
        <div className="bg-[#1e293b] p-4 rounded-lg border-l-4 border-blue-500 leading-relaxed">
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded border ${getCriticalityColor(question.criticality)}`}>Criticality: {question.criticality.toUpperCase()}</span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-gray-600/30 text-gray-300 border border-gray-600/50">Maturity Level: {question.maturity_level}</span>
                
                <div className="relative">
                    {question.hint && (
                        <button ref={hintTriggerRef} onClick={toggleHint} className="flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded bg-sky-800/50 text-sky-300 border border-sky-700/60 hover:bg-sky-800/80 transition">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
                            Hint
                        </button>
                    )}
                    {isHintVisible && <Popover content={question.hint} popoverRef={hintPopoverRef} onClose={closeHint} />}
                </div>

                {/* YENİ: AI's Comment Butonu */}
                {ai_comment && (
                  <div className="relative">
                    <button ref={commentTriggerRef} onClick={toggleComment} className="flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded bg-purple-800/50 text-purple-300 border border-purple-700/60 hover:bg-purple-800/80 transition">
                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                      AI's Comment
                    </button>
                    {isCommentVisible && <Popover content={ai_comment} popoverRef={commentPopoverRef} onClose={closeComment} />}
                  </div>
                )}
            </div>

            <p className="font-semibold text-gray-100">{question.question_text}</p>
            
            <div className="mt-4 border-t border-gray-700/50 pt-3">
                 <p className="text-xs text-gray-500 mb-2">Domain: {question.domain_name} | NIST Function: {question.nist_function}</p>
                 <div className="flex flex-wrap gap-1.5">{question.tags.map(tag => (<span key={tag} className="text-xs px-2 py-0.5 bg-sky-800/50 text-sky-300 rounded-full">{tag}</span>))}</div>
            </div>
        </div>
    );
};

// GÜNCELLENDİ: ChatPanel artık yeni mesaj tiplerini ve yüklenme durumunu yönetiyor.
const ChatPanel: React.FC<{ messages: Message[], onSendMessage: (prompt: string) => void, isLoading: boolean, currentQuestionId: number | null }> = ({ messages, onSendMessage, isLoading, currentQuestionId }) => {
  const [prompt, setPrompt] = useState("");
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatWindowRef.current) {
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSend = () => { if (prompt.trim() && !isLoading) { onSendMessage(prompt); setPrompt(""); } };

  return (
    <main className="flex-1 bg-[#1a1a2e] flex flex-col">
      <div className="p-5 border-b border-[#2d2d5f] bg-[#16213e]">
        <h1 className="text-xl font-bold text-gray-100">AI Security Analyst</h1>
        <p className="text-sm text-gray-400">Adaptive Cybersecurity Maturity Assessment</p>
      </div>
      <div ref={chatWindowRef} className="flex-1 p-6 overflow-y-auto bg-[#0f0f23] font-mono">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-4 animate-fadeIn">
            {(msg.type === 'question' || msg.type === 'user_response' || msg.type === 'error') && (
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${msg.sender === 'AI' ? 'bg-blue-500' : 'bg-green-600'} text-white flex-shrink-0`}>{msg.sender === 'AI' ? 'AI' : 'U'}</div>
                  <span className="font-semibold text-sm">{msg.sender === 'AI' ? 'Security Analyst' : 'You'}</span>
                </div>
                {msg.type === 'question' && msg.question ? (
                  <QuestionCard question={msg.question} ai_comment={msg.ai_comment} />
                ) : msg.type === 'error' ? (
                  <div className="p-4 rounded-lg bg-red-900/50 border-l-4 border-red-500"><p>{msg.text}</p></div>
                ) : (
                  <div className="p-4 rounded-lg bg-[#064e3b] border-l-4 border-green-500"><p className="text-white whitespace-pre-wrap">{msg.text}</p></div>
                )}
              </div>
            )}
            {msg.type === 'task_confirmation' && (
                <div className="p-3 mt-[-5px] ml-8 text-sm text-gray-400 border-l-2 border-gray-700/50">
                    <p className="text-emerald-400/80 font-medium">✅ Answer recorded</p>
                    <p>📌 <span className="font-semibold">New Task:</span> {msg.text}</p>
                </div>
            )}
          </div>
        ))}
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
          <button onClick={handleSend} disabled={isLoading || !prompt.trim() || currentQuestionId === null} className="bg-blue-600 text-white font-medium rounded-lg px-5 py-3 transition hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed">Send</button>
        </div>
      </div>
    </main>
  );
};


// =========== ANA UYGULAMA BİLEŞENİ (MANTIK GÜNCELLENDİ) =========== //

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [domainStatuses, setDomainStatuses] = useState<DomainStatus[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("http://localhost:3001/questions")
      .then((res) => {
        if (!res.ok) throw new Error(`Network response was not ok: ${res.statusText}`);
        return res.json();
      })
      .then((data: Question[]) => {
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("Fetched data is not a valid array or is empty.");
        }
        setQuestions(data);
        const firstQuestion = data[0];
        setCurrentQuestionId(firstQuestion.id);
        setMessages([{ id: uuidv4(), sender: 'AI', text: "Welcome! Let's start the assessment.", type: 'question', question: firstQuestion }]);
        const initialDomains: DomainStatus[] = [...new Set(data.map(q => q.domain_name))].map(domainName => ({ name: domainName, status: domainName === firstQuestion.domain_name ? 'In Progress' : 'Pending', score: 0 }));
        setDomainStatuses(initialDomains);
      })
      .catch((err) => {
        console.error("Error fetching questions:", err);
        setMessages([{ id: uuidv4(), sender: 'AI', text: "Failed to connect to the backend. Please ensure the server is running.", type: 'error', question: undefined }]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSendMessage = async (prompt: string) => {
    if (!currentQuestionId || isLoading) return;
    setIsLoading(true);

    const userMessage: Message = { id: uuidv4(), sender: 'User', text: prompt, type: 'user_response' };
    setMessages(prev => [...prev, userMessage]);

    try {
      const res = await fetch("http://localhost:3001/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, previous_question_id: currentQuestionId }),
      });
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const apiResponse = await res.json();
      
      const taskMessage: Message = { id: uuidv4(), sender: 'AI', text: apiResponse.task || "No task was generated.", type: 'task_confirmation' };
      
      const answeredQuestion = questions.find(q => q.id === currentQuestionId);
      const nextQuestion = questions.find(q => q.id === apiResponse.next_question_id);

      if (answeredQuestion) {
        setDomainStatuses(prevStatuses => {
            const newStatuses = prevStatuses.map(status => {
                let updatedStatus = { ...status };
                if (status.name === answeredQuestion.domain_name) {
                    const domainQuestions = questions.filter(q => q.domain_name === status.name);
                    const questionWeight = 100 / (domainQuestions.length || 1);
                    const newScore = Math.min(100, status.score + (apiResponse.score / 100) * questionWeight);
                    updatedStatus.score = newScore;
                    const domainIsFinished = !nextQuestion || nextQuestion.domain_name !== status.name;
                    if(domainIsFinished) updatedStatus.status = 'Complete';
                }
                if (nextQuestion && status.name === nextQuestion.domain_name && status.status === 'Pending') {
                    updatedStatus.status = 'In Progress';
                }
                return updatedStatus;
            });
            const totalScore = newStatuses.reduce((acc, curr) => acc + curr.score, 0);
            setOverallScore(totalScore / (newStatuses.length || 1));
            return newStatuses;
        });
      }

      if (nextQuestion) {
        const nextQuestionMessage: Message = { id: uuidv4(), sender: 'AI', text: 'Here is the next question.', type: 'question', question: nextQuestion, ai_comment: apiResponse.comment };
        setMessages(prev => [...prev, taskMessage, nextQuestionMessage]);
        setCurrentQuestionId(apiResponse.next_question_id);
      } else {
        const endMessage: Message = { id: uuidv4(), sender: 'AI', text: '🎉 Assessment complete! Thank you for your responses.', type: 'question', question: undefined };
        setMessages(prev => [...prev, taskMessage, endMessage]);
        setCurrentQuestionId(null);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages(prev => [...prev, { id: uuidv4(), sender: 'AI', text: "An error occurred while processing your request.", type: 'error', question: undefined }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0f0f23] text-gray-200 font-sans h-screen overflow-hidden flex flex-col">
      <Header />
      <div className="flex flex-1 min-h-0"> {/* min-h-0 is important for flexbox scrolling */}
        <ChatPanel messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} currentQuestionId={currentQuestionId} />
        <Sidebar statuses={domainStatuses} overallScore={overallScore} />
      </div>
    </div>
  );
};

export default App;
