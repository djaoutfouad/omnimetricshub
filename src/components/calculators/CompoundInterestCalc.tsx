import React, { useState } from 'react';
import { CurrencySymbol } from '../../types';
import { Copy, Check, RefreshCw, TrendingUp, Calendar } from 'lucide-react';
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

export const CompoundInterestCalc: React.FC<Props> = ({ currency }) => {
  const [principalStr, setPrincipalStr] = useState<string>('10000');
  const [monthlyDepositStr, setMonthlyDepositStr] = useState<string>('500');
  const [annualRateStr, setAnnualRateStr] = useState<string>('8.0');
  const [yearsStr, setYearsStr] = useState<string>('10');
  const [depositTiming, setDepositTiming] = useState<'end' | 'beginning'>('end');
  const [copied, setCopied] = useState(false);

  // Field validations
  const principalField = validateNumericInput(principalStr, {
    min: 0,
    max: 100000000,
    allowZero: true,
    fieldName: 'Initial Principal',
  });

  const monthlyDepositField = validateNumericInput(monthlyDepositStr, {
    min: 0,
    max: 1000000,
    allowZero: true,
    fieldName: 'Monthly Contribution',
  });

  const rateField = validateNumericInput(annualRateStr, {
    min: 0,
    max: 100,
    allowZero: true,
    fieldName: 'Annual Interest / Return (%)',
  });

  const yearsField = validateNumericInput(yearsStr, {
    min: 1,
    max: 100,
    allowZero: false,
    integerOnly: true,
    fieldName: 'Investment Horizon (Years)',
  });

  const isFormValid =
    principalField.isValid &&
    monthlyDepositField.isValid &&
    rateField.isValid &&
    yearsField.isValid;

  const safePrincipal = principalField.value ?? 0;
  const safeMonthly = monthlyDepositField.value ?? 0;
  const safeRate = rateField.value ?? 0;
  const safeYears = yearsField.value ?? 10;

  // Monthly compounding (n = 12)
  const totalMonths = safeYears * 12;
  const monthlyRate = (safeRate / 100) / 12;

  // Compound FV of Principal: P * (1 + r/12)^totalMonths
  const fvPrincipal = safePrincipal * Math.pow(1 + monthlyRate, totalMonths);

  // Compound FV of Monthly Stream
  let fvDeposits = 0;
  if (monthlyRate > 0) {
    const ordinaryAnnuityFv =
      safeMonthly * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
    fvDeposits =
      depositTiming === 'beginning'
        ? ordinaryAnnuityFv * (1 + monthlyRate)
        : ordinaryAnnuityFv;
  } else {
    fvDeposits = safeMonthly * totalMonths;
  }

  const finalBalance = isFormValid ? roundToDecimals(fvPrincipal + fvDeposits, 2) : 0;
  const totalPrincipalDeposits = roundToDecimals(safePrincipal + (safeMonthly * totalMonths), 2);
  const totalInterestEarned = isFormValid ? roundToDecimals(finalBalance - totalPrincipalDeposits, 2) : 0;
  const principalSharePercent =
    finalBalance > 0 ? roundToDecimals((totalPrincipalDeposits / finalBalance) * 100, 1) : 0;
  const interestSharePercent =
    finalBalance > 0 ? roundToDecimals((totalInterestEarned / finalBalance) * 100, 1) : 0;

  const handleCopy = async () => {
    if (!isFormValid) return;
    const text = `Compound Growth Forecast (${safeYears} Years):\n- Initial Principal: ${formatLatinCurrency(safePrincipal, currency)}\n- Monthly Contribution: ${formatLatinCurrency(safeMonthly, currency)} (${depositTiming === 'end' ? 'End of Month' : 'Beginning of Month'})\n- Annual Return Rate: ${formatLatinPercent(safeRate)} (Compounded Monthly)\n- Total Principal Contributed: ${formatLatinCurrency(totalPrincipalDeposits, currency)}\n- Total Compound Interest Earned: ${formatLatinCurrency(totalInterestEarned, currency)}\n- Projected Future Value: ${formatLatinCurrency(finalBalance, currency)}`;

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
          id="compound-principal-input"
          label={`Initial Principal (${currency})`}
          value={principalStr}
          onChange={setPrincipalStr}
          fieldState={principalField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={100000000}
          step="any"
        />

        <NumericInputField
          id="compound-deposit-input"
          label={`Monthly Contribution (${currency})`}
          value={monthlyDepositStr}
          onChange={setMonthlyDepositStr}
          fieldState={monthlyDepositField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={1000000}
          step="any"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumericInputField
          id="compound-rate-input"
          label="Annual Return / Interest (%)"
          value={annualRateStr}
          onChange={setAnnualRateStr}
          fieldState={rateField}
          suffix="%"
          placeholder="8.0"
          min={0}
          max={100}
          step="0.1"
        />

        <NumericInputField
          id="compound-years-input"
          label="Investment Horizon (Years)"
          value={yearsStr}
          onChange={setYearsStr}
          fieldState={yearsField}
          placeholder="10"
          min={1}
          max={100}
          step="1"
        />
      </div>

      {/* Deposit Timing Option */}
      <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
        <span className="font-semibold text-slate-600 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" /> Monthly Contribution Timing:
        </span>
        <div className="flex bg-slate-200/80 p-0.5 rounded-lg gap-1">
          <button
            type="button"
            onClick={() => setDepositTiming('end')}
            className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
              depositTiming === 'end' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            End of Month (Ordinary)
          </button>
          <button
            type="button"
            onClick={() => setDepositTiming('beginning')}
            className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
              depositTiming === 'beginning' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Beginning of Month (Due)
          </button>
        </div>
      </div>

      {/* Visual Composition Bar */}
      {isFormValid && finalBalance > 0 && (
        <div>
          <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
            <span>Principal Invested ({formatLatinPercent(principalSharePercent)})</span>
            <span className="text-emerald-600 font-bold">Compound Growth ({formatLatinPercent(interestSharePercent)})</span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className="bg-slate-300 transition-all duration-300"
              style={{ width: `${principalSharePercent}%` }}
              title="Total Principal Contributed"
            />
            <div
              className="bg-emerald-500 transition-all duration-300"
              style={{ width: `${interestSharePercent}%` }}
              title="Compound Interest Growth"
            />
          </div>
        </div>
      )}

      {/* Results Card */}
      {!isFormValid ? (
        <InvalidInputAlert message="Please enter valid positive numbers for principal, rate, and investment years." />
      ) : (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-inner space-y-3">
          <div className="flex justify-between items-baseline">
            <div>
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Projected Portfolio Value:
              </div>
              <div className="text-[11px] text-slate-400">Total accumulated balance after {safeYears} years</div>
            </div>
            <span className="font-black text-emerald-400 text-2xl tracking-tight">
              {formatLatinCurrency(finalBalance, currency)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Total Principal Invested:</span>
              <span className="font-bold text-slate-200 text-sm">
                {formatLatinCurrency(totalPrincipalDeposits, currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Total Compound Interest:</span>
              <span className="font-bold text-emerald-400 text-sm">
                +{formatLatinCurrency(totalInterestEarned, currency)}
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
            setPrincipalStr('10000');
            setMonthlyDepositStr('500');
            setAnnualRateStr('8.0');
            setYearsStr('10');
            setDepositTiming('end');
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
