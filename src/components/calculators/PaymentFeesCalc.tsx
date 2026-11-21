import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CurrencySymbol } from '../../types';
import { AlertTriangle, Info, ArrowRight, Workflow } from 'lucide-react';
import { PAYMENT_GATEWAY_PRESETS } from '../../data/rateDefaults';
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

export const PaymentFeesCalc: React.FC<Props> = ({ currency }) => {
  const location = useLocation();

  const [mode, setMode] = useState<'forward' | 'reverse'>(() =>
    getValidatedEnumParam('mode', ['forward', 'reverse'] as const, 'forward')
  );
  const [amountStr, setAmountStr] = useState<string>(() =>
    getValidatedNumericParam('amount', '100', { min: 0.01, max: 100000000, allowZero: false })
  );
  const [targetNetStr, setTargetNetStr] = useState<string>(() =>
    getValidatedNumericParam('targetNet', '100', { min: 0.01, max: 100000000, allowZero: false })
  );
  const [feePercentStr, setFeePercentStr] = useState<string>(() =>
    getValidatedNumericParam('feePercent', '2.9', { min: 0, max: 99.99, allowZero: true })
  );
  const [fixedFeeStr, setFixedFeeStr] = useState<string>(() =>
    getValidatedNumericParam('fixedFee', '0.30', { min: 0, max: 10000, allowZero: true })
  );
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!location.search) return;
    setMode(getValidatedEnumParam('mode', ['forward', 'reverse'] as const, 'forward', location.search));
    setAmountStr(getValidatedNumericParam('amount', '100', { min: 0.01, max: 100000000, allowZero: false }, location.search));
    setTargetNetStr(getValidatedNumericParam('targetNet', '100', { min: 0.01, max: 100000000, allowZero: false }, location.search));
    setFeePercentStr(getValidatedNumericParam('feePercent', '2.9', { min: 0, max: 99.99, allowZero: true }, location.search));
    setFixedFeeStr(getValidatedNumericParam('fixedFee', '0.30', { min: 0, max: 10000, allowZero: true }, location.search));
  }, [location.search]);

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

  const activeInvoiceAmount = mode === 'forward' ? safeAmount : reverseInvoice;

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

  const handleShareLink = async () => {
    if (!isFormValid) return;
    const url = buildShareableCalculatorUrl(
      'payment-gateway-fees',
      {
        mode,
        amount: safeAmount,
        targetNet: safeTargetNet,
        feePercent: safeFeePercent,
        fixedFee: safeFixedFee,
      },
      currency
    );
    const ok = await copyTextToClipboard(url);
    if (ok) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const lateInterestWorkflowUrl = `/tools/late-payment-interest/?principal=${activeInvoiceAmount.toFixed(2)}`;

  const getReportPayload = (): CalculationReportPayload => ({
    calculatorId: 'payment-gateway-fees',
    calculatorName: 'Payment Gateway & Invoice Fee Calculator',
    currency,
    inputs:
      mode === 'forward'
        ? [
            { label: 'Calculation Mode', value: 'Forward (Invoice to Net Payout)' },
            { label: 'Invoice / Transaction Amount', value: formatLatinCurrency(safeAmount, currency) },
            { label: 'Percentage Fee Rate', value: formatLatinPercent(safeFeePercent) },
            { label: 'Fixed Fee per Transaction', value: formatLatinCurrency(safeFixedFee, currency) },
          ]
        : [
            { label: 'Calculation Mode', value: 'Reverse Gross-Up (Target Net to Invoice)' },
            { label: 'Desired Take-Home Net Payout', value: formatLatinCurrency(safeTargetNet, currency) },
            { label: 'Percentage Fee Rate', value: formatLatinPercent(safeFeePercent) },
            { label: 'Fixed Fee per Transaction', value: formatLatinCurrency(safeFixedFee, currency) },
          ],
    results:
      mode === 'forward'
        ? [
            { label: 'Net Settled Payout', value: formatLatinCurrency(forwardNet, currency), highlight: true },
            { label: 'Processor Fee Cut', value: `-${formatLatinCurrency(forwardCut, currency)}` },
            { label: 'Effective Processing Rate', value: formatLatinPercent(forwardEffectiveFeePercent) },
          ]
        : [
            {
              label: 'Required Invoice Amount (Charge Client)',
              value: canComputeReverse ? formatLatinCurrency(reverseInvoice, currency) : 'N/A',
              highlight: true,
            },
            {
              label: 'Estimated Processor Fee Deduction',
              value: canComputeReverse ? `-${formatLatinCurrency(reverseCut, currency)}` : 'N/A',
            },
            {
              label: 'Realized Net Payout After Rounding',
              value: canComputeReverse ? formatLatinCurrency(realizedNet, currency) : 'N/A',
            },
          ],
    assumptions: [
      'Presets reflect editable US domestic standard merchant processing benchmarks.',
      'Cross-border international cards, currency conversion (FX), and regional interchange schedules may carry additional fees.',
    ],
  });

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
        <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
            Processor Rate Presets
          </span>
          <span className="text-[10.5px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
            US Domestic Standard Benchmarks (Editable)
          </span>
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

        {/* Baseline Rate Assumption Notice */}
        <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
          <span className="font-bold text-slate-800">US Domestic Standard Benchmarks (Editable):</span> Default presets reflect standard US domestic baseline rates (e.g., Stripe 2.9% + $0.30, PayPal standard 3.49% + $0.49 merchant fees). International cards, currency conversion (FX), and EEA/UK domestic rates differ. Users can manually adjust percentage and fixed fee rates for international or customized regional transactions.
        </p>
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

      {/* Connected Decision Workflow Card */}
      {isFormValid && activeInvoiceAmount > 0 && (
        <div className="p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5 text-emerald-600" /> Next Step in Your Workflow
            </span>
            <span className="text-emerald-700 font-semibold">
              Invoice: {formatLatinCurrency(activeInvoiceAmount, currency)}
            </span>
          </div>
          <Link
            to={lateInterestWorkflowUrl}
            className="w-full px-3 py-2 rounded-xl bg-white hover:bg-emerald-600 text-emerald-900 hover:text-white border border-emerald-200 hover:border-emerald-600 text-xs font-bold flex items-center justify-between transition shadow-2xs group"
          >
            <span>Calculate Late Interest on This Invoice Amount</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      )}

      {/* Preset Reference Footnote */}
      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <span>
          Presets represent <strong>US Domestic Standard Benchmarks (Editable)</strong>. Cross-border international cards (+1.0%–1.5%), currency conversion (+1.0%–2.0%), and EEA/UK domestic interchange schedules carry distinct fee structures.
        </span>
      </div>

      <CalculatorActionBar
        isFormValid={isFormValid}
        copied={copied}
        linkCopied={linkCopied}
        onCopySummary={handleCopy}
        onShareLink={handleShareLink}
        onResetDefaults={() => {
          setAmountStr('100');
          setTargetNetStr('100');
          setFeePercentStr('2.9');
          setFixedFeeStr('0.30');
        }}
        getReportPayload={getReportPayload}
      />
    </div>
  );
};

