import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { CurrencySymbol } from '../../types';
import { TrendingUp, Calendar, ChevronDown, ChevronUp, Table } from 'lucide-react';
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

interface YearlyCompoundRow {
  year: number;
  totalContributions: number;
  totalInterest: number;
  endingBalance: number;
}

export const CompoundInterestCalc: React.FC<Props> = ({ currency }) => {
  const location = useLocation();

  const [principalStr, setPrincipalStr] = useState<string>(() =>
    getValidatedNumericParam('principal', '10000', { min: 0, max: 100000000, allowZero: true })
  );
  const [monthlyDepositStr, setMonthlyDepositStr] = useState<string>(() =>
    getValidatedNumericParam('monthlyDeposit', '500', { min: 0, max: 1000000, allowZero: true })
  );
  const [annualRateStr, setAnnualRateStr] = useState<string>(() =>
    getValidatedNumericParam('rate', '8.0', { min: 0, max: 100, allowZero: true })
  );
  const [yearsStr, setYearsStr] = useState<string>(() =>
    getValidatedNumericParam('years', '10', { min: 1, max: 100, allowZero: false, integerOnly: true })
  );
  const [depositTiming, setDepositTiming] = useState<'end' | 'beginning'>(() =>
    getValidatedEnumParam('timing', ['end', 'beginning'] as const, 'end')
  );
  const [showSchedule, setShowSchedule] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!location.search) return;
    setPrincipalStr(getValidatedNumericParam('principal', '10000', { min: 0, max: 100000000, allowZero: true }, location.search));
    setMonthlyDepositStr(getValidatedNumericParam('monthlyDeposit', '500', { min: 0, max: 1000000, allowZero: true }, location.search));
    setAnnualRateStr(getValidatedNumericParam('rate', '8.0', { min: 0, max: 100, allowZero: true }, location.search));
    setYearsStr(getValidatedNumericParam('years', '10', { min: 1, max: 100, allowZero: false, integerOnly: true }, location.search));
    setDepositTiming(getValidatedEnumParam('timing', ['end', 'beginning'] as const, 'end', location.search));
  }, [location.search]);

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

  // Year-by-year growth schedule
  const yearlySchedule = useMemo<YearlyCompoundRow[]>(() => {
    if (!isFormValid || safeYears < 1) return [];
    const rows: YearlyCompoundRow[] = [];
    for (let y = 1; y <= safeYears; y++) {
      const m = y * 12;
      const yFvPrincipal = safePrincipal * Math.pow(1 + monthlyRate, m);
      let yFvDeposits = 0;
      if (monthlyRate > 0) {
        const ordFv = safeMonthly * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate);
        yFvDeposits = depositTiming === 'beginning' ? ordFv * (1 + monthlyRate) : ordFv;
      } else {
        yFvDeposits = safeMonthly * m;
      }
      const contrib = roundToDecimals(safePrincipal + safeMonthly * m, 2);
      const bal = roundToDecimals(yFvPrincipal + yFvDeposits, 2);
      const interest = roundToDecimals(bal - contrib, 2);
      rows.push({
        year: y,
        totalContributions: contrib,
        totalInterest: interest,
        endingBalance: bal,
      });
    }
    return rows;
  }, [isFormValid, safeYears, safePrincipal, safeMonthly, monthlyRate, depositTiming]);

  // SVG Chart coordinates (including Year 0)
  const chartGeometry = useMemo(() => {
    if (!isFormValid || yearlySchedule.length === 0) return null;
    const width = 440;
    const height = 165;
    const padLeft = 46;
    const padRight = 14;
    const padTop = 14;
    const padBottom = 26;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const pointsData = [
      { year: 0, totalContributions: safePrincipal, endingBalance: safePrincipal },
      ...yearlySchedule.map((r) => ({
        year: r.year,
        totalContributions: r.totalContributions,
        endingBalance: r.endingBalance,
      })),
    ];

    const maxY = Math.max(1, finalBalance, totalPrincipalDeposits, safePrincipal);
    const totalSteps = Math.max(1, pointsData.length - 1);

    const getX = (idx: number) => roundToDecimals(padLeft + (idx / totalSteps) * plotW, 2);
    const getY = (val: number) => {
      const clamped = Math.max(0, Math.min(maxY, Number.isFinite(val) ? val : 0));
      return roundToDecimals(padTop + plotH - (clamped / maxY) * plotH, 2);
    };

    const balancePts = pointsData.map((d, idx) => ({ x: getX(idx), y: getY(d.endingBalance) }));
    const contribPts = pointsData.map((d, idx) => ({ x: getX(idx), y: getY(d.totalContributions) }));

    const balanceLine = balancePts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const contribLine = contribPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

    const baselineY = roundToDecimals(padTop + plotH, 2);
    const firstX = balancePts[0].x;
    const lastX = balancePts[balancePts.length - 1].x;

    const balanceArea = `${balanceLine} L${lastX},${baselineY} L${firstX},${baselineY} Z`;
    const contribArea = `${contribLine} L${lastX},${baselineY} L${firstX},${baselineY} Z`;

    return {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      plotW,
      plotH,
      baselineY,
      maxY,
      balanceLine,
      contribLine,
      balanceArea,
      contribArea,
      lastBalancePt: balancePts[balancePts.length - 1],
      lastContribPt: contribPts[contribPts.length - 1],
    };
  }, [isFormValid, yearlySchedule, safePrincipal, finalBalance, totalPrincipalDeposits]);

  const handleCopy = async () => {
    if (!isFormValid) return;
    const text = `Compound Growth Forecast (${safeYears} Years):\n- Initial Principal: ${formatLatinCurrency(safePrincipal, currency)}\n- Monthly Contribution: ${formatLatinCurrency(safeMonthly, currency)} (${depositTiming === 'end' ? 'End of Month' : 'Beginning of Month'})\n- Annual Return Rate: ${formatLatinPercent(safeRate)} (Compounded Monthly)\n- Total Principal Contributed: ${formatLatinCurrency(totalPrincipalDeposits, currency)}\n- Total Compound Interest Earned: ${formatLatinCurrency(totalInterestEarned, currency)}\n- Projected Future Value: ${formatLatinCurrency(finalBalance, currency)}`;

    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLink = async () => {
    if (!isFormValid) return;
    const url = buildShareableCalculatorUrl(
      'compound-interest',
      {
        principal: safePrincipal,
        monthlyDeposit: safeMonthly,
        rate: safeRate,
        years: safeYears,
        timing: depositTiming,
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
    calculatorName: 'Compound Interest & Wealth Growth Calculator',
    slug: 'compound-interest',
    currency,
    inputs: [
      { label: 'Initial Principal', value: formatLatinCurrency(safePrincipal, currency) },
      { label: 'Monthly Contribution', value: formatLatinCurrency(safeMonthly, currency) },
      { label: 'Annual Interest / Return Rate', value: formatLatinPercent(safeRate) },
      { label: 'Investment Horizon', value: `${safeYears} ${safeYears === 1 ? 'Year' : 'Years'} (${totalMonths} months)` },
      { label: 'Contribution Timing', value: depositTiming === 'end' ? 'End of Month (Ordinary Annuity)' : 'Beginning of Month (Annuity Due)' },
    ],
    results: [
      { label: 'Projected Future Portfolio Value', value: formatLatinCurrency(finalBalance, currency) },
      { label: 'Total Principal & Deposits Contributed', value: `${formatLatinCurrency(totalPrincipalDeposits, currency)} (${formatLatinPercent(principalSharePercent)})` },
      { label: 'Estimated Compound Interest Earned', value: `+${formatLatinCurrency(totalInterestEarned, currency)} (${formatLatinPercent(interestSharePercent)})` },
    ],
    assumptions: [
      'Monthly compounding frequency (12 compounding periods per year).',
      'Assumes a constant nominal annual return rate without intermediate withdrawals or tax drag.',
    ],
    schedule: {
      title: 'Year-by-Year Compound Growth Schedule',
      headers: ['Year', 'Total Contributions', 'Compound Growth', 'Ending Balance'],
      rows: yearlySchedule.map((row) => [
        `Year ${row.year}`,
        formatLatinCurrency(row.totalContributions, currency),
        `+${formatLatinCurrency(row.totalInterest, currency)}`,
        formatLatinCurrency(row.endingBalance, currency),
      ]),
    },
  });

  const formatCompactAxis = (val: number): string => {
    if (val >= 1000000) return `${currency}${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${currency}${(val / 1000).toFixed(0)}k`;
    return `${currency}${val.toFixed(0)}`;
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
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
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

      {/* Pure SVG Dual-Line / Stacked Area Compound Growth Chart */}
      {isFormValid && chartGeometry && (
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <span className="font-bold text-slate-800">
              Compound Trajectory ({safeYears}-{safeYears === 1 ? 'Year' : 'Year'} Horizon)
            </span>
            <div className="flex items-center gap-3 text-[10.5px]">
              <span className="flex items-center gap-1 text-slate-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-400 inline-block" /> Contributions
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" /> Total Balance
              </span>
            </div>
          </div>

          <svg
            viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
            role="img"
            aria-label={`Compound interest growth chart over ${safeYears} years comparing total contributions of ${formatLatinCurrency(totalPrincipalDeposits, currency)} against projected balance of ${formatLatinCurrency(finalBalance, currency)}`}
            className="w-full h-auto overflow-visible"
          >
            {/* Horizontal grid lines */}
            {[0, 0.5, 1].map((ratio) => {
              const y = roundToDecimals(chartGeometry.padTop + chartGeometry.plotH * (1 - ratio), 2);
              const val = chartGeometry.maxY * ratio;
              return (
                <g key={ratio}>
                  <line
                    x1={chartGeometry.padLeft}
                    y1={y}
                    x2={chartGeometry.width - chartGeometry.padRight}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray={ratio === 0 ? undefined : '3 3'}
                    strokeWidth="1"
                  />
                  <text
                    x={chartGeometry.padLeft - 5}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-slate-400 text-[9px] font-semibold"
                  >
                    {formatCompactAxis(val)}
                  </text>
                </g>
              );
            })}

            {/* Total Balance Area & Line */}
            <path d={chartGeometry.balanceArea} fill="rgba(16, 185, 129, 0.16)" />
            <path
              d={chartGeometry.balanceLine}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Total Contributions Area & Line */}
            <path d={chartGeometry.contribArea} fill="rgba(148, 163, 184, 0.22)" />
            <path
              d={chartGeometry.contribLine}
              fill="none"
              stroke="#64748b"
              strokeWidth="1.75"
              strokeDasharray="4 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* End markers */}
            <circle
              cx={chartGeometry.lastBalancePt.x}
              cy={chartGeometry.lastBalancePt.y}
              r="3.5"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <circle
              cx={chartGeometry.lastContribPt.x}
              cy={chartGeometry.lastContribPt.y}
              r="3"
              fill="#64748b"
              stroke="#ffffff"
              strokeWidth="1.5"
            />

            {/* X-axis labels */}
            <text
              x={chartGeometry.padLeft}
              y={chartGeometry.height - 6}
              textAnchor="start"
              className="fill-slate-400 text-[9px] font-semibold"
            >
              Year 0
            </text>
            {safeYears > 1 && (
              <text
                x={roundToDecimals(chartGeometry.padLeft + chartGeometry.plotW / 2, 2)}
                y={chartGeometry.height - 6}
                textAnchor="middle"
                className="fill-slate-400 text-[9px] font-semibold"
              >
                Year {Math.round(safeYears / 2)}
              </text>
            )}
            <text
              x={chartGeometry.width - chartGeometry.padRight}
              y={chartGeometry.height - 6}
              textAnchor="end"
              className="fill-slate-500 text-[9px] font-bold"
            >
              Year {safeYears}
            </text>
          </svg>
        </div>
      )}

      {/* Collapsible Year-by-Year Growth Schedule */}
      {isFormValid && yearlySchedule.length > 0 && (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setShowSchedule((prev) => !prev)}
            aria-expanded={showSchedule}
            className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-emerald-600" />
              Year-by-Year Growth Schedule ({safeYears} {safeYears === 1 ? 'Year' : 'Years'})
            </span>
            {showSchedule ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {showSchedule && (
            <div className="max-h-60 overflow-y-auto overflow-x-auto border-t border-slate-200">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-slate-100/90 text-slate-600 sticky top-0">
                  <tr>
                    <th className="py-2 px-3 font-bold">Year</th>
                    <th className="py-2 px-3 font-bold text-right">Contributions</th>
                    <th className="py-2 px-3 font-bold text-right">Compound Growth</th>
                    <th className="py-2 px-3 font-bold text-right">Ending Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {yearlySchedule.map((row) => (
                    <tr key={row.year} className="hover:bg-slate-50/80">
                      <td className="py-1.5 px-3 font-semibold text-slate-700">Year {row.year}</td>
                      <td className="py-1.5 px-3 text-right text-slate-600 tabular-nums">
                        {formatLatinCurrency(row.totalContributions, currency)}
                      </td>
                      <td className="py-1.5 px-3 text-right text-emerald-600 font-semibold tabular-nums">
                        +{formatLatinCurrency(row.totalInterest, currency)}
                      </td>
                      <td className="py-1.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                        {formatLatinCurrency(row.endingBalance, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <CalculatorActionBar
        onReset={() => {
          setPrincipalStr('10000');
          setMonthlyDepositStr('500');
          setAnnualRateStr('8.0');
          setYearsStr('10');
          setDepositTiming('end');
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


