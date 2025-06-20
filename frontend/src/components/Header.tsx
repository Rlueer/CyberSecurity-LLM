import React from 'react';

const Header: React.FC = () => (
  <header className="h-[60px] bg-[#1e1e3f] border-b border-[#2d2d5f] z-50 flex items-center justify-between px-6 flex-shrink-0">
    <div className="text-lg font-semibold text-blue-400">CyberSec Assessment Platform</div>
    <div className="text-sm text-gray-400">Assessment Session #2025-001</div>
  </header>
);

export default Header;