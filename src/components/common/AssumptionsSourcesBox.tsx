import React from 'react';
import { BookCheck, ExternalLink, CheckCircle2, CalendarCheck } from 'lucide-react';

export type CalculatorModelId =
  | 'payment-gateway-fees'
  | 'profit-margin'
  | 'break-even'
  | 'roas-calculator'
  | 'conversion-rate-cpa'
  | 'landed-cost'
  | 'freelance-rate'
  | 'late-payment-interest'
  | 'compound-interest'
  | 'loan-emi'
  | 'customer-ltv'
  | 'salary-tax';

interface OfficialReferenceLink {
  label: string;
  url: string;
}

interface ModelSpec {
  methodologyLabel: string;
  assumptions: string[];
  references?: OfficialReferenceLink[];
}

const MODEL_SPECS: Record<CalculatorModelId, ModelSpec> = {
  'payment-gateway-fees': {
    methodologyLabel: 'Merchant Acquiring & Gross-Up Algebraic Standard',
    assumptions: [
      'Models card-not-present transaction deductions as (Invoice × Percentage Rate) + Fixed Fee, and reverse gross-up as (Target Net + Fixed Fee) / (1 − Rate).',
      'Default presets reflect editable US domestic baseline merchant rates (e.g., Stripe 2.9% + $0.30, PayPal 3.49% + $0.49).',
      'Cross-border cards (+1.0%–1.5%), currency conversion (+1.0%–2.0%), and EEA/UK interchange schedules vary by merchant agreement.',
    ],
    references: [
      { label: 'Stripe Processing Fee Schedule', url: 'https://stripe.com/pricing' },
      { label: 'PayPal US Merchant Fees Table', url: 'https://www.paypal.com/us/webapps/mpp/merchant-fees' },
    ],
  },
  'profit-margin': {
    methodologyLabel: 'GAAP / IFRS Gross Profit & Retail Markup Convention',
    assumptions: [
      'Computes Gross Profit Margin relative to selling price ((Price − Cost) / Price) and Markup relative to unit cost ((Price − Cost) / Cost).',
      'Target Margin solver computes required selling price via Cost / (1 − Target Margin %) and reports realized margin after 2-decimal currency rounding.',
      'Measures unit gross profit prior to unallocated operating overhead, payment processing fees, or sales tax/VAT.',
    ],
  },
  'break-even': {
    methodologyLabel: 'Managerial Accounting Cost-Volume-Profit (CVP) Standard',
    assumptions: [
      'Assumes linear Cost-Volume-Profit unit economics where Unit Contribution Margin = Selling Price − Variable Cost.',
      'Commercial break-even target rounds fractional units up to the next whole unit (ceiling function) so fixed overhead is fully recovered.',
      'Models static unit selling prices and constant unit variable costs across the analyzed sales volume range.',
    ],
  },
  'roas-calculator': {
    methodologyLabel: 'Performance Marketing & Unit Contribution Standard',
    assumptions: [
      'Computes Return on Ad Spend as Attributed Revenue / Total Ad Spend and Break-Even ROAS as 1 / Pre-Ad Gross Margin %.',
      'True Net Profit deducts both direct product Cost of Goods Sold (COGS) and total advertising spend from attributed revenue.',
      'Evaluates campaign-level attributed revenue prior to multi-channel attribution adjustments or post-purchase return allowances.',
    ],
  },
  'conversion-rate-cpa': {
    methodologyLabel: 'Digital Funnel Acquisition & CPA Analytical Standard',
    assumptions: [
      'Computes Conversion Rate as (Conversions / Unique Visitors) × 100, CPA as Ad Spend / Conversions, and CPC as Ad Spend / Visitors.',
      'Estimated pipeline revenue assumes a uniform Average Order Value (AOV) across recorded conversion events.',
      'Traffic required per 100 conversions rounds up to the next whole visitor based on the active conversion rate.',
    ],
  },
  'landed-cost': {
    methodologyLabel: 'International Trade Incoterms (FOB / CIF) & Unit Pricing Standard',
    assumptions: [
      'Aggregates unit manufacturing cost, allocated unit freight, import tariff/duty, and packaging/prep into Total Unit Landed Cost.',
      'Supports both FOB customs valuation (duty applied to goods cost only) and CIF customs valuation (duty applied to goods + freight).',
      'Recommended Retail Price solves for desired net profit margin after deducting both Total Landed Cost and payment processor fees.',
    ],
  },
  'freelance-rate': {
    methodologyLabel: 'Independent Contractor Billable Utilization Standard',
    assumptions: [
      'Sums target annual net personal pay, estimated annual taxes/healthcare, business overhead, and reinvestment profit buffer.',
      'Divides required annual gross revenue strictly by client-billable hours to account for unbilled administrative and marketing time.',
      'Weekly billing benchmarks are normalized across 48 active working weeks per year (allowing 4 weeks for PTO and holidays).',
    ],
  },
  'late-payment-interest': {
    methodologyLabel: 'Simple Commercial Debt Interest & Day-Count Standard',
    assumptions: [
      'Accrues simple daily commercial interest (Principal × Annual Rate / Day-Count Basis × Days Past Due) without compounding.',
      'Supports Actual/365 (UK/Commonwealth), Actual/360 (US commercial/money market), and Actual/366 (leap year) day-count conventions.',
      'The 8% + Central Bank Base Rate benchmark and fixed recovery tiers (£40 / £70 / £100) are editable estimates; verify live base rates before issuing demands.',
    ],
    references: [
      { label: 'Bank of England Official Bank Rate', url: 'https://www.bankofengland.co.uk/boeapps/database/Bank-Rate.asp' },
      { label: 'UK Gov Late Commercial Payments Guide', url: 'https://www.gov.uk/late-commercial-payments-interest-debt-recovery' },
    ],
  },
  'compound-interest': {
    methodologyLabel: 'Time Value of Money (TVM) Discrete Monthly Compounding Standard',
    assumptions: [
      'Compounds monthly (12 periods per year, monthly rate = Annual Rate / 12) over the selected multi-year investment horizon.',
      'Supports both Ordinary Annuity (end-of-month deposits) and Annuity Due (beginning-of-month deposits).',
      'Models a constant nominal annual return rate without intermediate withdrawals, fund expense ratios, or tax withholdings.',
    ],
  },
  'loan-emi': {
    methodologyLabel: 'Fixed-Rate Reducing-Balance Loan Amortization Standard',
    assumptions: [
      'Computes fixed monthly installments using the reducing-balance annuity formula with monthly compounding (Monthly Rate = APR / 12).',
      'Annual amortization schedule reconciles the final installment so the remaining principal balance reaches 0.00 cleanly at term end.',
      'Excludes optional property taxes, homeowner insurance, private mortgage insurance (PMI), HOA dues, and lender origination fees.',
    ],
  },
  'customer-ltv': {
    methodologyLabel: 'Subscription & Cohort Retention Unit Economics Standard',
    assumptions: [
      'Uses a linear steady-state cohort retention model where implied customer lifespan in months equals 1 / Monthly Churn Rate.',
      'Evaluates LTV:CAC health ratios and CAC payback periods using Gross Profit LTV (ARPU × Gross Margin % × Lifespan).',
      'Recommended Maximum CAC is benchmarked against a 3:1 Gross Profit LTV-to-CAC sustainability target without cash-flow discounting.',
    ],
  },
  'salary-tax': {
    methodologyLabel: 'Blended Effective Tax & Pre-Tax Withholding Model',
    assumptions: [
      'Deducts annual pre-tax contributions (Monthly Pre-Tax Deductions × 12) from Gross Annual Salary before applying the effective tax rate.',
      'Applies your user-entered combined effective tax rate directly rather than automatically computing multi-tier progressive tax brackets.',
      'Distributes annual net take-home pay across Weekly (52/yr), Bi-Weekly (26/yr), Semi-Monthly (24/yr), and Monthly (12/yr) pay periods.',
    ],
    references: [
      { label: 'US IRS Tax Withholding & Rates', url: 'https://www.irs.gov/' },
      { label: 'UK GOV.UK Income Tax Rates', url: 'https://www.gov.uk/income-tax-rates' },
    ],
  },
};

