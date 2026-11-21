import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CurrencySymbol } from '../../types';
import { Target, ArrowRight, Workflow } from 'lucide-react';
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

interface Props {
  currency: CurrencySymbol;
}

export const RoasCalc: React.FC<Props> = ({ currency }) => {
  const location = useLocation();

  const [adSpendStr, setAdSpendStr] = useState<string>(() =>
    getValidatedNumericParam('spend', '1000', { min: 0, max: 100000000, allowZero: true })
  );
  const [revenueStr, setRevenueStr] = useState<string>(() =>
    getValidatedNumericParam('revenue', '3500', { min: 0, max: 100000000, allowZero: true })
  );
  const [conversionsStr, setConversionsStr] = useState<string>(() =>
    getValidatedNumericParam('conversions', '50', { min: 0, max: 10000000, allowZero: true, integerOnly: true })
  );
  const [cogsStr, setCogsStr] = useState<string>(() =>
    getValidatedNumericParam('cogs', '1000', { min: 0, max: 100000000, allowZero: true })
  );
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!location.search) return;
    setAdSpendStr(getValidatedNumericParam('spend', '1000', { min: 0, max: 100000000, allowZero: true }, location.search));
    setRevenueStr(getValidatedNumericParam('revenue', '3500', { min: 0, max: 100000000, allowZero: true }, location.search));
    setConversionsStr(getValidatedNumericParam('conversions', '50', { min: 0, max: 10000000, allowZero: true, integerOnly: true }, location.search));
    setCogsStr(getValidatedNumericParam('cogs', '1000', { min: 0, max: 100000000, allowZero: true }, location.search));
  }, [location.search]);

  // Field validations
  const adSpendField = validateNumericInput(adSpendStr, {
    min: 0,
    max: 100000000,
    allowZero: true,
    fieldName: 'Total Ad Spend',
  });

  const revenueField = validateNumericInput(revenueStr, {
    min: 0,
    max: 100000000,
    allowZero: true,
    fieldName: 'Attributed Revenue',
  });

  const conversionsField = validateNumericInput(conversionsStr, {
    min: 0,
    max: 10000000,
    allowZero: true,
    integerOnly: true,
    fieldName: 'Total Conversions / Orders',
  });

  const cogsField = validateNumericInput(cogsStr, {
    min: 0,
    max: 100000000,
    allowZero: true,
    fieldName: 'Total Product COGS',
  });

  const isFormValid =
    adSpendField.isValid &&
    revenueField.isValid &&
    conversionsField.isValid &&
    cogsField.isValid;

  const safeAdSpend = adSpendField.value ?? 0;
  const safeRevenue = revenueField.value ?? 0;
  const safeConversions = conversionsField.value ?? 0;
  const safeCogs = cogsField.value ?? 0;

  // ROAS requires ad spend > 0
  const isAdSpendActive = isFormValid && safeAdSpend > 0;
  const roasMultiplier = isAdSpendActive
    ? roundToDecimals(safeRevenue / safeAdSpend, 2)
    : null;
  const roasPercent = roasMultiplier !== null ? roundToDecimals(roasMultiplier * 100, 0) : null;

  const netAdProfit = roundToDecimals(safeRevenue - safeAdSpend, 2);

  // CPA requires conversions > 0 and ad spend > 0
  const cpa =
    isFormValid && safeConversions > 0 && isAdSpendActive
      ? roundToDecimals(safeAdSpend / safeConversions, 2)
      : null;

  // Gross profit & margin before ad spend
  const grossProductProfit = roundToDecimals(safeRevenue - safeCogs, 2);
  const grossMarginPercent =
    isFormValid && safeRevenue > 0
      ? roundToDecimals((grossProductProfit / safeRevenue) * 100, 1)
      : null;

  // Break-Even ROAS = 1 / (Gross Margin % / 100) -> 100 / grossMarginPercent
  const breakEvenRoas =
    grossMarginPercent !== null && grossMarginPercent > 0
      ? roundToDecimals(100 / grossMarginPercent, 2)
      : null;

  // True Net Profit (after Ad Spend and COGS)
  const netTrueProfit = roundToDecimals(safeRevenue - safeAdSpend - safeCogs, 2);
  const totalCostBasis = safeAdSpend + safeCogs;
  const trueRoi =
    totalCostBasis > 0
      ? roundToDecimals((netTrueProfit / totalCostBasis) * 100, 1)
      : null;

  const handleCopy = async () => {
    if (!isFormValid) return;
    const roasText =
      roasMultiplier !== null
        ? `${roasMultiplier.toFixed(2)}x (${roasPercent}%)`
        : 'N/A (zero spend)';
    const cpaText = cpa !== null ? formatLatinCurrency(cpa, currency) : 'N/A';
    const breakEvenText =
      breakEvenRoas !== null ? `${breakEvenRoas.toFixed(2)}x` : 'N/A (gross margin <= 0%)';
    const roiText = trueRoi !== null ? formatLatinPercent(trueRoi) : 'N/A';

    const text = `ROAS & Ad Spend Summary:\n- Total Ad Spend: ${formatLatinCurrency(safeAdSpend, currency)}\n- Attributed Revenue: ${formatLatinCurrency(safeRevenue, currency)}\n- ROAS Multiplier: ${roasText}\n- Break-Even ROAS: ${breakEvenText} (Gross Margin: ${grossMarginPercent !== null ? formatLatinPercent(grossMarginPercent) : 'N/A'})\n- Net Ad Profit: ${formatLatinCurrency(netAdProfit, currency)}\n- Cost Per Acquisition (CPA): ${cpaText} (${safeConversions} conversions)\n- True Net Profit (after COGS): ${formatLatinCurrency(netTrueProfit, currency)} (ROI: ${roiText})`;

    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLink = async () => {
    if (!isFormValid) return;
    const url = buildShareableCalculatorUrl(
      'roas-calculator',
      {
        spend: safeAdSpend,
        revenue: safeRevenue,
        conversions: safeConversions,
        cogs: safeCogs,
      },
      currency
    );
    const ok = await copyTextToClipboard(url);
    if (ok) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const impliedAov =
    safeConversions > 0 && safeRevenue > 0
      ? roundToDecimals(safeRevenue / safeConversions, 2)
      : null;
  const conversionRateWorkflowUrl = `/tools/conversion-rate-cpa/?spend=${safeAdSpend.toFixed(2)}${
    safeConversions > 0 ? `&conversions=${safeConversions}` : ''
  }${impliedAov !== null ? `&aov=${impliedAov.toFixed(2)}` : ''}`;

  const getReportPayload = (): CalculationReportPayload => ({
    calculatorId: 'roas-calculator',
    calculatorName: 'ROAS & Ad Spend Profitability Calculator',
    currency,
    inputs: [
      { label: 'Total Ad Spend', value: formatLatinCurrency(safeAdSpend, currency) },
      { label: 'Attributed Revenue', value: formatLatinCurrency(safeRevenue, currency) },
      { label: 'Total Conversions / Orders', value: safeConversions.toLocaleString('en-US') },
      { label: 'Total Product COGS', value: formatLatinCurrency(safeCogs, currency) },
    ],
    results: [
      {
        label: 'ROAS Multiplier',
        value: roasMultiplier !== null ? `${roasMultiplier.toFixed(2)}x (${roasPercent}%)` : 'N/A (zero spend)',
        highlight: true,
      },
      {
        label: 'Break-Even ROAS Threshold',
        value: breakEvenRoas !== null ? `${breakEvenRoas.toFixed(2)}x` : 'N/A',
      },
      {
        label: 'Pre-Ad Gross Margin (%)',
        value: grossMarginPercent !== null ? formatLatinPercent(grossMarginPercent) : 'N/A',
      },
      { label: 'Gross Ad Profit (Revenue - Ad Spend)', value: formatLatinCurrency(netAdProfit, currency) },
      {
        label: 'Cost Per Acquisition (CPA)',
        value: cpa !== null ? formatLatinCurrency(cpa, currency) : 'N/A',
      },
      {
        label: 'True Net Profit (After COGS & Ad Spend)',
        value: `${formatLatinCurrency(netTrueProfit, currency)}${trueRoi !== null ? ` (${formatLatinPercent(trueRoi)} ROI)` : ''}`,
      },
    ],
    assumptions: [
      'ROAS Multiplier measures gross attributed revenue divided by total advertising spend.',
      'Break-Even ROAS is derived from pre-advertising product gross margin: 1 / Gross Margin %.',
    ],
  });

  return (
    <div className="space-y-5 text-slate-800">
      <div className="grid grid-cols-2 gap-3">
        <NumericInputField
          id="roas-adspend-input"
          label={`Total Ad Spend (${currency})`}
          value={adSpendStr}
          onChange={setAdSpendStr}
          fieldState={adSpendField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={100000000}
          step="any"
          helperText={safeAdSpend === 0 && adSpendField.isValid ? 'Zero spend results in undefined ROAS (N/A)' : undefined}
        />

        <NumericInputField
          id="roas-revenue-input"
          label={`Attributed Revenue (${currency})`}
          value={revenueStr}
          onChange={setRevenueStr}
          fieldState={revenueField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={100000000}
          step="any"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumericInputField
          id="roas-conversions-input"
          label="Total Conversions / Orders"
          value={conversionsStr}
          onChange={setConversionsStr}
          fieldState={conversionsField}
          placeholder="0"
          min={0}
          max={10000000}
          step="1"
          helperText={safeConversions === 0 && conversionsField.isValid ? 'Zero conversions results in undefined CPA (N/A)' : undefined}
        />

        <NumericInputField
          id="roas-cogs-input"
          label={`Total Product COGS (${currency})`}
          value={cogsStr}
          onChange={setCogsStr}
          fieldState={cogsField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={100000000}
          step="any"
          helperText={
            safeConversions > 0 && safeCogs > 0 && cogsField.isValid
              ? `~${formatLatinCurrency(safeCogs / safeConversions, currency)} COGS per conversion`
              : undefined
          }
        />
      </div>

      {/* Main ROAS Score Card */}
      {!isFormValid ? (
        <InvalidInputAlert message="Please provide valid non-negative figures for ad spend, revenue, and orders." />
      ) : (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-inner space-y-3">
          <div className="flex justify-between items-baseline">
            <div>
              <div className="text-xs font-bold text-slate-300">ROAS Multiplier:</div>
              <div className="text-[11px] text-slate-400">Attributed return per {currency}1.00 ad spend</div>
            </div>
            <span className="font-black text-rose-400 text-2xl tracking-tight">
              {roasMultiplier !== null ? (
                <>
                  {roasMultiplier.toFixed(2)}x <span className="text-sm font-semibold text-slate-400">({roasPercent}%)</span>
                </>
              ) : (
                <span className="text-lg text-slate-400 font-bold" title="Undefined: Zero ad spend">N/A</span>
              )}
            </span>
          </div>

          {/* Break-Even ROAS Target */}
          <div className="border-t border-slate-800 pt-2.5 flex justify-between items-baseline text-xs">
            <div>
              <span className="text-slate-300 font-bold flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-amber-400" /> Break-Even ROAS:
              </span>
              <span className="text-[10px] text-slate-400">
                Minimum ROAS based on {grossMarginPercent !== null ? formatLatinPercent(grossMarginPercent) : '0%'} gross margin
              </span>
            </div>
            <span className="font-extrabold text-amber-400 text-base">
              {breakEvenRoas !== null ? (
                `${breakEvenRoas.toFixed(2)}x`
              ) : (
                <span className="text-slate-400 text-xs" title="Undefined: Gross margin is zero or negative">N/A</span>
              )}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Gross Ad Profit (Rev - Spend):</span>
              <span className={`font-bold ${netAdProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'} text-sm`}>
                {formatLatinCurrency(netAdProfit, currency)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Cost Per Acquisition (CPA):</span>
              <span className="font-bold text-blue-400 text-sm">
                {cpa !== null ? (
                  formatLatinCurrency(cpa, currency)
                ) : (
                  <span className="text-slate-400" title="Undefined: Zero conversions or zero ad spend">N/A</span>
                )}
              </span>
            </div>
          </div>

          {safeCogs > 0 && (
            <div className="border-t border-slate-800 pt-2.5 flex justify-between items-baseline text-xs">
              <span className="text-slate-300">True Net Profit (After COGS & Spend):</span>
              <span className={`font-bold ${netTrueProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatLatinCurrency(netTrueProfit, currency)} {trueRoi !== null ? `(${formatLatinPercent(trueRoi)} ROI)` : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Connected Decision Workflow Card */}
      {isFormValid && safeAdSpend > 0 && (
        <div className="p-3 bg-rose-50/80 border border-rose-200/90 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-extrabold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5 text-rose-600" /> Next Step in Your Workflow
            </span>
            <span className="text-rose-700 font-semibold">
              Spend: {formatLatinCurrency(safeAdSpend, currency)} ({safeConversions} orders)
            </span>
          </div>
          <Link
            to={conversionRateWorkflowUrl}
            className="w-full px-3 py-2 rounded-xl bg-white hover:bg-rose-600 text-rose-900 hover:text-white border border-rose-200 hover:border-rose-600 text-xs font-bold flex items-center justify-between transition shadow-2xs group"
          >
            <span>Analyze Funnel Conversion & CPA</span>
            <ArrowRight className="w-3.5 h-3.5 text-rose-600 group-hover:text-white group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      )}

      <CalculatorActionBar
        isFormValid={isFormValid}
        copied={copied}
        linkCopied={linkCopied}
        onCopySummary={handleCopy}
        onShareLink={handleShareLink}
        onResetDefaults={() => {
          setAdSpendStr('1000');
          setRevenueStr('3500');
          setConversionsStr('50');
          setCogsStr('1000');
        }}
        getReportPayload={getReportPayload}
      />
    </div>
  );
};

