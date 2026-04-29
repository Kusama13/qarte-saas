'use client';

import { useEffect } from 'react';
import { initFreezeDetector } from '@/lib/freeze-detector';

export default function FreezeDetectorMount() {
  useEffect(() => {
    initFreezeDetector();
  }, []);
  return null;
}
