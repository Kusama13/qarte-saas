'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn, PHONE_CONFIG, COUNTRY_FLAGS, ALL_COUNTRIES } from '@/lib/utils';
import type { MerchantCountry } from '@/types';

const COUNTRY_NAMES: Record<MerchantCountry, string> = {
  FR: 'France', BE: 'Belgique', CH: 'Suisse', LU: 'Luxembourg',
  US: 'United States', GB: 'United Kingdom', CA: 'Canada', AU: 'Australia',
  ES: 'Espagne', IT: 'Italie',
};

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
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Position dropdown using fixed positioning (escapes overflow containers)
  const updateDropdownPos = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 4, left: rect.left });
  }, []);

  // Close dropdown on outside click or scroll
  useEffect(() => {
    if (!dropdownOpen) return;
    updateDropdownPos();
    const handleClose = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    const handleScroll = () => setDropdownOpen(false);
    document.addEventListener('mousedown', handleClose);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [dropdownOpen, updateDropdownPos]);

  const config = PHONE_CONFIG[country];
  const sortedCountries = useMemo(
    () => [country, ...countries.filter(c => c !== country)],
    [country, countries]
  );

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
        <button
          ref={buttonRef}
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

        {/* Dropdown — fixed position to escape overflow containers */}
        {dropdownOpen && dropdownPos && (
          <div
            ref={dropdownRef}
            className="fixed z-[100] bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[200px] max-h-[240px] overflow-y-auto"
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
          >
            {sortedCountries.map((c, i) => {
              const cfg = PHONE_CONFIG[c];
              return (
                <div key={c}>
                  {i === 1 && sortedCountries.length > 1 && (
                    <div className="border-t border-gray-100 my-1" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
                      c === country && 'bg-indigo-50 text-indigo-700 font-medium',
                    )}
                  >
                    <span className="text-base leading-none">{COUNTRY_FLAGS[c]}</span>
                    <span className="flex-1 text-left">{COUNTRY_NAMES[c] || c}</span>
                    <span className="text-xs text-gray-400">+{cfg.prefix}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

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
            'input rounded-l-none border-l-0 flex-1 min-w-0',
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
