import React from 'react';
import { AnswerAttempt } from '../types';
import { usePopover } from '../hooks/usePopover';
import Popover from './Popover';

interface FeedbackMessageProps {
  messageId: string;
  attempt: AnswerAttempt;
  attemptCount: number;
  activeAttemptIndex: number;
  onNavigate: (messageId: string, direction: 'prev' | 'next') => void;
  isLoading: boolean;
}

const FeedbackMessage: React.FC<FeedbackMessageProps> = ({ messageId, attempt, attemptCount, activeAttemptIndex, onNavigate, isLoading }) => {
    // 1. Değişiklik: Popover hook'larını daha anlaşılır isimlerle iki ayrı instance olarak oluşturuyoruz.
    // "AI's Comment" butonu için popover state'i
    const commentPopover = usePopover();
    // "New Task Created" butonu için popover state'i
    const taskPopover = usePopover();

    const canGoPrev = activeAttemptIndex > 0;
    const canGoNext = activeAttemptIndex < attemptCount - 1;

    // 2. Değişiklik: AI yorumu ve puanını birleştiren formatlı bir string oluşturuyoruz.
    // Bu, okunabilirliği artırmak için Popover'a tek bir prop olarak gönderilecek.
    const commentContent = `${attempt.ai_comment} Point: ${attempt.score}/100\n\n`;

    return (
        <div className="p-3 mt-[-5px] ml-8 text-sm text-gray-400 border-l-2 border-gray-700/50 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
              <div className="flex items-center gap-2">
                  <span className="text-emerald-400/80 font-medium">✅ Answer Recorded</span>
                  
                  {/* 1. İstenen Özellik: "New Task Created" butonu ve popover'ı */}
                  {/* Buton, sadece `ai_task` verisi mevcut olduğunda render edilecek. */}
                  {attempt.ai_task && (
                    <>
                      <span className="text-gray-500">|</span>
                      <div className="relative">
                          <button 
                            ref={taskPopover.triggerRef} 
                            onClick={taskPopover.toggle}
                            className="flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded bg-cyan-800/50 text-cyan-300 border border-cyan-700/60 hover:bg-cyan-800/80 transition"
                            disabled={isLoading}
                          >
                             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                             New Task Created
                          </button>
                          {taskPopover.isVisible && (
                            <Popover 
                                content={attempt.ai_task} 
                                coords={taskPopover.coords} 
                                popoverRef={taskPopover.popoverRef as React.RefObject<HTMLDivElement>} 
                                onClose={taskPopover.close} 
                            />
                          )}
                      </div>
                    </>
                  )}
              </div>

              {/* 2. İstenen Özellik: "AI's Comment" puan ile birlikte gösterimi */}
              {attempt.ai_comment && (
                   <div className="relative">
                      <button 
                        ref={commentPopover.triggerRef} 
                        onClick={commentPopover.toggle} 
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded bg-purple-800/50 text-purple-300 border border-purple-700/60 hover:bg-purple-800/80 transition" 
                        disabled={isLoading}
                      >
                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                        AI's Comment
                      </button>
                      {commentPopover.isVisible && (
                        <Popover 
                            content={commentContent} // <-- Puanı içeren formatlı string burada kullanılıyor.
                            coords={commentPopover.coords} 
                            popoverRef={commentPopover.popoverRef as React.RefObject<HTMLDivElement>} 
                            onClose={commentPopover.close} 
                        />
                      )}
                    </div>
              )}
            </div>
            
            {/* Versiyonlar arası geçiş butonları (Değişiklik yok) */}
            {attemptCount > 1 && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onNavigate(messageId, 'prev')} 
                  disabled={!canGoPrev || isLoading}
                  className="p-1 rounded-md text-gray-400 hover:bg-gray-700 disabled:text-gray-600 disabled:bg-transparent disabled:cursor-not-allowed transition"
                  title="Previous Version"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                </button>
                <span className="text-xs font-mono text-gray-500">
                  {activeAttemptIndex + 1} / {attemptCount}
                </span>
                <button 
                  onClick={() => onNavigate(messageId, 'next')} 
                  disabled={!canGoNext || isLoading}
                  className="p-1 rounded-md text-gray-400 hover:bg-gray-700 disabled:text-gray-600 disabled:bg-transparent disabled:cursor-not-allowed transition"
                  title="Next Version"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
                </button>
              </div>
            )}
        </div>
    );
};

export default FeedbackMessage;
