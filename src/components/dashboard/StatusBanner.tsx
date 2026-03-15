'use client';

import { Link } from '@/i18n/navigation';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBannerProps {
  variant: 'trial' | 'grace' | 'canceling' | 'past_due';
  message: string;
  linkText?: string;
  linkHref?: string;
  onLinkClick?: () => void;
  /** Only used for 'trial' variant when daysRemaining <= 3 */
  urgent?: boolean;
  /** Secondary text shown below the main message (used by grace variant) */
  description?: string;
  /** Render the link as a button (used by grace variant) */
  linkAsButton?: boolean;
}

const variantStyles: Record<StatusBannerProps['variant'], string> = {
  trial: '',  // dynamic, based on urgent prop
  grace: 'bg-red-100 text-red-800 border border-red-300',
  canceling: 'bg-orange-50 text-orange-700',
  past_due: 'bg-red-50 text-red-700 border border-red-200',
};

export default function StatusBanner({
  variant,
  message,
  linkText,
  linkHref,
  onLinkClick,
  urgent,
  description,
  linkAsButton,
}: StatusBannerProps) {
  const showIcon = variant !== 'trial' || urgent;

  const baseClasses = 'mx-3 mt-3 p-3 rounded-xl text-sm';
  const variantClass = variant === 'trial'
    ? urgent ? 'bg-red-50 text-red-700' : 'bg-primary-50 text-primary-700'
    : variantStyles[variant];

  return (
    <div className={cn(baseClasses, variantClass)}>
      {showIcon && <AlertTriangle className="w-4 h-4 inline mr-1.5" />}
      <span className={variant === 'grace' ? 'font-bold' : 'font-medium'}>
        {message}
      </span>

      {description && (
        <p className="mt-1.5 text-red-700 text-xs">{description}</p>
      )}

      {linkText && linkHref && (
        linkAsButton ? (
          <Link
            href={linkHref}
            onClick={onLinkClick}
            className="block mt-2 px-3 py-1.5 bg-red-600 text-white text-center rounded-lg font-medium text-xs hover:bg-red-700"
          >
            {linkText}
          </Link>
        ) : (
          <Link
            href={linkHref}
            onClick={onLinkClick}
            className="block mt-1 text-xs underline hover:no-underline"
          >
            {linkText}
          </Link>
        )
      )}
    </div>
  );
}
