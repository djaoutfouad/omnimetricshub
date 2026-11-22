import { CurrencySymbol } from '../types';
import { currencySymbolToCode } from './shareableState';

export interface CalculationReportRow {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface CalculationReportSchedule {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface CalculationReportPayload {
  calculatorName: string;
  slug?: string;
  calculatorId?: string;
  currency: CurrencySymbol;
  inputs: CalculationReportRow[];
  results: CalculationReportRow[];
  assumptions?: string[];
  schedule?: CalculationReportSchedule;
}

export const REPORT_ESTIMATE_DISCLAIMER =
  'Estimate based on user inputs and stated assumptions — for planning purposes only, not financial, legal, or tax advice.';

export const CSV_REPORT_ESTIMATE_DISCLAIMER =
  'Estimate based on user inputs and stated assumptions - for planning purposes only, not financial, legal, or tax advice.';

/**
 * Ensures any currency string formatted as "$-2.00" or "€-2.00" is normalized to "-$2.00" / "-€2.00".
 */
function normalizeNegativeCurrency(text: string): string {
  return text.replace(/(^|\s)(C\$|A\$|\$|€|£|¥|₹)-(\d)/g, '$1-$2$3');
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = normalizeNegativeCurrency(String(value ?? ''))
    .replace(/\r?\n/g, ' ')
    .replace(/[\u2014\u2013]/g, '-')
    .trim();
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

function escapeHtml(value: string | number | null | undefined): string {
  return normalizeNegativeCurrency(String(value ?? ''))
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getFormattedReportDate(): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Generates a UTF-8 BOM CSV file of the calculation inputs, results, assumptions,
 * optional schedule, and mandatory estimate disclaimer, and triggers a local download.
 */
export function exportCalculationCsv(report: CalculationReportPayload): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const dateStr = getFormattedReportDate();
  const currencyCode = currencySymbolToCode(report.currency);
  const lines: string[] = [];

  lines.push([escapeCsvCell('OmniMetrics Hub - Financial Decision Report'), escapeCsvCell('')].join(','));
  lines.push([escapeCsvCell('Calculator Name'), escapeCsvCell(report.calculatorName)].join(','));
  lines.push([escapeCsvCell('Date Generated'), escapeCsvCell(dateStr)].join(','));
  lines.push([escapeCsvCell('Currency'), escapeCsvCell(`${currencyCode} (${report.currency})`)].join(','));
  lines.push('');

  lines.push([escapeCsvCell('INPUT PARAMETERS'), escapeCsvCell('VALUE')].join(','));
  for (const row of report.inputs) {
    lines.push([escapeCsvCell(row.label), escapeCsvCell(row.value)].join(','));
  }
  lines.push('');

  lines.push([escapeCsvCell('ESTIMATED RESULTS'), escapeCsvCell('VALUE')].join(','));
  for (const row of report.results) {
    lines.push([escapeCsvCell(row.label), escapeCsvCell(row.value)].join(','));
  }
  lines.push('');

  if (report.schedule && report.schedule.rows.length > 0) {
    lines.push([escapeCsvCell(report.schedule.title.toUpperCase())].join(','));
    lines.push(report.schedule.headers.map((h) => escapeCsvCell(h)).join(','));
    for (const sRow of report.schedule.rows) {
      lines.push(sRow.map((cell) => escapeCsvCell(cell)).join(','));
    }
    lines.push('');
  }

  if (report.assumptions && report.assumptions.length > 0) {
    lines.push([escapeCsvCell('ASSUMPTIONS & MODEL NOTES')].join(','));
    for (const note of report.assumptions) {
      lines.push([escapeCsvCell('Note'), escapeCsvCell(note)].join(','));
    }
    lines.push('');
  }

  lines.push([escapeCsvCell('DISCLAIMER'), escapeCsvCell(CSV_REPORT_ESTIMATE_DISCLAIMER)].join(','));

  // Prepend UTF-8 BOM (\uFEFF) so Microsoft Excel renders €, £, ¥, ₹ cleanly
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  const rawSlug = report.slug || report.calculatorId || 'report';
  const safeSlug = rawSlug.replace(/[^a-z0-9-_]/gi, '-').toLowerCase();
  const dateStamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute('download', `omnimetrics-${safeSlug}-${dateStamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}

/**
 * Renders a self-contained, XSS-escaped, print-ready HTML report in an isolated hidden iframe
 * and triggers the native browser Print / Save-as-PDF dialog without popup blockers.
 */
export function printCalculationReport(report: CalculationReportPayload): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const dateStr = getFormattedReportDate();
  const currencyCode = currencySymbolToCode(report.currency);

  const inputsHtml = report.inputs
    .map(
      (r) => `
      <tr>
        <td class="cell-label">${escapeHtml(r.label)}</td>
        <td class="cell-value">${escapeHtml(r.value)}</td>
      </tr>`
    )
    .join('');

  const resultsHtml = report.results
    .map(
      (r, idx) => `
      <tr class="${r.highlight || idx === 0 ? 'primary-row' : ''}">
        <td class="cell-label">${escapeHtml(r.label)}</td>
        <td class="cell-value">${escapeHtml(r.value)}</td>
      </tr>`
    )
    .join('');

  const scheduleHtml =
    report.schedule && report.schedule.rows.length > 0
      ? `
      <div class="section">
        <h2 class="section-title">${escapeHtml(report.schedule.title)}</h2>
        <table class="data-table schedule-table">
          <thead>
            <tr>
              ${report.schedule.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${report.schedule.rows
              .map(
                (row) => `
              <tr>
                ${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`
      : '';

  const assumptionsHtml =
    report.assumptions && report.assumptions.length > 0
      ? `
      <div class="assumptions-box">
        <div class="box-heading">Model Assumptions &amp; Parameters</div>
        <ul>
          ${report.assumptions.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}
        </ul>
      </div>`
      : '';

  const htmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(report.calculatorName)} — OmniMetrics Hub Report</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 16mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 12px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .brand {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #059669;
      margin-bottom: 4px;
    }
    .report-title {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      margin: 0;
    }
    .meta {
      text-align: right;
      font-size: 11px;
      color: #475569;
    }
    .meta strong {
      color: #0f172a;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 18px;
    }
    .section {
      margin-bottom: 18px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #334155;
      margin: 0 0 8px 0;
      padding-bottom: 4px;
      border-bottom: 1px solid #cbd5e1;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    .data-table td, .data-table th {
      padding: 7px 9px;
      border: 1px solid #e2e8f0;
      font-size: 11.5px;
    }
    .data-table th {
      background: #f1f5f9;
      font-weight: 700;
      text-align: left;
      color: #1e293b;
    }
    .cell-label {
      color: #475569;
      font-weight: 500;
    }
    .cell-value {
      text-align: right;
      font-weight: 700;
      color: #0f172a;
      font-variant-numeric: tabular-nums;
    }
    .primary-row td {
      background: #f0fdf4;
      color: #065f46;
      font-weight: 800;
    }
    .schedule-table td {
      font-variant-numeric: tabular-nums;
    }
    .schedule-table td:not(:first-child),
    .schedule-table th:not(:first-child) {
      text-align: right;
    }
    .assumptions-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 14px;
      font-size: 11px;
      color: #334155;
    }
    .box-heading {
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.05em;
    }
    .assumptions-box ul {
      margin: 0;
      padding-left: 16px;
    }
    .assumptions-box li {
      margin-bottom: 2px;
    }
    .disclaimer-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 10.5px;
      color: #78350f;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">OmniMetrics Hub — Client-Side Analytical Report</div>
      <h1 class="report-title">${escapeHtml(report.calculatorName)}</h1>
    </div>
    <div class="meta">
      <div><strong>Generated:</strong> ${escapeHtml(dateStr)}</div>
      <div><strong>Currency:</strong> ${escapeHtml(currencyCode)} (${escapeHtml(report.currency)})</div>
    </div>
  </div>

  <div class="grid-2">
    <div>
      <h2 class="section-title">Input Parameters</h2>
      <table class="data-table">
        <tbody>
          ${inputsHtml}
        </tbody>
      </table>
    </div>
    <div>
      <h2 class="section-title">Estimated Results</h2>
      <table class="data-table">
        <tbody>
          ${resultsHtml}
        </tbody>
      </table>
    </div>
  </div>

  ${scheduleHtml}
  ${assumptionsHtml}

  <div class="disclaimer-box">
    <strong>Important Disclaimer:</strong> ${escapeHtml(REPORT_ESTIMATE_DISCLAIMER)}
  </div>
</body>
</html>`;

  const existingFrame = document.getElementById('omnimetrics-print-frame');
  if (existingFrame && existingFrame.parentNode) {
    existingFrame.parentNode.removeChild(existingFrame);
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'omnimetrics-print-frame';
  iframe.title = 'Print Calculation Report';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';

  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!frameDoc || !iframe.contentWindow) {
    return;
  }

  frameDoc.open();
  frameDoc.write(htmlDocument);
  frameDoc.close();

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // fallback if iframe print is restricted
      window.print();
    }
  };

  setTimeout(triggerPrint, 180);
}
