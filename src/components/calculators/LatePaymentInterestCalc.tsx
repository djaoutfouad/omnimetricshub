import React, { useState } from 'react';
import { CurrencySymbol } from '../../types';
import { Copy, Check, RefreshCw, Scale, Info } from 'lucide-react';
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

export const LatePaymentInterestCalc: React.FC<Props> = ({ currency }) => {
  const [invoiceAmountStr, setInvoiceAmountStr] = useState<string>('5000');
  const [annualRateStr, setAnnualRateStr] = useState<string>('10.0');
  const [daysOverdueStr, setDaysOverdueStr] = useState<string>('60');
  const [compensationFeeStr, setCompensationFeeStr] = useState<string>('70');
  const [dayBasis, setDayBasis] = useState<365 | 366>(365);
  const [copied, setCopied] = useState(false);

  // Field validations
  const invoiceField = validateNumericInput(invoiceAmountStr, {
    min: 0.01,
    max: 100000000,
    allowZero: false,
    fieldName: 'Overdue Invoice Principal',
  });

  const rateField = validateNumericInput(annualRateStr, {
    min: 0,
    max: 100,
    allowZero: true,
    fieldName: 'Annual Simple Interest Rate (%)',
  });

  const daysField = validateNumericInput(daysOverdueStr, {
    min: 0,
    max: 3650,
    allowZero: true,
    integerOnly: true,
    fieldName: 'Days Past Due Date',
  });

  const feeField = validateNumericInput(compensationFeeStr, {
    min: 0,
    max: 50000,
    allowZero: true,
    fieldName: 'Illustrative Debt Recovery Fee',
  });

  const isFormValid =
    invoiceField.isValid &&
    rateField.isValid &&
    daysField.isValid &&
    feeField.isValid;

  const safeInvoice = invoiceField.value ?? 0;
  const safeRate = rateField.value ?? 0;
  const safeDays = daysField.value ?? 0;
  const safeFee = feeField.value ?? 0;

  // Daily interest = (Principal * (Rate/100)) / dayBasis (simple interest convention)
  const dailyInterest = isFormValid
    ? (safeInvoice * (safeRate / 100)) / dayBasis
    : 0;
  const totalInterest = roundToDecimals(dailyInterest * safeDays, 2);
  const totalBalanceDue = roundToDecimals(safeInvoice + totalInterest + safeFee, 2);

  const handleCopy = async () => {
    if (!isFormValid) return;
    const text = `Late Payment Claim Statement (Illustrative Commercial Estimate):\n- Invoice Principal: ${formatLatinCurrency(safeInvoice, currency)}\n- Annual Simple Rate: ${formatLatinPercent(safeRate)} (${dayBasis}-day basis)\n- Days Past Due: ${safeDays.toLocaleString('en-US')} days\n- Daily Interest Accrual: ${formatLatinCurrency(dailyInterest, currency)}/day\n- Total Accrued Interest: ${formatLatinCurrency(totalInterest, currency)}\n- Illustrative Recovery Fee: ${formatLatinCurrency(safeFee, currency)}\n- Total Balance Due: ${formatLatinCurrency(totalBalanceDue, currency)}\n\nNotice: Informational commercial reference only; not legal advice. Subject to contractual agreements and local statutory debt recovery legislation.`;

    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setInvoiceAmountStr('5000');
    setAnnualRateStr('10.0');
    setDaysOverdueStr('60');
    setCompensationFeeStr('70');
    setDayBasis(365);
  };

  return (
    <div className="space-y-4 text-slate-800">
      <div className="grid grid-cols-2 gap-3">
        <NumericInputField
          id="late-invoice-input"
          label={`Overdue Invoice Principal (${currency})`}
          value={invoiceAmountStr}
          onChange={setInvoiceAmountStr}
          fieldState={invoiceField}
          prefix={currency}
          placeholder="0.00"
          min={0.01}
          max={100000000}
          step="any"
        />

        <NumericInputField
          id="late-rate-input"
          label="Annual Simple Rate (%)"
          value={annualRateStr}
          onChange={setAnnualRateStr}
          fieldState={rateField}
          suffix="%"
          placeholder="10.0"
          min={0}
          max={100}
          step="0.1"
          helperText="Statutory benchmark or contract rate"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <NumericInputField
          id="late-days-input"
          label="Days Past Due"
          value={daysOverdueStr}
          onChange={setDaysOverdueStr}
          fieldState={daysField}
          placeholder="0"
          min={0}
          max={3650}
          step="1"
        />

        <NumericInputField
          id="late-fee-input"
          label={`Recovery Fee (${currency})`}
          value={compensationFeeStr}
          onChange={setCompensationFeeStr}
          fieldState={feeField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={50000}
          step="any"
          helperText="Illustrative debt collection fee"
        />

        <div className="space-y-1">
          <label htmlFor="late-basis-select" className="text-xs font-bold text-slate-700 block">
            Day-Count Convention
          </label>
          <select
            id="late-basis-select"
            value={dayBasis}
            onChange={(e) => setDayBasis(parseInt(e.target.value, 10) as 365 | 366)}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-orange-500 text-xs"
          >
            <option value={365}>Actual/365 (Standard)</option>
            <option value={366}>Actual/366 (Leap Year)</option>
          </select>
        </div>
      </div>

      {/* Main Results Card */}
      {!isFormValid ? (
        <InvalidInputAlert message="Please provide valid non-negative figures for invoice amount, rate, and days past due." />
      ) : (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-inner space-y-3">
          <div className="flex justify-between items-baseline">
            <div>
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-orange-400" /> Total Balance Outstanding:
              </div>
              <div className="text-[11px] text-slate-400">Principal + accrued interest + illustrative fee</div>
            </div>
            <span className="font-black text-orange-400 text-2xl tracking-tight">
              {formatLatinCurrency(totalBalanceDue, currency)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">
                Accrued Interest ({safeDays.toLocaleString('en-US')} days):
              </span>
              <span className="font-bold text-rose-400 text-sm">
                +{formatLatinCurrency(totalInterest, currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Daily Accrual Rate:</span>
              <span className="font-bold text-white text-sm">
                {formatLatinCurrency(dailyInterest, currency)}/day
              </span>
            </div>
          </div>

          {safeFee > 0 && (
            <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline text-xs text-slate-400">
              <span>Illustrative Debt Recovery Fee:</span>
              <span className="font-bold text-slate-200">
                +{formatLatinCurrency(safeFee, currency)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Educational & Jurisdiction Notice */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <strong>Important Disclaimers:</strong> This tool calculates simple commercial interest as an illustrative reference for business invoices. It does not provide legal advice or enforce statutory debt recovery claims. Permissible maximum rates, compounding rules, and statutory fee schedules vary by jurisdiction (e.g. UK Late Payment Act, EU Late Payment Directive, US Uniform Commercial Code). Consult legal counsel before issuing formal legal demands.
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={handleReset}
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
