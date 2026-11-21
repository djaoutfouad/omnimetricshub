import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CurrencySymbol } from '../../types';
import { Scale, Info } from 'lucide-react';
import { STATUTORY_LATE_FEE_TIERS } from '../../data/rateDefaults';
import { copyTextToClipboard } from '../../utils/clipboard';
import {
  validateNumericInput,
  formatLatinCurrency,
  formatLatinPercent,
  roundToDecimals,
} from '../../utils/validation';
import {
  getValidatedNumericParam,
  getValidatedNumberEnumParam,
  buildShareableCalculatorUrl,
} from '../../utils/shareableState';
import { CalculationReportPayload } from '../../utils/exportReport';
import { NumericInputField, InvalidInputAlert } from '../common/NumericInputField';
import { CalculatorActionBar } from '../common/CalculatorActionBar';
import { AssumptionsSourcesBox } from '../common/AssumptionsSourcesBox';

interface Props {
  currency: CurrencySymbol;
}

export const LatePaymentInterestCalc: React.FC<Props> = ({ currency }) => {
  const location = useLocation();

  const [invoiceAmountStr, setInvoiceAmountStr] = useState<string>(() =>
    getValidatedNumericParam('principal', '5000', { min: 0.01, max: 100000000, allowZero: false })
  );
  const [annualRateStr, setAnnualRateStr] = useState<string>(() =>
    getValidatedNumericParam('rate', '12.75', { min: 0, max: 100, allowZero: true })
  );
  const [daysOverdueStr, setDaysOverdueStr] = useState<string>(() =>
    getValidatedNumericParam('days', '60', { min: 0, max: 3650, allowZero: true, integerOnly: true })
  );
  const [compensationFeeStr, setCompensationFeeStr] = useState<string>(() =>
    getValidatedNumericParam('fee', '70', { min: 0, max: 50000, allowZero: true })
  );
  const [dayBasis, setDayBasis] = useState<360 | 365 | 366>(() =>
    getValidatedNumberEnumParam('basis', [360, 365, 366] as const, 365)
  );
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!location.search) return;
    setInvoiceAmountStr(getValidatedNumericParam('principal', '5000', { min: 0.01, max: 100000000, allowZero: false }, location.search));
    setAnnualRateStr(getValidatedNumericParam('rate', '12.75', { min: 0, max: 100, allowZero: true }, location.search));
    setDaysOverdueStr(getValidatedNumericParam('days', '60', { min: 0, max: 3650, allowZero: true, integerOnly: true }, location.search));
    setCompensationFeeStr(getValidatedNumericParam('fee', '70', { min: 0, max: 50000, allowZero: true }, location.search));
    setDayBasis(getValidatedNumberEnumParam('basis', [360, 365, 366] as const, 365, location.search));
  }, [location.search]);

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

  // Suggest UK statutory compensation tier based on invoice principal (< 1,000 => 40, 1,000–9,999.99 => 70, 10,000+ => 100)
  const getSuggestedStatutoryFee = (principal: number): number => {
    if (principal <= 0) return 0;
    if (principal < 1000) return 40;
    if (principal < 10000) return 70;
    return 100;
  };

  const suggestedTierFee = getSuggestedStatutoryFee(safeInvoice);

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

  const handleShareLink = async () => {
    if (!isFormValid) return;
    const url = buildShareableCalculatorUrl(
      'late-payment-interest',
      {
        principal: safeInvoice,
        rate: safeRate,
        days: safeDays,
        fee: safeFee,
        basis: dayBasis,
      },
      currency
    );
    const ok = await copyTextToClipboard(url);
    if (ok) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setInvoiceAmountStr('5000');
    setAnnualRateStr('12.75');
    setDaysOverdueStr('60');
    setCompensationFeeStr('70');
    setDayBasis(365);
  };

  const getReportPayload = (): CalculationReportPayload => ({
    calculatorId: 'late-payment-interest',
    calculatorName: 'Late Payment & Overdue Invoice Interest Calculator',
    currency,
    inputs: [
      { label: 'Overdue Invoice Principal', value: formatLatinCurrency(safeInvoice, currency) },
      { label: 'Annual Simple Interest Rate', value: formatLatinPercent(safeRate) },
      { label: 'Days Past Due Date', value: `${safeDays.toLocaleString('en-US')} days` },
      { label: 'Illustrative Debt Recovery Fee', value: formatLatinCurrency(safeFee, currency) },
      { label: 'Day-Count Convention', value: `Actual/${dayBasis}` },
    ],
    results: [
      {
        label: 'Total Balance Outstanding',
        value: formatLatinCurrency(totalBalanceDue, currency),
        highlight: true,
      },
      {
        label: `Total Accrued Simple Interest (${safeDays.toLocaleString('en-US')} days)`,
        value: `+${formatLatinCurrency(totalInterest, currency)}`,
      },
      {
        label: 'Daily Interest Accrual Rate',
        value: `${formatLatinCurrency(dailyInterest, currency)}/day`,
      },
      {
        label: 'Illustrative Recovery Fee Included',
        value: `+${formatLatinCurrency(safeFee, currency)}`,
      },
    ],
    assumptions: [
      `Simple commercial interest is calculated on an Actual/${dayBasis} day-count basis without compounding.`,
      'Statutory reference rates (8% + Central Bank Base Rate) and fixed recovery tiers (£40 / £70 / £100) are editable planning estimates. Verify current published central bank base rates and contractual terms before issuing formal demands.',
    ],
  });

  return (
    <div className="space-y-4 text-slate-800">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          placeholder="12.75"
          min={0}
          max={100}
          step="0.05"
          helperText="8% + Central Bank Base Rate (Editable)"
        />
      </div>

      {/* Editable 8% + Central Bank Base Rate Benchmark Notice */}
      <div className="p-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-[11px] text-slate-600 space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold text-slate-800">
            Statutory Interest Benchmark: 8% + Central Bank Base Rate (Editable Estimate)
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setAnnualRateStr('12.75')}
              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-orange-400 text-[10px] font-bold text-slate-700 cursor-pointer transition"
              title="Set illustrative 8% + 4.75% base rate benchmark (12.75%)"
            >
              8% + 4.75% Base (12.75%)
            </button>
            <button
              type="button"
              onClick={() => setAnnualRateStr('10.0')}
              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-orange-400 text-[10px] font-bold text-slate-700 cursor-pointer transition"
              title="Set illustrative 10.0% commercial contract rate"
            >
              10.0% Contract
            </button>
          </div>
        </div>
        <p className="text-[10.5px] text-slate-500 leading-relaxed">
          Under UK/EU statutory commercial debt rules, reference interest is typically modeled as <strong>8% + Central Bank Base Rate</strong>. Because Bank of England (BoE) and European Central Bank (ECB) reference rates change periodically, this field is a fully editable estimate — <strong>verify current official base rate</strong> before issuing formal demands.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
          helperText="Editable statutory or contract fee"
        />

        <div className="space-y-1">
          <label htmlFor="late-basis-select" className="text-xs font-bold text-slate-700 block">
            Day-Count Convention
          </label>
          <select
            id="late-basis-select"
            value={dayBasis}
            onChange={(e) => setDayBasis(parseInt(e.target.value, 10) as 360 | 365 | 366)}
            className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-orange-500 text-xs"
          >
            <option value={365}>Actual/365 (Standard UK/Commonwealth)</option>
            <option value={360}>Actual/360 (US Commercial / Money Market)</option>
            <option value={366}>Actual/366 (Leap Year)</option>
          </select>
        </div>
      </div>

      {/* UK Statutory Debt Recovery Compensation Tiers (£40 / £70 / £100) */}
      <div className="p-2.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
          <span className="font-bold text-slate-700">
            UK Statutory Debt Recovery Compensation Tiers (Editable Presets):
          </span>
          {safeInvoice > 0 && (
            <button
              type="button"
              onClick={() => setCompensationFeeStr(suggestedTierFee.toString())}
              className="text-[10.5px] font-bold text-orange-700 hover:underline cursor-pointer"
            >
              Auto-match invoice tier ({currency}{suggestedTierFee})
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {STATUTORY_LATE_FEE_TIERS.map((tier) => {
            const isSelected = safeFee === tier.fee;
            return (
              <button
                key={tier.fee}
                type="button"
                onClick={() => setCompensationFeeStr(tier.fee.toString())}
                className={`px-2 py-1.5 rounded-lg border text-left text-[10.5px] transition cursor-pointer ${
                  isSelected
                    ? 'bg-orange-50 border-orange-500 text-orange-900 font-bold shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold">£{tier.fee} ({currency}{tier.fee})</div>
                <div className="text-[10px] text-slate-500">{tier.tierLabel}</div>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setCompensationFeeStr('0')}
            className={`px-2 py-1.5 rounded-lg border text-left text-[10.5px] transition cursor-pointer ${
              safeFee === 0
                ? 'bg-orange-50 border-orange-500 text-orange-900 font-bold shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="font-bold">{currency}0 (No Fee)</div>
            <div className="text-[10px] text-slate-500">Interest only</div>
          </button>
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
          <strong>Important Disclaimers:</strong> This tool calculates simple commercial interest as an illustrative reference for business invoices. UK statutory debt recovery tiers (£40 for &lt; £1,000, £70 for £1,000–£9,999.99, £100 for £10,000+) and the 8% + Central Bank Base Rate benchmark are editable estimates. Verify current official Bank of England / ECB base rates and consult legal counsel before issuing formal statutory demands.
        </div>
      </div>

      {/* Assumptions & Official References Box */}
      <AssumptionsSourcesBox calculatorId="late-payment-interest" />

      <CalculatorActionBar
        isFormValid={isFormValid}
        copied={copied}
        linkCopied={linkCopied}
        onCopySummary={handleCopy}
        onShareLink={handleShareLink}
        onResetDefaults={handleReset}
        getReportPayload={getReportPayload}
      />
    </div>
  );
};


