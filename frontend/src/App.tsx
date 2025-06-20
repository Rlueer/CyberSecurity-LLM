import React, { useEffect, useState, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Question, Message, DomainStatus, AnswerAttempt } from './types';
import Header from './components/Header';
import ChatPanel from './components/ChatPanel';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  // This is now the PERMANENT message store - we never delete from this
  const [messages, setMessages] = useState<Message[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [domainStatuses, setDomainStatuses] = useState<DomainStatus[]>([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

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
      .then(data => {
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("Fetched data is not valid.");
        }
        
        setQuestions(data);
        const firstQuestion = data[0];
        
        // Initialize with the first question
        setMessages([{
          id: uuidv4(),
          sender: 'AI',
          type: 'question',
          question: firstQuestion,
          text: ""
        }]);

        // Initialize domain statuses
        const initialDomains: DomainStatus[] = [...new Set(data.map(q => q.domain_name))]
          .map(name => ({
            name,
            status: name === firstQuestion.domain_name ? 'In Progress' : 'Pending',
            score: 0
          }));
        setDomainStatuses(initialDomains);
      })
      .catch(err => {
        console.error("Error fetching questions:", err);
        setMessages([{
          id: uuidv4(),
          sender: 'AI',
          type: 'error',
          text: "Backend'e bağlanılamadı."
        }]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // UPDATED: Score calculation now works with visible messages only
  const recalculateScores = useCallback((currentVisibleMessages: Message[], allQuestions: Question[]) => {
    if (allQuestions.length === 0) return;

    const domainData: { [key: string]: { score: number; answeredQuestions: Set<number> } } = {};
    const domains = [...new Set(allQuestions.map(q => q.domain_name))];

    domains.forEach(name => {
      domainData[name] = { score: 0, answeredQuestions: new Set() };
    });

    // Only count scores from the visible timeline
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

      return { name, score: Math.min(100, data.score), status };
    });

    const totalScore = newDomainStatuses.reduce((acc, curr) => acc + curr.score, 0);
    setOverallScore(totalScore / (newDomainStatuses.length || 1));
    setDomainStatuses(newDomainStatuses);
  }, []);

  // Recalculate scores whenever visible messages change
  useEffect(() => {
    recalculateScores(visibleMessages, questions);
  }, [visibleMessages, questions, recalculateScores]);

  // NON-DESTRUCTIVE: Only adds to permanent message store
  const handleSendMessage = async (prompt: string) => {
    if (!currentQuestionId || isLoading) return;
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
      text: ""
    };

    // Add to permanent store
    setMessages(prev => [...prev, optimisticUserMessage]);

    try {
      const res = await fetch("http://localhost:3001/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, previous_question_id: currentQuestionId })
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
                text: ""
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
                  text: ""
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

  return (
    <div className="bg-[#0f0f23] text-gray-200 font-sans h-screen flex flex-col">
      <Header />
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
        <Sidebar statuses={domainStatuses} overallScore={overallScore} />
      </div>
    </div>
  );
};

export default App;