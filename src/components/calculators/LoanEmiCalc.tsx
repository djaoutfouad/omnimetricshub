import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { CurrencySymbol } from '../../types';
import { Calculator, ChevronDown, ChevronUp, Table, ArrowLeftRight } from 'lucide-react';
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

interface AnnualAmortizationRow {
  year: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
}

export const LoanEmiCalc: React.FC<Props> = ({ currency }) => {
  const location = useLocation();

  const [principalStr, setPrincipalStr] = useState<string>(() =>
    getValidatedNumericParam('principal', '250000', { min: 1, max: 100000000000, allowZero: false })
  );
  const [annualRateStr, setAnnualRateStr] = useState<string>(() =>
    getValidatedNumericParam('rate', '6.5', { min: 0, max: 100, allowZero: true })
  );
  const [tenureYearsStr, setTenureYearsStr] = useState<string>(() =>
    getValidatedNumericParam('tenure', '30', { min: 0.25, max: 40, allowZero: false })
  );
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [annualRateBStr, setAnnualRateBStr] = useState<string>('5.75');
  const [tenureYearsBStr, setTenureYearsBStr] = useState<string>('15');
  const [showSchedule, setShowSchedule] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!location.search) return;
    setPrincipalStr(getValidatedNumericParam('principal', '250000', { min: 1, max: 100000000000, allowZero: false }, location.search));
    setAnnualRateStr(getValidatedNumericParam('rate', '6.5', { min: 0, max: 100, allowZero: true }, location.search));
    setTenureYearsStr(getValidatedNumericParam('tenure', '30', { min: 0.25, max: 40, allowZero: false }, location.search));
  }, [location.search]);

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

  const rateBField = validateNumericInput(annualRateBStr, {
    min: 0,
    max: 100,
    allowZero: true,
    fieldName: 'Offer B Annual Interest Rate (%)',
  });

  const tenureBField = validateNumericInput(tenureYearsBStr, {
    min: 0.25,
    max: 40,
    allowZero: false,
    fieldName: 'Offer B Loan Tenure (Years)',
  });

  const isOfferAValid = principalField.isValid && rateField.isValid && tenureField.isValid;
  const isOfferBValid = principalField.isValid && rateBField.isValid && tenureBField.isValid;
  const isFormValid = isOfferAValid && (!isComparing || isOfferBValid);

  const safePrincipal = principalField.value ?? 0;
  const safeRate = rateField.value ?? 0;
  const safeTenureYears = tenureField.value ?? 30;
  const totalMonths = Math.max(1, Math.round(safeTenureYears * 12));

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

  const safeEmi = isOfferAValid ? roundToDecimals(emi, 2) : 0;
  const totalRepayment = isOfferAValid
    ? monthlyRate === 0
      ? roundToDecimals(safePrincipal, 2)
      : roundToDecimals(safeEmi * totalMonths, 2)
    : 0;
  const totalInterest = isOfferAValid
    ? monthlyRate === 0
      ? 0
      : Math.max(0, roundToDecimals(totalRepayment - safePrincipal, 2))
    : 0;
  const principalSharePercent =
    totalRepayment > 0 ? roundToDecimals((safePrincipal / totalRepayment) * 100, 1) : 0;
  const interestSharePercent =
    totalRepayment > 0 ? roundToDecimals((totalInterest / totalRepayment) * 100, 1) : 0;

  // Loan Offer B Calculations
  const safeRateB = rateBField.value ?? 0;
  const safeTenureYearsB = tenureBField.value ?? 15;
  const totalMonthsB = Math.max(1, Math.round(safeTenureYearsB * 12));
  const monthlyRateB = (safeRateB / 100) / 12;

  let emiB = 0;
  if (monthlyRateB > 0) {
    const factorB = Math.pow(1 + monthlyRateB, totalMonthsB);
    if (Number.isFinite(factorB) && factorB > 1) {
      emiB = (safePrincipal * monthlyRateB * factorB) / (factorB - 1);
    }
  } else if (totalMonthsB > 0) {
    emiB = safePrincipal / totalMonthsB;
  }

  const safeEmiB = isOfferBValid ? roundToDecimals(emiB, 2) : 0;
  const totalRepaymentB = isOfferBValid
    ? monthlyRateB === 0
      ? roundToDecimals(safePrincipal, 2)
      : roundToDecimals(safeEmiB * totalMonthsB, 2)
    : 0;
  const totalInterestB = isOfferBValid
    ? monthlyRateB === 0
      ? 0
      : Math.max(0, roundToDecimals(totalRepaymentB - safePrincipal, 2))
    : 0;
  const emiSignedDiff = roundToDecimals(safeEmiB - safeEmi, 2);
  const emiDiff = Math.abs(emiSignedDiff);
  const interestSaved = roundToDecimals(Math.abs(totalInterest - totalInterestB), 2);

  // Annual Amortization Schedule (verified to reach 0 balance cleanly at term end, including 0% interest)
  const annualSchedule = useMemo<AnnualAmortizationRow[]>(() => {
    if (!isFormValid || safePrincipal <= 0 || totalMonths < 1) return [];
    const rows: AnnualAmortizationRow[] = [];
    let balance = safePrincipal;
    let yearPrincipal = 0;
    let yearInterest = 0;

    for (let m = 1; m <= totalMonths; m++) {
      const isLastMonth = m === totalMonths;
      let mInterest = 0;
      let mPrincipal = 0;

      if (monthlyRate > 0) {
        mInterest = balance * monthlyRate;
        mPrincipal = isLastMonth ? balance : Math.min(balance, Math.max(0, emi - mInterest));
      } else {
        mInterest = 0;
        mPrincipal = isLastMonth ? balance : Math.min(balance, emi);
      }

      balance = isLastMonth ? 0 : Math.max(0, balance - mPrincipal);
      yearPrincipal += mPrincipal;
      yearInterest += mInterest;

      if (m % 12 === 0 || isLastMonth) {
        const yearNum = Math.ceil(m / 12);
        rows.push({
          year: yearNum,
          principalPaid: roundToDecimals(yearPrincipal, 2),
          interestPaid: roundToDecimals(yearInterest, 2),
          remainingBalance: isLastMonth ? 0 : roundToDecimals(balance, 2),
        });
        yearPrincipal = 0;
        yearInterest = 0;
      }
    }
    return rows;
  }, [isFormValid, safePrincipal, totalMonths, monthlyRate, emi]);

  // SVG Amortization Balance Curve
  const chartGeometry = useMemo(() => {
    if (!isFormValid || annualSchedule.length === 0) return null;
    const width = 440;
    const height = 145;
    const padLeft = 46;
    const padRight = 14;
    const padTop = 12;
    const padBottom = 24;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const points = [
      { year: 0, balance: safePrincipal },
      ...annualSchedule.map((r) => ({ year: r.year, balance: r.remainingBalance })),
    ];

    const maxY = Math.max(1, safePrincipal);
    const totalSteps = Math.max(1, points.length - 1);

    const getX = (idx: number) => roundToDecimals(padLeft + (idx / totalSteps) * plotW, 2);
    const getY = (val: number) => {
      const clamped = Math.max(0, Math.min(maxY, Number.isFinite(val) ? val : 0));
      return roundToDecimals(padTop + plotH - (clamped / maxY) * plotH, 2);
    };

    const coords = points.map((p, i) => ({ x: getX(i), y: getY(p.balance) }));
    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
    const baselineY = roundToDecimals(padTop + plotH, 2);
    const areaPath = `${linePath} L${coords[coords.length - 1].x},${baselineY} L${coords[0].x},${baselineY} Z`;

    return {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      plotW,
      plotH,
      maxY,
      linePath,
      areaPath,
      startPt: coords[0],
      endPt: coords[coords.length - 1],
    };
  }, [isFormValid, annualSchedule, safePrincipal]);

  const handleCopy = async () => {
    if (!isFormValid) return;
    const text = `Loan Amortization & EMI Summary:\n- Loan Principal: ${formatLatinCurrency(safePrincipal, currency)}\n- Annual Interest Rate: ${formatLatinPercent(safeRate)}\n- Tenure: ${safeTenureYears} years (${totalMonths} months)\n- Monthly Payment (EMI): ${formatLatinCurrency(safeEmi, currency)}\n- Total Interest Payable: ${formatLatinCurrency(totalInterest, currency)}\n- Total Repayment Amount: ${formatLatinCurrency(totalRepayment, currency)}`;

    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLink = async () => {
    if (!isFormValid) return;
    const url = buildShareableCalculatorUrl(
      'loan-emi',
      {
        principal: safePrincipal,
        rate: safeRate,
        tenure: safeTenureYears,
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
    calculatorId: 'loan-emi',
    calculatorName: 'Loan & Monthly EMI Amortization Calculator',
    slug: 'loan-emi',
    currency,
    inputs: [
      { label: 'Loan Principal Amount', value: formatLatinCurrency(safePrincipal, currency) },
      { label: 'Annual Interest Rate', value: formatLatinPercent(safeRate) },
      { label: 'Loan Tenure', value: `${safeTenureYears} Years (${totalMonths} monthly installments)` },
    ],
    results: [
      { label: 'Estimated Monthly Payment (EMI)', value: formatLatinCurrency(safeEmi, currency) },
      { label: 'Total Interest Payable', value: `+${formatLatinCurrency(totalInterest, currency)} (${formatLatinPercent(interestSharePercent)})` },
      { label: 'Total Principal + Interest Repayment', value: formatLatinCurrency(totalRepayment, currency) },
    ],
    assumptions: [
      'Standard fixed-rate reducing-balance monthly amortization schedule.',
      'Excludes optional property taxes, homeowner insurance, HOA dues, or lender origination fees.',
    ],
    schedule: {
      title: 'Annual Loan Amortization Schedule',
      headers: ['Period', 'Principal Paid', 'Interest Paid', 'Ending Balance'],
      rows: annualSchedule.map((row) => [
        `Year ${row.year}`,
        formatLatinCurrency(row.principalPaid, currency),
        formatLatinCurrency(row.interestPaid, currency),
        formatLatinCurrency(row.remainingBalance, currency),
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
      {/* Compare Scenarios (A vs. B) Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200/90 rounded-xl">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
          <span>Compare Loan Offers (A vs. B)</span>
        </span>
        <button
          type="button"
          onClick={() => setIsComparing((prev) => !prev)}
          aria-pressed={isComparing}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
            isComparing
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          {isComparing ? 'Comparing A vs. B (On)' : 'Compare Scenarios (A vs. B)'}
        </button>
      </div>

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
          label={isComparing ? 'Offer A Interest Rate (%)' : 'Annual Interest Rate (%)'}
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
          label={isComparing ? 'Offer A Tenure (Years)' : 'Tenure (Years, max 40)'}
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

      {/* Loan Offer B Inputs */}
      {isComparing && (
        <div className="p-3.5 bg-indigo-50/60 border border-indigo-200/90 rounded-2xl space-y-2.5">
          <div className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-wider">
            Loan Offer B (Comparison Rate &amp; Term)
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumericInputField
              id="loan-rate-b-input"
              label="Offer B Interest Rate (%)"
              value={annualRateBStr}
              onChange={setAnnualRateBStr}
              fieldState={rateBField}
              suffix="%"
              placeholder="5.75"
              min={0}
              max={100}
              step="0.05"
            />
            <NumericInputField
              id="loan-tenure-b-input"
              label="Offer B Tenure (Years)"
              value={tenureYearsBStr}
              onChange={setTenureYearsBStr}
              fieldState={tenureBField}
              placeholder="15"
              min={0.25}
              max={40}
              step="0.5"
              helperText={`${totalMonthsB} monthly installments`}
            />
          </div>
        </div>
      )}

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

      {/* Pure SVG Principal Paydown Trajectory */}
      {isFormValid && chartGeometry && (
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-800">Remaining Principal Paydown Curve</span>
            <span className="text-indigo-700 font-semibold text-[10.5px]">
              {formatLatinCurrency(safePrincipal, currency)} → {currency}0.00
            </span>
          </div>

          <svg
            viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
            role="img"
            aria-label={`Loan principal paydown chart over ${annualSchedule.length} years starting at ${formatLatinCurrency(safePrincipal, currency)} and amortizing to ${currency}0.00`}
            className="w-full h-auto overflow-visible"
          >
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

            <path d={chartGeometry.areaPath} fill="rgba(79, 70, 229, 0.14)" />
            <path
              d={chartGeometry.linePath}
              fill="none"
              stroke="#4f46e5"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx={chartGeometry.startPt.x}
              cy={chartGeometry.startPt.y}
              r="3"
              fill="#4f46e5"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <circle
              cx={chartGeometry.endPt.x}
              cy={chartGeometry.endPt.y}
              r="3.5"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="1.5"
            />

            <text
              x={chartGeometry.padLeft}
              y={chartGeometry.height - 5}
              textAnchor="start"
              className="fill-slate-400 text-[9px] font-semibold"
            >
              Start
            </text>
            <text
              x={chartGeometry.width - chartGeometry.padRight}
              y={chartGeometry.height - 5}
              textAnchor="end"
              className="fill-slate-500 text-[9px] font-bold"
            >
              Year {annualSchedule[annualSchedule.length - 1]?.year ?? 1} (Paid Off)
            </text>
          </svg>
        </div>
      )}

      {/* Collapsible Annual Amortization Schedule Table */}
      {isFormValid && annualSchedule.length > 0 && (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <button
            type="button"
            onClick={() => setShowSchedule((prev) => !prev)}
            aria-expanded={showSchedule}
            className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Table className="w-3.5 h-3.5 text-indigo-600" />
              Annual Amortization Schedule ({annualSchedule.length} {annualSchedule.length === 1 ? 'Year' : 'Years'})
            </span>
            {showSchedule ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {showSchedule && (
            <div className="max-h-60 overflow-y-auto overflow-x-auto border-t border-slate-200">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-slate-100/90 text-slate-600 sticky top-0">
                  <tr>
                    <th className="py-2 px-3 font-bold">Year</th>
                    <th className="py-2 px-3 font-bold text-right">Principal Paid</th>
                    <th className="py-2 px-3 font-bold text-right">Interest Paid</th>
                    <th className="py-2 px-3 font-bold text-right">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {annualSchedule.map((row) => (
                    <tr key={row.year} className="hover:bg-slate-50/80">
                      <td className="py-1.5 px-3 font-semibold text-slate-700">Year {row.year}</td>
                      <td className="py-1.5 px-3 text-right text-indigo-700 font-semibold tabular-nums">
                        {formatLatinCurrency(row.principalPaid, currency)}
                      </td>
                      <td className="py-1.5 px-3 text-right text-rose-600 tabular-nums">
                        {formatLatinCurrency(row.interestPaid, currency)}
                      </td>
                      <td className="py-1.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                        {formatLatinCurrency(row.remainingBalance, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Side-by-Side Loan Offer A vs. Offer B Comparison */}
      {isComparing && isFormValid && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-inner space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400">
              Side-by-Side Loan Comparison (Offer A vs. Offer B)
            </span>
            <span className="text-[11px] text-slate-400">
              Principal: {formatLatinCurrency(safePrincipal, currency)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-indigo-400">Loan Offer A</span>
                <span className="text-[11px] text-slate-300 font-semibold">
                  {formatLatinPercent(safeRate)} • {safeTenureYears} yrs
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Monthly EMI:</span>
                <span className="font-extrabold text-white">{formatLatinCurrency(safeEmi, currency)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Total Interest:</span>
                <span className="font-bold text-rose-400">+{formatLatinCurrency(totalInterest, currency)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-700/70">
                <span className="text-slate-400">Total Repayment:</span>
                <span className="font-semibold text-slate-200">{formatLatinCurrency(totalRepayment, currency)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-emerald-400">Loan Offer B</span>
                <span className="text-[11px] text-slate-300 font-semibold">
                  {formatLatinPercent(safeRateB)} • {safeTenureYearsB} yrs
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Monthly EMI:</span>
                <span className="font-extrabold text-white">{formatLatinCurrency(safeEmiB, currency)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Total Interest:</span>
                <span className="font-bold text-rose-400">+{formatLatinCurrency(totalInterestB, currency)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-700/70">
                <span className="text-slate-400">Total Repayment:</span>
                <span className="font-semibold text-slate-200">{formatLatinCurrency(totalRepaymentB, currency)}</span>
              </div>
            </div>
          </div>

          {/* Comparison Verdict Badge */}
          <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-xs text-indigo-100 flex flex-wrap items-center justify-between gap-2">
            {totalInterest === totalInterestB && safeEmi === safeEmiB ? (
              <span className="font-bold">
                Verdict: Both Loan Offer A and Loan Offer B have identical monthly payments and total interest costs.
              </span>
            ) : (
              <>
                <span className="font-extrabold text-emerald-300">
                  Verdict: {totalInterestB < totalInterest ? 'Loan Offer B' : 'Loan Offer A'} saves {formatLatinCurrency(interestSaved, currency)} in total interest
                </span>
                <span className="text-[11px] font-bold bg-indigo-900/90 text-indigo-200 px-2 py-0.5 rounded-md">
                  Offer B EMI: {emiSignedDiff > 0 ? '+' : emiSignedDiff < 0 ? '-' : ''}{formatLatinCurrency(emiDiff, currency)}/mo vs A
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Assumptions & Official References Box */}
      <AssumptionsSourcesBox calculatorId="loan-emi" />

      {/* Action Footer */}
      <CalculatorActionBar
        onResetDefaults={() => {
          setPrincipalStr('250000');
          setAnnualRateStr('6.5');
          setTenureYearsStr('30');
          setAnnualRateBStr('5.75');
          setTenureYearsBStr('15');
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


