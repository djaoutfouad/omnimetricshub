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

/**
 * Validates a numeric string or number input.
 * Strictly validates the entire string (not a prefix), handles zero vs empty vs invalid.
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

  // 2. Validate complete string format via Regex (prevents "12abc" or "1.2.3")
  const regex = integerOnly ? INTEGER_REGEX : FLOAT_REGEX;
  if (!regex.test(trimmed)) {
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

  // 3. Parse number
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || isNaN(parsed)) {
    return {
      raw: rawStr,
      value: null,
      isValid: false,
      isEmpty: false,
      errorMessage: `${fieldName} must be a valid finite number.`,
    };
  }

  // 4. Check minimum bound
  if (min !== undefined && parsed < min) {
    return {
      raw: rawStr,
      value: parsed,
      isValid: false,
      isEmpty: false,
      errorMessage: `${fieldName} cannot be less than ${min}.`,
    };
  }

  // 5. Check maximum bound
  if (max !== undefined && parsed > max) {
    return {
      raw: rawStr,
      value: parsed,
      isValid: false,
      isEmpty: false,
      errorMessage: `${fieldName} cannot exceed ${max.toLocaleString('en-US')}.`,
    };
  }

  // 6. Check zero allowance
  if (!allowZero && parsed === 0) {
    return {
      raw: rawStr,
      value: parsed,
      isValid: false,
      isEmpty: false,
      errorMessage: `${fieldName} must be greater than 0.`,
    };
  }

  // 7. Check integer constraint if parsed as float
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
 */
export function roundToDecimals(val: number, decimals: number = 2): number {
  if (!Number.isFinite(val)) return 0;
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
  if (val === null || val === undefined || !Number.isFinite(val)) {
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
  if (val === null || val === undefined || !Number.isFinite(val)) {
    return 'N/A';
  }
  const rounded = roundToDecimals(val, decimals);
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
  if (val === null || val === undefined || !Number.isFinite(val)) {
    return 'N/A';
  }
  const rounded = roundToDecimals(val, decimals);
  const formatted = rounded.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return includeSymbol ? `${formatted}%` : formatted;
}
