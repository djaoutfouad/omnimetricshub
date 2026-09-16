import React, { useState } from 'react';
import { CurrencySymbol } from '../../types';
import { Copy, Check, RefreshCw, Target, AlertCircle } from 'lucide-react';
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

export const ConversionRateCpaCalc: React.FC<Props> = ({ currency }) => {
  const [visitorsStr, setVisitorsStr] = useState<string>('5000');
  const [conversionsStr, setConversionsStr] = useState<string>('150');
  const [adSpendStr, setAdSpendStr] = useState<string>('600');
  const [aovStr, setAovStr] = useState<string>('45');
  const [copied, setCopied] = useState(false);

  // Field validation
  const visitorsField = validateNumericInput(visitorsStr, {
    min: 0,
    max: 100000000,
    allowZero: true,
    integerOnly: true,
    fieldName: 'Unique Visitors / Clicks',
  });

  const conversionsField = validateNumericInput(conversionsStr, {
    min: 0,
    max: 10000000,
    allowZero: true,
    integerOnly: true,
    fieldName: 'Total Conversions / Sales',
  });

  const adSpendField = validateNumericInput(adSpendStr, {
    min: 0,
    max: 100000000,
    allowZero: true,
    fieldName: 'Total Campaign Spend',
  });

  const aovField = validateNumericInput(aovStr, {
    min: 0,
    max: 10000000,
    allowZero: true,
    fieldName: 'Average Order Value (AOV)',
  });

  const isFormValid =
    visitorsField.isValid &&
    conversionsField.isValid &&
    adSpendField.isValid &&
    aovField.isValid;

  const safeVisitors = visitorsField.value ?? 0;
  const safeConversions = conversionsField.value ?? 0;
  const safeAdSpend = adSpendField.value ?? 0;
  const safeAov = aovField.value ?? 0;

  const isConversionExceeded = isFormValid && safeVisitors > 0 && safeConversions > safeVisitors;

  // Conversion rate: requires visitors > 0
  const crPercent =
    isFormValid && safeVisitors > 0
      ? roundToDecimals((safeConversions / safeVisitors) * 100, 2)
      : null;

  // CPA: requires conversions > 0 and adSpend > 0
  const cpa =
    isFormValid && safeConversions > 0 && safeAdSpend > 0
      ? roundToDecimals(safeAdSpend / safeConversions, 2)
      : null;

  // CPC: requires visitors > 0 and adSpend > 0
  const cpc =
    isFormValid && safeVisitors > 0 && safeAdSpend > 0
      ? roundToDecimals(safeAdSpend / safeVisitors, 2)
      : null;

  const grossRevenue = roundToDecimals(safeConversions * safeAov, 2);

  // ROAS: requires adSpend > 0
  const roas =
    isFormValid && safeAdSpend > 0
      ? roundToDecimals(grossRevenue / safeAdSpend, 2)
      : null;

  // Traffic requirement per 100 conversions
  const visitorsPer100Conversions =
    crPercent !== null && crPercent > 0
      ? Math.ceil(100 / (crPercent / 100))
      : null;

  const handleCopy = async () => {
    if (!isFormValid) return;
    const crText = crPercent !== null ? formatLatinPercent(crPercent) : 'N/A (zero visitors)';
    const cpaText = cpa !== null ? formatLatinCurrency(cpa, currency) : 'N/A';
    const cpcText = cpc !== null ? formatLatinCurrency(cpc, currency) : 'N/A';
    const roasText = roas !== null ? `${roas.toFixed(2)}x ROAS` : 'N/A';
    const trafficTarget =
      visitorsPer100Conversions !== null
        ? `${visitorsPer100Conversions.toLocaleString('en-US')} visitors`
        : 'N/A';

    const text = `Conversion Rate & CPA Analysis:\n- Visitors / Clicks: ${safeVisitors.toLocaleString('en-US')}\n- Total Conversions: ${safeConversions.toLocaleString('en-US')}\n- Conversion Rate (CR): ${crText}\n- Ad Spend: ${formatLatinCurrency(safeAdSpend, currency)}\n- Cost Per Acquisition (CPA): ${cpaText}\n- Cost Per Click (CPC): ${cpcText}\n- Est. Revenue (AOV ${formatLatinCurrency(safeAov, currency)}): ${formatLatinCurrency(grossRevenue, currency)} (${roasText})\n- Traffic needed per 100 sales: ${trafficTarget}`;

    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const setPreset = (v: number, c: number, s: number, a: number) => {
    setVisitorsStr(v.toString());
    setConversionsStr(c.toString());
    setAdSpendStr(s.toString());
    setAovStr(a.toString());
  };

  return (
    <div className="space-y-5 text-slate-800">
      {/* Preset Quick Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold text-slate-400 shrink-0">Benchmarks:</span>
        <button
          type="button"
          onClick={() => setPreset(5000, 125, 500, 60)}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] whitespace-nowrap transition cursor-pointer"
        >
          E-Com Store (2.5% CR)
        </button>
        <button
          type="button"
          onClick={() => setPreset(2000, 100, 800, 150)}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] whitespace-nowrap transition cursor-pointer"
        >
          B2B SaaS Lead (5.0% CR)
        </button>
        <button
          type="button"
          onClick={() => setPreset(10000, 120, 1200, 35)}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] whitespace-nowrap transition cursor-pointer"
        >
          Paid Funnel (1.2% CR)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumericInputField
          id="cr-visitors-input"
          label="Unique Visitors / Clicks"
          value={visitorsStr}
          onChange={setVisitorsStr}
          fieldState={visitorsField}
          placeholder="0"
          min={0}
          max={100000000}
          step="1"
          helperText={safeVisitors === 0 && visitorsField.isValid ? 'Zero visitors results in undefined CR (N/A)' : undefined}
        />

        <NumericInputField
          id="cr-conversions-input"
          label="Total Conversions / Sales"
          value={conversionsStr}
          onChange={setConversionsStr}
          fieldState={conversionsField}
          placeholder="0"
          min={0}
          max={10000000}
          step="1"
          helperText={safeConversions === 0 && conversionsField.isValid ? 'Zero conversions results in undefined CPA (N/A)' : undefined}
        />
      </div>

      {isConversionExceeded && (
        <div role="alert" className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Data Notice:</strong> Recorded conversions ({safeConversions}) exceed recorded visitor clicks ({safeVisitors}), calculating a conversion rate over 100%. Please check session tracking definitions.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <NumericInputField
          id="cr-adspend-input"
          label={`Total Campaign Spend (${currency})`}
          value={adSpendStr}
          onChange={setAdSpendStr}
          fieldState={adSpendField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={100000000}
          step="any"
        />

        <NumericInputField
          id="cr-aov-input"
          label={`Avg Order Value (AOV) (${currency})`}
          value={aovStr}
          onChange={setAovStr}
          fieldState={aovField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={10000000}
          step="any"
        />
      </div>

      {/* Main Results Card */}
      {!isFormValid ? (
        <InvalidInputAlert message="Please provide valid non-negative figures for visitors, conversions, and ad spend." />
      ) : (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-inner space-y-3">
          <div className="flex justify-between items-baseline">
            <div>
              <div className="text-xs font-bold text-slate-300">Conversion Rate (CR):</div>
              <div className="text-[11px] text-slate-400">Total conversions / unique visitor clicks</div>
            </div>
            <span className="font-black text-teal-400 text-2xl tracking-tight">
              {crPercent !== null ? (
                formatLatinPercent(crPercent)
              ) : (
                <span className="text-slate-400 text-lg" title="Undefined: Zero visitors">N/A</span>
              )}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Cost Per Acquisition (CPA):</span>
              <span className="font-bold text-rose-400 text-sm">
                {cpa !== null ? (
                  formatLatinCurrency(cpa, currency)
                ) : (
                  <span className="text-slate-400" title="Undefined: Zero conversions or zero spend">N/A</span>
                )}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Cost Per Click (CPC):</span>
              <span className="font-bold text-blue-400 text-sm">
                {cpc !== null ? (
                  formatLatinCurrency(cpc, currency)
                ) : (
                  <span className="text-slate-400" title="Undefined: Zero visitors or zero spend">N/A</span>
                )}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-baseline border-t border-slate-800 pt-2.5 text-xs">
            <span className="text-slate-300">Estimated Pipeline Revenue:</span>
            <span className="font-bold text-emerald-400 text-sm">
              {formatLatinCurrency(grossRevenue, currency)} {roas !== null ? `(${roas.toFixed(2)}x ROAS)` : ''}
            </span>
          </div>
        </div>
      )}

      {/* Traffic Requirement Target */}
      {visitorsPer100Conversions !== null && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-950">
          <span className="flex items-center gap-1 font-semibold">
            <Target className="w-3.5 h-3.5 text-teal-600" /> Whole traffic required for 100 sales:
          </span>
          <span className="font-extrabold text-teal-900">
            {visitorsPer100Conversions.toLocaleString('en-US')} unique visitors
          </span>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => {
            setVisitorsStr('5000');
            setConversionsStr('150');
            setAdSpendStr('600');
            setAovStr('45');
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
