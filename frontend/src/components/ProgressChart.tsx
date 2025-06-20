import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { DomainStatus } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProgressChartProps {
  statuses: DomainStatus[];
}

const ProgressChart: React.FC<ProgressChartProps> = ({ statuses }) => {
  const data = {
    labels: statuses.map(s => s.name),
    datasets: [{
      data: statuses.map(s => s.score || 0.1),
      backgroundColor: statuses.map(s => 
        s.status === 'Complete' ? '#10b981' : 
        s.status === 'In Progress' ? '#3b82f6' : '#6b7280'
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

export default ProgressChart;