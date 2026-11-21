import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CurrencySymbol } from '../../types';
import { AlertTriangle, ArrowRight, Workflow, ArrowLeftRight } from 'lucide-react';
import { copyTextToClipboard } from '../../utils/clipboard';
import {
  validateNumericInput,
  formatLatinCurrency,
  formatLatinPercent,
  roundToDecimals,
} from '../../utils/validation';
import {
  getValidatedNumericParam,
  buildShareableCalculatorUrl,
} from '../../utils/shareableState';
import { CalculationReportPayload } from '../../utils/exportReport';
import { NumericInputField, InvalidInputAlert } from '../common/NumericInputField';
import { CalculatorActionBar } from '../common/CalculatorActionBar';
import { AssumptionsSourcesBox } from '../common/AssumptionsSourcesBox';

interface Props {
  currency: CurrencySymbol;
}

export const ProfitMarginCalc: React.FC<Props> = ({ currency }) => {
  const location = useLocation();

  const [costStr, setCostStr] = useState<string>(() =>
    getValidatedNumericParam('cost', '50', { min: 0, max: 100000000, allowZero: true })
  );
  const [priceStr, setPriceStr] = useState<string>(() =>
    getValidatedNumericParam('price', '100', { min: 0, max: 100000000, allowZero: true })
  );
  const [targetMarginStr, setTargetMarginStr] = useState<string>(() =>
    getValidatedNumericParam('targetMargin', '40', { min: 0.1, max: 99.9, allowZero: false })
  );
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [costBStr, setCostBStr] = useState<string>('45');
  const [priceBStr, setPriceBStr] = useState<string>('110');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!location.search) return;
    setCostStr(getValidatedNumericParam('cost', '50', { min: 0, max: 100000000, allowZero: true }, location.search));
    setPriceStr(getValidatedNumericParam('price', '100', { min: 0, max: 100000000, allowZero: true }, location.search));
    setTargetMarginStr(getValidatedNumericParam('targetMargin', '40', { min: 0.1, max: 99.9, allowZero: false }, location.search));
  }, [location.search]);

  // Field validation
  const costField = validateNumericInput(costStr, {
    min: 0,
    max: 100000000,
    allowZero: true,
    fieldName: 'Cost Price',
  });

  const priceField = validateNumericInput(priceStr, {
    min: 0,
    max: 100000000,
    allowZero: true,
    fieldName: 'Selling Price',
  });

  const targetMarginField = validateNumericInput(targetMarginStr, {
    min: 0.1,
    max: 99.9,
    allowZero: false,
    fieldName: 'Target Margin Goal',
  });

  const costBField = validateNumericInput(costBStr, {
    min: 0,
    max: 100000000,
    allowZero: true,
    fieldName: 'Option B Cost Price',
  });

  const priceBField = validateNumericInput(priceBStr, {
    min: 0,
    max: 100000000,
    allowZero: true,
    fieldName: 'Option B Selling Price',
  });

  const isOptionAValid = costField.isValid && priceField.isValid;
  const isOptionBValid = costBField.isValid && priceBField.isValid;
  const isFormValid = isOptionAValid && (!isComparing || isOptionBValid);

  const safeCost = costField.value ?? 0;
  const safePrice = priceField.value ?? 0;
  const safeTargetMargin = targetMarginField.value ?? 0;
  const safeCostB = costBField.value ?? 0;
  const safePriceB = priceBField.value ?? 0;

  const grossProfit = roundToDecimals(safePrice - safeCost, 2);
  const isLoss = isOptionAValid && safePrice > 0 && safeCost > safePrice;

  // Margin requires selling price > 0
  const isMarginDefined = isOptionAValid && safePrice > 0;
  const marginPct = isMarginDefined
    ? roundToDecimals((grossProfit / safePrice) * 100, 1)
    : null;

  // Markup requires cost > 0
  const isMarkupDefined = isOptionAValid && safeCost > 0;
  const markupPct = isMarkupDefined
    ? roundToDecimals((grossProfit / safeCost) * 100, 1)
    : null;

  const priceMultiplier = isMarkupDefined
    ? roundToDecimals(safePrice / safeCost, 2)
    : null;

  // Option B calculations
  const grossProfitB = roundToDecimals(safePriceB - safeCostB, 2);
  const marginPctB =
    isOptionBValid && safePriceB > 0
      ? roundToDecimals((grossProfitB / safePriceB) * 100, 1)
      : null;
  const markupPctB =
    isOptionBValid && safeCostB > 0
      ? roundToDecimals((grossProfitB / safeCostB) * 100, 1)
      : null;
  const profitDiff = roundToDecimals(grossProfitB - grossProfit, 2);
  const marginDiff =
    marginPct !== null && marginPctB !== null
      ? roundToDecimals(marginPctB - marginPct, 1)
      : null;
  const markupDiff =
    markupPct !== null && markupPctB !== null
      ? roundToDecimals(markupPctB - markupPct, 1)
      : null;

  // Target margin calculation: Required Price = Cost / (1 - targetMargin/100)
  const isTargetValid = targetMarginField.isValid && safeCost > 0;
  const targetRequiredPriceRaw = isTargetValid
    ? safeCost / (1 - (safeTargetMargin / 100))
    : 0;
  const roundedTargetPrice = roundToDecimals(targetRequiredPriceRaw, 2);
  const realizedTargetMargin = roundedTargetPrice > 0
    ? roundToDecimals(((roundedTargetPrice - safeCost) / roundedTargetPrice) * 100, 1)
    : 0;

  const handleCopy = async () => {
    if (!isFormValid) return;
    const marginText = marginPct !== null ? `${marginPct.toFixed(1)}%` : 'N/A (price is 0)';
    const markupText = markupPct !== null ? `${markupPct.toFixed(1)}%` : 'N/A (cost is 0)';
    const multText = priceMultiplier !== null ? `${priceMultiplier.toFixed(2)}x` : 'N/A';

    const text = `Profit Margin & Markup Breakdown:\n- Cost Price: ${formatLatinCurrency(safeCost, currency)}\n- Selling Price: ${formatLatinCurrency(safePrice, currency)}\n- ${isLoss ? 'Gross Loss' : 'Gross Profit'}: ${formatLatinCurrency(grossProfit, currency)}\n- Profit Margin: ${marginText}\n- Markup: ${markupText}\n- Price Multiplier: ${multText}`;
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLink = async () => {
    if (!isFormValid) return;
    const url = buildShareableCalculatorUrl(
      'profit-margin',
      {
        cost: safeCost,
        price: safePrice,
        targetMargin: targetMarginField.isValid ? safeTargetMargin : 40,
      },
      currency
    );
    const ok = await copyTextToClipboard(url);
    if (ok) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const breakEvenWorkflowUrl = `/tools/break-even/?price=${safePrice.toFixed(2)}&variableCost=${safeCost.toFixed(2)}`;
  const roasWorkflowUrl = `/tools/roas-calculator/?cogs=${safeCost.toFixed(2)}`;

  const getReportPayload = (): CalculationReportPayload => ({
    calculatorId: 'profit-margin',
    calculatorName: 'Profit Margin & Markup Calculator',
    currency,
    inputs: [
      { label: 'Unit Cost Price', value: formatLatinCurrency(safeCost, currency) },
      { label: 'Unit Selling Price', value: formatLatinCurrency(safePrice, currency) },
      {
        label: 'Target Margin Goal',
        value: targetMarginField.isValid ? formatLatinPercent(safeTargetMargin) : 'N/A',
      },
    ],
    results: [
      {
        label: isLoss ? 'Gross Loss per Unit' : 'Gross Profit per Unit',
        value: formatLatinCurrency(grossProfit, currency),
        highlight: true,
      },
      {
        label: 'Profit Margin (%)',
        value: marginPct !== null ? formatLatinPercent(marginPct) : 'N/A (selling price is 0)',
      },
      {
        label: 'Markup on Cost (%)',
        value: markupPct !== null ? formatLatinPercent(markupPct) : 'N/A (cost price is 0)',
      },
      {
        label: 'Price-to-Cost Multiplier',
        value: priceMultiplier !== null ? `${priceMultiplier.toFixed(2)}x` : 'N/A',
      },
      {
        label: 'Required Selling Price for Target Margin',
        value: isTargetValid ? formatLatinCurrency(roundedTargetPrice, currency) : 'N/A',
      },
    ],
    assumptions: [
      'Gross Profit Margin is calculated as (Selling Price - Cost Price) / Selling Price.',
      'Markup Percentage is calculated as (Selling Price - Cost Price) / Cost Price.',
    ],
  });

  return (
    <div className="space-y-4 text-slate-800">
      {/* Compare Scenarios (A vs. B) Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200/90 rounded-xl">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
          <span>Compare Pricing Options (A vs. B)</span>
        </span>
        <button
          type="button"
          onClick={() => setIsComparing((prev) => !prev)}
          aria-pressed={isComparing}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
            isComparing
              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          {isComparing ? 'Comparing A vs. B (On)' : 'Compare Scenarios (A vs. B)'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumericInputField
          id="margin-cost-input"
          label={isComparing ? `Option A Cost Price (${currency})` : `Cost Price (${currency})`}
          value={costStr}
          onChange={setCostStr}
          fieldState={costField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={100000000}
          step="any"
          helperText={safeCost === 0 && costField.isValid ? 'Zero cost makes markup undefined (N/A)' : undefined}
        />

        <NumericInputField
          id="margin-price-input"
          label={isComparing ? `Option A Selling Price (${currency})` : `Selling Price (${currency})`}
          value={priceStr}
          onChange={setPriceStr}
          fieldState={priceField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={100000000}
          step="any"
          helperText={safePrice === 0 && priceField.isValid ? 'Zero price makes margin undefined (N/A)' : undefined}
        />
      </div>

      {/* Option B Inputs */}
      {isComparing && (
        <div className="p-3.5 bg-blue-50/60 border border-blue-200/90 rounded-2xl space-y-2.5">
          <div className="text-[11px] font-extrabold text-blue-950 uppercase tracking-wider">
            Pricing Option B (Comparison Scenario)
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumericInputField
              id="margin-cost-b-input"
              label={`Option B Cost Price (${currency})`}
              value={costBStr}
              onChange={setCostBStr}
              fieldState={costBField}
              prefix={currency}
              placeholder="0.00"
              min={0}
              max={100000000}
              step="any"
            />
            <NumericInputField
              id="margin-price-b-input"
              label={`Option B Selling Price (${currency})`}
              value={priceBStr}
              onChange={setPriceBStr}
              fieldState={priceBField}
              prefix={currency}
              placeholder="0.00"
              min={0}
              max={100000000}
              step="any"
            />
          </div>
        </div>
      )}

      {/* Visual Revenue Share Bar */}
      {isFormValid && safePrice > 0 && marginPct !== null && (
        <div>
          <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
            <span>Cost Share ({isLoss ? '100%+' : `${(100 - Math.max(0, marginPct)).toFixed(1)}%`})</span>
            <span className={isLoss ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
              {isLoss ? 'Deficit' : `Profit Share (${Math.max(0, marginPct).toFixed(1)}%)`}
            </span>
          </div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
            {isLoss ? (
              <div className="bg-rose-500 w-full transition-all duration-300" title="Deficit / Loss" />
            ) : (
              <>
                <div
                  className="bg-slate-300 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, 100 - marginPct))}%` }}
                  title="Cost Portion"
                />
                <div
                  className="bg-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, marginPct))}%` }}
                  title="Profit Margin Portion"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Negative Margin / Gross Loss Warning */}
      {isLoss && (
        <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Operational Loss Alert:</span> Cost price ({formatLatinCurrency(safeCost, currency)}) exceeds selling price ({formatLatinCurrency(safePrice, currency)}). Every unit sold results in a loss of {formatLatinCurrency(Math.abs(grossProfit), currency)} ({marginPct !== null ? `${Math.abs(marginPct).toFixed(1)}% negative margin` : ''}).
          </div>
        </div>
      )}

      {/* Results Container */}
      {!isFormValid ? (
        <InvalidInputAlert message="Please provide valid cost and selling prices to calculate margins." />
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          <div className={`p-3 rounded-2xl text-center border ${isLoss ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLoss ? 'text-rose-800' : 'text-emerald-800'}`}>
              {isLoss ? 'Gross Loss' : 'Gross Profit'}
            </span>
            <div className={`text-base font-extrabold mt-0.5 ${isLoss ? 'text-rose-600' : 'text-emerald-700'}`}>
              {grossProfit < 0
                ? `-${formatLatinCurrency(Math.abs(grossProfit), currency)}`
                : formatLatinCurrency(grossProfit, currency)}
            </div>
          </div>

          <div className={`p-3 rounded-2xl text-center border ${isLoss ? 'bg-rose-50 border-rose-200' : 'bg-blue-50 border-blue-200'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLoss ? 'text-rose-800' : 'text-blue-800'}`}>
              Margin
            </span>
            <div className={`text-base font-extrabold mt-0.5 ${isLoss ? 'text-rose-600' : 'text-blue-700'}`}>
              {marginPct !== null ? (
                formatLatinPercent(marginPct)
              ) : (
                <span className="text-slate-400 font-bold text-sm" title="Undefined: Selling price is zero">N/A</span>
              )}
            </div>
          </div>

          <div className={`p-3 rounded-2xl text-center border ${isLoss ? 'bg-rose-50 border-rose-200' : 'bg-purple-50 border-purple-200'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isLoss ? 'text-rose-800' : 'text-purple-800'}`}>
              Markup
            </span>
            <div className={`text-base font-extrabold mt-0.5 ${isLoss ? 'text-rose-600' : 'text-purple-700'}`}>
              {markupPct !== null ? (
                formatLatinPercent(markupPct)
              ) : (
                <span className="text-slate-400 font-bold text-sm" title="Undefined: Cost price is zero">N/A</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Target Margin Helper */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="margin-target-input" className="text-xs font-bold text-slate-700">
            Target Margin Goal:
          </label>
          <div className="flex items-center gap-1">
            <input
              id="margin-target-input"
              type="text"
              inputMode="decimal"
              value={targetMarginStr}
              onChange={(e) => setTargetMarginStr(e.target.value)}
              aria-invalid={!targetMarginField.isValid}
              aria-describedby={!targetMarginField.isValid ? 'margin-target-error' : undefined}
              className={`w-20 px-2 py-1 bg-white border rounded-lg text-xs font-bold text-center outline-none transition ${
                !targetMarginField.isValid
                  ? 'border-rose-400 text-rose-900 focus:ring-1 focus:ring-rose-500'
                  : 'border-slate-300 focus:ring-1 focus:ring-blue-500'
              }`}
            />
            <span className="text-xs font-bold text-slate-500">%</span>
          </div>
        </div>

        {!targetMarginField.isValid && (
          <p id="margin-target-error" role="alert" className="text-[11px] text-rose-600 font-semibold">
            {targetMarginField.errorMessage || 'Target margin must be between 0.1% and 99.9%'}
          </p>
        )}

        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
          <span className="text-slate-500">Required Selling Price:</span>
          {isTargetValid ? (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setPriceStr(roundedTargetPrice.toFixed(2))}
                className="font-extrabold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer ml-auto"
                title="Click to apply to selling price input"
              >
                {formatLatinCurrency(roundedTargetPrice, currency)} (Apply)
              </button>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Realized margin after rounding: {formatLatinPercent(realizedTargetMargin)}
              </div>
            </div>
          ) : (
            <span className="text-slate-400 font-medium">
              {safeCost <= 0 ? 'Enter cost > 0' : 'N/A (check target %)'}
            </span>
          )}
        </div>
      </div>

      {/* Side-by-Side Pricing Option A vs. Option B Comparison */}
      {isComparing && isFormValid && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-inner space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400">
              Side-by-Side Pricing Comparison (A vs. B)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-emerald-400">Pricing Option A</span>
                <span className="text-[11px] text-slate-400">
                  Cost {formatLatinCurrency(safeCost, currency)} → {formatLatinCurrency(safePrice, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Gross Profit / Unit:</span>
                <span className="font-bold text-white">{formatLatinCurrency(grossProfit, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Profit Margin:</span>
                <span className="font-bold text-emerald-400">
                  {marginPct !== null ? formatLatinPercent(marginPct) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Markup on Cost:</span>
                <span className="font-bold text-purple-300">
                  {markupPct !== null ? formatLatinPercent(markupPct) : 'N/A'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-blue-400">Pricing Option B</span>
                <span className="text-[11px] text-slate-400">
                  Cost {formatLatinCurrency(safeCostB, currency)} → {formatLatinCurrency(safePriceB, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Gross Profit / Unit:</span>
                <span className="font-bold text-white">{formatLatinCurrency(grossProfitB, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Profit Margin:</span>
                <span className="font-bold text-blue-400">
                  {marginPctB !== null ? formatLatinPercent(marginPctB) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Markup on Cost:</span>
                <span className="font-bold text-purple-300">
                  {markupPctB !== null ? formatLatinPercent(markupPctB) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Verdict Badge */}
          <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-700/60 text-xs text-blue-100 flex flex-wrap items-center justify-between gap-2">
            {grossProfit === grossProfitB ? (
              <span className="font-bold">
                Verdict: Both Pricing Option A and Option B generate identical gross profit ({formatLatinCurrency(grossProfit, currency)}/unit).
              </span>
            ) : (
              <>
                <span className="font-extrabold text-blue-300">
                  Verdict: {grossProfitB > grossProfit ? 'Option B' : 'Option A'} yields +{formatLatinCurrency(Math.abs(profitDiff), currency)} more profit per unit
                </span>
                <span className="text-[11px] font-bold bg-blue-900/90 text-blue-200 px-2 py-0.5 rounded-md">
                  Margin Δ: {marginDiff !== null ? `${marginDiff > 0 ? '+' : ''}${marginDiff.toFixed(1)}%` : 'N/A'} | Markup Δ: {markupDiff !== null ? `${markupDiff > 0 ? '+' : ''}${markupDiff.toFixed(1)}%` : 'N/A'}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Connected Decision Workflow Card */}
      {isFormValid && safePrice > 0 && (
        <div className="p-3 bg-blue-50/80 border border-blue-200/90 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-extrabold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5 text-blue-600" /> Next Step in Your Workflow
            </span>
            <span className="text-blue-700 font-semibold">
              Price {formatLatinCurrency(safePrice, currency)} / Cost {formatLatinCurrency(safeCost, currency)}
            </span>
          </div>
          <div className="space-y-1.5">
            <Link
              to={breakEvenWorkflowUrl}
              className="w-full px-3 py-2 rounded-xl bg-white hover:bg-blue-600 text-blue-900 hover:text-white border border-blue-200 hover:border-blue-600 text-xs font-bold flex items-center justify-between transition shadow-2xs group"
            >
              <span>Check Break-Even Volume with This Price & Cost</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-600 group-hover:text-white group-hover:translate-x-0.5 transition" />
            </Link>
            <Link
              to={roasWorkflowUrl}
              className="w-full px-3 py-2 rounded-xl bg-white hover:bg-blue-600 text-blue-900 hover:text-white border border-blue-200 hover:border-blue-600 text-xs font-bold flex items-center justify-between transition shadow-2xs group"
            >
              <span>Model Ad Profitability in ROAS Calculator</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-600 group-hover:text-white group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
        </div>
      )}

      {/* Assumptions & Official References Box */}
      <AssumptionsSourcesBox calculatorId="profit-margin" />

      <CalculatorActionBar
        isFormValid={isFormValid}
        copied={copied}
        linkCopied={linkCopied}
        onCopySummary={handleCopy}
        onShareLink={handleShareLink}
        onResetDefaults={() => {
          setCostStr('50');
          setPriceStr('100');
          setTargetMarginStr('40');
          setCostBStr('45');
          setPriceBStr('110');
        }}
        getReportPayload={getReportPayload}
      />
    </div>
  );
};

