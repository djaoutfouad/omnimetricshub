import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CurrencySymbol } from '../../types';
import { Package, AlertCircle, ArrowRight, Workflow, ArrowLeftRight } from 'lucide-react';
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
import { AssumptionsSourcesBox } from '../common/AssumptionsSourcesBox';

interface Props {
  currency: CurrencySymbol;
}

export const LandedCostCalc: React.FC<Props> = ({ currency }) => {
  const location = useLocation();

  const [unitCostStr, setUnitCostStr] = useState<string>(() =>
    getValidatedNumericParam('unitCost', '12.00', { min: 0, max: 1000000, allowZero: true })
  );
  const [freightPerUnitStr, setFreightPerUnitStr] = useState<string>(() =>
    getValidatedNumericParam('freight', '3.50', { min: 0, max: 100000, allowZero: true })
  );
  const [tariffPercentStr, setTariffPercentStr] = useState<string>(() =>
    getValidatedNumericParam('tariff', '5.0', { min: 0, max: 500, allowZero: true })
  );
  const [packagingPerUnitStr, setPackagingPerUnitStr] = useState<string>(() =>
    getValidatedNumericParam('packaging', '1.50', { min: 0, max: 100000, allowZero: true })
  );
  const [paymentFeePercentStr, setPaymentFeePercentStr] = useState<string>(() =>
    getValidatedNumericParam('feePercent', '2.9', { min: 0, max: 95, allowZero: true })
  );
  const [paymentFeeFixedStr, setPaymentFeeFixedStr] = useState<string>(() =>
    getValidatedNumericParam('feeFixed', '0.30', { min: 0, max: 1000, allowZero: true })
  );
  const [targetMarginStr, setTargetMarginStr] = useState<string>(() =>
    getValidatedNumericParam('targetMargin', '50.0', { min: 0, max: 95, allowZero: true })
  );
  const [dutyBasis, setDutyBasis] = useState<'FOB' | 'CIF'>(() =>
    getValidatedEnumParam('dutyBasis', ['FOB', 'CIF'] as const, 'FOB')
  );
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [unitCostBStr, setUnitCostBStr] = useState<string>('12.00');
  const [freightPerUnitBStr, setFreightPerUnitBStr] = useState<string>('6.50');
  const [tariffPercentBStr, setTariffPercentBStr] = useState<string>('5.0');
  const [packagingPerUnitBStr, setPackagingPerUnitBStr] = useState<string>('1.50');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!location.search) return;
    setUnitCostStr(getValidatedNumericParam('unitCost', '12.00', { min: 0, max: 1000000, allowZero: true }, location.search));
    setFreightPerUnitStr(getValidatedNumericParam('freight', '3.50', { min: 0, max: 100000, allowZero: true }, location.search));
    setTariffPercentStr(getValidatedNumericParam('tariff', '5.0', { min: 0, max: 500, allowZero: true }, location.search));
    setPackagingPerUnitStr(getValidatedNumericParam('packaging', '1.50', { min: 0, max: 100000, allowZero: true }, location.search));
    setPaymentFeePercentStr(getValidatedNumericParam('feePercent', '2.9', { min: 0, max: 95, allowZero: true }, location.search));
    setPaymentFeeFixedStr(getValidatedNumericParam('feeFixed', '0.30', { min: 0, max: 1000, allowZero: true }, location.search));
    setTargetMarginStr(getValidatedNumericParam('targetMargin', '50.0', { min: 0, max: 95, allowZero: true }, location.search));
    setDutyBasis(getValidatedEnumParam('dutyBasis', ['FOB', 'CIF'] as const, 'FOB', location.search));
  }, [location.search]);

  // Field validation
  const unitCostField = validateNumericInput(unitCostStr, {
    min: 0,
    max: 1000000,
    allowZero: true,
    fieldName: 'Manufacturing / FOB Unit Cost',
  });

  const freightField = validateNumericInput(freightPerUnitStr, {
    min: 0,
    max: 100000,
    allowZero: true,
    fieldName: 'Freight & Shipping / Unit',
  });

  const tariffField = validateNumericInput(tariffPercentStr, {
    min: 0,
    max: 500,
    allowZero: true,
    fieldName: 'Import Duty / Tariff (%)',
  });

  const packagingField = validateNumericInput(packagingPerUnitStr, {
    min: 0,
    max: 100000,
    allowZero: true,
    fieldName: 'Packaging & Prep / Unit',
  });

  const targetMarginField = validateNumericInput(targetMarginStr, {
    min: 0,
    max: 95,
    allowZero: true,
    fieldName: 'Target Profit Margin (%)',
  });

  const feePercentField = validateNumericInput(paymentFeePercentStr, {
    min: 0,
    max: 95,
    allowZero: true,
    fieldName: 'Payment Processor Rate (%)',
  });

  const feeFixedField = validateNumericInput(paymentFeeFixedStr, {
    min: 0,
    max: 1000,
    allowZero: true,
    fieldName: 'Payment Processor Fixed Fee',
  });

  // Scenario B (Option B) field validation
  const unitCostBField = validateNumericInput(unitCostBStr, {
    min: 0,
    max: 1000000,
    allowZero: true,
    fieldName: 'Option B Manufacturing Unit Cost',
  });

  const freightBField = validateNumericInput(freightPerUnitBStr, {
    min: 0,
    max: 100000,
    allowZero: true,
    fieldName: 'Option B Freight & Shipping / Unit',
  });

  const tariffBField = validateNumericInput(tariffPercentBStr, {
    min: 0,
    max: 500,
    allowZero: true,
    fieldName: 'Option B Import Duty / Tariff (%)',
  });

  const packagingBField = validateNumericInput(packagingPerUnitBStr, {
    min: 0,
    max: 100000,
    allowZero: true,
    fieldName: 'Option B Packaging & Prep / Unit',
  });

  const isOptionAValid =
    unitCostField.isValid &&
    freightField.isValid &&
    tariffField.isValid &&
    packagingField.isValid &&
    targetMarginField.isValid &&
    feePercentField.isValid &&
    feeFixedField.isValid;

  const isOptionBValid =
    unitCostBField.isValid &&
    freightBField.isValid &&
    tariffBField.isValid &&
    packagingBField.isValid;

  const isFormValid = isOptionAValid && (!isComparing || isOptionBValid);

  const safeUnitCost = unitCostField.value ?? 0;
  const safeFreight = freightField.value ?? 0;
  const safeTariff = tariffField.value ?? 0;
  const safePackaging = packagingField.value ?? 0;
  const safeTargetMargin = targetMarginField.value ?? 0;
  const safeFeePercent = feePercentField.value ?? 0;
  const safeFeeFixed = feeFixedField.value ?? 0;

  const safeUnitCostB = unitCostBField.value ?? 0;
  const safeFreightB = freightBField.value ?? 0;
  const safeTariffB = tariffBField.value ?? 0;
  const safePackagingB = packagingBField.value ?? 0;

  // Calculations per unit (Option A)
  const dutyBase = dutyBasis === 'FOB' ? safeUnitCost : roundToDecimals(safeUnitCost + safeFreight, 2);
  const tariffCost = roundToDecimals(dutyBase * (safeTariff / 100), 2);
  const totalLandedCost = roundToDecimals(
    safeUnitCost + safeFreight + tariffCost + safePackaging,
    2
  );

  const feeRate = safeFeePercent / 100;
  const marginRate = safeTargetMargin / 100;

  // Selling Price P such that P - Fee(P) - LandedCost = P * MarginRate
  // P * (1 - feeRate - marginRate) = totalLandedCost + feeFixed
  const denominator = 1 - feeRate - marginRate;
  const isPricingSolvable = isFormValid && denominator > 0;
  const recommendedPrice = isPricingSolvable
    ? roundToDecimals((totalLandedCost + safeFeeFixed) / denominator, 2)
    : null;

  const paymentFeeTotal =
    recommendedPrice !== null
      ? roundToDecimals((recommendedPrice * feeRate) + safeFeeFixed, 2)
      : null;

  const netProfitPerUnit =
    recommendedPrice !== null && paymentFeeTotal !== null
      ? roundToDecimals(recommendedPrice - totalLandedCost - paymentFeeTotal, 2)
      : null;

  const markupPercent =
    recommendedPrice !== null && totalLandedCost > 0
      ? roundToDecimals(((recommendedPrice - totalLandedCost) / totalLandedCost) * 100, 1)
      : null;

  // Break-even retail price (target margin = 0%)
  const breakEvenDenominator = 1 - feeRate;
  const breakEvenPrice =
    isFormValid && breakEvenDenominator > 0
      ? roundToDecimals((totalLandedCost + safeFeeFixed) / breakEvenDenominator, 2)
      : null;

  // Option B Calculations
  const dutyBaseB = dutyBasis === 'FOB' ? safeUnitCostB : roundToDecimals(safeUnitCostB + safeFreightB, 2);
  const tariffCostB = roundToDecimals(dutyBaseB * (safeTariffB / 100), 2);
  const totalLandedCostB = roundToDecimals(
    safeUnitCostB + safeFreightB + tariffCostB + safePackagingB,
    2
  );
  const recommendedPriceB = isPricingSolvable
    ? roundToDecimals((totalLandedCostB + safeFeeFixed) / denominator, 2)
    : null;
  const paymentFeeTotalB =
    recommendedPriceB !== null
      ? roundToDecimals((recommendedPriceB * feeRate) + safeFeeFixed, 2)
      : null;
  const netProfitPerUnitB =
    recommendedPriceB !== null && paymentFeeTotalB !== null
      ? roundToDecimals(recommendedPriceB - totalLandedCostB - paymentFeeTotalB, 2)
      : null;
  const landedCostDiff = roundToDecimals(Math.abs(totalLandedCostB - totalLandedCost), 2);
  const retailPriceDiff =
    recommendedPrice !== null && recommendedPriceB !== null
      ? roundToDecimals(Math.abs(recommendedPriceB - recommendedPrice), 2)
      : null;

  const handleCopy = async () => {
    if (!isFormValid) return;
    const priceText =
      recommendedPrice !== null
        ? formatLatinCurrency(recommendedPrice, currency)
        : 'N/A (margin + fee rate >= 100%)';
    const profitText =
      netProfitPerUnit !== null
        ? formatLatinCurrency(netProfitPerUnit, currency)
        : 'N/A';
    const markupText = markupPercent !== null ? formatLatinPercent(markupPercent) : 'N/A';
    const bePriceText =
      breakEvenPrice !== null
        ? formatLatinCurrency(breakEvenPrice, currency)
        : 'N/A';

    const text = `E-Commerce Landed Cost & Pricing Summary:\n- FOB Manufacturing Unit Cost: ${formatLatinCurrency(safeUnitCost, currency)}\n- Freight/Unit: ${formatLatinCurrency(safeFreight, currency)} | Tariff (${formatLatinPercent(safeTariff)}): ${formatLatinCurrency(tariffCost, currency)} | Packaging/Unit: ${formatLatinCurrency(safePackaging, currency)}\n- Total Landed Cost per Unit: ${formatLatinCurrency(totalLandedCost, currency)}\n- Recommended Retail Price (${formatLatinPercent(safeTargetMargin)} Margin): ${priceText}\n- Net Profit per Unit: ${profitText} (Markup: ${markupText})\n- Minimum Break-Even Price: ${bePriceText}`;

    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareLink = async () => {
    if (!isFormValid) return;
    const url = buildShareableCalculatorUrl(
      'landed-cost',
      {
        unitCost: safeUnitCost,
        freight: safeFreight,
        tariff: safeTariff,
        packaging: safePackaging,
        targetMargin: safeTargetMargin,
        feePercent: safeFeePercent,
        feeFixed: safeFeeFixed,
        dutyBasis,
      },
      currency
    );
    const ok = await copyTextToClipboard(url);
    if (ok) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const profitMarginWorkflowUrl = `/tools/profit-margin/?cost=${totalLandedCost.toFixed(2)}${
    recommendedPrice !== null ? `&price=${recommendedPrice.toFixed(2)}` : ''
  }&targetMargin=${Math.max(0.1, safeTargetMargin)}&currency=${encodeURIComponent(currency)}`;

  const getReportPayload = (): CalculationReportPayload => ({
    calculatorId: 'landed-cost',
    calculatorName: 'E-Commerce Unit Landed Cost & Pricing Calculator',
    currency,
    inputs: [
      { label: 'Manufacturing / FOB Unit Cost', value: formatLatinCurrency(safeUnitCost, currency) },
      { label: 'Freight & Shipping per Unit', value: formatLatinCurrency(safeFreight, currency) },
      { label: 'Import Customs Duty / Tariff Rate', value: `${formatLatinPercent(safeTariff)} (${dutyBasis} Basis)` },
      { label: 'Packaging & Prep per Unit', value: formatLatinCurrency(safePackaging, currency) },
      { label: 'Desired Profit Margin', value: formatLatinPercent(safeTargetMargin) },
      { label: 'Payment Processor Rate', value: `${formatLatinPercent(safeFeePercent)} + ${formatLatinCurrency(safeFeeFixed, currency)}` },
    ],
    results: [
      {
        label: 'Recommended Retail Price',
        value: recommendedPrice !== null ? formatLatinCurrency(recommendedPrice, currency) : 'N/A',
        highlight: true,
      },
      { label: 'Total Landed Cost per Unit', value: formatLatinCurrency(totalLandedCost, currency) },
      { label: `Calculated Duty Cost (${dutyBasis})`, value: formatLatinCurrency(tariffCost, currency) },
      {
        label: 'Net Profit per Unit (After Processor Fees)',
        value: netProfitPerUnit !== null ? formatLatinCurrency(netProfitPerUnit, currency) : 'N/A',
      },
      {
        label: 'Markup on Landed Cost',
        value: markupPercent !== null ? formatLatinPercent(markupPercent) : 'N/A',
      },
      {
        label: 'Minimum Break-Even Retail Price',
        value: breakEvenPrice !== null ? formatLatinCurrency(breakEvenPrice, currency) : 'N/A',
      },
    ],
    assumptions: [
      dutyBasis === 'FOB'
        ? 'FOB Customs Basis: Tariff percentage is applied to manufacturing unit cost only.'
        : 'CIF Customs Basis: Tariff percentage is applied to manufacturing unit cost plus allocated unit freight.',
      'Recommended Retail Price solves for desired net profit margin after deducting percentage and fixed payment gateway fees.',
    ],
  });

  return (
    <div className="space-y-4 text-slate-800">
      {/* Compare Scenarios (A vs. B) Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200/90 rounded-xl">
        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600" />
          <span>Compare Supplier / Freight Options (A vs. B)</span>
        </span>
        <button
          type="button"
          onClick={() => setIsComparing((prev) => !prev)}
          aria-pressed={isComparing}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
            isComparing
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          {isComparing ? 'Comparing A vs. B (On)' : 'Compare Scenarios (A vs. B)'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumericInputField
          id="landed-unit-cost-input"
          label={isComparing ? `Option A FOB Unit Cost (${currency})` : `Manufacturing / FOB Unit Cost (${currency})`}
          value={unitCostStr}
          onChange={setUnitCostStr}
          fieldState={unitCostField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={1000000}
          step="any"
          helperText="Factory purchase price per single unit"
        />

        <NumericInputField
          id="landed-freight-input"
          label={isComparing ? `Option A Freight / Unit (${currency})` : `Freight & Shipping / Unit (${currency})`}
          value={freightPerUnitStr}
          onChange={setFreightPerUnitStr}
          fieldState={freightField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={100000}
          step="any"
          helperText="Allocated ocean/air freight per unit"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <NumericInputField
            id="landed-tariff-input"
            label="Import Customs Duty / Tariff (%)"
            value={tariffPercentStr}
            onChange={setTariffPercentStr}
            fieldState={tariffField}
            suffix="%"
            placeholder="0.0"
            min={0}
            max={500}
            step="any"
            helperText={`${formatLatinCurrency(tariffCost, currency)} duty on ${dutyBasis} basis`}
          />
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span className="font-semibold">Duty Valuation:</span>
            <button
              type="button"
              onClick={() => setDutyBasis('FOB')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                dutyBasis === 'FOB'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              FOB (Goods)
            </button>
            <button
              type="button"
              onClick={() => setDutyBasis('CIF')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                dutyBasis === 'CIF'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              CIF (Goods+Freight)
            </button>
          </div>
        </div>

        <NumericInputField
          id="landed-packaging-input"
          label={isComparing ? `Option A Packaging / Unit (${currency})` : `Packaging & Prep / Unit (${currency})`}
          value={packagingPerUnitStr}
          onChange={setPackagingPerUnitStr}
          fieldState={packagingField}
          prefix={currency}
          placeholder="0.00"
          min={0}
          max={100000}
          step="any"
          helperText="Custom box, insert, barcode labeling per unit"
        />
      </div>

      {/* Option B (Air Freight / Alt Supplier) Inputs */}
      {isComparing && (
        <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/90 rounded-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-1">
            <span className="text-[11px] font-extrabold text-emerald-950 uppercase tracking-wider">
              Option B (e.g., Air Freight / Alternate Supplier)
            </span>
            <span className="text-[10.5px] font-semibold text-emerald-800">
              Uses {dutyBasis} Duty Valuation &amp; {formatLatinPercent(safeTargetMargin)} Target Margin
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumericInputField
              id="landed-unit-cost-b-input"
              label={`Option B FOB Unit Cost (${currency})`}
              value={unitCostBStr}
              onChange={setUnitCostBStr}
              fieldState={unitCostBField}
              prefix={currency}
              placeholder="0.00"
              min={0}
              max={1000000}
              step="any"
            />
            <NumericInputField
              id="landed-freight-b-input"
              label={`Option B Freight / Unit (${currency})`}
              value={freightPerUnitBStr}
              onChange={setFreightPerUnitBStr}
              fieldState={freightBField}
              prefix={currency}
              placeholder="0.00"
              min={0}
              max={100000}
              step="any"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumericInputField
              id="landed-tariff-b-input"
              label="Option B Duty / Tariff (%)"
              value={tariffPercentBStr}
              onChange={setTariffPercentBStr}
              fieldState={tariffBField}
              suffix="%"
              placeholder="0.0"
              min={0}
              max={500}
              step="any"
            />
            <NumericInputField
              id="landed-packaging-b-input"
              label={`Option B Packaging / Unit (${currency})`}
              value={packagingPerUnitBStr}
              onChange={setPackagingPerUnitBStr}
              fieldState={packagingBField}
              prefix={currency}
              placeholder="0.00"
              min={0}
              max={100000}
              step="any"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <NumericInputField
          id="landed-margin-input"
          label="Desired Profit Margin (%)"
          value={targetMarginStr}
          onChange={setTargetMarginStr}
          fieldState={targetMarginField}
          suffix="%"
          placeholder="50.0"
          min={0}
          max={95}
          step="1"
        />

        <NumericInputField
          id="landed-fee-percent-input"
          label="Processor Rate (%)"
          value={paymentFeePercentStr}
          onChange={setPaymentFeePercentStr}
          fieldState={feePercentField}
          suffix="%"
          placeholder="2.9"
          min={0}
          max={95}
          step="0.1"
          helperText="e.g. 2.9%"
        />

        <NumericInputField
          id="landed-fee-fixed-input"
          label={`Fixed Fee per Txn (${currency})`}
          value={paymentFeeFixedStr}
          onChange={setPaymentFeeFixedStr}
          fieldState={feeFixedField}
          prefix={currency}
          placeholder="0.30"
          min={0}
          max={1000}
          step="0.05"
          helperText="Per customer transaction"
        />
      </div>

      {/* Main Scorecard */}
      {!isFormValid ? (
        <InvalidInputAlert message="Please provide valid non-negative figures for unit costs, freight, and tariff." />
      ) : (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-inner space-y-3">
          {isPricingSolvable && recommendedPrice !== null ? (
            <>
              <div className="flex justify-between items-baseline">
                <div>
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-emerald-400" /> Recommended Retail Price:
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Yields targeted {formatLatinPercent(safeTargetMargin)} margin after payment fees
                  </div>
                </div>
                <span className="font-black text-emerald-400 text-2xl tracking-tight">
                  {formatLatinCurrency(recommendedPrice, currency)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2.5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Landed Cost / Unit:</span>
                  <span className="font-bold text-white text-sm">
                    {formatLatinCurrency(totalLandedCost, currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Net Profit / Unit:</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {netProfitPerUnit !== null ? formatLatinCurrency(netProfitPerUnit, currency) : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-2.5 text-xs text-slate-400">
                <div>
                  <span>Markup on Landed Cost:</span>
                  <span className="font-semibold text-slate-200 ml-1">
                    {markupPercent !== null ? formatLatinPercent(markupPercent) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span>Break-Even Retail Price:</span>
                  <span className="font-semibold text-slate-200 ml-1">
                    {breakEvenPrice !== null ? formatLatinCurrency(breakEvenPrice, currency) : 'N/A'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div role="alert" className="flex items-start gap-2 text-rose-400 text-xs py-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Pricing Unsolvable (N/A):</strong> Desired profit margin ({formatLatinPercent(safeTargetMargin)}) plus processor rate ({formatLatinPercent(safeFeePercent)}) total 100% or more. Reduce target margin or fees to solve retail price.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Side-by-Side Option A vs. Option B Landed Cost Comparison */}
      {isComparing && isFormValid && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-inner space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
              Side-by-Side Logistics Comparison (Option A vs. Option B)
            </span>
            <span className="text-[11px] text-slate-400">
              {dutyBasis} Valuation • {formatLatinPercent(safeTargetMargin)} Margin Target
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-emerald-400">Option A (Primary)</span>
                <span className="text-[11px] text-slate-400">
                  Freight: {formatLatinCurrency(safeFreight, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Total Landed Cost / Unit:</span>
                <span className="font-bold text-white">{formatLatinCurrency(totalLandedCost, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Required Retail Price:</span>
                <span className="font-extrabold text-emerald-400">
                  {recommendedPrice !== null ? formatLatinCurrency(recommendedPrice, currency) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-700/70">
                <span className="text-slate-400">Net Profit / Unit:</span>
                <span className="font-semibold text-slate-200">
                  {netProfitPerUnit !== null ? formatLatinCurrency(netProfitPerUnit, currency) : 'N/A'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-teal-400">Option B (Comparison)</span>
                <span className="text-[11px] text-slate-400">
                  Freight: {formatLatinCurrency(safeFreightB, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Total Landed Cost / Unit:</span>
                <span className="font-bold text-white">{formatLatinCurrency(totalLandedCostB, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Required Retail Price:</span>
                <span className="font-extrabold text-teal-400">
                  {recommendedPriceB !== null ? formatLatinCurrency(recommendedPriceB, currency) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-700/70">
                <span className="text-slate-400">Net Profit / Unit:</span>
                <span className="font-semibold text-slate-200">
                  {netProfitPerUnitB !== null ? formatLatinCurrency(netProfitPerUnitB, currency) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Comparison Verdict Badge */}
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-xs text-emerald-100 flex flex-wrap items-center justify-between gap-2">
            {totalLandedCost === totalLandedCostB ? (
              <span className="font-bold">
                Verdict: Both Option A and Option B result in an identical unit landed cost ({formatLatinCurrency(totalLandedCost, currency)}).
              </span>
            ) : (
              <>
                <span className="font-extrabold text-emerald-300">
                  Verdict: {totalLandedCost < totalLandedCostB ? 'Option A' : 'Option B'} saves {formatLatinCurrency(landedCostDiff, currency)} per unit in landed cost
                </span>
                {retailPriceDiff !== null && (
                  <span className="text-[11px] font-bold bg-emerald-900/90 text-emerald-200 px-2 py-0.5 rounded-md">
                    Retail Price Δ: {formatLatinCurrency(retailPriceDiff, currency)}/unit
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Connected Decision Workflow Card */}
      {isFormValid && totalLandedCost > 0 && (
        <div className="p-3 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5 text-emerald-600" /> Next Step in Your Workflow
            </span>
            <span className="text-emerald-700 font-semibold">
              Carries {formatLatinCurrency(totalLandedCost, currency)} unit cost
            </span>
          </div>
          <Link
            to={profitMarginWorkflowUrl}
            className="w-full px-3 py-2 rounded-xl bg-white hover:bg-emerald-600 text-emerald-900 hover:text-white border border-emerald-200 hover:border-emerald-600 text-xs font-bold flex items-center justify-between transition shadow-2xs group"
          >
            <span>Use Total Landed Cost in Profit Margin Calculator</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      )}

      {/* Assumptions & Official References Box */}
      <AssumptionsSourcesBox calculatorId="landed-cost" />

      <CalculatorActionBar
        isFormValid={isFormValid}
        copied={copied}
        linkCopied={linkCopied}
        onCopySummary={handleCopy}
        onShareLink={handleShareLink}
        onResetDefaults={() => {
          setUnitCostStr('12.00');
          setFreightPerUnitStr('3.50');
          setTariffPercentStr('5.0');
          setPackagingPerUnitStr('1.50');
          setPaymentFeePercentStr('2.9');
          setPaymentFeeFixedStr('0.30');
          setTargetMarginStr('50.0');
          setDutyBasis('FOB');
          setUnitCostBStr('12.00');
          setFreightPerUnitBStr('6.50');
          setTariffPercentBStr('5.0');
          setPackagingPerUnitBStr('1.50');
        }}
        getReportPayload={getReportPayload}
      />
    </div>
  );
};

