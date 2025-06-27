// app/layouts/AdminLayout.tsx
import type { PropsWithChildren, ReactNode } from 'react';

import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';

interface AdminLayoutProps extends PropsWithChildren {
  title: string;
  breadcrumb?: ReactNode;
}

export const AdminLayout = ({ children, title, breadcrumb }: AdminLayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar title={title} breadcrumb={breadcrumb} />
        <main className="p-6 overflow-y-auto flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;