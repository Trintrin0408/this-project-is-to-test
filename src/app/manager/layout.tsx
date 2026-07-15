import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="Manager">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
