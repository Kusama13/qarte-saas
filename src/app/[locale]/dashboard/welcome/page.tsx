'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';

/**
 * Legacy welcome page — now redirects to /dashboard/program.
 * Kept so bookmarked URLs don't 404.
 */
export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/program');
  }, [router]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}
