'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Boxes,
  Users,
  Inbox,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Wrench,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  // Handle Unauthenticated Redirection
  React.useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.push('/admin/login');
    }
  }, [user, loading, isLoginPage, router]);

  if (isLoginPage) {
    return <div className="min-h-screen bg-slate-100">{children}</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-300">Loading Anand Hardware Admin Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  const navGroups = [
    {
      group: 'Overview',
      items: [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      group: 'Catalog',
      items: [
        { name: 'Products', href: '/admin/products', icon: Package },
        { name: 'Categories', href: '/admin/categories', icon: FolderTree },
      ]
    },
    {
      group: 'Sales & Billing',
      items: [
        { name: 'Quotations', href: '/admin/quotations', icon: FileSpreadsheet },
        { name: 'Bills / Invoices', href: '/admin/bills', icon: Receipt },
        { name: 'Payment Logs', href: '/admin/payments', icon: CreditCard },
      ]
    },
    {
      group: 'Inventory',
      items: [
        { name: 'Stock Control', href: '/admin/inventory', icon: Boxes },
      ]
    },
    {
      group: 'CRM & Credit',
      items: [
        { name: 'Customers', href: '/admin/customers', icon: Users },
        { name: 'Inquiries & Leads', href: '/admin/leads', icon: Inbox },
        { name: 'Credit / Udhar', href: '/admin/credit', icon: Wallet },
      ]
    },
    {
      group: 'Analytics & Settings',
      items: [
        { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
        { name: 'Business Settings', href: '/admin/settings', icon: Settings },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-navy-950 text-slate-300 border-r border-navy-900 shrink-0">
        {/* Brand */}
        <div className="p-5 border-b border-navy-900 flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-black text-white tracking-tight block">ANAND HARDWARE</span>
            <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-widest block">Biratnagar • Nepal</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3">
                {group.group}
              </span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'text-slate-400 hover:bg-navy-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-navy-900 flex items-center justify-between bg-navy-900/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-brand-400">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {userProfile?.displayName || user.email?.split('@')[0]}
              </p>
              <p className="text-[10px] font-medium text-slate-400 uppercase">
                {userProfile?.role || 'Staff'}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-navy-800 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="lg:hidden bg-navy-950 text-white px-4 py-3 border-b border-navy-900 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center text-white">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="font-black text-sm tracking-tight">ANAND HARDWARE</span>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-300 hover:text-white bg-navy-900 rounded-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Drawer */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-navy-950/95 text-slate-300 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-navy-800 pb-4">
                <span className="text-base font-black text-white">ANAND HARDWARE</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="space-y-4">
                {navGroups.map((group, idx) => (
                  <div key={idx} className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3">
                      {group.group}
                    </span>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold ${
                            isActive
                              ? 'bg-brand-600 text-white'
                              : 'text-slate-300 hover:bg-navy-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5" />
                            <span>{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </div>

            <div className="pt-6 border-t border-navy-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">{user.email}</p>
                <p className="text-[10px] text-slate-400">Logistics & Billing Staff</p>
              </div>
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  logout();
                }}
                className="px-3 py-2 bg-rose-600/20 text-rose-300 text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}
