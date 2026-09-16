import React, { useState } from 'react';
import { CurrencySymbol } from '../../types';
import { Copy, Check, RefreshCw, Clock } from 'lucide-react';
import { copyTextToClipboard } from '../../utils/clipboard';
import {
  validateNumericInput,
  formatLatinCurrency,
  formatLatinPercent,
  roundToDecimals,
} from '../../utils/validation';
import { NumericInputField, InvalidInputAlert } from '../common/NumericInputField';

interface Props {
  currency: CurrencySymbol;
}

export const FreelanceRateCalc: React.FC<Props> = ({ currency }) => {
  const [takeHomeSalaryStr, setTakeHomeSalaryStr] = useState<string>('75000');
  const [taxAmountStr, setTaxAmountStr] = useState<string>('22000');
  const [businessExpensesStr, setBusinessExpensesStr] = useState<string>('8000');
  const [billableHoursStr, setBillableHoursStr] = useState<string>('1000');
  const [profitBufferPctStr, setProfitBufferPctStr] = useState<string>('10');
  const [copied, setCopied] = useState(false);

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

    const text = `Freelance Pricing Architecture:\n- Target Net Salary: ${formatLatinCurrency(safeTakeHome, currency)}/yr\n- Taxes & Healthcare: ${formatLatinCurrency(safeTax, currency)}/yr\n- Business Overhead: ${formatLatinCurrency(safeExpenses, currency)}/yr\n- Reinvestment Buffer (${formatLatinPercent(safeBufferPct)}): ${formatLatinCurrency(profitBuffer, currency)}/yr\n- Total Required Gross Revenue: ${formatLatinCurrency(totalGrossRequired, currency)}/yr\n- Billable Capacity: ${safeBillableHours.toLocaleString('en-US')} hrs/yr (~${(safeBillableHours / activeWeeks).toFixed(1)} hrs/wk across 48 weeks)\n- Minimum Hourly Rate: ${hourlyText}\n- Standard Day Rate (8h): ${dayText}\n- Weekly Gross Target (48 wks): ${formatLatinCurrency(weeklyRate, currency)}/wk\n- Monthly Gross Target: ${formatLatinCurrency(monthlyRate, currency)}/mo`;

    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
          helperText="Self-employment tax & health coverage"
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
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label htmlFor="freelance-hours-input" className="font-bold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-violet-600" /> Annual Billable Hours:
          </label>
          <span className="font-bold text-violet-700">
            {safeBillableHours.toLocaleString('en-US')} hrs/yr (~{(safeBillableHours / activeWeeks).toFixed(1)} hrs/wk across 48 weeks)
          </span>
        </div>
        <input
          id="freelance-hours-input"
          type="range"
          min="200"
          max="1800"
          step="25"
          value={Math.min(1800, Math.max(200, safeBillableHours))}
          onChange={(e) => setBillableHoursStr(e.target.value)}
          className="w-full accent-violet-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>Part-time (500 hrs)</span>
          <span className="font-semibold text-slate-600">Balanced (1,000 hrs)</span>
          <span>Max Capacity (1,500 hrs)</span>
        </div>
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
                  <div className="text-xs font-bold text-slate-300">Minimum Hourly Rate:</div>
                  <div className="text-[11px] text-slate-400">Baseline to achieve target take-home salary</div>
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

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => {
            setTakeHomeSalaryStr('75000');
            setTaxAmountStr('22000');
            setBusinessExpensesStr('8000');
            setBillableHoursStr('1000');
            setProfitBufferPctStr('10');
          }}
          className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset Defaults
        </button>

        <button
          type="button"
          onClick={handleCopy}
          disabled={!isFormValid}
          className={`text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
            isFormValid
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              : 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy Summary'}
        </button>
      </div>
    </div>
  );
};
