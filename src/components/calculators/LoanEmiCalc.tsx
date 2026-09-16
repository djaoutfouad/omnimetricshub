import React, { useState } from 'react';
import { CurrencySymbol } from '../../types';
import { Copy, Check, RefreshCw, Calculator } from 'lucide-react';
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

export const LoanEmiCalc: React.FC<Props> = ({ currency }) => {
  const [principalStr, setPrincipalStr] = useState<string>('250000');
  const [annualRateStr, setAnnualRateStr] = useState<string>('6.5');
  const [tenureYearsStr, setTenureYearsStr] = useState<string>('30');
  const [copied, setCopied] = useState(false);

  // Field validation
  const principalField = validateNumericInput(principalStr, {
    min: 1,
    max: 100000000000,
    allowZero: false,
    fieldName: 'Loan Principal Amount',
  });

  const rateField = validateNumericInput(annualRateStr, {
    min: 0,
    max: 100,
    allowZero: true,
    fieldName: 'Annual Interest Rate (%)',
  });

  const tenureField = validateNumericInput(tenureYearsStr, {
    min: 0.25,
    max: 40,
    allowZero: false,
    fieldName: 'Loan Tenure (Years)',
  });

  const isFormValid = principalField.isValid && rateField.isValid && tenureField.isValid;

  const safePrincipal = principalField.value ?? 0;
  const safeRate = rateField.value ?? 0;
  const safeTenureYears = tenureField.value ?? 30;
  const totalMonths = Math.round(safeTenureYears * 12);

  const monthlyRate = (safeRate / 100) / 12;

  let emi = 0;
  if (monthlyRate > 0) {
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    if (Number.isFinite(factor) && factor > 1) {
      emi = (safePrincipal * monthlyRate * factor) / (factor - 1);
    }
  } else if (totalMonths > 0) {
    emi = safePrincipal / totalMonths;
  }

  const safeEmi = isFormValid ? roundToDecimals(emi, 2) : 0;
  const totalRepayment = isFormValid
    ? roundToDecimals(safeEmi * totalMonths, 2)
    : 0;
  const totalInterest = isFormValid ? roundToDecimals(totalRepayment - safePrincipal, 2) : 0;
  const principalSharePercent =
    totalRepayment > 0 ? roundToDecimals((safePrincipal / totalRepayment) * 100, 1) : 0;
  const interestSharePercent =
    totalRepayment > 0 ? roundToDecimals((totalInterest / totalRepayment) * 100, 1) : 0;

  const handleCopy = async () => {
    if (!isFormValid) return;
    const text = `Loan Amortization & EMI Summary:\n- Loan Principal: ${formatLatinCurrency(safePrincipal, currency)}\n- Annual Interest Rate: ${formatLatinPercent(safeRate)}\n- Tenure: ${safeTenureYears} years (${totalMonths} months)\n- Monthly Payment (EMI): ${formatLatinCurrency(safeEmi, currency)}\n- Total Interest Payable: ${formatLatinCurrency(totalInterest, currency)}\n- Total Repayment Amount: ${formatLatinCurrency(totalRepayment, currency)}`;

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
          id="loan-principal-input"
          label={`Loan Principal Amount (${currency})`}
          value={principalStr}
          onChange={setPrincipalStr}
          fieldState={principalField}
          prefix={currency}
          placeholder="0.00"
          min={1}
          max={100000000000}
          step="any"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumericInputField
          id="loan-rate-input"
          label="Annual Interest Rate (%)"
          value={annualRateStr}
          onChange={setAnnualRateStr}
          fieldState={rateField}
          suffix="%"
          placeholder="6.5"
          min={0}
          max={100}
          step="0.05"
        />

        <NumericInputField
          id="loan-tenure-input"
          label="Tenure (Years, max 40)"
          value={tenureYearsStr}
          onChange={setTenureYearsStr}
          fieldState={tenureField}
          placeholder="30"
          min={0.25}
          max={40}
          step="0.5"
          helperText={`${totalMonths} monthly installments`}
        />
      </div>

      {/* Visual Amortization Proportion */}
      {isFormValid && totalRepayment > 0 && (
        <div>
          <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
            <span>Principal ({formatLatinPercent(principalSharePercent)})</span>
            <span className="text-rose-600 font-bold">Finance Interest ({formatLatinPercent(interestSharePercent)})</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="bg-indigo-600 transition-all duration-300"
              style={{ width: `${principalSharePercent}%` }}
              title="Principal Repayment"
            />
            <div
              className="bg-rose-400 transition-all duration-300"
              style={{ width: `${interestSharePercent}%` }}
              title="Finance Interest"
            />
          </div>
        </div>
      )}

      {/* Main Results Box */}
      {!isFormValid ? (
        <InvalidInputAlert message="Please provide a valid loan principal (> 0), interest rate, and tenure (0.25 - 40 years)." />
      ) : (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-inner space-y-3">
          <div className="flex justify-between items-baseline">
            <div>
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-indigo-400" /> Monthly Payment (EMI):
              </div>
              <div className="text-[11px] text-slate-400">Fixed monthly installment across {totalMonths} months</div>
            </div>
            <span className="font-black text-indigo-400 text-2xl tracking-tight">
              {formatLatinCurrency(safeEmi, currency)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Total Interest Payable:</span>
              <span className="font-bold text-rose-400 text-sm">
                +{formatLatinCurrency(totalInterest, currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Total Principal + Interest:</span>
              <span className="font-bold text-white text-sm">
                {formatLatinCurrency(totalRepayment, currency)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => {
            setPrincipalStr('250000');
            setAnnualRateStr('6.5');
            setTenureYearsStr('30');
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
