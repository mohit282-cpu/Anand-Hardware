'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Package,
  Boxes,
  Users,
  Inbox,
  FileSpreadsheet,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  Clock,
  ChevronRight,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Lead, LeadStatus } from '@/types';
import { Receipt, Wallet, CreditCard, BarChart3 } from 'lucide-react';
import { updateLeadStatus } from '@/lib/supabase/services';

// Lightweight dashboard metrics — only fetches counts and top-5 lists
interface DashboardMetrics {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: { id: string; name: string; sku: string; stock: number; unit: string; lowStockLevel: number }[];
  totalCustomers: number;
  newLeadsCount: number;
  totalLeadsCount: number;
  recentLeads: Lead[];
  pendingQuotations: number;
  totalQuotations: number;
  recentTransactionsCount: number;
  totalOutstandingUdhar: number;
  walkinOutstandingUdhar: number;
  registeredOutstandingUdhar: number;
}

interface DashboardState {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
}

async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  // Run queries in parallel — credit totals now computed server-side via RPC
  const [
    productsCountRes,
    activeProductsRes,
    lowStockRes,
    customersCountRes,
    newLeadsRes,
    totalLeadsRes,
    recentLeadsRes,
    pendingQuotationsRes,
    totalQuotationsRes,
    txnCountRes,
    creditTotalsRes,
  ] = await Promise.all([
    // Total products count
    supabase.from('products').select('id', { count: 'exact', head: true }),
    // Active products count
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('active', true),
    // Low stock products (top 5 only, with minimal columns)
    supabase.from('products')
      .select('id, name, sku, stock, unit, low_stock_level')
      .eq('active', true)
      .or('stock.lte.low_stock_level')
      .order('stock', { ascending: true })
      .limit(10),
    // Total customers count
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    // New leads count
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'NEW'),
    // Total leads count
    supabase.from('leads').select('id', { count: 'exact', head: true }),
    // Recent leads (top 5 with minimal columns)
    supabase.from('leads')
      .select('id, customer_id, customer_name, phone, email, company, product_id, product_name, quantity, message, status, assigned_to, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(5),
    // Pending quotations count (DRAFT or SENT)
    supabase.from('quotations').select('id', { count: 'exact', head: true }).in('status', ['DRAFT', 'SENT']),
    // Total quotations count
    supabase.from('quotations').select('id', { count: 'exact', head: true }),
    // Recent inventory transactions count
    supabase.from('inventory_transactions').select('id', { count: 'exact', head: true }),
    // Outstanding customer balances — computed server-side
    supabase.rpc('get_dashboard_credit_totals'),
  ]);

  const customerBalances = (creditTotalsRes.data || [])[0] as any;
  const totalOutstandingUdhar = Number(customerBalances?.total_outstanding || 0);
  const walkinOutstandingUdhar = Number(customerBalances?.walkin_outstanding || 0);
  const registeredOutstandingUdhar = Number(customerBalances?.registered_outstanding || 0);

  // Filter low stock products client-side (Supabase .or() with column comparison is limited)
  const lowStockProducts = (lowStockRes.data || [])
    .filter((p: any) => p.stock <= p.low_stock_level)
    .slice(0, 5)
    .map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku || '',
      stock: p.stock || 0,
      unit: p.unit || 'pcs',
      lowStockLevel: p.low_stock_level || 10,
    }));

  const recentLeads: Lead[] = (recentLeadsRes.data || []).map((l: any) => ({
    id: l.id,
    customerId: l.customer_id,
    customerName: l.customer_name,
    phone: l.phone,
    email: l.email || '',
    company: l.company || '',
    productId: l.product_id,
    productName: l.product_name,
    quantity: l.quantity,
    message: l.message || '',
    status: l.status,
    assignedTo: l.assigned_to,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
  }));

  return {
    totalProducts: productsCountRes.count ?? 0,
    activeProducts: activeProductsRes.count ?? 0,
    lowStockProducts,
    totalCustomers: customersCountRes.count ?? 0,
    newLeadsCount: newLeadsRes.count ?? 0,
    totalLeadsCount: totalLeadsRes.count ?? 0,
    recentLeads,
    pendingQuotations: pendingQuotationsRes.count ?? 0,
    totalQuotations: totalQuotationsRes.count ?? 0,
    recentTransactionsCount: txnCountRes.count ?? 0,
    totalOutstandingUdhar,
    walkinOutstandingUdhar,
    registeredOutstandingUdhar,
  };
}

