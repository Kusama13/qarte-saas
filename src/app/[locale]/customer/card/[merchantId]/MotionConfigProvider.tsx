'use client';

import { MotionConfig } from 'framer-motion';
import { ToastProvider } from '@/components/ui/Toast';

export function MotionConfigProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>{children}</ToastProvider>
    </MotionConfig>
  );
}
