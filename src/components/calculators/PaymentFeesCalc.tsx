import React, { useState } from 'react';
import { CurrencySymbol } from '../../types';
import { Copy, Check, RefreshCw, AlertTriangle, Info } from 'lucide-react';
import { PAYMENT_GATEWAY_PRESETS } from '../../data/rateDefaults';
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

export const PaymentFeesCalc: React.FC<Props> = ({ currency }) => {
  const [mode, setMode] = useState<'forward' | 'reverse'>('forward');
  const [amountStr, setAmountStr] = useState<string>('100');
  const [targetNetStr, setTargetNetStr] = useState<string>('100');
  const [feePercentStr, setFeePercentStr] = useState<string>('2.9');
  const [fixedFeeStr, setFixedFeeStr] = useState<string>('0.30');
  const [copied, setCopied] = useState(false);

  const presets = PAYMENT_GATEWAY_PRESETS;

  // Validation
  const amountField = validateNumericInput(amountStr, {
    min: 0.01,
    max: 100000000,
    allowZero: false,
    fieldName: 'Invoice / Transaction Amount',
  });

  const targetNetField = validateNumericInput(targetNetStr, {
    min: 0.01,
    max: 100000000,
    allowZero: false,
    fieldName: 'Desired Take-Home Net Payout',
  });

  const feePercentField = validateNumericInput(feePercentStr, {
    min: 0,
    max: 99.99,
    allowZero: true,
    fieldName: 'Percentage Fee',
  });

  const fixedFeeField = validateNumericInput(fixedFeeStr, {
    min: 0,
    max: 10000,
    allowZero: true,
    fieldName: 'Fixed Fee',
  });

  const isFormValid =
    mode === 'forward'
      ? amountField.isValid && feePercentField.isValid && fixedFeeField.isValid
      : targetNetField.isValid && feePercentField.isValid && fixedFeeField.isValid;

  // Calculations
  const safeAmount = amountField.value ?? 0;
  const safeTargetNet = targetNetField.value ?? 0;
  const safeFeePercent = feePercentField.value ?? 0;
  const safeFixedFee = fixedFeeField.value ?? 0;

  // Forward calculations
  const forwardCut = roundToDecimals((safeAmount * (safeFeePercent / 100)) + safeFixedFee, 2);
  const forwardNet = roundToDecimals(Math.max(0, safeAmount - forwardCut), 2);
  const forwardEffectiveFeePercent =
    safeAmount > 0 ? roundToDecimals((forwardCut / safeAmount) * 100, 2) : 0;
  const isFeeExceedingAmount = isFormValid && safeAmount > 0 && forwardCut >= safeAmount;

  // Reverse calculations: Required Invoice = (Target + Fixed) / (1 - (pct/100))
  const rateFraction = safeFeePercent / 100;
  const reverseDenominator = 1 - rateFraction;
  const canComputeReverse = isFormValid && reverseDenominator > 0;
  const rawReverseInvoice = canComputeReverse
    ? (safeTargetNet + safeFixedFee) / reverseDenominator
    : 0;
  const reverseInvoice = roundToDecimals(rawReverseInvoice, 2);
  const reverseCut = roundToDecimals((reverseInvoice * rateFraction) + safeFixedFee, 2);
  const realizedNet = roundToDecimals(reverseInvoice - reverseCut, 2);

  const handleCopy = async () => {
    if (!isFormValid) return;
    let text = '';
    if (mode === 'forward') {
      text = `Payment Fee Calculation:\n- Invoice Amount: ${formatLatinCurrency(safeAmount, currency)}\n- Processing Fee (${formatLatinPercent(safeFeePercent)} + ${formatLatinCurrency(safeFixedFee, currency)}): ${formatLatinCurrency(forwardCut, currency)} (${formatLatinPercent(forwardEffectiveFeePercent)} effective)\n- Net Settled Payout: ${formatLatinCurrency(forwardNet, currency)}`;
    } else {
      text = `Reverse Gross-Up Fee Calculation:\n- Target Net Payout: ${formatLatinCurrency(safeTargetNet, currency)}\n- Processing Rate: ${formatLatinPercent(safeFeePercent)} + ${formatLatinCurrency(safeFixedFee, currency)}\n- Required Invoice Amount: ${formatLatinCurrency(reverseInvoice, currency)}\n- Actual Processor Fee: ${formatLatinCurrency(reverseCut, currency)}\n- Realized Net Settled: ${formatLatinCurrency(realizedNet, currency)}`;
    }
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-5 text-slate-800">
      {/* Mode toggle */}
      <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => setMode('forward')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
            mode === 'forward' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Forward (Invoice → Net Payout)
        </button>
        <button
          type="button"
          onClick={() => setMode('reverse')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
            mode === 'reverse' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Reverse Gross-Up (Target Net → Charge Client)
        </button>
      </div>

      {/* Preset pills */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Processor Rate Presets
          </span>
          <span className="text-[10px] text-slate-400">US domestic baseline examples</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {presets.map((p) => {
            const isSelected =
              feePercentField.value === p.percentRate && fixedFeeField.value === p.fixedFee;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setFeePercentStr(p.percentRate.toString());
                  setFixedFeeStr(p.fixedFee.toString());
                }}
                className={`text-[11px] py-1 px-2 rounded-lg font-medium border text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="truncate">{p.name}</div>
                <div className="text-[10px] text-slate-400">
                  {p.percentRate}% + {currency}{p.fixedFee.toFixed(2)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-3.5">
        {mode === 'forward' ? (
          <NumericInputField
            id="pay-amount-input"
            label={`Invoice / Transaction Amount (${currency})`}
            value={amountStr}
            onChange={setAmountStr}
            fieldState={amountField}
            prefix={currency}
            placeholder="0.00"
            min={0.01}
            max={100000000}
            step="any"
          />
        ) : (
          <NumericInputField
            id="pay-target-net-input"
            label={`Desired Take-Home Net Payout (${currency})`}
            value={targetNetStr}
            onChange={setTargetNetStr}
            fieldState={targetNetField}
            prefix={currency}
            placeholder="0.00"
            min={0.01}
            max={100000000}
            step="any"
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <NumericInputField
            id="pay-fee-percent-input"
            label="Percentage Fee (%)"
            value={feePercentStr}
            onChange={setFeePercentStr}
            fieldState={feePercentField}
            suffix="%"
            placeholder="2.90"
            min={0}
            max={99.99}
            step="0.01"
            helperText="Must be strictly under 100%"
          />

          <NumericInputField
            id="pay-fixed-fee-input"
            label={`Fixed Fee (${currency})`}
            value={fixedFeeStr}
            onChange={setFixedFeeStr}
            fieldState={fixedFeeField}
            prefix={currency}
            placeholder="0.30"
            min={0}
            max={10000}
            step="0.01"
          />
        </div>
      </div>

      {/* Fee deficit alert */}
      {isFeeExceedingAmount && (
        <div id="fee-exceed-warning" role="alert" className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Fee Deficit:</strong> Gateway processing fees ({formatLatinCurrency(forwardCut, currency)}) equal or exceed the invoice amount ({formatLatinCurrency(safeAmount, currency)}), resulting in a net payout of {currency}0.00.
          </span>
        </div>
      )}

      {/* Results Card */}
      {!isFormValid ? (
        <InvalidInputAlert message="Please enter valid positive numbers within permitted ranges to calculate payment fees." />
      ) : (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-inner space-y-3">
          {mode === 'forward' ? (
            <>
              <div className="flex justify-between items-baseline text-xs text-slate-400">
                <span>Processor Fee Cut:</span>
                <span className="font-bold text-rose-400 text-sm">
                  -{formatLatinCurrency(forwardCut, currency)} ({formatLatinPercent(forwardEffectiveFeePercent)})
                </span>
              </div>
              <div className="flex justify-between items-baseline border-t border-slate-800 pt-2.5">
                <span className="text-xs font-bold text-slate-300">Net Settled Payout:</span>
                <span className="font-extrabold text-emerald-400 text-xl tracking-tight">
                  {formatLatinCurrency(forwardNet, currency)}
                </span>
              </div>
            </>
          ) : canComputeReverse ? (
            <>
              <div className="flex justify-between items-baseline text-xs text-slate-400">
                <span>Estimated Processor Fee Deduction:</span>
                <span className="font-bold text-rose-400 text-sm">
                  -{formatLatinCurrency(reverseCut, currency)}
                </span>
              </div>
              <div className="flex justify-between items-baseline border-t border-slate-800 pt-2.5">
                <span className="text-xs font-bold text-slate-300">Required Invoice (Charge Client):</span>
                <span className="font-extrabold text-emerald-400 text-xl tracking-tight">
                  {formatLatinCurrency(reverseInvoice, currency)}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 flex justify-between">
                <span>Realized net payout after standard currency rounding:</span>
                <span className="font-semibold text-slate-200">
                  {formatLatinCurrency(realizedNet, currency)}
                </span>
              </div>
            </>
          ) : (
            <div className="text-center py-3 text-rose-400 text-xs">
              Reverse calculation cannot be computed (N/A) because percentage fee equals or exceeds 100%.
            </div>
          )}
        </div>
      )}

      {/* Preset Reference Footnote */}
      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          Presets illustrate standard US domestic card processing schedules. International transactions, currency conversions, and merchant interchange agreements carry distinct rates.
        </span>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => {
            setAmountStr('100');
            setTargetNetStr('100');
            setFeePercentStr('2.9');
            setFixedFeeStr('0.30');
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
