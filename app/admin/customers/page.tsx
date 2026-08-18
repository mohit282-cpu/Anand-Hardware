'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users, Search, Plus, Edit2, Trash2, X, Phone, Mail, Building, MapPin, FileText, CheckCircle2 } from 'lucide-react';
import { customerSchema, CustomerFormValues } from '@/lib/validation/schemas';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getLeads, getQuotations } from '@/lib/firestore/services';
import { Customer, Lead, Quotation } from '@/types';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      company: '',
      address: '',
      notes: '',
    },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [cData, lData, qData] = await Promise.all([
        getCustomers(),
        getLeads(),
        getQuotations(),
      ]);
      setCustomers(cData);
      setLeads(lData);
      setQuotations(qData);
    } catch (err) {
      console.error('Error loading customer CRM:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingCustomer(null);
    reset({
      name: '',
      phone: '',
      email: '',
      company: '',
      address: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    reset({
      name: c.name,
      phone: c.phone,
      email: c.email || '',
      company: c.company || '',
      address: c.address || '',
      notes: c.notes || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (values: CustomerFormValues) => {
    setSubmitting(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, values);
        setToastMsg('Customer details updated.');
      } else {
        await createCustomer(values);
        setToastMsg('New customer profile created.');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Customer save error:', err);
      alert(err.message || 'Failed to save customer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer record?')) return;
    try {
      await deleteCustomer(id);
      if (selectedCustomer?.id === id) setSelectedCustomer(null);
      setToastMsg('Customer deleted.');
      loadData();
    } catch (err) {
      console.error('Failed to delete customer:', err);
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.company && c.company.toLowerCase().includes(q))
    );
  });

  // Get customer specific activity
  const customerLeads = selectedCustomer ? leads.filter(l => l.phone === selectedCustomer.phone || l.customerId === selectedCustomer.id) : [];
  const customerQuotations = selectedCustomer ? quotations.filter(q => q.customer?.phone === selectedCustomer.phone || q.customerId === selectedCustomer.id) : [];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="flex items-center justify-between p-4 bg-emerald-900 text-white text-xs font-semibold rounded-xl shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="p-1 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950">Customer Directory & CRM</h1>
          <p className="text-xs text-slate-500 mt-1">Manage contractor contacts, clients, inquiry logs, and customized notes.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone number, or company..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>
      </div>

      {/* CUSTOMERS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-navy-950 text-sm">No Customers Found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Phone / Contact</th>
                  <th className="py-3.5 px-4">Company / Firm</th>
                  <th className="py-3.5 px-4">Address</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    onClick={() => setSelectedCustomer(cust)}
                    className={`hover:bg-slate-50 cursor-pointer transition ${selectedCustomer?.id === cust.id ? 'bg-amber-50/50' : ''}`}
                  >
                    <td className="py-3.5 px-4 font-bold text-navy-950">
                      {cust.name}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-mono">
                      {cust.phone}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {cust.company || 'Individual Client'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {cust.address || 'Biratnagar'}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEditModal(cust)}
                        className="p-1.5 text-slate-600 hover:text-navy-950 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cust.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CUSTOMER DETAIL DRAWER */}
      {selectedCustomer && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-navy-950">{selectedCustomer.name}</h2>
              <p className="text-xs text-slate-500">{selectedCustomer.company || 'Customer Profile'}</p>
            </div>
            <button onClick={() => setSelectedCustomer(null)} className="p-1 text-slate-400 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Phone</span>
              <p className="font-bold text-navy-950">{selectedCustomer.phone}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Email</span>
              <p className="font-semibold text-slate-700">{selectedCustomer.email || 'N/A'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Address</span>
              <p className="font-semibold text-slate-700">{selectedCustomer.address || 'N/A'}</p>
            </div>
          </div>

          {/* Activity History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider mb-3">Inquiries ({customerLeads.length})</h3>
              {customerLeads.length === 0 ? (
                <p className="text-xs text-slate-400">No linked website inquiries.</p>
              ) : (
                <div className="space-y-2">
                  {customerLeads.map(l => (
                    <div key={l.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                      <div className="flex justify-between font-bold text-navy-950">
                        <span>{l.productName} ({l.quantity} pcs)</span>
                        <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded">{l.status}</span>
                      </div>
                      {l.message && <p className="text-[11px] text-slate-500 mt-1">{l.message}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider mb-3">Quotations ({customerQuotations.length})</h3>
              {customerQuotations.length === 0 ? (
                <p className="text-xs text-slate-400">No generated quotations for this customer.</p>
              ) : (
                <div className="space-y-2">
                  {customerQuotations.map(q => (
                    <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-navy-950 block">{q.quotationNumber}</span>
                        <span className="text-[10px] text-slate-500">{q.items.length} items</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-navy-950 block">Rs. {q.total.toLocaleString()}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">{q.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-navy-950">
                {editingCustomer ? 'Edit Customer' : 'Create Customer Record'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                {errors.phone && <p className="mt-1 text-xs text-rose-500">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Firm Name</label>
                <input
                  type="text"
                  {...register('company')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  {...register('address')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  {...register('notes')}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingCustomer ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
