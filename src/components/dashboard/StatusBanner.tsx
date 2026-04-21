'use client';

import { Link } from '@/i18n/navigation';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type TrialSeverity = 'calm' | 'warning' | 'urgent';

interface StatusBannerProps {
  variant: 'trial' | 'grace' | 'canceling' | 'past_due';
  message: string;
  linkText?: string;
  linkHref?: string;
  onLinkClick?: () => void;
  /** Only used for 'trial' variant. calm (J-7→J-4), warning (J-3→J-2), urgent (J-1→J0). */
  severity?: TrialSeverity;
  /** Secondary text shown below the main message (used by grace variant) */
  description?: string;
  /** Render the link as a button (used by grace variant) */
  linkAsButton?: boolean;
}

const variantStyles: Record<StatusBannerProps['variant'], string> = {
  trial: '',  // dynamic, based on severity prop
  grace: 'bg-red-100 text-red-800 border border-red-300',
  canceling: 'bg-orange-50 text-orange-700',
  past_due: 'bg-red-50 text-red-700 border border-red-200',
};

const trialSeverityStyles: Record<TrialSeverity, string> = {
  calm: 'bg-primary-50 text-primary-700',
  warning: 'bg-amber-50 text-amber-800 border border-amber-200',
  urgent: 'bg-red-50 text-red-700',
};

export default function StatusBanner({
  variant,
  message,
  linkText,
  linkHref,
  onLinkClick,
  severity = 'calm',
  description,
  linkAsButton,
}: StatusBannerProps) {
  const showIcon = variant !== 'trial' || severity !== 'calm';

  const baseClasses = 'mx-3 mt-3 p-3 rounded-xl text-sm';
  const variantClass = variant === 'trial'
    ? trialSeverityStyles[severity]
    : variantStyles[variant];

  return (
    <div className={cn(baseClasses, variantClass)}>
      {showIcon && <AlertTriangle className="w-4 h-4 inline mr-1.5" />}
      <span className={variant === 'grace' ? 'font-bold' : 'font-medium'}>
        {message}
      </span>

      {description && (
        <p className={cn('mt-1.5 text-xs', variant === 'trial' ? (severity === 'urgent' ? 'text-red-600' : severity === 'warning' ? 'text-amber-700' : 'text-primary-500') : 'text-red-700')}>{description}</p>
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