export default function AdminDashboardPage() {
  const [state, setState] = useState<DashboardState>({
    metrics: null,
    loading: true,
    error: null,
  });

  const loadDashboardData = useCallback(async () => {
    setState(prev => ({ metrics: null, loading: true, error: null }));
    try {
      const data = await fetchDashboardMetrics();
      setState(prev => ({ metrics: data, loading: false, error: null }));
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setState(prev => ({ metrics: prev.metrics, loading: false, error: err.message || 'Failed to load dashboard data' }));
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const retry = () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    loadDashboardData();
  };

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    try {
      await updateLeadStatus(leadId, status);
      setState(prev => {
        if (!prev?.metrics) return prev;
        return {
          ...prev,
          metrics: {
            ...prev.metrics,
            recentLeads: prev.metrics.recentLeads.map(l =>
              l.id === leadId ? { ...l, status } : l
            ),
          },
        };
      });
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-300">Loading Anand Hardware Admin Portal...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="bg-rose-600/10 border rose-400/20 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-rose-400" />
              <div>
                <p className="font-bold text-rose-600">Error loading dashboard</p>
                <p className="text-sm text-slate-500">{state.error}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={retry}
              className="p-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
            <Link
              href="/admin/quotations/new"
              className="p-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Continue Anyway</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const metrics = state.metrics!;

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950">Dashboard Overview</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time status of Anand Hardware products, inventory, leads & quotations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            className="p-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <Link
            href="/admin/quotations/new"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>New Quotation</span>
          </Link>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Products */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Products</span>
            <div className="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center text-navy-900">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-navy-950">{metrics.totalProducts}</span>
            <span className="text-xs font-semibold text-emerald-600">{metrics.activeProducts} Active</span>
          </div>
          <Link href="/admin/products" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
            <span>Manage Products</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Low Stock Items */}
        <div className={`bg-white rounded-2xl p-6 border shadow-sm space-y-4 ${metrics.lowStockProducts.length > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock Products</span>
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-navy-950">{metrics.lowStockProducts.length}</span>
            <span className="text-xs font-semibold text-amber-700">Needs Replenishment</span>
          </div>
          <Link href="/admin/inventory" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
            <span>Inventory Control</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* New Leads */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">New Inquiries</span>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Inbox className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-navy-950">{metrics.newLeadsCount}</span>
            <span className="text-xs font-semibold text-blue-600">{metrics.totalLeadsCount} Total Leads</span>
          </div>
          <Link href="/admin/leads" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
            <span>View Inquiries CRM</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customers CRM</span>
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-navy-950">{metrics.totalCustomers}</span>
            <span className="text-xs font-semibold text-slate-500">Contractors & Clients</span>
          </div>
          <Link href="/admin/customers" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
            <span>Customer Directory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Outstanding Udhar */}
        <div className="bg-white rounded-2xl p-6 border border-amber-200 bg-amber-50/20 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Credit (Udhar)</span>
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-700">Rs. {metrics.totalOutstandingUdhar.toLocaleString()}</span>
            <span className="text-[11px] font-semibold text-slate-500">
              Walk-in: Rs. {metrics.walkinOutstandingUdhar.toLocaleString()}
            </span>
          </div>
          <Link href="/admin/credit" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
            <span>Manage Udhar Ledgers</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Inventory Stock Status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Transactions</span>
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-black text-navy-950">{metrics.recentTransactionsCount}</span>
            <span className="text-xs font-semibold text-slate-500">Total Movements</span>
          </div>
          <Link href="/admin/inventory" className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1">
            <span>Record Stock Transaction</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* DASHBOARD TABLES & WIDGETS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-navy-950">Low Stock Alert List</h3>
              </div>
              <Link href="/admin/inventory" className="text-xs font-bold text-brand-600 hover:underline">
                Update Stock
              </Link>
            </div>
            {metrics.lowStockProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <span>All product stock levels are above threshold.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {metrics.lowStockProducts.map(prod => (
                  <div key={prod.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <span className="text-xs font-bold text-navy-950 block">{prod.name}</span>
                      <span className="text-[11px] font-mono text-slate-500">SKU: {prod.sku || 'N/A'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-600 block">{prod.stock} {prod.unit}</span>
                      <span className="text-[10px] text-slate-400">Min: {prod.lowStockLevel}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-navy-950">Recent Customer Inquiries</h3>
              </div>
              <Link href="/admin/leads" className="text-xs font-bold text-brand-600 hover:underline">
                View All Leads
              </Link>
            </div>
            {metrics.recentLeads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <span>No customer inquiries received yet.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {metrics.recentLeads.map(lead => (
                  <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <span className="text-xs font-bold text-navy-950 block">{lead.customerName}</span>
                      <span className="text-[11px] text-slate-500">Item: {lead.productName} ({lead.quantity} pcs)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        className="text-xs font-semibold py-1 px-2 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none"
                      >
                        <option value="NEW">NEW</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="QUOTATION">QUOTATION</option>
                        <option value="WON">WON</option>
                        <option value="LOST">LOST</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
