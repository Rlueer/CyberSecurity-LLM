// Header bileşenine bir "Previous" butonu ekleyelim.
const Header: React.FC<{ onPrevious?: () => void; canGoBack: boolean; }> = ({ onPrevious, canGoBack }) => (
  <header className="h-[60px] bg-[#1e1e3f] border-b border-[#2d2d5f] z-50 flex items-center justify-between px-6 flex-shrink-0">
    <div className="text-lg font-semibold text-blue-400">CyberSec Assessment Platform</div>
    <button
      onClick={onPrevious}
      disabled={!canGoBack}
      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-700/50 rounded-md hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
      Previous
    </button>
  </header>
);


export default Header;