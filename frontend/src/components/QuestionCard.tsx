import React from 'react';
import { Question } from '../types'; // Tipleri buradan al
import { usePopover } from '../hooks/usePopover'; // Hook'u import et

interface QuestionCardProps {
  question: Question;
  ai_comment?: string; // Opsiyonel olarak AI yorumunu al
}

// Ayrı bir Popover bileşeni oluşturalım
const Popover: React.FC<{
  content: string;
  popoverRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
    }> = ({ content, popoverRef, onClose }) => (
    <div
      ref={popoverRef}
      className="absolute z-50 w-72 bg-[#2a3a51] rounded-lg shadow-xl ring-1 ring-black/5 bottom-full mb-3 left-1/2 -translate-x-1/2 p-3 animate-fadeIn"
    >
      <button onClick={onClose} className="absolute top-1 right-1 text-gray-400 hover:text-white">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
      </button>
      <p className="text-sm text-gray-200 pr-4">{content}</p>
    </div>
);


const QuestionCard: React.FC<QuestionCardProps> = ({ question, ai_comment }) => {
  const { isVisible: isHintVisible, toggle: toggleHint, close: closeHint, triggerRef: hintTriggerRef, popoverRef: hintPopoverRef } = usePopover();
  const { isVisible: isCommentVisible, toggle: toggleComment, close: closeComment, triggerRef: commentTriggerRef, popoverRef: commentPopoverRef } = usePopover();

  // ... (getCriticalityColor fonksiyonu aynı)
  const getCriticalityColor = (level: string) => ({
    'high': 'bg-red-500/20 text-red-400 border-red-500/30',
    'medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'low': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }[level] || 'bg-gray-500/20 text-gray-400 border-gray-500/30');

  return (
    <div className="bg-[#1e293b] p-4 rounded-lg border-l-4 border-blue-500 leading-relaxed">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* ... (Criticality ve Maturity Level span'leri aynı) */}
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded border ${getCriticalityColor(question.criticality)}`}>Criticality: {question.criticality.toUpperCase()}</span>
        <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-gray-600/30 text-gray-300 border border-gray-600/50">Maturity Level: {question.maturity_level}</span>
        
        {/* HINT BUTONU */}
        <div className="relative">
          <button ref={hintTriggerRef} onClick={toggleHint} className="flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded bg-sky-800/50 text-sky-300 border border-sky-700/60 hover:bg-sky-800/80 transition">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
            Hint
          </button>
          {isHintVisible && <Popover content={question.hint} popoverRef={hintPopoverRef} onClose={closeHint} />}
        </div>

        {/* YENİ: AI's Comment Butonu (sadece yorum varsa görünür) */}
        {ai_comment && (
          <div className="relative">
            <button ref={commentTriggerRef} onClick={toggleComment} className="flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded bg-purple-800/50 text-purple-300 border border-purple-700/60 hover:bg-purple-800/80 transition">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 3a1 1 0 011 1v1.162a3.765 3.765 0 012.338 2.338V8.5a1 1 0 112 0v-.001a5.765 5.765 0 00-4.338-4.338V3a1 1 0 01-1-1zm0 14a1 1 0 01-1-1v-1.162a3.765 3.765 0 01-2.338-2.338V8.5a1 1 0 11-2 0v.001a5.765 5.765 0 004.338 4.338V17a1 1 0 011-1zM3 10a1 1 0 011-1h1.162a3.765 3.765 0 012.338-2.338V6.5a1 1 0 112 0v.001a5.765 5.765 0 00-4.338 4.338H3a1 1 0 01-1-1zm14 0a1 1 0 01-1 1h-1.162a3.765 3.765 0 01-2.338 2.338V13.5a1 1 0 11-2 0v-.001a5.765 5.765 0 004.338-4.338H17a1 1 0 011-1z"></path></svg>
              AI's Comment
            </button>
            {isCommentVisible && <Popover content={ai_comment} popoverRef={commentPopoverRef} onClose={closeComment} />}
          </div>
        )}
      </div>
      {/* ... (kartın geri kalanı aynı) */}
      <p className="font-semibold text-gray-100">{question.question_text}</p>
      <div className="mt-4 border-t border-gray-700/50 pt-3">
         <p className="text-xs text-gray-500 mb-2">Domain: {question.domain_name} | NIST Function: {question.nist_function} | NIST Category: {question.related_nist_category}</p>
         <div className="flex flex-wrap gap-1.5">{question.tags.map(tag => (<span key={tag} className="text-xs px-2 py-0.5 bg-sky-800/50 text-sky-300 rounded-full">{tag}</span>))}</div>
      </div>
    </div>
  );
};

export default QuestionCard;