import React, { useState } from 'react';
import { CurrencySymbol } from '../../types';
import { Copy, Check, RefreshCw, AlertTriangle } from 'lucide-react';
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

export const BreakEvenCalc: React.FC<Props> = ({ currency }) => {
  const [fixedCostsStr, setFixedCostsStr] = useState<string>('2000');
  const [unitPriceStr, setUnitPriceStr] = useState<string>('50');
  const [variableCostStr, setVariableCostStr] = useState<string>('20');
  const [copied, setCopied] = useState(false);

  // Field validation
  const fixedCostsField = validateNumericInput(fixedCostsStr, {
    min: 0,
    max: 100000000,
    allowZero: true,
    fieldName: 'Fixed Overhead Costs',
  });

  const unitPriceField = validateNumericInput(unitPriceStr, {
    min: 0.01,
    max: 10000000,
    allowZero: false,
    fieldName: 'Selling Price / Unit',
  });

  const variableCostField = validateNumericInput(variableCostStr, {
    min: 0,
    max: 10000000,
    allowZero: true,
    fieldName: 'Variable Cost / Unit',
  });

  const isFormValid =
    fixedCostsField.isValid && unitPriceField.isValid && variableCostField.isValid;

  const safeFixedCosts = fixedCostsField.value ?? 0;
  const safeUnitPrice = unitPriceField.value ?? 0;
  const safeVariableCost = variableCostField.value ?? 0;

  const contributionMargin = roundToDecimals(safeUnitPrice - safeVariableCost, 2);
  const isViable = isFormValid && contributionMargin > 0;
  const contributionRatio =
    safeUnitPrice > 0
      ? roundToDecimals((contributionMargin / safeUnitPrice) * 100, 1)
      : 0;

  // Undefined break-even if contribution margin <= 0
  const exactBreakEvenUnits = isViable ? safeFixedCosts / contributionMargin : null;
  const wholeBreakEvenUnits =
    exactBreakEvenUnits !== null ? Math.ceil(exactBreakEvenUnits) : null;

  const exactBreakEvenRevenue =
    exactBreakEvenUnits !== null
      ? roundToDecimals(exactBreakEvenUnits * safeUnitPrice, 2)
      : null;
  const wholeBreakEvenRevenue =
    wholeBreakEvenUnits !== null
      ? roundToDecimals(wholeBreakEvenUnits * safeUnitPrice, 2)
      : null;

  const safetyBufferUnits =
    wholeBreakEvenUnits !== null ? Math.ceil(wholeBreakEvenUnits * 1.25) : null;

  const handleCopy = async () => {
    if (!isFormValid) return;
    const unitsText =
      wholeBreakEvenUnits !== null
        ? `${wholeBreakEvenUnits.toLocaleString('en-US')} units`
        : 'N/A (price <= variable cost)';
    const revText =
      wholeBreakEvenRevenue !== null
        ? formatLatinCurrency(wholeBreakEvenRevenue, currency)
        : 'N/A';

    const text = `Break-Even Analysis:\n- Fixed Overhead: ${formatLatinCurrency(safeFixedCosts, currency)}\n- Unit Selling Price: ${formatLatinCurrency(safeUnitPrice, currency)}\n- Variable Cost / Unit: ${formatLatinCurrency(safeVariableCost, currency)}\n- Unit Contribution Margin: ${formatLatinCurrency(contributionMargin, currency)} (${formatLatinPercent(contributionRatio)})\n- Commercial Whole-Unit Break-Even Target: ${unitsText} (${revText})\n- 25% Safety Cushion Target: ${safetyBufferUnits !== null ? `${safetyBufferUnits.toLocaleString('en-US')} units` : 'N/A'}`;

    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-5 text-slate-800">
      <div>
        <NumericInputField
          id="be-fixed-costs-input"
          label={`Total Fixed Overhead Costs (${currency})`}
          value={fixedCostsStr}
          onChange={setFixedCostsStr}
          fieldState={fixedCostsField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={100000000}
          step="any"
          helperText="Rent, software subscriptions, payroll, insurance, and hosting"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumericInputField
          id="be-unit-price-input"
          label={`Selling Price / Unit (${currency})`}
          value={unitPriceStr}
          onChange={setUnitPriceStr}
          fieldState={unitPriceField}
          prefix={currency}
          placeholder="0.00"
          min={0.01}
          max={10000000}
          step="any"
        />

        <NumericInputField
          id="be-variable-cost-input"
          label={`Variable Cost / Unit (${currency})`}
          value={variableCostStr}
          onChange={setVariableCostStr}
          fieldState={variableCostField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={10000000}
          step="any"
          helperText="Materials, shipping, direct fulfillment"
        />
      </div>

      {/* Main Results Card */}
      {!isFormValid ? (
        <InvalidInputAlert message="Please provide valid non-negative figures for overhead, price, and variable cost." />
      ) : (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-inner space-y-3">
          <div className="flex justify-between items-baseline text-xs text-slate-400">
            <span>Unit Contribution Margin:</span>
            <span className={`font-bold ${isViable ? 'text-amber-400' : 'text-rose-400'}`}>
              {formatLatinCurrency(contributionMargin, currency)} ({formatLatinPercent(contributionRatio)})
            </span>
          </div>

          {isViable && wholeBreakEvenUnits !== null && wholeBreakEvenRevenue !== null ? (
            <>
              <div className="flex justify-between items-baseline border-t border-slate-800 pt-2.5">
                <div>
                  <div className="text-xs font-bold text-slate-300">Commercial Break-Even Target:</div>
                  <div className="text-[11px] text-slate-400">Volume required to cover all fixed overhead</div>
                </div>
                <span className="font-extrabold text-amber-400 text-2xl tracking-tight">
                  {wholeBreakEvenUnits.toLocaleString('en-US')} <span className="text-sm font-semibold text-slate-400">units</span>
                </span>
              </div>

              <div className="flex justify-between items-baseline border-t border-slate-800 pt-2.5">
                <span className="text-xs font-bold text-slate-300">Required Sales Revenue:</span>
                <span className="font-extrabold text-emerald-400 text-lg">
                  {formatLatinCurrency(wholeBreakEvenRevenue, currency)}
                </span>
              </div>

              {exactBreakEvenUnits !== null && exactBreakEvenRevenue !== null && (
                <div className="flex justify-between items-baseline border-t border-slate-800/60 pt-2 text-xs text-slate-400">
                  <span>Exact Mathematical Figure:</span>
                  <span className="font-semibold text-slate-200">
                    {formatLatinCurrency(exactBreakEvenRevenue, currency)} ({exactBreakEvenUnits.toFixed(2)} units)
                  </span>
                </div>
              )}
            </>
          ) : (
            <div role="alert" className="border-t border-slate-800 pt-2.5 flex items-start gap-2 text-rose-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-rose-300 mb-0.5">Break-Even Volume: N/A (Deficit Unit Economics)</strong>
                <span>
                  Unit selling price ({formatLatinCurrency(safeUnitPrice, currency)}) does not exceed variable costs ({formatLatinCurrency(safeVariableCost, currency)}). Break-even cannot be attained because each unit sold adds an operational loss of {formatLatinCurrency(Math.abs(contributionMargin), currency)}.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommended Safety Buffer */}
      {isViable && safetyBufferUnits !== null && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
          <span className="text-amber-900 font-medium">
            Recommended volume with 25% safety cushion:
          </span>
          <span className="font-bold text-amber-800">
            {safetyBufferUnits.toLocaleString('en-US')} units ({formatLatinCurrency(safetyBufferUnits * safeUnitPrice, currency)})
          </span>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => {
            setFixedCostsStr('2000');
            setUnitPriceStr('50');
            setVariableCostStr('20');
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
