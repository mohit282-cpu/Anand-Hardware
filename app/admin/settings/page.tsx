'use me';
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings, Save, CheckCircle2, AlertCircle, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { businessSettingsSchema, BusinessSettingsFormValues } from '@/lib/validation/schemas';
import { getBusinessSettings, updateBusinessSettings, DEFAULT_SETTINGS } from '@/lib/firestore/services';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BusinessSettingsFormValues>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: DEFAULT_SETTINGS,
  });

  const watchLogoUrl = watch('logoUrl');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getBusinessSettings();
        reset(data);
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reset]);

  const onSubmit = async (values: BusinessSettingsFormValues) => {
    setSaving(true);
    setErrorMsg(null);
    setToastMsg(null);
    try {
      await updateBusinessSettings(values);
      setToastMsg('Business settings updated successfully!');
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      setErrorMsg(err.message || 'Failed to update business settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading business settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-navy-950">Business Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Central configuration for Anand Hardware header, contact information, PAN/VAT registration, and quotation numbering.
        </p>
      </div>

      {toastMsg && (
        <div className="p-4 bg-emerald-900 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Core Identity */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider border-b border-slate-100 pb-2">
            Company Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('businessName')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              {errors.businessName && <p className="mt-1 text-xs text-rose-500">{errors.businessName.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                PAN / VAT Registration Number
              </label>
              <input
                type="text"
                {...register('taxId')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="PAN: 302948576 / VAT Registered"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Logo Image Web URL</label>
            <input
              type="url"
              {...register('logoUrl')}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="https://..."
            />
          </div>

          {watchLogoUrl && watchLogoUrl.trim() !== '' && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded border border-slate-200 overflow-hidden flex items-center justify-center">
                <img
                  src={watchLogoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="text-xs text-slate-500 font-mono">{watchLogoUrl}</span>
            </div>
          )}
        </div>

        {/* Contact & Location */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider border-b border-slate-100 pb-2">
            Contact & Location Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Store Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('phone')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              {errors.phone && <p className="mt-1 text-xs text-rose-500">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Contact</label>
              <input
                type="text"
                {...register('whatsapp')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Hours</label>
              <input
                type="text"
                {...register('openingHours')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Physical Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('address')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              {errors.address && <p className="mt-1 text-xs text-rose-500">{errors.address.message}</p>}
            </div>
          </div>
        </div>

        {/* Quotation & System Settings */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider border-b border-slate-100 pb-2">
            Quotation Prefix & Socials
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quotation Number Prefix <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('quotationPrefix')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                placeholder="AH-QT-"
              />
              {errors.quotationPrefix && <p className="mt-1 text-xs text-rose-500">{errors.quotationPrefix.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
              <input
                type="text"
                {...register('website')}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Settings...' : 'Save Business Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
