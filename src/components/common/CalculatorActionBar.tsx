import React, { useState } from 'react';
import { Copy, Check, RefreshCw, Share2, Printer, Download } from 'lucide-react';
import {
  CalculationReportPayload,
  exportCalculationCsv,
  printCalculationReport,
} from '../../utils/exportReport';

interface CalculatorActionBarProps {
  onReset?: () => void;
  onResetDefaults?: () => void;
  onCopySummary: () => void;
  onShareLink: () => void;
  copied: boolean;
  linkCopied: boolean;
  isFormValid: boolean;
  getReportPayload: () => CalculationReportPayload;
}

export const CalculatorActionBar: React.FC<CalculatorActionBarProps> = ({
  onReset,
  onResetDefaults,
  onCopySummary,
  onShareLink,
  copied,
  linkCopied,
  isFormValid,
  getReportPayload,
}) => {
  const [csvSaved, setCsvSaved] = useState(false);

  const handleExportCsv = () => {
    if (!isFormValid) return;
    exportCalculationCsv(getReportPayload());
    setCsvSaved(true);
    setTimeout(() => setCsvSaved(false), 2000);
  };

  const handlePrintPdf = () => {
    if (!isFormValid) return;
    printCalculationReport(getReportPayload());
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
      <button
        type="button"
        onClick={onReset ?? onResetDefaults}
        className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium transition cursor-pointer py-1"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Reset Defaults
      </button>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={!isFormValid}
          title="Download calculation report as CSV spreadsheet"
          className={`text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition cursor-pointer border ${
            isFormValid
              ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              : 'bg-slate-100 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
          }`}
        >
          {csvSaved ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Download className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span>{csvSaved ? 'CSV Saved!' : 'CSV'}</span>
        </button>

        <button
          type="button"
          onClick={handlePrintPdf}
          disabled={!isFormValid}
          title="Print or Save calculation report as PDF"
          className={`text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition cursor-pointer border ${
            isFormValid
              ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              : 'bg-slate-100 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
          }`}
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>Print / PDF</span>
        </button>

        <button
          type="button"
          onClick={onShareLink}
          disabled={!isFormValid}
          title="Copy shareable link with current inputs"
          className={`text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition cursor-pointer border ${
            isFormValid
              ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              : 'bg-slate-100 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed'
          }`}
        >
          {linkCopied ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span>{linkCopied ? 'Link Copied!' : 'Share Link'}</span>
        </button>

        <button
          type="button"
          onClick={onCopySummary}
          disabled={!isFormValid}
          title="Copy formatted text summary to clipboard"
          className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
            isFormValid
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              : 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
          }`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
        </button>
      </div>
    </div>
  );
};
