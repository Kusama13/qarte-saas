'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn, PHONE_CONFIG, COUNTRY_FLAGS, ALL_COUNTRIES } from '@/lib/utils';
import type { MerchantCountry } from '@/types';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  country: MerchantCountry;
  onCountryChange: (country: MerchantCountry) => void;
  /** Which countries to show in the dropdown */
  countries?: MerchantCountry[];
  label?: string;
  error?: string;
  required?: boolean;
  autoFocus?: boolean;
  className?: string;
  /** Extra className for the outer wrapper */
  wrapperClassName?: string;
}

export function PhoneInput({
  value,
  onChange,
  country,
  onCountryChange,
  countries = ALL_COUNTRIES,
  label,
  error,
  required,
  autoFocus,
  className,
  wrapperClassName,
}: PhoneInputProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const config = PHONE_CONFIG[country];

  const handleCountrySelect = (c: MerchantCountry) => {
    onCountryChange(c);
    setDropdownOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div className={cn('w-full', wrapperClassName)}>
      {label && (
        <label className="label">{label}</label>
      )}
      <div className="relative flex">
        {/* Country selector button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={cn(
              'flex items-center gap-1 h-full px-3 border border-r-0 rounded-l-xl bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700 shrink-0',
              error ? 'border-red-300' : 'border-gray-300',
            )}
          >
            <span className="text-base leading-none">{COUNTRY_FLAGS[country]}</span>
            <span className="text-xs text-gray-500">+{config.prefix}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[180px] max-h-[240px] overflow-y-auto">
              {countries.map((c) => {
                const cfg = PHONE_CONFIG[c];
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
                      c === country && 'bg-indigo-50 text-indigo-700 font-medium',
                    )}
                  >
                    <span className="text-base leading-none">{COUNTRY_FLAGS[c]}</span>
                    <span className="flex-1 text-left">{c}</span>
                    <span className="text-xs text-gray-400">+{cfg.prefix}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Phone input */}
        <input
          ref={inputRef}
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          required={required}
          autoFocus={autoFocus}
          className={cn(
            'input rounded-l-none border-l-0 flex-1',
            error && 'input-error',
            className,
          )}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
