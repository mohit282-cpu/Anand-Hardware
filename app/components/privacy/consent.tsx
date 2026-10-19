'use client';

import React, { useState, useEffect } from 'react';

const CONSENT_KEY = 'privacy_consent';

const ConsentModal = () => {
  const [showModal, setShowModal] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);

  // Check existing consent
  useEffect(() => {
    const existing = localStorage.getItem(CONSENT_KEY);
    if (existing === 'accepted') {
      setShowModal(false);
      setConsentGiven(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setShowModal(false);
    setConsentGiven(true);
  };

  const handleReject = () => {
    localStorage.setItem(CONSENT_KEY, 'rejected');
    setShowModal(false);
    // Remove analytics if previously accepted
    localStorage.removeItem('vercel_analytics');
  };

  if (consentGiven && !showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-navy-900">Privacy Consent</h2>
          <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18M6 6l12 12M6 6l6 6" />
            </svg>
          </button>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          We use Vercel Analytics to understand how visitors interact with our website.
          This helps us improve our products and services. <strong>Accept</strong> to allow
          analytics tracking, or <strong>Reject</strong> to opt-out of tracking.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => handleAccept()}
            className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition"
          >
            Accept
          </button>
          <button
            onClick={() => handleReject()}
            className="flex-1 px-4 py-2 bg-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-300 transition"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;