'use me';
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

  const navItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Categories', href: '/admin/categories', icon: FolderTree },
    { name: 'Inventory Control', href: '/admin/inventory', icon: Boxes },
    { name: 'Customers CRM', href: '/admin/customers', icon: Users },
    { name: 'Leads & Inquiries', href: '/admin/leads', icon: Inbox },
    { name: 'Quotations', href: '/admin/quotations', icon: FileSpreadsheet },
    { name: 'Business Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-navy-950 text-slate-300 border-r border-navy-900 shrink-0">
        {/* Brand */}
        <div className="p-6 border-b border-navy-900 flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-black text-white tracking-tight block">ANAND HARDWARE</span>
            <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-widest block">Admin Management</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-navy-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout Footer */}
        <div className="p-4 border-t border-navy-900 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-navy-800 border border-slate-700 flex items-center justify-center text-brand-400 font-bold text-xs">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-white block truncate">{userProfile?.displayName || 'Admin'}</span>
              <span className="text-[10px] text-slate-400 block truncate">{user.email}</span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-2 bg-navy-900 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs font-semibold rounded-xl transition border border-navy-800"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
              Management Console
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy-950 text-xs font-bold rounded-lg transition"
            >
              View Public Website ↗
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-navy-950/70" onClick={() => setSidebarOpen(false)} />
            <div className="relative w-64 max-w-xs bg-navy-950 text-slate-300 flex flex-col h-full z-10">
              <div className="p-4 flex items-center justify-between border-b border-navy-900">
                <span className="font-bold text-white text-sm">Navigation</span>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-navy-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
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
