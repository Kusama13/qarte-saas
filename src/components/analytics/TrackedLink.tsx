'use client';

import { trackCtaClick } from '@/lib/analytics';
import Link from 'next/link';
import { ComponentProps } from 'react';

interface TrackedLinkProps extends ComponentProps<typeof Link> {
  trackingName: string;
  trackingLocation: string;
}

export function TrackedLink({
  trackingName,
  trackingLocation,
  onClick,
  children,
  ...props
}: TrackedLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackCtaClick(trackingName, trackingLocation);
    onClick?.(e);
  };

  return (
    <Link onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}

interface TrackedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  trackingName: string;
  trackingLocation: string;
}

export function TrackedButton({
  trackingName,
  trackingLocation,
  onClick,
  children,
  ...props
}: TrackedButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    trackCtaClick(trackingName, trackingLocation);
    onClick?.(e);
  };

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
}
