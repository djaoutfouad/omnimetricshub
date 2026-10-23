import React from 'react';
import { Link } from 'react-router-dom';
import { SeoHead } from '../components/SeoHead';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-5">
      <SeoHead
        title="Requested Page Not Found (Error 404) | OmniMetrics"
        description="The requested financial calculator or guide page could not be found on OmniMetrics Hub. Return to the homepage or search our free tool directory."
        canonicalPath="/404/"
      />
      <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto text-2xl font-black">
        404
      </div>
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">
        Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
        The financial tool, article, or resource you are looking for has been moved or is no longer available.
      </p>
      <div className="pt-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs transition shadow-sm cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    </div>
  );
};
