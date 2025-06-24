import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { DomainStatus } from '../types';
import ProgressChart from './ProgressChart';

ChartJS.register(ArcElement, Tooltip, Legend);

interface SidebarProps {
  statuses: DomainStatus[];
  overallScore: number;
  mainProgress: {
    current: number;
    total: number;
  };
  onCreatePdfReport?: () => void;
  onAssignRedmineTasks?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ statuses, overallScore, mainProgress, onCreatePdfReport, onAssignRedmineTasks }) => {
  const getStatusDotColor = (status: DomainStatus['status']) => ({
    'Complete': 'bg-green-500',
    'In Progress': 'bg-blue-500', 
    'Pending': 'bg-gray-500',
  }[status]);

  const getProficiencyColor = (proficiency: DomainStatus['proficiency']) => {
    switch(proficiency) {
        case 'Mature': return 'text-green-400';
        case 'Developing': return 'text-yellow-400';
        case 'Foundational': return 'text-red-400';
        case 'In Progress': return 'text-blue-400';
        default: return 'text-gray-500';
    }
  }

  const currentDomain = statuses.find(s => s.status === 'In Progress');

  return (
    <aside className="hidden lg:flex w-full lg:w-[400px] bg-[#1e1e3f] flex-col border-t lg:border-t-0 lg:border-l border-[#2d2d5f] overflow-y-auto">
      {/* --- Overall Progress Section --- */}
      <div className="p-6 border-b border-[#2d2d5f]">
        <h2 className="text-base font-semibold text-gray-100 mb-4">Assessment Progress</h2>
        <div className="flex flex-col items-center gap-4">
          <div className="w-[170px] h-[170px] relative">
            <ProgressChart statuses={statuses} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold text-blue-400">{overallScore.toFixed(0)}</div>
                <div className="text-xs text-gray-400 mt-1">Overall Score</div>
            </div>
          </div>
          {/* NEW: Main progress counter */}
          <div className='w-full text-center'>
            <span className='text-sm text-gray-300'>Assessment Step:</span>
            <span className='text-lg font-bold text-white ml-2'>{mainProgress.current} / {mainProgress.total}</span>
          </div>
        </div>
      </div>
      
      {/* --- PDF/Redmine Buttons --- */}
      <div className="p-6 border-b border-[#2d2d5f] flex flex-col gap-3">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
          onClick={onCreatePdfReport}
        >
          Create PDF Report
        </button>
        <button
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition"
          onClick={onAssignRedmineTasks}
        >
          Assign Redmine Tasks
        </button>
      </div>
      
      {/* --- Active Domain Section --- */}
      {currentDomain && (
        <div className="p-6 border-b border-[#2d2d5f] bg-black/10">
          <h2 className="text-base font-semibold text-gray-100 mb-3">Active Domain: {currentDomain.name}</h2>
          <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
              <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-300">Domain Score</span>
                  <span className="text-sm font-semibold text-blue-400">{currentDomain.score.toFixed(0)}%</span>
              </div>
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ width: `${currentDomain.score}%` }}></div>
              </div>
          </div>
        </div>
      )}

      {/* --- Domain Status List --- */}
      <div className="p-6">
        <h2 className="text-base font-semibold text-gray-100 mb-4">Domain Statuses</h2>
        <div className="flex flex-col gap-3">
          {statuses.map((domain) => (
            <div key={domain.name} className={`flex items-center gap-3 p-3 rounded-md transition-all
              ${domain.status === 'In Progress' 
                ? 'bg-blue-500/10 border border-blue-500/50' 
                : 'bg-[#0f172a]/50 border border-transparent'}`
            }>
              <div className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(domain.status)} flex-shrink-0 mt-1 self-start`}></div>
              <div className="flex-1">
                <span className="text-sm text-gray-200 font-medium truncate">{domain.name}</span>
                {/* NEW: Domain-specific progress and time */}
                <div className="text-xs text-gray-400 flex items-center gap-3 mt-1">
                    {domain.status !== 'Pending' && (
                        <span>Questions: <strong>{domain.answeredInDomain}/3</strong></span>
                    )}
                    {domain.timeTaken !== null && domain.timeTaken > 0 && (
                        <span>Time: <strong>~{domain.timeTaken} min</strong></span>
                    )}
                </div>
              </div>
              {/* NEW: English proficiency label */}
              <div className={`text-xs font-semibold ${getProficiencyColor(domain.proficiency)}`}>
                {domain.proficiency}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