interface Props {
  calculatorId: CalculatorModelId;
}

export const AssumptionsSourcesBox: React.FC<Props> = ({ calculatorId }) => {
  const spec = MODEL_SPECS[calculatorId];
  if (!spec) return null;

  return (
    <div
      role="region"
      aria-label="Model Assumptions and Reference Standards"
      className="p-3.5 bg-slate-50/90 border border-slate-200/90 rounded-2xl text-[11px] text-slate-600 space-y-2.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-200/80 pb-2">
        <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10.5px] flex items-center gap-1.5">
          <BookCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Model Scope, Assumptions &amp; References</span>
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
          <CalendarCheck className="w-3 h-3 text-emerald-600" />
          Benchmarks Reviewed: 2026
        </span>
      </div>

      <ul className="space-y-1.5 text-slate-600 leading-relaxed">
        {spec.assumptions.map((item, idx) => (
          <li key={idx} className="flex items-start gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
        <span className="text-slate-500">
          <strong className="text-slate-700">Methodology:</strong> {spec.methodologyLabel}
        </span>

        {spec.references && spec.references.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700">Official Sources:</span>
            {spec.references.map((ref) => (
              <a
                key={ref.url}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 hover:underline bg-white border border-slate-200 px-2 py-0.5 rounded-md transition"
              >
                <span>{ref.label}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
