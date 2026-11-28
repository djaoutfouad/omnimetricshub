import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { CurrencySymbol } from '../../types';
import { AlertTriangle } from 'lucide-react';
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

export const BreakEvenCalc: React.FC<Props> = ({ currency }) => {
  const location = useLocation();

  const [fixedCostsStr, setFixedCostsStr] = useState<string>(() =>
    getValidatedNumericParam('fixedCosts', '2000', { min: 0, max: 100000000, allowZero: true })
  );
  const [unitPriceStr, setUnitPriceStr] = useState<string>(() =>
    getValidatedNumericParam('price', '50', { min: 0.01, max: 10000000, allowZero: false })
  );
  const [variableCostStr, setVariableCostStr] = useState<string>(() =>
    getValidatedNumericParam('variableCost', '20', { min: 0, max: 10000000, allowZero: true })
  );
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!location.search) return;
    setFixedCostsStr(getValidatedNumericParam('fixedCosts', '2000', { min: 0, max: 100000000, allowZero: true }, location.search));
    setUnitPriceStr(getValidatedNumericParam('price', '50', { min: 0.01, max: 10000000, allowZero: false }, location.search));
    setVariableCostStr(getValidatedNumericParam('variableCost', '20', { min: 0, max: 10000000, allowZero: true }, location.search));
  }, [location.search]);

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

  const rawContributionMargin = safeUnitPrice - safeVariableCost;
  const contributionMargin = roundToDecimals(rawContributionMargin, 2);
  const isViable = isFormValid && rawContributionMargin > 0;
  const contributionRatio =
    safeUnitPrice > 0
      ? roundToDecimals((rawContributionMargin / safeUnitPrice) * 100, 1)
      : 0;

  // Undefined break-even if contribution margin <= 0
  const unroundedBreakEvenUnits = isViable ? safeFixedCosts / rawContributionMargin : null;
  const wholeBreakEvenUnits =
    unroundedBreakEvenUnits !== null
      ? unroundedBreakEvenUnits > 0
        ? Math.ceil(unroundedBreakEvenUnits - 1e-9)
        : 0
      : null;

  const unroundedBreakEvenRevenue =
    unroundedBreakEvenUnits !== null
      ? roundToDecimals(unroundedBreakEvenUnits * safeUnitPrice, 2)
      : null;
  const wholeBreakEvenRevenue =
    wholeBreakEvenUnits !== null
      ? roundToDecimals(wholeBreakEvenUnits * safeUnitPrice, 2)
      : null;

  const safetyBufferUnits =
    wholeBreakEvenUnits !== null ? Math.ceil(wholeBreakEvenUnits * 1.25) : null;

  // Pure SVG Break-Even Line Chart (Total Revenue vs. Total Cost from 0 to 2x Break-Even Units)
  const breakEvenChart = useMemo(() => {
    if (!isViable || unroundedBreakEvenUnits === null || wholeBreakEvenUnits === null) {
      return null;
    }
    const width = 440;
    const height = 170;
    const padLeft = 46;
    const padRight = 16;
    const padTop = 16;
    const padBottom = 26;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const maxUnits = Math.max(2, wholeBreakEvenUnits * 2);
    const maxRevenue = maxUnits * safeUnitPrice;
    const maxTotalCost = safeFixedCosts + maxUnits * safeVariableCost;
    const maxY = Math.max(1, maxRevenue, maxTotalCost, safeFixedCosts);

    const getX = (u: number) => {
      const clampedU = Math.max(0, Math.min(maxUnits, Number.isFinite(u) ? u : 0));
      return roundToDecimals(padLeft + (clampedU / maxUnits) * plotW, 2);
    };
    const getY = (val: number) => {
      const clampedV = Math.max(0, Math.min(maxY, Number.isFinite(val) ? val : 0));
      return roundToDecimals(padTop + plotH - (clampedV / maxY) * plotH, 2);
    };

    const x0 = getX(0);
    const xMax = getX(maxUnits);
    const xBe = getX(unroundedBreakEvenUnits);

    const y0 = getY(0);
    const yFixed = getY(safeFixedCosts);
    const yCostMax = getY(maxTotalCost);
    const yRevMax = getY(maxRevenue);
    const yBe = getY(unroundedBreakEvenUnits * safeUnitPrice);

    const lossZonePolygon = `${x0},${y0} ${x0},${yFixed} ${xBe},${yBe}`;
    const profitZonePolygon = `${xBe},${yBe} ${xMax},${yRevMax} ${xMax},${yCostMax}`;

    return {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      plotW,
      plotH,
      maxUnits,
      maxY,
      x0,
      xMax,
      xBe,
      y0,
      yFixed,
      yCostMax,
      yRevMax,
      yBe,
      lossZonePolygon,
      profitZonePolygon,
    };
  }, [isViable, unroundedBreakEvenUnits, wholeBreakEvenUnits, safeUnitPrice, safeFixedCosts, safeVariableCost]);

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

  const handleShareLink = async () => {
    if (!isFormValid) return;
    const url = buildShareableCalculatorUrl(
      'break-even',
      {
        fixedCosts: safeFixedCosts,
        price: safeUnitPrice,
        variableCost: safeVariableCost,
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
    calculatorId: 'break-even',
    calculatorName: 'Break-Even Point & Unit Volume Calculator',
    slug: 'break-even',
    currency,
    inputs: [
      { label: 'Total Fixed Overhead Costs', value: formatLatinCurrency(safeFixedCosts, currency) },
      { label: 'Selling Price per Unit', value: formatLatinCurrency(safeUnitPrice, currency) },
      { label: 'Variable Cost per Unit', value: formatLatinCurrency(safeVariableCost, currency) },
    ],
    results: [
      {
        label: 'Commercial Break-Even Volume (Whole Units)',
        value: wholeBreakEvenUnits !== null ? `${wholeBreakEvenUnits.toLocaleString('en-US')} units` : 'N/A (Deficit Unit Economics)',
      },
      {
        label: 'Required Sales Revenue at Break-Even',
        value: wholeBreakEvenRevenue !== null ? formatLatinCurrency(wholeBreakEvenRevenue, currency) : 'N/A',
      },
      {
        label: 'Unit Contribution Margin',
        value: `${formatLatinCurrency(contributionMargin, currency)} (${formatLatinPercent(contributionRatio)})`,
      },
      {
        label: 'Unrounded Mathematical Figure',
        value:
          unroundedBreakEvenUnits !== null && unroundedBreakEvenRevenue !== null
            ? `${unroundedBreakEvenUnits.toFixed(2)} units (${formatLatinCurrency(unroundedBreakEvenRevenue, currency)})`
            : 'N/A',
      },
      {
        label: '25% Safety Cushion Target Volume',
        value:
          safetyBufferUnits !== null
            ? `${safetyBufferUnits.toLocaleString('en-US')} units (${formatLatinCurrency(safetyBufferUnits * safeUnitPrice, currency)})`
            : 'N/A',
      },
    ],
    assumptions: [
      'Linear cost-volume-profit (CVP) model assuming constant unit selling price and constant unit variable cost across the analyzed volume range.',
      'Whole-unit commercial target rounds up fractional units (ceiling function) so fixed overhead is fully covered.',
    ],
  });

  const formatCompactAxis = (val: number): string => {
    if (val >= 1e9) return `${currency}${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `${currency}${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `${currency}${(val / 1e3).toFixed(0)}k`;
    return `${currency}${val.toFixed(0)}`;
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

              {unroundedBreakEvenUnits !== null && unroundedBreakEvenRevenue !== null && (
                <div className="flex justify-between items-baseline border-t border-slate-800/60 pt-2 text-xs text-slate-400">
                  <span>Unrounded Mathematical Figure:</span>
                  <span className="font-semibold text-slate-200">
                    {formatLatinCurrency(unroundedBreakEvenRevenue, currency)} ({unroundedBreakEvenUnits.toFixed(2)} units)
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

      {/* Pure SVG Break-Even Intersection Line Chart */}
      {isViable && breakEvenChart && wholeBreakEvenUnits !== null && (
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="font-bold text-slate-800">
              Cost-Volume-Profit Break-Even Chart (0 to {breakEvenChart.maxUnits.toLocaleString('en-US')} units)
            </span>
            <div className="flex items-center gap-3 text-[10.5px]">
              <span className="flex items-center gap-1 text-rose-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" /> Total Cost
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" /> Total Revenue
              </span>
            </div>
          </div>

          <svg
            viewBox={`0 0 ${breakEvenChart.width} ${breakEvenChart.height}`}
            role="img"
            aria-label={`Break-even line chart showing Total Revenue intersecting Total Cost at ${wholeBreakEvenUnits.toLocaleString('en-US')} units`}
            className="w-full h-auto overflow-visible"
          >
            {/* Horizontal grid lines */}
            {[0, 0.5, 1].map((ratio) => {
              const y = roundToDecimals(breakEvenChart.padTop + breakEvenChart.plotH * (1 - ratio), 2);
              const val = breakEvenChart.maxY * ratio;
              return (
                <g key={ratio}>
                  <line
                    x1={breakEvenChart.padLeft}
                    y1={y}
                    x2={breakEvenChart.width - breakEvenChart.padRight}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray={ratio === 0 ? undefined : '3 3'}
                    strokeWidth="1"
                  />
                  <text
                    x={breakEvenChart.padLeft - 5}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-slate-400 text-[9px] font-semibold"
                  >
                    {formatCompactAxis(val)}
                  </text>
                </g>
              );
            })}

            {/* Shaded Loss & Profit Zones */}
            <polygon points={breakEvenChart.lossZonePolygon} fill="rgba(244, 63, 94, 0.14)" />
            <polygon points={breakEvenChart.profitZonePolygon} fill="rgba(16, 185, 129, 0.16)" />

            {/* Fixed Cost Horizontal Reference */}
            <line
              x1={breakEvenChart.x0}
              y1={breakEvenChart.yFixed}
              x2={breakEvenChart.xMax}
              y2={breakEvenChart.yFixed}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="3 3"
            />

            {/* Total Cost Line */}
            <line
              x1={breakEvenChart.x0}
              y1={breakEvenChart.yFixed}
              x2={breakEvenChart.xMax}
              y2={breakEvenChart.yCostMax}
              stroke="#f43f5e"
              strokeWidth="2.25"
              strokeLinecap="round"
            />

            {/* Total Revenue Line */}
            <line
              x1={breakEvenChart.x0}
              y1={breakEvenChart.y0}
              x2={breakEvenChart.xMax}
              y2={breakEvenChart.yRevMax}
              stroke="#10b981"
              strokeWidth="2.25"
              strokeLinecap="round"
            />

            {/* Vertical drop-line at Break-Even Point */}
            <line
              x1={breakEvenChart.xBe}
              y1={breakEvenChart.yBe}
              x2={breakEvenChart.xBe}
              y2={breakEvenChart.y0}
              stroke="#f59e0b"
              strokeWidth="1.25"
              strokeDasharray="2 2"
            />

            {/* Break-Even Intersection Point */}
            <circle
              cx={breakEvenChart.xBe}
              cy={breakEvenChart.yBe}
              r="4.5"
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth="2"
            />

            {/* Zone & Intersection Badges */}
            <text
              x={roundToDecimals(breakEvenChart.x0 + 8, 2)}
              y={roundToDecimals(breakEvenChart.padTop + 12, 2)}
              className="fill-rose-600 text-[9px] font-bold"
            >
              Loss Zone
            </text>
            <text
              x={roundToDecimals(breakEvenChart.xMax - 8, 2)}
              y={roundToDecimals(breakEvenChart.padTop + 12, 2)}
              textAnchor="end"
              className="fill-emerald-700 text-[9px] font-bold"
            >
              Profit Zone
            </text>

            {/* X-axis unit labels */}
            <text
              x={breakEvenChart.x0}
              y={breakEvenChart.height - 6}
              textAnchor="start"
              className="fill-slate-400 text-[9px] font-semibold"
            >
              0 units
            </text>
            <text
              x={breakEvenChart.xBe}
              y={breakEvenChart.height - 6}
              textAnchor="middle"
              className="fill-amber-700 text-[9.5px] font-extrabold"
            >
              BE: {wholeBreakEvenUnits.toLocaleString('en-US')} units
            </text>
            <text
              x={breakEvenChart.xMax}
              y={breakEvenChart.height - 6}
              textAnchor="end"
              className="fill-slate-500 text-[9px] font-semibold"
            >
              {breakEvenChart.maxUnits.toLocaleString('en-US')} units
            </text>
          </svg>
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

      {/* Assumptions & Official References Box */}
      <AssumptionsSourcesBox calculatorId="break-even" />

      {/* Action Footer */}
      <CalculatorActionBar
        onResetDefaults={() => {
          setFixedCostsStr('2000');
          setUnitPriceStr('50');
          setVariableCostStr('20');
        }}
        onCopySummary={handleCopy}
        onShareLink={handleShareLink}
        copied={copied}
        linkCopied={linkCopied}
        isFormValid={isFormValid}
        getReportPayload={getReportPayload}
      />
    </div>
  );
};


