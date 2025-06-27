import { FaCalendarAlt, FaPlus } from 'react-icons/fa';

interface TopbarProps {
  title: string;
  breadcrumb?: React.ReactNode;
}

export const Topbar = ({ title, breadcrumb }: TopbarProps) => {
  return (
    <header className="flex items-center justify-between bg-white px-6 py-4 shadow border-b">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {breadcrumb && <div className="text-sm text-gray-400 mt-1">{breadcrumb}</div>}
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-300" />
        <span className="font-medium text-sm text-gray-700">Harper Nelson</span>
      </div>
    </header>
  );
};