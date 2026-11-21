import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CurrencySymbol } from '../../types';
import { Users, Info } from 'lucide-react';
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

export const CustomerLtvCalc: React.FC<Props> = ({ currency }) => {
  const location = useLocation();

  const [aovStr, setAovStr] = useState<string>(() =>
    getValidatedNumericParam('aov', '65', { min: 0.01, max: 1000000, allowZero: false })
  );
  const [frequencyStr, setFrequencyStr] = useState<string>(() =>
    getValidatedNumericParam('frequency', '1.5', { min: 0.01, max: 1000, allowZero: false })
  );
  const [churnRateStr, setChurnRateStr] = useState<string>(() =>
    getValidatedNumericParam('churn', '5.0', { min: 0, max: 100, allowZero: true })
  );
  const [grossMarginStr, setGrossMarginStr] = useState<string>(() =>
    getValidatedNumericParam('margin', '70', { min: 0, max: 100, allowZero: true })
  );
  const [cacStr, setCacStr] = useState<string>(() =>
    getValidatedNumericParam('cac', '120', { min: 0, max: 1000000, allowZero: true })
  );
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!location.search) return;
    setAovStr(getValidatedNumericParam('aov', '65', { min: 0.01, max: 1000000, allowZero: false }, location.search));
    setFrequencyStr(getValidatedNumericParam('frequency', '1.5', { min: 0.01, max: 1000, allowZero: false }, location.search));
    setChurnRateStr(getValidatedNumericParam('churn', '5.0', { min: 0, max: 100, allowZero: true }, location.search));
    setGrossMarginStr(getValidatedNumericParam('margin', '70', { min: 0, max: 100, allowZero: true }, location.search));
    setCacStr(getValidatedNumericParam('cac', '120', { min: 0, max: 1000000, allowZero: true }, location.search));
  }, [location.search]);

  // Field validation
  const aovField = validateNumericInput(aovStr, {
    min: 0.01,
    max: 1000000,
    allowZero: false,
    fieldName: 'Avg Order / Contract Value (AOV)',
  });

  const frequencyField = validateNumericInput(frequencyStr, {
    min: 0.01,
    max: 1000,
    allowZero: false,
    fieldName: 'Purchase Frequency (orders/mo)',
  });

  const churnRateField = validateNumericInput(churnRateStr, {
    min: 0,
    max: 100,
    allowZero: true,
    fieldName: 'Monthly Churn Rate (%)',
  });

  const grossMarginField = validateNumericInput(grossMarginStr, {
    min: 0,
    max: 100,
    allowZero: true,
    fieldName: 'Gross Margin (%)',
  });

  const cacField = validateNumericInput(cacStr, {
    min: 0,
    max: 1000000,
    allowZero: true,
    fieldName: 'Customer Acquisition Cost (CAC)',
  });

  const isFormValid =
    aovField.isValid &&
    frequencyField.isValid &&
    churnRateField.isValid &&
    grossMarginField.isValid &&
    cacField.isValid;

  const safeAov = aovField.value ?? 0;
  const safeFreq = frequencyField.value ?? 0;
  const safeChurn = churnRateField.value ?? 0;
  const safeMargin = grossMarginField.value ?? 70;
  const safeCac = cacField.value ?? 0;

  // Monthly revenue per customer (ARPU) = AOV * monthly order frequency
  const monthlyRevenuePerCustomer = roundToDecimals(safeAov * safeFreq, 2);

  // Customer Lifespan in Months = 1 / (monthly churn rate %)
  // When churn = 0, lifespan is infinite (undefined / N/A in linear model)
  const hasChurn = safeChurn > 0;
  const customerLifespanMonths = hasChurn ? roundToDecimals(1 / (safeChurn / 100), 1) : null;
  const customerLifespanYears = customerLifespanMonths !== null ? roundToDecimals(customerLifespanMonths / 12, 1) : null;

  // Revenue LTV vs Gross Profit LTV
  const grossRevenueLtv =
    customerLifespanMonths !== null
      ? roundToDecimals(monthlyRevenuePerCustomer * customerLifespanMonths, 2)
      : null;
  const grossProfitLtv =
    grossRevenueLtv !== null
      ? roundToDecimals(grossRevenueLtv * (safeMargin / 100), 2)
      : null;

  // LTV:CAC Ratio based on Gross Profit LTV
  const ltvCacRatio =
    grossProfitLtv !== null && safeCac > 0
      ? roundToDecimals(grossProfitLtv / safeCac, 2)
      : null;

  // Payback period (months to recover CAC from monthly gross profit contribution)
  const monthlyGrossProfitContribution = monthlyRevenuePerCustomer * (safeMargin / 100);
  const paybackMonths =
    monthlyGrossProfitContribution > 0 && safeCac > 0
      ? roundToDecimals(safeCac / monthlyGrossProfitContribution, 1)
      : null;

  // Recommended Maximum CAC based on standard 3:1 LTV:CAC industry rule
  const recommendedMaxCac =
    grossProfitLtv !== null ? roundToDecimals(grossProfitLtv / 3, 2) : null;

  const handleCopy = async () => {
    if (!isFormValid) return;
    const lifespanText =
      customerLifespanMonths !== null
        ? `${customerLifespanMonths} mos (${customerLifespanYears} yrs)`
        : 'N/A (0% churn)';
    const ltvRevText = grossRevenueLtv !== null ? formatLatinCurrency(grossRevenueLtv, currency) : 'N/A';
    const ltvProfitText = grossProfitLtv !== null ? formatLatinCurrency(grossProfitLtv, currency) : 'N/A';
    const ratioText = ltvCacRatio !== null ? `${ltvCacRatio.toFixed(2)}x` : 'N/A';
    const paybackText = paybackMonths !== null ? `${paybackMonths} months` : 'N/A';
    const maxCacText = recommendedMaxCac !== null ? formatLatinCurrency(recommendedMaxCac, currency) : 'N/A';

    const text = `Customer Lifetime Value (LTV) Breakdown:\n- Avg Order / Contract Value (AOV): ${formatLatinCurrency(safeAov, currency)}\n- Monthly Order Frequency: ${safeFreq} orders/mo\n- Monthly Churn Rate: ${formatLatinPercent(safeChurn)}\n- Implied Lifespan: ${lifespanText}\n- Gross Revenue LTV: ${ltvRevText}\n- Gross Profit LTV (${formatLatinPercent(safeMargin)} Margin): ${ltvProfitText}\n- Current CAC: ${formatLatinCurrency(safeCac, currency)}\n- Recommended Max CAC (3:1 Rule): ${maxCacText}\n- LTV:CAC Ratio: ${ratioText}\n- CAC Payback Horizon: ${paybackText}\n\nNotice: Linear steady-state retention model without discount rate.`;

    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLink = async () => {
    if (!isFormValid) return;
    const url = buildShareableCalculatorUrl(
      'customer-ltv',
      {
        aov: safeAov,
        frequency: safeFreq,
        churn: safeChurn,
        margin: safeMargin,
        cac: safeCac,
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
    calculatorId: 'customer-ltv',
    calculatorName: 'Customer Lifetime Value (LTV) & CAC Ratio Calculator',
    currency,
    inputs: [
      { label: 'Average Order / Contract Value (AOV)', value: formatLatinCurrency(safeAov, currency) },
      { label: 'Purchase Frequency (Orders / Month)', value: `${safeFreq} orders/mo` },
      { label: 'Monthly Churn Rate (%)', value: formatLatinPercent(safeChurn) },
      { label: 'Gross Profit Margin (%)', value: formatLatinPercent(safeMargin) },
      { label: 'Customer Acquisition Cost (CAC)', value: formatLatinCurrency(safeCac, currency) },
    ],
    results: [
      {
        label: 'Gross Profit LTV per Customer',
        value: grossProfitLtv !== null ? formatLatinCurrency(grossProfitLtv, currency) : 'N/A (0% churn)',
        highlight: true,
      },
      {
        label: 'Gross Revenue LTV (Before Margin)',
        value: grossRevenueLtv !== null ? formatLatinCurrency(grossRevenueLtv, currency) : 'N/A',
      },
      {
        label: 'Implied Customer Lifespan',
        value:
          customerLifespanMonths !== null
            ? `${customerLifespanMonths} months (${customerLifespanYears} years)`
            : 'N/A (0% churn)',
      },
      {
        label: 'LTV : CAC Health Ratio',
        value: ltvCacRatio !== null ? `${ltvCacRatio.toFixed(2)}x` : 'N/A',
      },
      {
        label: 'CAC Payback Horizon',
        value: paybackMonths !== null ? `${paybackMonths} months` : 'N/A',
      },
      {
        label: 'Recommended Max CAC (3:1 Target)',
        value: recommendedMaxCac !== null ? formatLatinCurrency(recommendedMaxCac, currency) : 'N/A',
      },
    ],
    assumptions: [
      'Uses a linear steady-state retention model where average customer lifespan equals 1 / Monthly Churn Rate.',
      'LTV:CAC Ratio and CAC Payback Horizon are evaluated using Gross Profit LTV rather than top-line revenue.',
    ],
  });

  return (
    <div className="space-y-4 text-slate-800">
      <div className="grid grid-cols-2 gap-3">
        <NumericInputField
          id="ltv-aov-input"
          label={`Avg Order Value (${currency})`}
          value={aovStr}
          onChange={setAovStr}
          fieldState={aovField}
          prefix={currency}
          placeholder="0.00"
          min={0.01}
          max={1000000}
          step="any"
        />

        <NumericInputField
          id="ltv-freq-input"
          label="Purchase Frequency (orders/mo)"
          value={frequencyStr}
          onChange={setFrequencyStr}
          fieldState={frequencyField}
          placeholder="1.0"
          min={0.01}
          max={1000}
          step="0.1"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <NumericInputField
          id="ltv-churn-input"
          label="Monthly Churn (%)"
          value={churnRateStr}
          onChange={setChurnRateStr}
          fieldState={churnRateField}
          suffix="%"
          placeholder="5.0"
          min={0}
          max={100}
          step="0.5"
          helperText={safeChurn === 0 && churnRateField.isValid ? 'Zero churn results in undefined lifespan (N/A)' : undefined}
        />

        <NumericInputField
          id="ltv-margin-input"
          label="Gross Margin (%)"
          value={grossMarginStr}
          onChange={setGrossMarginStr}
          fieldState={grossMarginField}
          suffix="%"
          placeholder="70"
          min={0}
          max={100}
          step="1"
        />

        <NumericInputField
          id="ltv-cac-input"
          label={`CAC (${currency})`}
          value={cacStr}
          onChange={setCacStr}
          fieldState={cacField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={1000000}
          step="any"
          helperText={safeCac === 0 && cacField.isValid ? 'Zero CAC makes LTV:CAC ratio undefined (N/A)' : undefined}
        />
      </div>

      {/* Main Results Card */}
      {!isFormValid ? (
        <InvalidInputAlert message="Please enter valid positive numbers for order value and frequency." />
      ) : (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-inner space-y-3">
          <div className="flex justify-between items-baseline">
            <div>
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-cyan-400" /> Gross Profit LTV:
              </div>
              <div className="text-[11px] text-slate-400">Total gross profit contribution per customer lifetime</div>
            </div>
            <span className="font-black text-cyan-400 text-2xl tracking-tight">
              {grossProfitLtv !== null ? (
                formatLatinCurrency(grossProfitLtv, currency)
              ) : (
                <span className="text-slate-400 text-lg" title="Undefined: Zero churn rate creates infinite lifespan">N/A</span>
              )}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">LTV : CAC Health Ratio:</span>
              <span className={`font-bold text-sm ${ltvCacRatio && ltvCacRatio >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {ltvCacRatio !== null ? `${ltvCacRatio.toFixed(2)}x` : <span className="text-slate-400">N/A</span>}
                {ltvCacRatio && ltvCacRatio >= 3 ? ' (Healthy)' : ''}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">CAC Payback Horizon:</span>
              <span className="font-bold text-white text-sm">
                {paybackMonths !== null ? `${paybackMonths} months` : <span className="text-slate-400">N/A</span>}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-2 flex justify-between text-xs text-slate-400">
            <span>Gross Revenue LTV (Before Margin):</span>
            <span className="font-semibold text-slate-200">
              {grossRevenueLtv !== null && customerLifespanMonths !== null
                ? `${formatLatinCurrency(grossRevenueLtv, currency)} (${customerLifespanMonths} mos)`
                : 'N/A'}
            </span>
          </div>

          <div className="border-t border-slate-800 pt-2 flex justify-between text-xs text-slate-400">
            <span>Recommended Max CAC (3:1 LTV:CAC Target):</span>
            <span className="font-semibold text-emerald-400">
              {recommendedMaxCac !== null ? formatLatinCurrency(recommendedMaxCac, currency) : 'N/A'}
            </span>
          </div>
        </div>
      )}

      {/* Linear Model Notice */}
      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          <strong>Linear Model Specification:</strong> This calculation utilizes standard steady-state retention models (`Lifespan = 1 / Churn`). If monthly churn is 0%, customer lifespan is infinite and LTV is mathematically undefined (N/A).
        </span>
      </div>

      {/* Assumptions & Official References Box */}
      <AssumptionsSourcesBox calculatorId="customer-ltv" />

      <CalculatorActionBar
        isFormValid={isFormValid}
        copied={copied}
        linkCopied={linkCopied}
        onCopySummary={handleCopy}
        onShareLink={handleShareLink}
        onResetDefaults={() => {
          setAovStr('65');
          setFrequencyStr('1.5');
          setChurnRateStr('5.0');
          setGrossMarginStr('70');
          setCacStr('120');
        }}
        getReportPayload={getReportPayload}
      />
    </div>
  );
};

