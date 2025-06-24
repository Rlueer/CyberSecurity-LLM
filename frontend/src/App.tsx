import React, { useEffect, useState, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Question, Message, DomainStatus, AnswerAttempt } from './types';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import Sidebar from './components/Sidebar';
import Login from './components/Login';


const getProficiencyLabel = (score: number): 'Mature' | 'Developing' | 'Foundational' => {
    if (score >= 75) return 'Mature';
    if (score >= 40) return 'Developing';
    return 'Foundational';
  };


const App: React.FC = () => {
  // This is now the PERMANENT message store - we never delete from this
  const [messages, setMessages] = useState<Message[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [domainStatuses, setDomainStatuses] = useState<DomainStatus[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  // NEW: State to hold the total number of unique domains
  const [totalDomains, setTotalDomains] = useState(0);
  // State for the main progress counter
  const [mainProgress, setMainProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  
  const [domainProgress, setDomainProgress] = useState<{
    current: number;
    total: number;
    estimate: number;
  }>({ current: 0, total: 0, estimate: 0 });

  // Login state
  const [user, setUser] = useState<{ username: string; sector: string; userId: string } | null>(null);

  // CORE NEW FUNCTION: The "Timeline Walker" 
  // This calculates which messages should be visible based on active attempt selections
  const getVisibleMessages = useCallback((allMessages: Message[]): Message[] => {
    if (allMessages.length === 0) return [];
    
    const visible: Message[] = [];
    // Always start with the first question
    visible.push(allMessages[0]);

    while (true) {
      const lastVisible = visible[visible.length - 1];

      if (lastVisible.type === 'question') {
        // Look for a user response to this question
        const response = allMessages.find(m => 
          m.type === 'user_response' && 
          m.answeredQuestionId === lastVisible.question?.id &&
          m.activeAttemptIndex !== undefined && 
          m.activeAttemptIndex >= 0 // Only include messages with valid active attempt
        );
        
        if (response) {
          visible.push(response);
        } else {
          // No response found, this is where the visible timeline ends
          break;
        }
      } else if (lastVisible.type === 'user_response') {
        // Get the active attempt to find the next question
        const activeAttempt = lastVisible.attempts?.[lastVisible.activeAttemptIndex ?? 0];
        
        if (!activeAttempt || activeAttempt.next_question_id === null) {
          // This branch ends here (assessment complete)
          break;
        }

        // Find the next question in our permanent message store
        const nextQuestion = allMessages.find(m => 
          m.type === 'question' && 
          m.question?.id === activeAttempt.next_question_id
        );
        
        if (nextQuestion) {
          visible.push(nextQuestion);
        } else {
          // Question not found in permanent store, timeline ends here
          break;
        }
      } else {
        // Other message types (like error messages) end the timeline
        break;
      }
    }

    return visible;
  }, []);

  // DERIVED STATE: Calculate visible messages and current question from permanent store
  const visibleMessages = useMemo(() => getVisibleMessages(messages), [messages, getVisibleMessages]);
  
  const currentQuestionId = useMemo(() => {
    const lastVisible = visibleMessages[visibleMessages.length - 1];
    return lastVisible?.type === 'question' ? lastVisible.question?.id ?? null : null;
  }, [visibleMessages]);

  // Initial data fetching
  useEffect(() => {
        fetch("http://localhost:3001/questions")
            .then(res => {
                if (!res.ok) throw new Error(`Network response was not ok: ${res.statusText}`);
                return res.json();
            })
            .then((data: Question[]) => {
                if (!Array.isArray(data) || data.length === 0) {
                    throw new Error("Fetched data is not valid.");
                }
                
                setQuestions(data);
                const uniqueDomains = [...new Set(data.map(q => q.domain_name))];
                setTotalDomains(uniqueDomains.length);

                const firstQuestion = data.find(q => q.id === 1) || data[0];
                
                // Add the first question with a timestamp
                setMessages([{
                    id: uuidv4(),
                    sender: 'AI',
                    type: 'question',
                    question: firstQuestion,
                    text: "",
                    timestamp: Date.now()
                }]);
                
                // FIX: Initialize DomainStatus with all required properties to prevent type errors.
                const initialDomains: DomainStatus[] = uniqueDomains.map(name => ({
                  name,
                  status: 'Pending',
                  score: 0, 
                  proficiency: 'Pending',
                  answeredInDomain: 0,
                  timeTaken: null
                }));
                setDomainStatuses(initialDomains);
            })
            .catch(err => {
                console.error("Error fetching questions:", err);
            })
            .finally(() => setIsLoading(false));
    }, []);


  useEffect(() => {
        if (questions.length === 0 || totalDomains === 0) return;

        // 1. Calculate overall assessment progress
        const answeredQuestionsCount = visibleMessages.filter(m => m.type === 'user_response').length;
        setMainProgress({
            current: answeredQuestionsCount,
            total: totalDomains * 3
        });
        
        const lastQuestionMsg = [...visibleMessages].reverse().find(m => m.type === 'question' && m.question);
        const currentDomainName = lastQuestionMsg?.question?.domain_name;

        // 2. Calculate the status of each domain
        const newStatuses: DomainStatus[] = [...new Set(questions.map(q => q.domain_name))].map(domainName => {
            const domainResponsesInPath = visibleMessages.filter(m => 
                m.type === 'user_response' && questions.find(q => q.id === m.answeredQuestionId)?.domain_name === domainName
            );
            
            const answeredInDomain = Math.min(domainResponsesInPath.length, 3);
            
            let status: 'Complete' | 'In Progress' | 'Pending' = 'Pending';
            if (domainName === currentDomainName && answeredInDomain < 3) {
                status = 'In Progress';
            } else if (answeredInDomain >= 3) {
                status = 'Complete';
            } else if (answeredInDomain > 0 && domainName !== currentDomainName) {
                status = 'Complete';
            }

            // Calculate time taken for completed domains
            let timeTaken = null;
            if (status === 'Complete' && answeredInDomain > 0) {
                const domainQuestionsInPath = visibleMessages.filter(m => m.type === 'question' && m.question?.domain_name === domainName);
                if (domainQuestionsInPath.length > 0) {
                    const firstQuestionTimestamp = domainQuestionsInPath[0].timestamp;
                    const lastResponseTimestamp = domainResponsesInPath[answeredInDomain - 1].timestamp;
                    const diffMs = lastResponseTimestamp - firstQuestionTimestamp;
                    timeTaken = Math.max(1, Math.ceil(diffMs / 60000)); // Show at least 1 minute
                }
            }

            // Calculate score for the domain
            const totalQuestionsInDomainDB = questions.filter(q => q.domain_name === domainName).length;
            const questionWeight = totalQuestionsInDomainDB > 0 ? 100 / totalQuestionsInDomainDB : 0;
            let domainScore = 0;
            domainResponsesInPath.forEach(msg => {
                const activeAttempt = msg.attempts?.[msg.activeAttemptIndex || 0];
                if (activeAttempt) {
                    domainScore += (activeAttempt.score / 100) * questionWeight;
                }
            });
            
            const proficiency = status === 'Complete' ? getProficiencyLabel(domainScore) : (status === 'In Progress' ? 'In Progress' : 'Pending');

            // FIX: Return a complete DomainStatus object with all required properties.
            return { name: domainName, status, score: Math.min(100, domainScore), proficiency, answeredInDomain, timeTaken };
        });

        setDomainStatuses(newStatuses);
        
        // 3. Calculate overall score
        const completedDomains = newStatuses.filter(d => d.status === 'Complete');
        const totalScore = completedDomains.reduce((acc, curr) => acc + curr.score, 0);
        setOverallScore(completedDomains.length > 0 ? totalScore / completedDomains.length : 0);

    }, [visibleMessages, questions, totalDomains]);

  // UPDATED: Score calculation now works with visible messages only
const recalculateScores = useCallback((currentVisibleMessages: Message[], allQuestions: Question[]) => {
  if (allQuestions.length === 0) return;

  const domainData: { [key: string]: { score: number; answeredQuestions: Set<number> } } = {};
  const domains = [...new Set(allQuestions.map(q => q.domain_name))];

  domains.forEach(name => {
    domainData[name] = { score: 0, answeredQuestions: new Set() };
  });

  for (const msg of currentVisibleMessages) {
    if (msg.type === 'user_response' && msg.answeredQuestionId && msg.attempts && msg.activeAttemptIndex !== undefined) {
      const question = allQuestions.find(q => q.id === msg.answeredQuestionId);
      if (question) {
        domainData[question.domain_name].answeredQuestions.add(question.id);
      }
    }
  }

  domains.forEach(name => {
    const totalQuestionsInDomain = allQuestions.filter(q => q.domain_name === name).length;
    const questionWeight = 100 / (totalQuestionsInDomain || 1);
    let domainScore = 0;

    currentVisibleMessages
      .filter(m => m.type === 'user_response' && m.answeredQuestionId && domainData[name].answeredQuestions.has(m.answeredQuestionId))
      .forEach(msg => {
        const activeAttempt = msg.attempts?.[msg.activeAttemptIndex || 0];
        if (activeAttempt) {
          domainScore += (activeAttempt.score / 100) * questionWeight;
        }
      });
    
    domainData[name].score = domainScore;
  });

  const lastQuestionMsg = [...currentVisibleMessages].reverse().find(m => m.type === 'question' && m.question);
  const currentDomainName = lastQuestionMsg?.question?.domain_name;

  const newDomainStatuses: DomainStatus[] = domains.map(name => {
    const data = domainData[name];
    const answeredCount = data.answeredQuestions.size;
    const totalCount = allQuestions.filter(q => q.domain_name === name).length;
    let status: 'Complete' | 'In Progress' | 'Pending' = 'Pending';

    if (answeredCount > 0) {
      status = (answeredCount >= totalCount || name !== currentDomainName) ? 'Complete' : 'In Progress';
    } else if (name === currentDomainName) {
      status = 'In Progress';
    }

    // ✅ Calculate time taken for completed domains
    let timeTaken = null;
    if (status === 'Complete' && answeredCount > 0) {
      const domainQuestionsInPath = currentVisibleMessages.filter(m => 
        m.type === 'question' && m.question?.domain_name === name
      );
      const domainResponsesInPath = currentVisibleMessages.filter(m => 
        m.type === 'user_response' && allQuestions.find(q => q.id === m.answeredQuestionId)?.domain_name === name
      );
      
      const firstQuestionTimestamp = domainQuestionsInPath[0]?.timestamp;
      const lastResponseTimestamp = domainResponsesInPath[domainResponsesInPath.length - 1]?.timestamp;

      if (firstQuestionTimestamp && lastResponseTimestamp) {
        const diffMs = lastResponseTimestamp - firstQuestionTimestamp;
        timeTaken = Math.ceil(diffMs / 60000); // To nearest minute
      }
    }

    // ✅ Calculate proficiency based on status and score
    const proficiency = status === 'Complete' 
      ? getProficiencyLabel(data.score) 
      : (status === 'In Progress' ? 'In Progress' : 'Pending');

    // YENİ: Aktif domain için ilerleme ve süre hesaplaması
    if (status === 'In Progress') {
      const remaining = totalCount - answeredCount;
      const estimate = remaining * 2; // Her soruya ortalama 2 dakika
      setDomainProgress({
        current: answeredCount + 1,
        total: totalCount,
        estimate: estimate
      });
    }

    // ✅ Return complete DomainStatus object
    return { 
      name, 
      score: Math.min(100, data.score), 
      status,
      proficiency: proficiency as 'Mature' | 'Developing' | 'Foundational' | 'In Progress' | 'Pending',
      answeredInDomain: answeredCount,
      timeTaken: timeTaken
    };
  });

  const totalScore = newDomainStatuses.reduce((acc, curr) => acc + curr.score, 0);
  setOverallScore(totalScore / (newDomainStatuses.length || 1));
  setDomainStatuses(newDomainStatuses);

  // YENİ: Kümülatif ve yol-bazlı ilerleme sayacı mantığı
  if (currentDomainName) {
    const completedDomainsCount = newDomainStatuses.filter(d => d.status === 'Complete').length;
    
    // Görünen mesajlar içinden aktif domaine ait cevaplanmış soru sayısı
    const answeredInCurrentDomainPath = currentVisibleMessages.filter(msg => 
      msg.type === 'user_response' && allQuestions.find(q => q.id === msg.answeredQuestionId)?.domain_name === currentDomainName
    ).length;
    
    const currentStepNumerator = (completedDomainsCount * 3) + answeredInCurrentDomainPath + 1;
    const currentStepDenominator = (completedDomainsCount + 1) * 3;

    const remainingInPath = 3 - (answeredInCurrentDomainPath + 1);
    const estimate = (remainingInPath < 0 ? 0 : remainingInPath) * 2; // Her soruya 2 dakika

    setDomainProgress({
      current: currentStepNumerator,
      total: currentStepDenominator,
      estimate: estimate
    });
  }

}, []);


  // Recalculate scores whenever visible messages change
  useEffect(() => {
    recalculateScores(visibleMessages, questions);
  }, [visibleMessages, questions, recalculateScores]);

  // NON-DESTRUCTIVE: Only adds to permanent message store
  const handleSendMessage = async (prompt: string) => {
    if (!currentQuestionId || isLoading || !user) return;
    setIsLoading(true);

    // Create optimistic message
    const optimisticUserMessage: Message = {
      id: uuidv4(),
      sender: 'User',
      type: 'user_response',
      answeredQuestionId: currentQuestionId,
      attempts: [{
        text: prompt,
        score: 0,
        ai_comment: "...",
        ai_task: "...",
        db_answer_id: -1,
        next_question_id: null
      }],
      activeAttemptIndex: 0,
      text: "",
      timestamp: Date.now()
    };

    // Add to permanent store
    setMessages(prev => [...prev, optimisticUserMessage]);

    try {
      const res = await fetch("http://localhost:3001/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, previous_question_id: currentQuestionId, user_id: user.userId })
      });
      
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const apiResponse = await res.json();

      const newAttempt: AnswerAttempt = {
        text: prompt,
        score: apiResponse.score,
        ai_comment: apiResponse.comment,
        ai_task: apiResponse.task,
        db_answer_id: apiResponse.db_answer_id,
        next_question_id: apiResponse.next_question_id,
      };

      setMessages(currentMessages => {
        const updatedMessages = [...currentMessages];
        
        // Update the optimistic message with real data
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        if (lastMessage.type === 'user_response') {
          lastMessage.attempts = [newAttempt];
        }

        // Add next question if it doesn't exist in permanent store
        if (apiResponse.next_question_id !== null) {
          const nextQuestionExists = updatedMessages.some(m => 
            m.type === 'question' && m.question?.id === apiResponse.next_question_id
          );
          
          if (!nextQuestionExists) {
            const nextQuestion = questions.find(q => q.id === apiResponse.next_question_id);
            if (nextQuestion) {
              updatedMessages.push({
                id: uuidv4(),
                sender: 'AI',
                type: 'question',
                question: nextQuestion,
                text: "",
                timestamp: Date.now()
              });
            }
          }
        }

        return updatedMessages;
      });

    } catch (err) {
      console.error("Error sending message:", err);
      // Revert optimistic update on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  // BRANCH LOGIC: Create new branch when editing
  const handleEditMessage = useCallback(async (messageId: string, newText: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.answeredQuestionId) return;

    setIsLoading(true);
    setEditingMessageId(null);

    try {
      const res = await fetch("http://localhost:3001/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: newText,
          previous_question_id: message.answeredQuestionId
        }),
      });
      
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
      const apiResponse = await res.json();

      const newAttempt: AnswerAttempt = {
        text: newText,
        score: apiResponse.score,
        ai_comment: apiResponse.comment,
        ai_task: apiResponse.task,
        db_answer_id: apiResponse.db_answer_id,
        next_question_id: apiResponse.next_question_id,
      };

      setMessages(currentMessages => {
        const updatedMessages = [...currentMessages];
        const messageToUpdate = updatedMessages.find(m => m.id === messageId);
        
        if (messageToUpdate) {
          // BRANCH LOGIC: Replace attempts completely (start new branch)
          messageToUpdate.attempts = [newAttempt];
          messageToUpdate.activeAttemptIndex = 0;

          // Add next question if it doesn't exist and is needed
          if (apiResponse.next_question_id !== null) {
            const nextQuestionExists = updatedMessages.some(m =>
              m.type === 'question' &&
              m.question?.id === apiResponse.next_question_id &&
              m.sender === 'AI'
            );
            
            if (!nextQuestionExists) {
              const nextQuestion = questions.find(q => q.id === apiResponse.next_question_id);
              if (nextQuestion) {
                updatedMessages.push({
                  id: uuidv4(),
                  sender: 'AI',
                  type: 'question',
                  question: nextQuestion,
                  text: "",
                  timestamp: Date.now()
                });
              }
            }
          }
        }

        return updatedMessages;
      });

    } catch (err) {
      console.error("Error while editing message:", err);
    } finally {
      setIsLoading(false);
    }
  }, [messages, questions]);

  // BRANCH NAVIGATION: Switch between different attempts (branches)
  const handleNavigateAttempt = (messageId: string, direction: 'prev' | 'next') => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.attempts || message.attempts.length <= 1) return;

    const currentIndex = message.activeAttemptIndex ?? 0;
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % message.attempts.length
      : (currentIndex - 1 + message.attempts.length) % message.attempts.length;

    setMessages(currentMessages =>
      currentMessages.map(m =>
        m.id === messageId
          ? { ...m, activeAttemptIndex: newIndex }
          : m
      )
    );
  };

  // TIMELINE NAVIGATION: Go back by deactivating the last response
  const handlePreviousQuestion = () => {
    // Find the last user response in the visible timeline
    const visibleResponses = visibleMessages.filter(m => m.type === 'user_response');
    if (visibleResponses.length === 0) return;

    const lastResponse = visibleResponses[visibleResponses.length - 1];
    
    // Find this response in the permanent store and "deactivate" it
    setMessages(currentMessages => {
      const updatedMessages = [...currentMessages];
      const responseToModify = updatedMessages.find(m => m.id === lastResponse.id);
      
      if (responseToModify) {
        // Set to invalid attempt index to hide from visible timeline
        responseToModify.activeAttemptIndex = -1;
      }

      return updatedMessages;
    });
  };

  // PDF and Redmine handlers
  const handleCreatePdfReport = async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:3001/report/pdf?user_id=${encodeURIComponent(user.userId)}`);
      if (!response.ok) throw new Error('Failed to generate PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assessment-report-${user.username}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      //alert('Failed ssssssto download PDF report.');
    }
  };

  const handleAssignRedmineTasks = async () => {
    if (!user) return;
    try {
      const response = await fetch(`http://localhost:3001/redmine/assign?user_id=${encodeURIComponent(user.userId)}`);
      const data = await response.json();
      alert(data.message || 'Redmine tasks assigned!');
    } catch (err) {
      alert('Failed to assign Redmine tasks.');
    }
  };

  if (!user) {
    return <Login onLogin={(username, sector, userId) => setUser({ username, sector, userId })} />;
  }

  return (
    <div className="bg-[#0f0f23] text-gray-200 font-sans h-screen flex flex-col">
      <Header username={user.username} sector={user.sector} />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <ChatPanel
          messages={visibleMessages}  // Only pass visible messages to UI
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          currentQuestionId={currentQuestionId}
          editingMessageId={editingMessageId}
          setEditingMessageId={setEditingMessageId}
          onEditMessage={handleEditMessage}
          onNavigateAttempt={handleNavigateAttempt}
        />
        {/* YENİ: Sidebar'a domainProgress prop'u eklendi */}
        <Sidebar 
          statuses={domainStatuses} 
          overallScore={overallScore}
          mainProgress={domainProgress}
          onCreatePdfReport={handleCreatePdfReport}
          onAssignRedmineTasks={handleAssignRedmineTasks}
        />
      </div>
    </div>
  );
};

export default App;