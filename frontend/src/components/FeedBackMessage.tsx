import React from 'react';
import { Message } from '../types';
import { usePopover } from '../hooks/usePopover';
import Popover from './Popover';

const FeedbackMessage: React.FC<{ message: Message }> = ({ message }) => {
    const { isVisible, toggle, close, triggerRef, popoverRef, coords } = usePopover();
    return (
        <div className="p-3 mt-[-5px] ml-8 text-sm text-gray-400 border-l-2 border-gray-700/50 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
                <span className="text-emerald-400/80 font-medium">✅ Answer Recorded</span>
                <span className="text-gray-500">|</span>
                <span className="text-cyan-400/80 font-medium">📌 New Task Created</span>
            </div>
            {message.ai_comment && (
                 <div className="relative">
                    <button ref={triggerRef} onClick={toggle} className="flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded bg-purple-800/50 text-purple-300 border border-purple-700/60 hover:bg-purple-800/80 transition">
                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                      AI's Comment
                    </button>
                    {isVisible && <Popover content={message.ai_comment} coords={coords} popoverRef={popoverRef as React.RefObject<HTMLDivElement>} onClose={close} />}
                  </div>
            )}
        </div>
    );
};

export default FeedbackMessage;