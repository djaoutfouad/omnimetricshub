import React, { useState } from 'react';
import { CurrencySymbol } from '../../types';
import { Copy, Check, RefreshCw, Package, AlertCircle } from 'lucide-react';
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

export const LandedCostCalc: React.FC<Props> = ({ currency }) => {
  const [unitCostStr, setUnitCostStr] = useState<string>('12.00');
  const [freightPerUnitStr, setFreightPerUnitStr] = useState<string>('3.50');
  const [tariffPercentStr, setTariffPercentStr] = useState<string>('5.0');
  const [packagingPerUnitStr, setPackagingPerUnitStr] = useState<string>('1.50');
  const [paymentFeePercentStr, setPaymentFeePercentStr] = useState<string>('2.9');
  const [paymentFeeFixedStr, setPaymentFeeFixedStr] = useState<string>('0.30');
  const [targetMarginStr, setTargetMarginStr] = useState<string>('50.0');
  const [copied, setCopied] = useState(false);

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

  const isFormValid =
    unitCostField.isValid &&
    freightField.isValid &&
    tariffField.isValid &&
    packagingField.isValid &&
    targetMarginField.isValid &&
    feePercentField.isValid &&
    feeFixedField.isValid;

  const safeUnitCost = unitCostField.value ?? 0;
  const safeFreight = freightField.value ?? 0;
  const safeTariff = tariffField.value ?? 0;
  const safePackaging = packagingField.value ?? 0;
  const safeTargetMargin = targetMarginField.value ?? 0;
  const safeFeePercent = feePercentField.value ?? 0;
  const safeFeeFixed = feeFixedField.value ?? 0;

  // Calculations per unit
  const tariffCost = roundToDecimals(safeUnitCost * (safeTariff / 100), 2);
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

  return (
    <div className="space-y-4 text-slate-800">
      <div className="grid grid-cols-2 gap-3">
        <NumericInputField
          id="landed-unit-cost-input"
          label={`Manufacturing / FOB Unit Cost (${currency})`}
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
          label={`Freight & Shipping / Unit (${currency})`}
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
          helperText={`${formatLatinCurrency(tariffCost, currency)} duty on FOB cost`}
        />

        <NumericInputField
          id="landed-packaging-input"
          label={`Packaging & Prep / Unit (${currency})`}
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

      <div className="grid grid-cols-2 gap-3">
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

        <div className="space-y-1">
          <label htmlFor="landed-fee-percent-input" className="text-xs font-bold text-slate-700 block">
            Payment Processor Rate & Fee
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <input
              id="landed-fee-percent-input"
              type="text"
              inputMode="decimal"
              value={paymentFeePercentStr}
              onChange={(e) => setPaymentFeePercentStr(e.target.value)}
              aria-label="Payment Processor Percentage Rate"
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none text-xs focus:ring-2 focus:ring-emerald-500"
              placeholder="2.9%"
            />
            <input
              id="landed-fee-fixed-input"
              type="text"
              inputMode="decimal"
              value={paymentFeeFixedStr}
              onChange={(e) => setPaymentFeeFixedStr(e.target.value)}
              aria-label="Payment Processor Fixed Fee"
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none text-xs focus:ring-2 focus:ring-emerald-500"
              placeholder={`+ ${currency}0.30`}
            />
          </div>
          {(!feePercentField.isValid || !feeFixedField.isValid) && (
            <p role="alert" className="text-rose-600 text-[11px] font-semibold">
              {feePercentField.errorMessage || feeFixedField.errorMessage}
            </p>
          )}
        </div>
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

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => {
            setUnitCostStr('12.00');
            setFreightPerUnitStr('3.50');
            setTariffPercentStr('5.0');
            setPackagingPerUnitStr('1.50');
            setPaymentFeePercentStr('2.9');
            setPaymentFeeFixedStr('0.30');
            setTargetMarginStr('50.0');
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
