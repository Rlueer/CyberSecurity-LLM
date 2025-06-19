import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

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

interface Message {
  sender: 'AI' | 'User';
  text: string;
  question?: Question;
}

interface DomainStatus {
  name: string;
  status: 'Complete' | 'In Progress' | 'Pending';
  score: number;
}


// =========== YARDIMCI BİLEŞENLER (AYNI DOSYA İÇİNDE) =========== //

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
            data: statuses.map(s => s.score || 1),
            backgroundColor: statuses.map(s => s.status === 'Complete' ? '#10b981' : s.status === 'In Progress' ? '#3b82f6' : '#374151'),
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
    'Complete': 'bg-green-500', 'In Progress': 'bg-blue-500', 'Pending': 'bg-yellow-500',
  }[status]);

  const currentDomain = statuses.find(s => s.status === 'In Progress');

  return (
    <aside className="w-full lg:w-[400px] bg-[#1e1e3f] flex flex-col border-t lg:border-t-0 lg:border-l border-[#2d2d5f] overflow-y-auto">
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
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400" style={{ width: `${currentDomain.score}%` }}></div>
              </div>
              <span className="text-xs text-gray-400">{currentDomain.score}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 border-b border-[#2d2d5f]">
        <h2 className="text-base font-semibold text-gray-100 mb-4">Status Indicators</h2>
        <div className="flex flex-col gap-3">
          {statuses.map((domain) => (
            <div key={domain.name} className="flex items-center gap-2.5 p-2 rounded-md bg-[#0f172a] border border-[#334155]">
              <div className={`w-2 h-2 rounded-full ${getStatusDotColor(domain.status)}`}></div>
              <span className="text-sm text-gray-300">{domain.name} - {domain.status}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-6">
        <h2 className="text-base font-semibold text-gray-100 mb-4">Actions</h2>
        <div className="flex flex-col gap-3">
           <button className="w-full flex items-center justify-center gap-2 bg-gray-700 border border-gray-600 text-gray-200 text-sm font-medium rounded-lg p-3 transition hover:bg-gray-600">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
             Export PDF Report
           </button>
            <button className="w-full flex items-center justify-center gap-2 bg-gray-700 border border-gray-600 text-gray-200 text-sm font-medium rounded-lg p-3 transition hover:bg-gray-600">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2m-6 9l2 2 4-4"></path></svg>
              Generate Redmine Tasks
            </button>
        </div>
      </div>
    </aside>
  );
};

const QuestionCard: React.FC<{ question: Question }> = ({ question }) => {
    // 1. State'ler ayrıldı: Biri görünürlük, diğeri koordinatlar için.
    const [isHintVisible, setIsHintVisible] = useState(false);
    const [popoverCoords, setPopoverCoords] = useState<{ top: number, left: number } | null>(null);
    const [isPositioned, setIsPositioned] = useState(false); // ✅ Yeni state eklendi
    const hintButtonRef = useRef<HTMLButtonElement>(null);

    // 2. useLayoutEffect eklendi: DOM güncellendikten hemen sonra pozisyonu hesaplar.
    useLayoutEffect(() => {
        if (isHintVisible && hintButtonRef.current) {
            const rect = hintButtonRef.current.getBoundingClientRect();
            setPopoverCoords({
                top: rect.top - 10,
                left: rect.left + rect.width / 2,
            });
            // ✅ Pozisyon hesaplandıktan sonra görünür yap
            setTimeout(() => setIsPositioned(true), 0);
        } else {
            setIsPositioned(false); // ✅ Popup kapandığında sıfırla
        }
    }, [isHintVisible]);

    // 3. handleHintClick sadeleştirildi: Sadece görünürlüğü değiştirir.
    const handleHintClick = () => {
        setIsHintVisible(prev => !prev);
        setIsPositioned(false); // ✅ Her tıklamada pozisyonu sıfırla
    };

    const getCriticalityColor = (level: string) => ({
        'high': 'bg-red-500/20 text-red-400 border-red-500/30',
        'medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'low': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    }[level] || 'bg-gray-500/20 text-gray-400 border-gray-500/30');

    return (
        <div className="bg-[#1e293b] p-4 rounded-lg border-l-4 border-blue-500 leading-relaxed">
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded border ${getCriticalityColor(question.criticality)}`}>
                    Criticality: {question.criticality.toUpperCase()}
                </span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-gray-600/30 text-gray-300 border border-gray-600/50">
                    Maturity Level: {question.maturity_level}
                </span>
                <div className="relative">
                    {question.hint && (
                        <button 
                            ref={hintButtonRef}
                            onClick={handleHintClick}
                            className="flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded bg-sky-800/50 text-sky-300 border border-sky-700/60 hover:bg-sky-800/80 transition"
                        >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
                            Hint
                        </button>
                    )}
                </div>
            </div>

            <p className="font-semibold text-gray-100">{question.question_text}</p>
            
            <div className="mt-4 border-t border-gray-700/50 pt-3">
                 <p className="text-xs text-gray-500 mb-2">
                    Domain: {question.domain_name} | NIST Function: {question.nist_function} | NIST Category: {question.related_nist_category}
                 </p>
                 <div className="flex flex-wrap gap-1.5">
                    {question.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-sky-800/50 text-sky-300 rounded-full">{tag}</span>
                    ))}
                 </div>
            </div>

            {/* 4. Popup JSX'i güncellendi: Artık koordinatları ve görünürlüğü ayrı kontrol ediyor. */}
            {isHintVisible && popoverCoords && (
              <div
                  className={`fixed z-50 w-72 transition-opacity duration-200 ${
                      isPositioned ? 'opacity-100' : 'opacity-0'
                  }`} // ✅ animate-fadeIn yerine opacity kontrolü
                  style={{
                      top: `${popoverCoords.top}px`,
                      left: `${popoverCoords.left}px`,
                      transform: 'translate(-50%, -100%)',
                  }}
              >
                    <div className="overflow-hidden rounded-lg bg-[#2a3a51] p-3 text-sm text-gray-200 shadow-xl ring-1 ring-black/5">
                        <p>{question.hint}</p>
                    </div>
                    <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-8 border-x-transparent border-t-8 border-t-[#2a3a51]"></div>
                </div>
            )}
        </div>
    );
};

const ChatPanel: React.FC<{ messages: Message[], onSendMessage: (prompt: string) => void }> = ({ messages, onSendMessage }) => {
  const [prompt, setPrompt] = useState("");
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatWindowRef.current) {
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSend = () => { if (prompt.trim()) { onSendMessage(prompt); setPrompt(""); } };

  return (
    <main className="flex-1 bg-[#1a1a2e] flex flex-col">
      <div className="p-5 border-b border-[#2d2d5f] bg-[#16213e]">
        <h1 className="text-xl font-bold text-gray-100">AI Security Analyst</h1>
        <p className="text-sm text-gray-400">Adaptive Cybersecurity Maturity Assessment</p>
      </div>
      <div ref={chatWindowRef} className="flex-1 p-6 overflow-y-auto bg-[#0f0f23] font-mono">
        {messages.map((msg, index) => (
          <div key={index} className="mb-6 animate-fadeIn">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${msg.sender === 'AI' ? 'bg-blue-500' : 'bg-green-600'} text-white`}>
                {msg.sender === 'AI' ? 'AI' : 'U'}
              </div>
              <span className="font-semibold text-sm">{msg.sender === 'AI' ? 'Security Analyst' : 'User'}</span>
            </div>
            {msg.question ? <QuestionCard question={msg.question} /> : <div className="p-4 rounded-lg bg-[#064e3b] border-l-4 border-green-500"><p>{msg.text}</p></div>}
          </div>
        ))}
      </div>
      <div className="p-6 border-t border-[#2d2d5f] bg-[#16213e]">
        <div className="flex gap-3 items-end">
          <textarea
            className="flex-1 bg-[#0f0f23] border border-gray-700 rounded-lg p-3 text-gray-100 text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Type your response here..."
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          />
          <button onClick={handleSend} className="bg-blue-600 text-white font-medium rounded-lg px-5 py-3 transition hover:bg-blue-700">Send</button>
        </div>
      </div>
    </main>
  );
};


// =========== ANA UYGULAMA BİLEŞENİ (TÜM MANTIĞIN BİRLEŞTİĞİ YER) =========== //

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [domainStatuses, setDomainStatuses] = useState<DomainStatus[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);

  useEffect(() => {
    fetch("http://localhost:3001/questions")
      .then((res) => res.json())
      .then((data: Question[]) => {
        setQuestions(data);
        if (data.length > 0) {
          const firstQuestion = data[0];
          setCurrentQuestionId(firstQuestion.id);
          setMessages([{ sender: 'AI', text: 'Welcome! Let\'s start the assessment.', question: firstQuestion }]);
          
          const initialDomains: DomainStatus[] = [...new Set(data.map(q => q.domain_name))].map(domainName => ({
            name: domainName,
            status: domainName === firstQuestion.domain_name ? 'In Progress' : 'Pending',
            score: 0,
          }));
          setDomainStatuses(initialDomains);
        }
      })
      .catch((err) => console.error("Error fetching questions:", err));
  }, []);

  const handleSendMessage = async (prompt: string) => {
    if (!currentQuestionId) return;
    setMessages(prev => [...prev, { sender: 'User', text: prompt }]);

    try {
      const res = await fetch("http://localhost:3001/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, previous_question_id: currentQuestionId }),
      });
      const apiResponse = await res.json();
      
      const nextQuestion = questions.find(q => q.id === apiResponse.next_question_id);
      
      setMessages(prev => [...prev, { sender: 'AI', text: apiResponse.result, question: nextQuestion }]);
      setCurrentQuestionId(apiResponse.next_question_id);
      
      const answeredQuestion = questions.find(q => q.id === currentQuestionId);
      if (answeredQuestion) {
          setDomainStatuses(prevStatuses => {
              let totalScore = 0;
              const newStatuses = prevStatuses.map(status => {
                  if (status.name === answeredQuestion.domain_name) {
                      const newScore = Math.min(100, status.score + apiResponse.score * 10);
                      totalScore += newScore;
                      
                      const isDomainFinished = nextQuestion?.domain_name !== status.name;
                      return { ...status, score: newScore, status: (isDomainFinished ? 'Complete' : 'In Progress') as DomainStatus['status'] };
                  }
                  if(nextQuestion && status.name === nextQuestion.domain_name){
                      totalScore += status.score;
                      return {...status, status: 'In Progress' as DomainStatus['status']};
                  }
                  totalScore += status.score;
                  return status;
              });

              setOverallScore( (totalScore / newStatuses.length) / 10 );
              return newStatuses;
          });
      }
      
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages(prev => [...prev, { sender: 'AI', text: "Sorry, an error occurred." }]);
    }
  };

  return (
    <div className="bg-[#0f0f23] text-gray-200 font-sans h-screen overflow-hidden flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <ChatPanel messages={messages} onSendMessage={handleSendMessage} />
        <Sidebar statuses={domainStatuses} overallScore={overallScore} />
      </div>
    </div>
  );
};

export default App;