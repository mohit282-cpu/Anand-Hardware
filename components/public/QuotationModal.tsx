'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { leadInquirySchema, LeadInquiryFormValues } from '@/lib/validation/schemas';
import { createLeadInquiry } from '@/lib/supabase/services';

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: {
    id?: string;
    name: string;
  };
}

export const QuotationModal: React.FC<QuotationModalProps> = ({ isOpen, onClose, initialProduct }) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadInquiryFormValues>({
    resolver: zodResolver(leadInquirySchema),
    defaultValues: {
      productName: initialProduct?.name || '',
      productId: initialProduct?.id || '',
      quantity: 1,
      customerName: '',
      phone: '',
      email: '',
      company: '',
      message: '',
    },
  });

  if (!isOpen) return null;

  const onSubmit = async (values: LeadInquiryFormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createLeadInquiry({
        customerName: values.customerName,
        phone: values.phone,
        email: values.email || '',
        company: values.company || '',
        productName: values.productName,
        productId: values.productId || '',
        quantity: Number(values.quantity),
        message: values.message || '',
      });
      setSubmitted(true);
      reset();
    } catch (err: any) {
      console.error('Failed to submit quote inquiry:', err);
      setErrorMsg(err.message || 'Failed to submit quotation request. Please try again or call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-navy-900 text-white">
          <div>
            <h3 className="text-lg font-bold">Request a Quotation</h3>
            <p className="text-xs text-slate-300">Anand Hardware — Biratnagar, Nepal</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
              <h4 className="text-xl font-bold text-navy-900">Quotation Request Received!</h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Thank you for contacting Anand Hardware. Our team will review your requirement and reach out to you via phone or WhatsApp shortly.
              </p>
              <button
                onClick={handleClose}
                className="mt-4 px-6 py-2.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition shadow-md"
              >
                Close & Continue Browsing
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Product */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product / Item Required <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('productName')}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. PVC Pipe 2 Inch / UltraTech Cement"
                />
                {errors.productName && (
                  <p className="mt-1 text-xs text-rose-500">{errors.productName.message}</p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  {...register('quantity')}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {errors.quantity && (
                  <p className="mt-1 text-xs text-rose-500">{errors.quantity.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('customerName')}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. Ramesh Shrestha"
                  />
                  {errors.customerName && (
                    <p className="mt-1 text-xs text-rose-500">{errors.customerName.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone / Mobile <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    {...register('phone')}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. 9801234567"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-rose-500">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="ramesh@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Company / Contractor Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company / Firm (Optional)
                  </label>
                  <input
                    type="text"
                    {...register('company')}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Shrestha Builders"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Notes / Specifications
                </label>
                <textarea
                  rows={3}
                  {...register('message')}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Mention delivery site location, required brand preferences, or custom dimensions..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 disabled:opacity-50 transition shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Submitting Request...' : 'Submit Quote Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
