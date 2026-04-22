import type { Metadata } from 'next';
import { MotionConfigProvider } from './MotionConfigProvider';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CustomerCardLayout({ children }: { children: React.ReactNode }) {
  return <MotionConfigProvider>{children}</MotionConfigProvider>;
}
