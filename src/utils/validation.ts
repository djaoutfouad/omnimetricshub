/**
 * Financial Input Validation, Sanitization & Formatting Utility
 * Enforces strict verification against NaN, Infinity, malformed strings,
 * negative numbers, and out-of-range values.
 * Formats all outputs strictly using Latin digits (0-9) via 'en-US' locale.
 */

export interface NumericFieldState {
  raw: string;
  value: number | null;
  isValid: boolean;
  isEmpty: boolean;
  errorMessage?: string;
}

export interface NumberValidationOptions {
  min?: number;
  max?: number;
  allowZero?: boolean;
  allowEmpty?: boolean;
  integerOnly?: boolean;
  fieldName?: string;
}

// Regex to validate full trimmed floating-point strings (strictly rejecting trailing garbage like "12abc")
const FLOAT_REGEX = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
// Regex to validate full trimmed integer strings
const INTEGER_REGEX = /^[+-]?\d+$/;
// Regex to validate valid comma-separated thousands groups
const COMMA_FLOAT_REGEX = /^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/;
const COMMA_INT_REGEX = /^[+-]?\d{1,3}(?:,\d{3})+$/;

/**
 * Validates a numeric string or number input.
 * Strictly validates the entire string (not a prefix), handles zero vs empty vs invalid.
 * Accepts formatted numbers with valid thousands commas (e.g. "20,000") and optional currency symbols.
 * Strictly rejects malformed values like "12abc", "12,34", multiple decimal points, NaN, Infinity.
 */
export function validateNumericInput(
  input: string | number | null | undefined,
  options: NumberValidationOptions = {}
): NumericFieldState {
  const {
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    allowZero = true,
    allowEmpty = false,
    integerOnly = false,
    fieldName = 'Input',
  } = options;

  const rawStr =
    typeof input === 'number'
      ? Number.isFinite(input)
        ? String(input)
        : ''
      : String(input ?? '');
  const trimmed = rawStr.trim();

  // 1. Check for empty string
  if (trimmed === '') {
    if (allowEmpty) {
      return {
        raw: rawStr,
        value: null,
        isValid: true,
        isEmpty: true,
      };
    }
    return {
      raw: rawStr,
      value: null,
      isValid: false,
      isEmpty: true,
      errorMessage: `${fieldName} is required.`,
    };
  }

  // Strip optional leading currency sign ($ € £ ¥ ₹ C$ A$) and optional trailing percent (%)
  let sanitized = trimmed;
  if (/^(\$|€|£|¥|₹|C\$|A\$)/.test(sanitized)) {
    sanitized = sanitized.replace(/^(\$|€|£|¥|₹|C\$|A\$)\s*/, '');
  }
  if (sanitized.endsWith('%')) {
    sanitized = sanitized.slice(0, -1).trim();
  }

  if (sanitized === '') {
    return {
      raw: rawStr,
      value: null,
      isValid: false,
      isEmpty: false,
      errorMessage: `Please enter a valid numeric value for ${fieldName}.`,
    };
  }

  // 2. Normalize valid thousands commas (e.g., "20,000" -> "20000")
  let candidate = sanitized;
  if (integerOnly) {
    if (COMMA_INT_REGEX.test(candidate)) {
      candidate = candidate.replace(/,/g, '');
    }
  } else {
    if (COMMA_FLOAT_REGEX.test(candidate)) {
      candidate = candidate.replace(/,/g, '');
    }
  }

  // 3. Validate complete string format via Regex (prevents "12abc", "12,34", or "1.2.3")
  const regex = integerOnly ? INTEGER_REGEX : FLOAT_REGEX;
  if (!regex.test(candidate)) {
    return {
      raw: rawStr,
      value: null,
      isValid: false,
      isEmpty: false,
      errorMessage: integerOnly
        ? `Please enter a valid whole integer for ${fieldName}.`
        : `Please enter a valid numeric value for ${fieldName}.`,
    };
  }

  // 4. Parse number
  const parsed = Number(candidate);
  if (!Number.isFinite(parsed) || isNaN(parsed)) {
    return {
      raw: rawStr,
      value: null,
      isValid: false,
      isEmpty: false,
      errorMessage: `${fieldName} must be a valid finite number.`,
    };
  }

  // 5. Check minimum bound
  if (min !== undefined && parsed < min) {
    return {
      raw: rawStr,
      value: parsed,
      isValid: false,
      isEmpty: false,
      errorMessage: `${fieldName} cannot be less than ${min}.`,
    };
  }

  // 6. Check maximum bound
  if (max !== undefined && parsed > max) {
    return {
      raw: rawStr,
      value: parsed,
      isValid: false,
      isEmpty: false,
      errorMessage: `${fieldName} cannot exceed ${max.toLocaleString('en-US')}.`,
    };
  }

  // 7. Check zero allowance
  if (!allowZero && parsed === 0) {
    return {
      raw: rawStr,
      value: parsed,
      isValid: false,
      isEmpty: false,
      errorMessage: `${fieldName} must be greater than 0.`,
    };
  }

  // 8. Check integer constraint if parsed as float
  if (integerOnly && !Number.isInteger(parsed)) {
    return {
      raw: rawStr,
      value: parsed,
      isValid: false,
      isEmpty: false,
      errorMessage: `${fieldName} must be a whole integer without decimals.`,
    };
  }

  // Valid number
  return {
    raw: rawStr,
    value: parsed,
    isValid: true,
    isEmpty: false,
  };
}

/**
 * Ensures safe half-up mathematical rounding to prevent floating-point inaccuracies.
 * Returns NaN for non-finite or NaN inputs (never silently masks errors with 0).
 */
export function roundToDecimals(val: number, decimals: number = 2): number {
  if (!Number.isFinite(val) || isNaN(val)) return NaN;
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Format numbers strictly using Latin digits (en-US locale).
 * Returns 'N/A' for null, undefined, NaN, or non-finite values.
 */
export function formatLatinNumber(
  val: number | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  if (val === null || val === undefined || !Number.isFinite(val) || isNaN(val)) {
    return 'N/A';
  }
  return new Intl.NumberFormat('en-US', options).format(val);
}

/**
 * Format currency amounts strictly using Latin digits (en-US locale).
 * Returns 'N/A' for null, undefined, NaN, or non-finite values.
 */
export function formatLatinCurrency(
  val: number | null | undefined,
  currencySymbol: string = '$',
  decimals: number = 2
): string {
  if (val === null || val === undefined || !Number.isFinite(val) || isNaN(val)) {
    return 'N/A';
  }
  const rounded = roundToDecimals(val, decimals);
  if (!Number.isFinite(rounded) || isNaN(rounded)) {
    return 'N/A';
  }
  const formatted = rounded.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${currencySymbol}${formatted}`;
}

/**
 * Format percentage strictly using Latin digits (en-US locale).
 * Returns 'N/A' for null, undefined, NaN, or non-finite values.
 */
export function formatLatinPercent(
  val: number | null | undefined,
  decimals: number = 1,
  includeSymbol: boolean = true
): string {
  if (val === null || val === undefined || !Number.isFinite(val) || isNaN(val)) {
    return 'N/A';
  }
  const rounded = roundToDecimals(val, decimals);
  if (!Number.isFinite(rounded) || isNaN(rounded)) {
    return 'N/A';
  }
  const formatted = rounded.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return includeSymbol ? `${formatted}%` : formatted;
}
