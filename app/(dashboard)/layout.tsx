'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    operador: 'Operador',
    financeiro: 'Financeiro',
  };

  return (
    <div className="flex h-screen bg-[#0f1117] overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 h-14 bg-[#1a1f2e] border-b border-[#2a2f42] flex items-center px-4 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-[#2a2f42] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1" />

          {/* Notifications */}
          <button className="relative text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-[#2a2f42] transition-colors">
            <Bell className="w-5 h-5" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#2a2f42] transition-colors"
            >
              <div className="w-7 h-7 bg-amber-500/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-amber-400" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-slate-200 leading-none">{user?.name || '...'}</p>
                <p className="text-xs text-slate-500 leading-none mt-0.5">{user ? roleLabels[user.role] || user.role : ''}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1f2e] border border-[#2a2f42] rounded-xl shadow-xl z-20 py-1">
                  <div className="px-3 py-2 border-b border-[#2a2f42]">
                    <p className="text-sm font-medium text-slate-200">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
