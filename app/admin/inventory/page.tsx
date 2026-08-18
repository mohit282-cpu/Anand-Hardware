'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Boxes, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, CheckCircle2, History, Plus } from 'lucide-react';
import { inventoryTransactionSchema, InventoryTransactionFormValues } from '@/lib/validation/schemas';
import { getProducts, addInventoryTransaction, getInventoryTransactions } from '@/lib/firestore/services';
import { Product, InventoryTransaction, InventoryTransactionType } from '@/types';
import { useAuth } from '@/components/auth/AuthProvider';

export default function AdminInventoryPage() {
  const { userProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InventoryTransactionFormValues>({
    resolver: zodResolver(inventoryTransactionSchema),
    defaultValues: {
      productId: '',
      type: 'STOCK_IN',
      quantity: 1,
      reason: 'Purchase',
      note: '',
    },
  });

  const selectedProductId = watch('productId');
  const selectedProduct = products.find(p => p.id === selectedProductId);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodData, txnData] = await Promise.all([
        getProducts(),
        getInventoryTransactions(),
      ]);
      setProducts(prodData);
      setTransactions(txnData);
    } catch (err) {
      console.error('Error loading inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (values: InventoryTransactionFormValues) => {
    if (!selectedProduct) {
      setErrorMsg('Please select a valid product.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await addInventoryTransaction({
        productId: values.productId,
        productName: selectedProduct.name,
        type: values.type as InventoryTransactionType,
        quantity: Number(values.quantity),
        reason: values.reason,
        note: values.note || '',
        createdBy: userProfile?.displayName || userProfile?.email || 'Admin Staff',
      });

      if (!res.success) {
        setErrorMsg(res.message || 'Transaction failed.');
        return;
      }

      setSuccessMsg(`Inventory transaction recorded successfully! ${selectedProduct.name} stock updated.`);
      reset({
        productId: values.productId,
        type: 'STOCK_IN',
        quantity: 1,
        reason: 'Purchase',
        note: '',
      });
      loadData();
    } catch (err: any) {
      console.error('Transaction error:', err);
      setErrorMsg(err.message || 'Failed to complete stock transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-navy-950">Transaction-Based Inventory Control</h1>
        <p className="text-xs text-slate-500 mt-1">
          Record stock entries and releases with complete audit trail and safety validation against negative inventory.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* TRANSACTION FORM */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 lg:col-span-1">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-brand-600" />
              <span>Record Stock Movement</span>
            </h2>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Product Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Product <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('productId')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="">-- Choose Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock} {p.unit})
                  </option>
                ))}
              </select>
              {errors.productId && <p className="mt-1 text-xs text-rose-500">{errors.productId.message}</p>}
            </div>

            {selectedProduct && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Current Stock Level:</span>
                  <span className="font-bold text-navy-950">{selectedProduct.stock} {selectedProduct.unit}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Low Stock Alert at:</span>
                  <span className="font-semibold text-slate-700">{selectedProduct.lowStockLevel} {selectedProduct.unit}</span>
                </div>
              </div>
            )}

            {/* Transaction Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Type <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('type')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="STOCK_IN">STOCK_IN (+ Add to Inventory)</option>
                <option value="STOCK_OUT">STOCK_OUT (- Sale / Release to Site)</option>
                <option value="RETURN">RETURN (+ Customer Return)</option>
                <option value="DAMAGE">DAMAGE (- Warehouse Defect / Damage)</option>
                <option value="ADJUSTMENT">ADJUSTMENT (= Audit Level Override)</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                {...register('quantity')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              {errors.quantity && <p className="mt-1 text-xs text-rose-500">{errors.quantity.message}</p>}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason / Reference <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('reason')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="e.g. Factory Purchase, Sale Invoice #1042, Site Return"
              />
              {errors.reason && <p className="mt-1 text-xs text-rose-500">{errors.reason.message}</p>}
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
              <textarea
                rows={2}
                {...register('note')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="Additional audit details..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Recording Transaction...' : 'Post Inventory Transaction'}</span>
            </button>
          </form>
        </div>

        {/* LOG HISTORY TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-navy-900" />
                <h2 className="text-base font-bold text-navy-950">Inventory Audit Log</h2>
              </div>
              <button onClick={loadData} className="p-1.5 text-slate-500 hover:text-navy-950 rounded-lg">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading inventory log...</div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                <Boxes className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-navy-950 text-sm">No Inventory Transactions Logged</p>
                <p>Record your first stock entry or sale release using the form on the left.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4 text-center">Type</th>
                      <th className="py-3 px-4 text-right">Quantity</th>
                      <th className="py-3 px-4">Reason / Notes</th>
                      <th className="py-3 px-4">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {transactions.map((txn) => {
                      const isAddition = txn.type === 'STOCK_IN' || txn.type === 'RETURN';
                      return (
                        <tr key={txn.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(txn.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>

                          <td className="py-3 px-4 font-bold text-navy-950">
                            {txn.productName}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isAddition
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : txn.type === 'ADJUSTMENT'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isAddition ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {txn.type}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right font-bold text-navy-950">
                            {isAddition ? `+${txn.quantity}` : `-${txn.quantity}`}
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            <span className="font-semibold text-slate-800 block">{txn.reason}</span>
                            {txn.note && <span className="text-[11px] text-slate-400 block">{txn.note}</span>}
                          </td>

                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {txn.createdBy || 'Admin'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
