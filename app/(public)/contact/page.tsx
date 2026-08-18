import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { ContactForm } from '@/components/public/ContactForm';

// Incremental Static Regeneration (ISR): Cache & revalidate every 1 hour (3600s)
export const revalidate = 3600;

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-widest block">Get In Touch</span>
        <h1 className="text-3xl sm:text-4xl font-black text-navy-950">Contact Anand Hardware</h1>
        <p className="text-xs text-slate-600">
          Have questions about pricing, bulk contractor rates, or stock availability? Call us or send an online inquiry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact Info Cards */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-brand-600 font-bold shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy-950">Store Address</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Main Road, Ward No. 7, Biratnagar, Morang, Nepal
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-brand-600 font-bold shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy-950">Phone & Mobile</h3>
              <p className="text-xs text-slate-600 mt-1">Landline: +977 21-523456</p>
              <p className="text-xs text-slate-600">Mobile / WhatsApp: +977 9801234567</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-brand-600 font-bold shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy-950">Email Address</h3>
              <p className="text-xs text-slate-600 mt-1">info@anandhardware.com</p>
              <p className="text-xs text-slate-600">sales@anandhardware.com</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-brand-600 font-bold shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy-950">Opening Hours</h3>
              <p className="text-xs text-slate-600 mt-1">Sunday - Friday: 8:00 AM - 7:00 PM</p>
              <p className="text-xs font-semibold text-rose-500">Saturday: Closed</p>
            </div>
          </div>
        </div>

        {/* Contact Inquiry Form Wrapper */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-navy-950">Send an Inquiry or Quote Request</h2>
            <p className="text-xs text-slate-500 mt-1">
              Fill in your contact details and message. Our sales team in Biratnagar will get back to you promptly.
            </p>
          </div>

          <ContactForm />
        </div>
      </div>
    </div>
  );
}
