import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DomainStatus {
  name: string;
  status: 'Complete' | 'In Progress' | 'Pending';
  score: number;
}

interface SidebarProps {
  statuses: DomainStatus[];
  overallScore: number;
}

const ProgressChart: React.FC<{ statuses: DomainStatus[] }> = ({ statuses }) => {
  const data = {
    labels: statuses.map(s => s.name),
    datasets: [{
      data: statuses.map(s => s.score || 1),
      backgroundColor: statuses.map(s => 
        s.status === 'Complete' ? '#10b981' : 
        s.status === 'In Progress' ? '#3b82f6' : '#374151'
      ),
      borderWidth: 2,
      borderColor: '#1e1e3f',
      cutout: '75%',
    }]
  };
  const options = { 
    responsive: true, 
    maintainAspectRatio: true, 
    plugins: { legend: { display: false } } 
  };
  return <Doughnut data={data} options={options} />;
};

const Sidebar: React.FC<SidebarProps> = ({ statuses, overallScore }) => {
  const getStatusDotColor = (status: DomainStatus['status']) => ({
    'Complete': 'bg-green-500',
    'In Progress': 'bg-blue-500', 
    'Pending': 'bg-yellow-500',
  }[status]);

  const currentDomain = statuses.find(s => s.status === 'In Progress');

  return (
    <aside className="w-full lg:w-[400px] bg-[#1e1e3f] flex flex-col border-t lg:border-t-0 lg:border-l border-[#2d2d5f] overflow-y-auto">
      <div className="p-6 border-b border-[#2d2d5f]">
        <h2 className="text-base font-semibold text-gray-100 mb-4">Assessment Progress</h2>
        <div className="flex flex-col items-center gap-4">
          <div className="w-[180px] h-[180px]">
            <ProgressChart statuses={statuses} />
          </div>
          <div className="text-center -mt-2">
            <div className="text-4xl font-bold text-blue-400">{overallScore.toFixed(1)}</div>
            <div className="text-sm text-gray-400 mt-1">Overall Maturity Score</div>
          </div>
        </div>
      </div>
      
      {currentDomain && (
        <div className="p-6 border-b border-[#2d2d5f]">
          <h2 className="text-base font-semibold text-gray-100 mb-4">Current Domain: {currentDomain.name}</h2>
          <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400" style={{ width: `${currentDomain.score}%` }}></div>
              </div>
              <span className="text-xs text-gray-400">{currentDomain.score}%</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 border-b border-[#2d2d5f]">
        <h2 className="text-base font-semibold text-gray-100 mb-4">Status Indicators</h2>
        <div className="flex flex-col gap-3">
          {statuses.map((domain) => (
            <div key={domain.name} className="flex items-center gap-2.5 p-2 rounded-md bg-[#0f172a] border border-[#334155]">
              <div className={`w-2 h-2 rounded-full ${getStatusDotColor(domain.status)}`}></div>
              <span className="text-sm text-gray-300">{domain.name} - {domain.status}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;