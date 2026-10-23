import React from 'react';
import { Link } from 'react-router-dom';
import { LegalTabType } from './modals/LegalModal';
import { Mail, ShieldCheck, HeartHandshake } from 'lucide-react';
import { Logo } from './Logo';

interface Props {
  onOpenCalculator?: (toolId: string) => void;
  onOpenLegal?: (tab: LegalTabType) => void;
  onOpenContact?: () => void;
  onOpenSuggest?: () => void;
}

export const Footer: React.FC<Props> = ({
  onOpenSuggest,
}) => {
  return (
    <footer className="bg-slate-900 text-slate-300 text-xs py-14 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Brand */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2.5">
            <Link to="/" className="flex items-center gap-2.5">
              <Logo theme="dark" size="md" showSubtitle={false} idPrefix="footer-" />
            </Link>
          </div>
          <p className="text-slate-300 text-xs max-w-sm leading-relaxed">
            High-precision financial calculators, fee gross-up engines, and merchant decision tools built for modern entrepreneurs, agencies, and online operators.
          </p>
          <div className="pt-2 flex items-center gap-2 text-slate-300 text-[11px]">
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span>Official Inquiries: </span>
            <Link
              to="/contact/"
              className="text-emerald-400 hover:underline font-semibold"
            >
              omnimetricshub@gmail.com
            </Link>
          </div>
        </div>

        {/* Calculators Quick Access */}
        <div>
          <h3 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
            Core Calculators (12 Tools)
          </h3>
          <ul className="space-y-1 text-xs text-slate-300">
            <li>
              <Link to="/tools/payment-gateway-fees/" className="py-1 inline-block hover:text-white transition">
                Payment Gateway Fees
              </Link>
            </li>
            <li>
              <Link to="/tools/profit-margin/" className="py-1 inline-block hover:text-white transition">
                Profit Margin & Markup
              </Link>
            </li>
            <li>
              <Link to="/tools/break-even/" className="py-1 inline-block hover:text-white transition">
                Break-Even Point
              </Link>
            </li>
            <li>
              <Link to="/tools/roas-calculator/" className="py-1 inline-block hover:text-white transition">
                ROAS & Ad Spend
              </Link>
            </li>
            <li>
              <Link to="/tools/conversion-rate-cpa/" className="py-1 inline-block hover:text-white transition">
                Conversion Rate & CPA
              </Link>
            </li>
            <li>
              <Link to="/tools/landed-cost/" className="py-1 inline-block hover:text-white transition">
                Landed Cost & Pricing
              </Link>
            </li>
            <li>
              <Link to="/tools/freelance-rate/" className="py-1 inline-block hover:text-white transition">
                Freelance Rate Formula
              </Link>
            </li>
            <li>
              <Link to="/tools/late-payment-interest/" className="py-1 inline-block hover:text-white transition">
                Invoice Late Interest
              </Link>
            </li>
            <li>
              <Link to="/tools/compound-interest/" className="py-1 inline-block hover:text-white transition">
                Compound Interest
              </Link>
            </li>
            <li>
              <Link to="/tools/loan-emi/" className="py-1 inline-block hover:text-white transition">
                Loan & Monthly EMI
              </Link>
            </li>
            <li>
              <Link to="/tools/customer-ltv/" className="py-1 inline-block hover:text-white transition">
                Customer LTV (CLV)
              </Link>
            </li>
            <li>
              <Link to="/tools/salary-tax/" className="py-1 inline-block hover:text-white transition">
                Net Salary & Tax Payout
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & About Navigation */}
        <div>
          <h3 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
            Company & Resources
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li>
              <Link to="/about/" className="py-1 inline-flex items-center gap-1.5 hover:text-white transition">
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
                <span>About OmniMetrics Hub</span>
              </Link>
            </li>
            <li>
              <Link to="/blog/" className="py-1 inline-block hover:text-white transition">
                Guides & Knowledge Base
              </Link>
            </li>
            <li>
              <Link to="/methodology/" className="py-1 inline-block hover:text-white transition">
                Calculation Methodology
              </Link>
            </li>
            <li>
              <Link to="/calculators/" className="py-1 inline-block hover:text-white transition">
                All 12 Calculators
              </Link>
            </li>
            <li>
              <Link to="/contact/" className="py-1 inline-flex items-center gap-1.5 hover:text-white transition">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Contact & Feedback</span>
              </Link>
            </li>
            <li>
              <Link to="/privacy/" className="py-1 inline-flex items-center gap-1.5 hover:text-white transition">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
                <span>Privacy Policy</span>
              </Link>
            </li>
            <li>
              <Link to="/terms/" className="py-1 inline-block hover:text-white transition">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/disclaimer/" className="py-1 inline-block hover:text-white transition">
                Financial Disclaimer
              </Link>
            </li>
            {onOpenSuggest && (
              <li className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onOpenSuggest}
                  className="py-1 inline-block hover:text-white transition text-left text-emerald-400 font-semibold cursor-pointer"
                >
                  + Suggest a Calculator
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-400">
        <p>© 2026 OmniMetrics Hub. All rights reserved.</p>
        <p className="flex items-center gap-1.5">
          <span>Client-side mathematical modeling • Zero server data tracking.</span>
        </p>
      </div>
    </footer>
  );
};
