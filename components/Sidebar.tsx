'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  DollarSign,
  Users,
  Truck,
  Building2,
  BarChart3,
  X,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ciots', label: 'CIOTs', icon: FileText },
  { href: '/pef', label: 'PEF', icon: DollarSign },
  { href: '/transportadores', label: 'Transportadores', icon: Users },
  { href: '/veiculos', label: 'Veículos', icon: Truck },
  { href: '/contratantes', label: 'Contratantes', icon: Building2 },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-[#1a1f2e] border-r border-[#2a2f42]
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2f42]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Truck className="w-4 h-4 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-100">FreteControl</span>
              <p className="text-[10px] text-slate-500 leading-none">CIOT &amp; PEF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-500 hover:text-slate-200 p-1 rounded-lg hover:bg-[#2a2f42]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-150 group
                  ${isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-[#2a2f42] border border-transparent'
                  }
                `}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                {item.label}
                {isActive && (
                  <ChevronRight className="w-3 h-3 ml-auto text-amber-400/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#2a2f42]">
          <p className="text-xs text-slate-600 text-center">
            v1.0.0 · FreteControl
          </p>
        </div>
      </aside>
    </>
  );
}
