'use me';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      router.push('/admin/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid admin email or password.');
      } else {
        setError(err.message || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@anandhardware.com');
    setPassword('AnandAdmin2026!');
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl space-y-6 border border-slate-100">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg">
            <Wrench className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-navy-950">ANAND HARDWARE</h1>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Admin Management Portal</p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@anandhardware.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Helper */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-[11px] text-slate-400">Need quick demo login credentials?</p>
          <button
            type="button"
            onClick={fillDemoAdmin}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy-950 text-xs font-semibold rounded-lg transition"
          >
            Auto-Fill Demo Admin Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
