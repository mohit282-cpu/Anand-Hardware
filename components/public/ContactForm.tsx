'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { leadInquirySchema, LeadInquiryFormValues } from '@/lib/validation/schemas';
import { createLeadInquiry } from '@/lib/firestore/services';

export function ContactForm() {
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
      productName: 'General Inquiry / Hardware Materials',
      quantity: 1,
      customerName: '',
      phone: '',
      email: '',
      company: '',
      message: '',
    },
  });

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
        quantity: Number(values.quantity) || 1,
        message: values.message || '',
      });
      setSubmitted(true);
      reset();
    } catch (err: any) {
      console.error('Contact submission error:', err);
      setErrorMsg(err.message || 'Failed to submit inquiry. Please call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-12 space-y-4">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
        <h3 className="text-xl font-bold text-navy-950">Inquiry Sent Successfully!</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Thank you for writing to Anand Hardware. A member of our staff will contact you shortly.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="px-6 py-2.5 bg-brand-600 text-white font-bold text-xs rounded-xl shadow"
        >
          Send Another Inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Your Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register('customerName')}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            placeholder="Full Name"
          />
          {errors.customerName && (
            <p className="mt-1 text-xs text-rose-500">{errors.customerName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Phone / Mobile <span className="text-rose-500">*</span>
          </label>
          <input
            type="tel"
            {...register('phone')}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            placeholder="Mobile number"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-rose-500">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
          <input
            type="email"
            {...register('email')}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            placeholder="Email address"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Firm (Optional)</label>
          <input
            type="text"
            {...register('company')}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            placeholder="Contractor or Firm name"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Product / Materials Required <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          {...register('productName')}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Inquiry Details / Message</label>
        <textarea
          rows={4}
          {...register('message')}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          placeholder="Describe required sizes, quantities, site location, or special questions..."
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        <span>{submitting ? 'Submitting...' : 'Submit Inquiry'}</span>
      </button>
    </form>
  );
}
