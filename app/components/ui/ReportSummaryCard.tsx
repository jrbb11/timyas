import React from 'react';

interface ReportSummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const ReportSummaryCard: React.FC<ReportSummaryCardProps> = ({ icon, label, value }) => (
  <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4" role="region" aria-label={label}>
    <div className="text-3xl">{icon}</div>
    <div>
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  </div>
);

export default ReportSummaryCard; 