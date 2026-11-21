import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CurrencySymbol } from '../../types';
import { Info, Calendar } from 'lucide-react';
import { copyTextToClipboard } from '../../utils/clipboard';
import {
  validateNumericInput,
  formatLatinCurrency,
  formatLatinPercent,
  roundToDecimals,
} from '../../utils/validation';
import {
  getValidatedNumericParam,
  getValidatedEnumParam,
  buildShareableCalculatorUrl,
} from '../../utils/shareableState';
import { CalculationReportPayload } from '../../utils/exportReport';
import { NumericInputField, InvalidInputAlert } from '../common/NumericInputField';
import { CalculatorActionBar } from '../common/CalculatorActionBar';

interface Props {
  currency: CurrencySymbol;
}

export const SalaryTaxCalc: React.FC<Props> = ({ currency }) => {
  const location = useLocation();

  const [grossAnnualStr, setGrossAnnualStr] = useState<string>(() =>
    getValidatedNumericParam('gross', '75000', { min: 0, max: 100000000, allowZero: true })
  );
  const [taxRateStr, setTaxRateStr] = useState<string>(() =>
    getValidatedNumericParam('taxRate', '22', { min: 0, max: 70, allowZero: true })
  );
  const [preTaxDeductionsMonthlyStr, setPreTaxDeductionsMonthlyStr] = useState<string>(() =>
    getValidatedNumericParam('deductions', '350', { min: 0, max: 100000, allowZero: true })
  );
  const [paycheckView, setPaycheckView] = useState<'weekly' | 'biweekly' | 'semimonthly' | 'monthly'>(() =>
    getValidatedEnumParam('cadence', ['weekly', 'biweekly', 'semimonthly', 'monthly'] as const, 'biweekly')
  );
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!location.search) return;
    setGrossAnnualStr(getValidatedNumericParam('gross', '75000', { min: 0, max: 100000000, allowZero: true }, location.search));
    setTaxRateStr(getValidatedNumericParam('taxRate', '22', { min: 0, max: 70, allowZero: true }, location.search));
    setPreTaxDeductionsMonthlyStr(getValidatedNumericParam('deductions', '350', { min: 0, max: 100000, allowZero: true }, location.search));
    setPaycheckView(getValidatedEnumParam('cadence', ['weekly', 'biweekly', 'semimonthly', 'monthly'] as const, 'biweekly', location.search));
  }, [location.search]);

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

  const safeGross = grossField.value ?? 0;
  const safeTaxRate = taxRateField.value ?? 0;
  const safeMonthlyDeductions = deductionsField.value ?? 0;
  const annualPreTaxDeductions = roundToDecimals(safeMonthlyDeductions * 12, 2);

  const isDeductionsValid = !grossField.isValid || !deductionsField.isValid || annualPreTaxDeductions <= safeGross;
  const deductionExceededError = !isDeductionsValid
    ? `Annual deductions (${formatLatinCurrency(annualPreTaxDeductions, currency)}) cannot exceed gross annual salary (${formatLatinCurrency(safeGross, currency)}).`
    : undefined;

  const isFormValid =
    grossField.isValid &&
    taxRateField.isValid &&
    deductionsField.isValid &&
    isDeductionsValid;

  // Pre-tax deductions reduce taxable income before tax calculation
  const taxableIncome = isFormValid
    ? roundToDecimals(safeGross - annualPreTaxDeductions, 2)
    : 0;
  const annualTax = isFormValid
    ? roundToDecimals(taxableIncome * (safeTaxRate / 100), 2)
    : 0;
  const annualNet = isFormValid
    ? roundToDecimals(safeGross - annualTax - annualPreTaxDeductions, 2)
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

  const handleShareLink = async () => {
    if (!isFormValid) return;
    const url = buildShareableCalculatorUrl(
      'salary-tax',
      {
        gross: safeGross,
        taxRate: safeTaxRate,
        deductions: safeMonthlyDeductions,
        cadence: paycheckView,
      },
      currency
    );
    const ok = await copyTextToClipboard(url);
    if (ok) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const getReportPayload = (): CalculationReportPayload => ({
    calculatorId: 'salary-tax',
    calculatorName: 'Net Salary & Paycheck Take-Home Calculator',
    currency,
    inputs: [
      { label: 'Gross Annual Salary', value: formatLatinCurrency(safeGross, currency) },
      { label: 'Combined Effective Tax Rate (%)', value: formatLatinPercent(safeTaxRate) },
      { label: 'Monthly Pre-Tax Deductions', value: formatLatinCurrency(safeMonthlyDeductions, currency) },
      { label: 'Annual Pre-Tax Deductions', value: formatLatinCurrency(annualPreTaxDeductions, currency) },
    ],
    results: [
      {
        label: activePeriodLabel.replace(/:$/, ''),
        value: formatLatinCurrency(activePeriodNet, currency),
        highlight: true,
      },
      { label: 'Annual Net Take-Home Pay', value: formatLatinCurrency(annualNet, currency) },
      { label: 'Taxable Income Base (Gross - Pre-Tax)', value: formatLatinCurrency(taxableIncome, currency) },
      { label: 'Estimated Annual Taxes Withheld', value: `-${formatLatinCurrency(annualTax, currency)}` },
      { label: 'Weekly Net Paycheck (52/yr)', value: formatLatinCurrency(weeklyNet, currency) },
      { label: 'Bi-Weekly Net Paycheck (26/yr)', value: formatLatinCurrency(biWeeklyNet, currency) },
      { label: 'Semi-Monthly Net Paycheck (24/yr)', value: formatLatinCurrency(semiMonthlyNet, currency) },
      { label: 'Monthly Net Salary (12/yr)', value: formatLatinCurrency(monthlyNet, currency) },
    ],
    assumptions: [
      'Applies your user-entered combined effective tax rate to taxable income (Gross Annual Salary minus Annual Pre-Tax Deductions).',
      'Does not automatically compute multi-tier progressive tax brackets or localized municipal payroll levies.',
    ],
  });

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

      {/* Tax Model Clarification Note */}
      <div className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1">
        <div>
          <span className="font-bold text-slate-800">Model Assumptions (Effective Combined Rate vs. Progressive Tax Brackets):</span>{' '}
          This calculator applies your entered <strong>combined effective tax rate</strong> directly to your taxable income base (Gross Salary minus Pre-Tax Deductions), rather than automatically computing multi-tier progressive tax brackets.
        </div>
        <div>
          <span className="font-bold text-slate-800">Jurisdiction Note:</span>{' '}
          Calculations utilize general withholding models for illustrative educational purposes. Federal, state/provincial, regional municipal tax rules, and mandatory social contributions (e.g., FICA, National Insurance) should be verified locally. <strong>Estimate only — not professional tax advice.</strong>
        </div>
      </div>

      {/* Primary Results Card */}
      {!isFormValid ? (
        <InvalidInputAlert
          message={
            deductionExceededError ||
            'Please provide valid non-negative numbers for salary, tax rate (0-70%), and deductions.'
          }
        />
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
          <strong>Estimate only — not professional tax advice:</strong> Models an effective combined tax baseline with pre-tax withholdings for budgeting and educational evaluation only. Consult a certified CPA or local tax authority for jurisdiction-specific filings.
        </span>
      </div>

      <CalculatorActionBar
        isFormValid={isFormValid}
        copied={copied}
        linkCopied={linkCopied}
        onCopySummary={handleCopy}
        onShareLink={handleShareLink}
        onResetDefaults={() => {
          setGrossAnnualStr('75000');
          setTaxRateStr('22');
          setPreTaxDeductionsMonthlyStr('350');
          setPaycheckView('biweekly');
        }}
        getReportPayload={getReportPayload}
      />
    </div>
  );
};

