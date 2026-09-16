import React, { useState } from 'react';
import { CurrencySymbol } from '../../types';
import { Copy, Check, RefreshCw, Info, Calendar } from 'lucide-react';
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

export const SalaryTaxCalc: React.FC<Props> = ({ currency }) => {
  const [grossAnnualStr, setGrossAnnualStr] = useState<string>('75000');
  const [taxRateStr, setTaxRateStr] = useState<string>('22');
  const [preTaxDeductionsMonthlyStr, setPreTaxDeductionsMonthlyStr] = useState<string>('350');
  const [paycheckView, setPaycheckView] = useState<'weekly' | 'biweekly' | 'semimonthly' | 'monthly'>('biweekly');
  const [copied, setCopied] = useState(false);

  // Field validation
  const grossField = validateNumericInput(grossAnnualStr, {
    min: 0,
    max: 100000000,
    allowZero: true,
    fieldName: 'Gross Annual Salary',
  });

  const taxRateField = validateNumericInput(taxRateStr, {
    min: 0,
    max: 70,
    allowZero: true,
    fieldName: 'Blended Income Tax Rate (%)',
  });

  const deductionsField = validateNumericInput(preTaxDeductionsMonthlyStr, {
    min: 0,
    max: 100000,
    allowZero: true,
    fieldName: 'Pre-Tax Deductions (Monthly)',
  });

  const isFormValid = grossField.isValid && taxRateField.isValid && deductionsField.isValid;

  const safeGross = grossField.value ?? 0;
  const safeTaxRate = taxRateField.value ?? 0;
  const safeMonthlyDeductions = deductionsField.value ?? 0;

  // Pre-tax deductions reduce taxable income before tax calculation
  const annualPreTaxDeductions = roundToDecimals(safeMonthlyDeductions * 12, 2);
  const taxableIncome = Math.max(0, roundToDecimals(safeGross - annualPreTaxDeductions, 2));
  const annualTax = isFormValid ? roundToDecimals(taxableIncome * (safeTaxRate / 100), 2) : 0;
  const annualNet = isFormValid
    ? Math.max(0, roundToDecimals(safeGross - annualTax - annualPreTaxDeductions, 2))
    : 0;

  // Paycheck breakdown
  const weeklyNet = roundToDecimals(annualNet / 52, 2);
  const biWeeklyNet = roundToDecimals(annualNet / 26, 2);
  const semiMonthlyNet = roundToDecimals(annualNet / 24, 2);
  const monthlyNet = roundToDecimals(annualNet / 12, 2);

  const activePeriodNet =
    paycheckView === 'weekly'
      ? weeklyNet
      : paycheckView === 'biweekly'
      ? biWeeklyNet
      : paycheckView === 'semimonthly'
      ? semiMonthlyNet
      : monthlyNet;

  const activePeriodLabel =
    paycheckView === 'weekly'
      ? 'Weekly Paycheck (52/yr):'
      : paycheckView === 'biweekly'
      ? 'Bi-Weekly Paycheck (26/yr):'
      : paycheckView === 'semimonthly'
      ? 'Semi-Monthly Paycheck (24/yr):'
      : 'Monthly Net Salary (12/yr):';

  const taxSavingsFromDeductions = roundToDecimals(
    annualPreTaxDeductions * (safeTaxRate / 100),
    2
  );

  const handleCopy = async () => {
    if (!isFormValid) return;
    const text = `Net Salary & Paycheck Breakdown:\n- Gross Annual Salary: ${formatLatinCurrency(safeGross, currency)}\n- Annual Pre-Tax Deductions: ${formatLatinCurrency(annualPreTaxDeductions, currency)}\n- Taxable Income Base: ${formatLatinCurrency(taxableIncome, currency)}\n- Estimated Tax Rate: ${formatLatinPercent(safeTaxRate)} (${formatLatinCurrency(annualTax, currency)} withheld)\n- Annual Net Take-Home: ${formatLatinCurrency(annualNet, currency)}\n- Weekly Paycheck (52 wks): ${formatLatinCurrency(weeklyNet, currency)}/wk\n- Bi-Weekly Paycheck (26 wks): ${formatLatinCurrency(biWeeklyNet, currency)}/period\n- Semi-Monthly Paycheck (24 wks): ${formatLatinCurrency(semiMonthlyNet, currency)}/period\n- Monthly Net Salary: ${formatLatinCurrency(monthlyNet, currency)}/mo`;

    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      <div>
        <NumericInputField
          id="salary-gross-input"
          label={`Gross Annual Salary (${currency})`}
          value={grossAnnualStr}
          onChange={setGrossAnnualStr}
          fieldState={grossField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={100000000}
          step="any"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumericInputField
          id="salary-tax-rate-input"
          label="Estimated Tax Rate (%)"
          value={taxRateStr}
          onChange={setTaxRateStr}
          fieldState={taxRateField}
          suffix="%"
          placeholder="22.0"
          min={0}
          max={70}
          step="0.5"
          helperText="Combined effective income & payroll tax"
        />

        <NumericInputField
          id="salary-deductions-input"
          label={`Pre-Tax Deductions (${currency}/mo)`}
          value={preTaxDeductionsMonthlyStr}
          onChange={setPreTaxDeductionsMonthlyStr}
          fieldState={deductionsField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={100000}
          step="any"
          helperText="401(k), HSA, qualifying health premiums"
        />
      </div>

      {/* Paycheck Cadence Selector */}
      <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs">
        <button
          type="button"
          onClick={() => setPaycheckView('weekly')}
          className={`flex-1 py-1.5 font-bold rounded-lg transition cursor-pointer ${
            paycheckView === 'weekly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Weekly (52)
        </button>
        <button
          type="button"
          onClick={() => setPaycheckView('biweekly')}
          className={`flex-1 py-1.5 font-bold rounded-lg transition cursor-pointer ${
            paycheckView === 'biweekly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Bi-Weekly (26)
        </button>
        <button
          type="button"
          onClick={() => setPaycheckView('semimonthly')}
          className={`flex-1 py-1.5 font-bold rounded-lg transition cursor-pointer ${
            paycheckView === 'semimonthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Semi-Mo (24)
        </button>
        <button
          type="button"
          onClick={() => setPaycheckView('monthly')}
          className={`flex-1 py-1.5 font-bold rounded-lg transition cursor-pointer ${
            paycheckView === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Monthly (12)
        </button>
      </div>

      {/* Primary Results Card */}
      {!isFormValid ? (
        <InvalidInputAlert message="Please provide valid non-negative numbers for salary, tax rate (0-70%), and deductions." />
      ) : (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-inner space-y-3">
          <div className="flex justify-between items-baseline">
            <div>
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-pink-400" />
                {activePeriodLabel}
              </div>
              <div className="text-[11px] text-slate-400">
                Net estimated take-home deposited each pay period
              </div>
            </div>
            <span className="font-black text-pink-400 text-2xl tracking-tight">
              {formatLatinCurrency(activePeriodNet, currency)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Annual Net Take-Home:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {formatLatinCurrency(annualNet, currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Taxes Withheld ({formatLatinPercent(safeTaxRate)}):</span>
              <span className="font-bold text-rose-400 text-sm">
                -{formatLatinCurrency(annualTax, currency)}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-2 flex justify-between text-xs text-slate-400">
            <span>Taxable Income Base (Gross - Pre-Tax):</span>
            <span className="font-semibold text-slate-200">
              {formatLatinCurrency(taxableIncome, currency)}
            </span>
          </div>
        </div>
      )}

      {/* Info on Pre-tax Advantage */}
      {annualPreTaxDeductions > 0 && isFormValid && (
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            Pre-tax deductions ({formatLatinCurrency(annualPreTaxDeductions, currency)}/yr) reduce your taxable income base dollar-for-dollar, saving an estimated {formatLatinCurrency(taxSavingsFromDeductions, currency)} in taxes annually compared to after-tax contributions.
          </span>
        </div>
      )}

      {/* Educational Disclaimer */}
      <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <span>
          <strong>Educational Estimate:</strong> Models an effective tax baseline with pre-tax withholdings for budgeting purposes. This is an informational tool and does not constitute formal legal, accounting, or tax advice. Consult a certified CPA for jurisdiction-specific filings.
        </span>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => {
            setGrossAnnualStr('75000');
            setTaxRateStr('22');
            setPreTaxDeductionsMonthlyStr('350');
            setPaycheckView('biweekly');
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
