import React from 'react';
import ReactDOM from 'react-dom';

interface PopoverProps {
  content: string;
  coords: { top: number; left: number } | null;
  popoverRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
}

const Popover: React.FC<PopoverProps> = ({ content, coords, popoverRef, onClose }) => {
  if (!coords || !content) return null;

  return ReactDOM.createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[999] w-72 bg-[#2a3a51] rounded-lg shadow-xl ring-1 ring-black/5 p-3 animate-fadeIn"
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <button onClick={onClose} className="absolute top-1 right-1 text-gray-400 hover:text-white transition-colors">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
      </button>
      <p className="text-sm text-gray-200 pr-4">{content}</p>
    </div>,
    document.body
  );
};

export default Popover;