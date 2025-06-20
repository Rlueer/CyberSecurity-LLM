import React from 'react';
import { Question } from '../types';
import { usePopover } from '../hooks/usePopover';
import Popover from './Popover';

const QuestionCard: React.FC<{ question: Question }> = ({ question }) => {
    const { isVisible: isHintVisible, toggle: toggleHint, close: closeHint, triggerRef: hintTriggerRef, popoverRef: hintPopoverRef, coords: hintCoords } = usePopover();
    const getCriticalityColor = (level: string) => ({ 'high': 'bg-red-500/20 text-red-400 border-red-500/30', 'medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', 'low': 'bg-blue-500/20 text-blue-400 border-blue-500/30' }[level] || 'bg-gray-500/20 text-gray-400 border-gray-500/30');

    return (
        <div className="bg-[#1e293b] p-4 rounded-lg border-l-4 border-blue-500 leading-relaxed">
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded border ${getCriticalityColor(question.criticality)}`}>Criticality: {question.criticality.toUpperCase()}</span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-gray-600/30 text-gray-300 border border-gray-600/50">Maturity Level: {question.maturity_level}</span>
                <div className="relative">
                    {question.hint && (<button ref={hintTriggerRef} onClick={toggleHint} className="flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded bg-sky-800/50 text-sky-300 border border-sky-700/60 hover:bg-sky-800/80 transition"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>Hint</button>)}
                    {isHintVisible && <Popover content={question.hint} coords={hintCoords} popoverRef={hintPopoverRef as React.RefObject<HTMLDivElement>} onClose={closeHint} />}
                </div>
            </div>
            <p className="font-semibold text-gray-100">{question.question_text}</p>
            <div className="mt-4 border-t border-gray-700/50 pt-3">
                 <p className="text-xs text-gray-500 mb-2">Domain: {question.domain_name} | NIST Function: {question.nist_function}</p>
                 <div className="flex flex-wrap gap-1.5">{question.tags.map(tag => (<span key={tag} className="text-xs px-2 py-0.5 bg-sky-800/50 text-sky-300 rounded-full">{tag}</span>))}</div>
            </div>
        </div>
    );
};

export default QuestionCard;