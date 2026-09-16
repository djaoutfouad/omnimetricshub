import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck, X } from 'lucide-react';

/**
 * ConsentBanner Component
 * 
 * Provides transparent notice regarding client-side calculation execution and essential local storage.
 * Architecture Note: Designed for drop-in integration with Google-certified Consent Management Platforms
 * (CMP supporting IAB TCF v2.2 and Google consent mode v2) when Google AdSense is activated in the future.
 */
export const ConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('omni_privacy_consent');
      if (!consent) {
        // Small timeout so it doesn't pop in abruptly on initial load
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage may be disabled in restricted sandbox environments
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('omni_privacy_consent', 'accepted');
    } catch {}
    setIsVisible(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem('omni_privacy_consent', 'essential_only');
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Privacy and Transparency Notice"
      role="complementary"
      className="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-auto sm:max-w-sm z-40 bg-slate-900/95 text-slate-100 p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-slate-800 backdrop-blur-md text-xs space-y-2.5 transition-all animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold text-white text-xs sm:text-sm">
          <Cookie className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Privacy & Transparency Notice</span>
        </div>
        <button
          type="button"
          onClick={handleDecline}
          className="text-slate-400 hover:text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition cursor-pointer"
          aria-label="Close Notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-slate-300 text-[11px] leading-relaxed">
        OmniMetrics Hub computes financial models client-side in your browser. We use local storage solely for essential interface preferences. No personal calculation data is collected or tracked on external servers.
      </p>

      <div className="flex items-center justify-between pt-0.5 gap-2">
        <Link
          to="/privacy"
          className="text-slate-400 hover:text-emerald-400 text-[11px] underline underline-offset-2 transition font-medium"
        >
          Privacy Policy
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDecline}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition cursor-pointer border border-slate-700/60"
          >
            Essential Only
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition shadow-sm cursor-pointer"
          >
            Accept
          </button>
        </div>
      </div>
    </aside>
  );
};

