// Bu dosyanın içeriğini aşağıdakiyle tamamen değiştirin.

import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import ReactDOM from 'react-dom'; // Popover'lar için gerekli

// Ayırdığımız tipleri ve bileşenleri import ediyoruz
import { Question, Message, DomainStatus } from './types';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [domainStatuses, setDomainStatuses] = useState<DomainStatus[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // State yönetimi ve API çağrı mantığı aynı kalıyor...
  useEffect(() => {
    fetch("http://localhost:3001/questions").then(res => {
        if (!res.ok) throw new Error(`Network response was not ok: ${res.statusText}`);
        return res.json();
    }).then(data => {
      if (!Array.isArray(data) || data.length === 0) throw new Error("Fetched data is not valid.");
      setQuestions(data);
      const firstQuestion = data[0];
      setCurrentQuestionId(firstQuestion.id);
      setMessages([{ id: uuidv4(), sender: 'AI', text: "Welcome!", type: 'question', question: firstQuestion }]);
      const initialDomains: DomainStatus[] = [...new Set(data.map(q => q.domain_name))].map(name => ({ name, status: name === firstQuestion.domain_name ? 'In Progress' : 'Pending', score: 0 }));
      setDomainStatuses(initialDomains);
    }).catch(err => {
      console.error("Error fetching questions:", err);
      setMessages([{ id: uuidv4(), sender: 'AI', text: "Backend'e bağlanılamadı.", type: 'error', question: undefined }]);
    }).finally(() => setIsLoading(false));
  }, []);

  const handleSendMessage = async (prompt: string) => {
    if (!currentQuestionId || isLoading) return;
    setIsLoading(true);

    const userMessage: Message = { id: uuidv4(), sender: 'User', text: prompt, type: 'user_response' };
    setMessages(prev => [...prev, userMessage]);

    try {
      const res = await fetch("http://localhost:3001/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, previous_question_id: currentQuestionId }) });
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const apiResponse = await res.json();
      
      const feedbackMessage: Message = {
          id: uuidv4(),
          sender: 'AI',
          text: 'Feedback for your answer.',
          type: 'feedback',
          ai_comment: apiResponse.comment,
          ai_task: apiResponse.task,
      };
      
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
                      if (!nextQuestion || nextQuestion.domain_name !== status.name) updatedStatus.status = 'Complete';
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
      
      const newMessages: Message[] = [feedbackMessage];
      if (nextQuestion) {
        newMessages.push({ id: uuidv4(), sender: 'AI', text: 'Here is the next question.', type: 'question', question: nextQuestion });
        setCurrentQuestionId(apiResponse.next_question_id);
      } else {
        newMessages.push({ id: uuidv4(), sender: 'AI', text: '🎉 Assessment complete!', type: 'question', question: undefined });
        setCurrentQuestionId(null);
      }
      setMessages(prev => [...prev, ...newMessages]);

    } catch (err) {
      console.error("Error sending message:", err);
      setMessages(prev => [...prev, { id: uuidv4(), sender: 'AI', text: "An error occurred.", type: 'error', question: undefined }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <div className="bg-[#0f0f23] text-gray-200 font-sans h-screen flex flex-col">
    <Header />
    <div className="flex flex-1 overflow-hidden">
      <ChatPanel 
        messages={messages} 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading} 
        currentQuestionId={currentQuestionId} 
      />
      <Sidebar statuses={domainStatuses} overallScore={overallScore} />
    </div>
  </div>
);
};

export default App;