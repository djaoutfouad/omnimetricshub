import React from 'react';
import { AlertCircle } from 'lucide-react';
import { NumericFieldState } from '../../utils/validation';

interface NumericInputFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  fieldState: NumericFieldState;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  placeholder?: string;
  helperText?: string;
  min?: number;
  max?: number;
  step?: string | number;
  className?: string;
  disabled?: boolean;
}

export const NumericInputField: React.FC<NumericInputFieldProps> = ({
  id,
  label,
  value,
  onChange,
  fieldState,
  prefix,
  suffix,
  placeholder,
  helperText,
  min,
  max,
  step = 'any',
  className = '',
  disabled = false,
}) => {
  const isInvalid = !fieldState.isValid;
  const errorId = `${id}-error`;
  const helperId = `${id}-helper`;

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={id} className="text-xs font-bold text-slate-700 block">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs pointer-events-none select-none flex items-center">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-invalid={isInvalid}
          aria-describedby={
            isInvalid && fieldState.errorMessage
              ? errorId
              : helperText
              ? helperId
              : undefined
          }
          className={`w-full py-2 bg-slate-50 border rounded-xl font-bold text-slate-900 outline-none text-sm transition ${
            prefix ? 'pl-7' : 'pl-3.5'
          } ${suffix ? 'pr-8' : 'pr-3'} ${
            isInvalid
              ? 'border-rose-400 bg-rose-50/50 text-rose-950 focus:ring-2 focus:ring-rose-500/40'
              : 'border-slate-200 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500'
          }`}
        />
        {suffix && (
          <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-xs pointer-events-none select-none flex items-center">
            {suffix}
          </span>
        )}
      </div>
      {isInvalid && fieldState.errorMessage ? (
        <p id={errorId} role="alert" className="text-rose-600 text-[11px] font-semibold flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{fieldState.errorMessage}</span>
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-[10px] text-slate-400 mt-1 block">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export const InvalidInputAlert: React.FC<{
  message?: string;
  details?: string;
}> = ({
  message = 'Please correct the highlighted inputs above to view calculation results.',
  details,
}) => (
  <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-inner text-center py-6">
    <AlertCircle className="w-6 h-6 text-rose-400 mx-auto mb-2" />
    <p className="text-sm font-bold text-rose-300">Invalid or Incomplete Input</p>
    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
      {message}
    </p>
    {details && (
      <p className="text-[11px] text-amber-300 mt-2 bg-slate-800/80 rounded-lg py-1 px-3 inline-block">
        {details}
      </p>
    )}
  </div>
);
