import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CurrencySymbol } from '../../types';
import { Clock, ArrowRight, Workflow } from 'lucide-react';
import { copyTextToClipboard } from '../../utils/clipboard';
import {
  validateNumericInput,
  formatLatinCurrency,
  formatLatinPercent,
  roundToDecimals,
} from '../../utils/validation';
import {
  getValidatedNumericParam,
  buildShareableCalculatorUrl,
} from '../../utils/shareableState';
import { CalculationReportPayload } from '../../utils/exportReport';
import { NumericInputField, InvalidInputAlert } from '../common/NumericInputField';
import { CalculatorActionBar } from '../common/CalculatorActionBar';
import { AssumptionsSourcesBox } from '../common/AssumptionsSourcesBox';

interface Props {
  currency: CurrencySymbol;
}

export const FreelanceRateCalc: React.FC<Props> = ({ currency }) => {
  const location = useLocation();

  const [takeHomeSalaryStr, setTakeHomeSalaryStr] = useState<string>(() =>
    getValidatedNumericParam('takeHome', '75000', { min: 0, max: 10000000, allowZero: true })
  );
  const [taxAmountStr, setTaxAmountStr] = useState<string>(() =>
    getValidatedNumericParam('taxes', '22000', { min: 0, max: 10000000, allowZero: true })
  );
  const [businessExpensesStr, setBusinessExpensesStr] = useState<string>(() =>
    getValidatedNumericParam('expenses', '8000', { min: 0, max: 10000000, allowZero: true })
  );
  const [billableHoursStr, setBillableHoursStr] = useState<string>(() =>
    getValidatedNumericParam('hours', '1000', { min: 1, max: 4000, allowZero: false, integerOnly: true })
  );
  const [profitBufferPctStr, setProfitBufferPctStr] = useState<string>(() =>
    getValidatedNumericParam('buffer', '10', { min: 0, max: 100, allowZero: true })
  );
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!location.search) return;
    setTakeHomeSalaryStr(getValidatedNumericParam('takeHome', '75000', { min: 0, max: 10000000, allowZero: true }, location.search));
    setTaxAmountStr(getValidatedNumericParam('taxes', '22000', { min: 0, max: 10000000, allowZero: true }, location.search));
    setBusinessExpensesStr(getValidatedNumericParam('expenses', '8000', { min: 0, max: 10000000, allowZero: true }, location.search));
    setBillableHoursStr(getValidatedNumericParam('hours', '1000', { min: 1, max: 4000, allowZero: false, integerOnly: true }, location.search));
    setProfitBufferPctStr(getValidatedNumericParam('buffer', '10', { min: 0, max: 100, allowZero: true }, location.search));
  }, [location.search]);

  // Field validations
  const takeHomeField = validateNumericInput(takeHomeSalaryStr, {
    min: 0,
    max: 10000000,
    allowZero: true,
    fieldName: 'Target Net Personal Pay',
  });

  const taxField = validateNumericInput(taxAmountStr, {
    min: 0,
    max: 10000000,
    allowZero: true,
    fieldName: 'Taxes & Healthcare',
  });

  const expensesField = validateNumericInput(businessExpensesStr, {
    min: 0,
    max: 10000000,
    allowZero: true,
    fieldName: 'Business Overhead',
  });

  const billableHoursField = validateNumericInput(billableHoursStr, {
    min: 1,
    max: 4000,
    allowZero: false,
    integerOnly: true,
    fieldName: 'Annual Billable Hours',
  });

  const bufferPctField = validateNumericInput(profitBufferPctStr, {
    min: 0,
    max: 100,
    allowZero: true,
    fieldName: 'Reinvestment & Profit Buffer (%)',
  });

  const isFormValid =
    takeHomeField.isValid &&
    taxField.isValid &&
    expensesField.isValid &&
    billableHoursField.isValid &&
    bufferPctField.isValid;

  const safeTakeHome = takeHomeField.value ?? 0;
  const safeTax = taxField.value ?? 0;
  const safeExpenses = expensesField.value ?? 0;
  const safeBillableHours = billableHoursField.value ?? 1000;
  const safeBufferPct = bufferPctField.value ?? 0;

  const activeWeeks = 48;

  // Base Required Revenue
  const baseGrossRequired = safeTakeHome + safeTax + safeExpenses;
  const profitBuffer = roundToDecimals(baseGrossRequired * (safeBufferPct / 100), 2);
  const totalGrossRequired = roundToDecimals(baseGrossRequired + profitBuffer, 2);

  // Hourly rate based on client-facing billable hours
  const isHoursValid = isFormValid && safeBillableHours > 0;
  const hourlyRate = isHoursValid
    ? roundToDecimals(totalGrossRequired / safeBillableHours, 2)
    : null;
  const dayRate = hourlyRate !== null ? roundToDecimals(hourlyRate * 8, 2) : null;
  const weeklyRate = roundToDecimals(totalGrossRequired / activeWeeks, 2);
  const monthlyRate = roundToDecimals(totalGrossRequired / 12, 2);

  const handleCopy = async () => {
    if (!isFormValid) return;
    const hourlyText =
      hourlyRate !== null ? `${formatLatinCurrency(hourlyRate, currency)}/hr` : 'N/A';
    const dayText = dayRate !== null ? `${formatLatinCurrency(dayRate, currency)}/day` : 'N/A';

    const text = `Freelance Pricing Architecture:\n- Target Net Salary: ${formatLatinCurrency(safeTakeHome, currency)}/yr\n- Taxes & Healthcare: ${formatLatinCurrency(safeTax, currency)}/yr\n- Business Overhead: ${formatLatinCurrency(safeExpenses, currency)}/yr\n- Reinvestment Buffer (${formatLatinPercent(safeBufferPct)}): ${formatLatinCurrency(profitBuffer, currency)}/yr\n- Total Required Gross Revenue: ${formatLatinCurrency(totalGrossRequired, currency)}/yr\n- Billable Capacity: ${safeBillableHours.toLocaleString('en-US')} hrs/yr (~${(safeBillableHours / activeWeeks).toFixed(1)} hrs/wk across 48 weeks)\n- Suggested Minimum Hourly Rate (Estimated): ${hourlyText}\n- Standard Day Rate (8h): ${dayText}\n- Weekly Gross Target (48 wks): ${formatLatinCurrency(weeklyRate, currency)}/wk\n- Monthly Gross Target: ${formatLatinCurrency(monthlyRate, currency)}/mo`;

    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLink = async () => {
    if (!isFormValid) return;
    const url = buildShareableCalculatorUrl(
      'freelance-rate',
      {
        takeHome: safeTakeHome,
        taxes: safeTax,
        expenses: safeExpenses,
        hours: safeBillableHours,
        buffer: safeBufferPct,
      },
      currency
    );
    const ok = await copyTextToClipboard(url);
    if (ok) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const projectInvoiceAmount = weeklyRate > 0 ? weeklyRate : dayRate ?? 100;
  const paymentFeesWorkflowUrl = `/tools/payment-gateway-fees/?amount=${projectInvoiceAmount.toFixed(2)}&currency=${encodeURIComponent(currency)}`;

  const getReportPayload = (): CalculationReportPayload => ({
    calculatorId: 'freelance-rate',
    calculatorName: 'Freelance Hourly & Project Rate Calculator',
    slug: 'freelance-rate',
    currency,
    inputs: [
      { label: 'Target Net Personal Pay (Annual)', value: formatLatinCurrency(safeTakeHome, currency) },
      { label: 'Taxes & Healthcare Reserve (Annual)', value: formatLatinCurrency(safeTax, currency) },
      { label: 'Business Overhead (Annual)', value: formatLatinCurrency(safeExpenses, currency) },
      { label: 'Profit & Growth Buffer (%)', value: formatLatinPercent(safeBufferPct) },
      { label: 'Annual Billable Hours Capacity', value: `${safeBillableHours.toLocaleString('en-US')} hrs/yr` },
    ],
    results: [
      {
        label: 'Suggested Minimum Hourly Rate (Estimated)',
        value: hourlyRate !== null ? `${formatLatinCurrency(hourlyRate, currency)}/hr` : 'N/A',
        highlight: true,
      },
      {
        label: 'Standard Day Rate (8 Billable Hours)',
        value: dayRate !== null ? `${formatLatinCurrency(dayRate, currency)}/day` : 'N/A',
      },
      {
        label: `Weekly Gross Revenue Target (${activeWeeks} Active Weeks)`,
        value: `${formatLatinCurrency(weeklyRate, currency)}/wk`,
      },
      {
        label: 'Monthly Gross Revenue Target',
        value: `${formatLatinCurrency(monthlyRate, currency)}/mo`,
      },
      {
        label: 'Total Required Annual Gross Revenue',
        value: formatLatinCurrency(totalGrossRequired, currency),
      },
    ],
    assumptions: [
      `Weekly billing benchmarks assume ${activeWeeks} active working weeks per year (allowing 4 weeks for PTO, holidays, and sick leave).`,
      'Hourly rate divides total required gross revenue (take-home pay + taxes + overhead + profit buffer) by actual client-billable hours.',
    ],
  });

  return (
    <div className="space-y-4 text-slate-800">
      <div className="grid grid-cols-2 gap-3">
        <NumericInputField
          id="freelance-salary-input"
          label={`Target Net Pay (${currency}/yr)`}
          value={takeHomeSalaryStr}
          onChange={setTakeHomeSalaryStr}
          fieldState={takeHomeField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={10000000}
          step="any"
          helperText="Net personal living budget"
        />

        <NumericInputField
          id="freelance-tax-input"
          label={`Taxes & Healthcare (${currency}/yr)`}
          value={taxAmountStr}
          onChange={setTaxAmountStr}
          fieldState={taxField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={10000000}
          step="any"
          helperText="Manual annual estimate (not auto-recalculated)"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumericInputField
          id="freelance-expenses-input"
          label={`Business Overhead (${currency}/yr)`}
          value={businessExpensesStr}
          onChange={setBusinessExpensesStr}
          fieldState={expensesField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={10000000}
          step="any"
          helperText="Software, accounting, equipment"
        />

        <NumericInputField
          id="freelance-buffer-input"
          label="Profit & Growth Buffer (%)"
          value={profitBufferPctStr}
          onChange={setProfitBufferPctStr}
          fieldState={bufferPctField}
          suffix="%"
          placeholder="10"
          min={0}
          max={100}
          step="1"
          helperText="Emergency reserves & reinvestment"
        />
      </div>

      {/* Billable hours slider & input */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <label htmlFor="freelance-hours-num" className="font-bold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-violet-600" /> Annual Billable Hours:
          </label>
          <div className="flex items-center gap-2">
            <input
              id="freelance-hours-num"
              type="text"
              inputMode="numeric"
              value={billableHoursStr}
              onChange={(e) => setBillableHoursStr(e.target.value)}
              aria-label="Annual Billable Hours (type directly)"
              aria-invalid={!billableHoursField.isValid}
              className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-right text-violet-700 outline-none focus:ring-2 focus:ring-violet-500"
            />
            <span className="text-[11px] font-semibold text-slate-600">
              hrs/yr (~{(safeBillableHours / activeWeeks).toFixed(1)} hrs/wk across {activeWeeks} wks)
            </span>
          </div>
        </div>
        <input
          id="freelance-hours-input"
          type="range"
          min="200"
          max="1800"
          step="25"
          value={Math.min(1800, Math.max(200, safeBillableHours))}
          onChange={(e) => setBillableHoursStr(e.target.value)}
          aria-label="Annual Billable Hours slider"
          className="w-full accent-violet-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>Part-time (500 hrs)</span>
          <span className="font-semibold text-slate-700">Balanced (1,000 hrs)</span>
          <span>Max Capacity (1,500 hrs)</span>
        </div>
        {!billableHoursField.isValid && (
          <p role="alert" className="text-rose-600 text-[11px] font-semibold">
            {billableHoursField.errorMessage}
          </p>
        )}
      </div>

      {/* Primary Scorecard */}
      {!isFormValid ? (
        <InvalidInputAlert message="Please provide valid non-negative numbers and positive billable hours." />
      ) : (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-inner space-y-3">
          {hourlyRate !== null ? (
            <>
              <div className="flex justify-between items-baseline">
                <div>
                  <div className="text-xs font-bold text-slate-300">Suggested Minimum Hourly Rate (Estimated):</div>
                  <div className="text-[11px] text-slate-400">Baseline to achieve target take-home salary (Taxes &amp; Healthcare are user-entered manual estimates)</div>
                </div>
                <span className="font-black text-violet-400 text-2xl tracking-tight">
                  {formatLatinCurrency(hourlyRate, currency)}
                  <span className="text-sm font-semibold text-slate-400">/hr</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-2.5 text-center">
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Day Rate (8h)</span>
                  <span className="font-bold text-white text-xs">
                    {dayRate !== null ? formatLatinCurrency(dayRate, currency) : 'N/A'}
                  </span>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Weekly (48 wks)</span>
                  <span className="font-bold text-violet-300 text-xs">
                    {formatLatinCurrency(weeklyRate, currency)}
                  </span>
                </div>
                <div className="bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Monthly Target</span>
                  <span className="font-bold text-emerald-400 text-xs">
                    {formatLatinCurrency(monthlyRate, currency)}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-2 flex justify-between text-xs text-slate-400">
                <span>Total Required Annual Gross:</span>
                <span className="font-bold text-slate-200">
                  {formatLatinCurrency(totalGrossRequired, currency)}
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-3 text-rose-400 text-xs font-semibold">
              Hourly rate is N/A because billable hours must exceed 0.
            </div>
          )}
        </div>
      )}

      {/* Connected Decision Workflow Card */}
      {isFormValid && projectInvoiceAmount > 0 && (
        <div className="p-3 bg-violet-50/80 border border-violet-200/90 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-extrabold text-violet-950 uppercase tracking-wider flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5 text-violet-600" /> Next Step in Your Workflow
            </span>
            <span className="text-violet-700 font-semibold">
              Weekly Retainer: {formatLatinCurrency(projectInvoiceAmount, currency)}
            </span>
          </div>
          <Link
            to={paymentFeesWorkflowUrl}
            className="w-full px-3 py-2 rounded-xl bg-white hover:bg-violet-600 text-violet-900 hover:text-white border border-violet-200 hover:border-violet-600 text-xs font-bold flex items-center justify-between transition shadow-2xs group"
          >
            <span>Check Gateway Fees on a Project Invoice</span>
            <ArrowRight className="w-3.5 h-3.5 text-violet-600 group-hover:text-white group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      )}

      {/* Assumptions & Official References Box */}
      <AssumptionsSourcesBox calculatorId="freelance-rate" />

      <CalculatorActionBar
        isFormValid={isFormValid}
        copied={copied}
        linkCopied={linkCopied}
        onCopySummary={handleCopy}
        onShareLink={handleShareLink}
        onResetDefaults={() => {
          setTakeHomeSalaryStr('75000');
          setTaxAmountStr('22000');
          setBusinessExpensesStr('8000');
          setBillableHoursStr('1000');
          setProfitBufferPctStr('10');
        }}
        getReportPayload={getReportPayload}
      />
    </div>
  );
};

