import { CurrencySymbol } from '../types';
import { validateNumericInput, NumberValidationOptions } from './validation';

const SYMBOL_TO_CODE: Record<CurrencySymbol, string> = {
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
  'C$': 'CAD',
  'A$': 'AUD',
  '¥': 'JPY',
  '₹': 'INR',
};

const CODE_TO_SYMBOL: Record<string, CurrencySymbol> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  INR: '₹',
  '$': '$',
  '€': '€',
  '£': '£',
  'C$': 'C$',
  'A$': 'A$',
  '¥': '¥',
  '₹': '₹',
};

function getSearchParams(searchStr?: string): URLSearchParams | null {
  if (typeof searchStr === 'string') {
    return new URLSearchParams(searchStr);
  }
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    return new URLSearchParams(window.location.search);
  }
  return null;
}

/**
 * Safely reads and validates a numeric query parameter from URLSearchParams
 * using the existing validation rules. Ignores invalid, NaN, or out-of-range
 * parameters and falls back to the provided safe default value.
 */
export function getValidatedNumericParam(
  key: string,
  defaultVal: string,
  options: NumberValidationOptions = {},
  searchStr?: string
): string {
  const params = getSearchParams(searchStr);
  if (!params) return defaultVal;

  const rawVal = params.get(key);
  if (rawVal === null || rawVal.trim() === '') {
    return defaultVal;
  }

  const validated = validateNumericInput(rawVal, options);
  if (!validated.isValid || validated.isEmpty || validated.value === null) {
    return defaultVal;
  }

  return String(validated.value);
}

/**
 * Safely reads a string enum query parameter from URLSearchParams.
 */
export function getValidatedEnumParam<T extends string>(
  key: string,
  allowedValues: readonly T[],
  defaultVal: T,
  searchStr?: string
): T {
  const params = getSearchParams(searchStr);
  if (!params) return defaultVal;

  const rawVal = params.get(key);
  if (!rawVal) return defaultVal;

  const match = allowedValues.find(
    (item) => item.toLowerCase() === rawVal.trim().toLowerCase()
  );
  return match ?? defaultVal;
}

/**
 * Safely reads a numeric enum query parameter (e.g. day-count basis 360 | 365 | 366).
 */
export function getValidatedNumberEnumParam<T extends number>(
  key: string,
  allowedValues: readonly T[],
  defaultVal: T,
  searchStr?: string
): T {
  const params = getSearchParams(searchStr);
  if (!params) return defaultVal;

  const rawVal = params.get(key);
  if (!rawVal) return defaultVal;

  const parsed = Number(rawVal.trim());
  if (!Number.isFinite(parsed)) return defaultVal;

  return allowedValues.includes(parsed as T) ? (parsed as T) : defaultVal;
}

/**
 * Reads currency from ?currency=USD (or symbol) if present in URL query parameters.
 */
export function getInitialCurrencyFromUrl(searchStr?: string): CurrencySymbol | null {
  const params = getSearchParams(searchStr);
  if (!params) return null;

  const raw = params.get('currency');
  if (!raw) return null;

  const normalized = raw.trim().toUpperCase();
  if (CODE_TO_SYMBOL[normalized]) {
    return CODE_TO_SYMBOL[normalized];
  }
  if (CODE_TO_SYMBOL[raw.trim()]) {
    return CODE_TO_SYMBOL[raw.trim()];
  }
  return null;
}

/**
 * Converts a CurrencySymbol ('$', '€', etc.) to its clean URL code ('USD', 'EUR', etc.).
 */
export function currencySymbolToCode(currency: CurrencySymbol): string {
  return SYMBOL_TO_CODE[currency] || 'USD';
}

/**
 * Builds a clean shareable URL containing the user's current validated calculator inputs
 * and active currency without polluting the browser address bar during typing.
 */
export function buildShareableCalculatorUrl(
  toolSlug: string,
  inputParams: Record<string, string | number | null | undefined>,
  currency?: CurrencySymbol
): string {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://omnimetricshub.pages.dev';

  let pathname = `/tools/${toolSlug}/`;
  if (typeof window !== 'undefined' && window.location?.pathname) {
    const currentPath = window.location.pathname;
    if (
      currentPath.startsWith('/tools/') ||
      currentPath.startsWith('/calculators/') ||
      currentPath.startsWith('/calculator/')
    ) {
      pathname = currentPath.endsWith('/') ? currentPath : `${currentPath}/`;
    }
  }

  const searchParams = new URLSearchParams();
  if (currency) {
    searchParams.set('currency', currencySymbolToCode(currency));
  }

  Object.entries(inputParams).forEach(([key, val]) => {
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      searchParams.set(key, String(val).trim());
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${origin}${pathname}?${queryString}` : `${origin}${pathname}`;
}
