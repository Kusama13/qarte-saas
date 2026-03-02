'use client';

import { useRef, useState, useEffect } from 'react';

interface UseInViewOptions extends IntersectionObserverInit {
  /** If true (default), stops observing after first intersection. Set false for continuous tracking. */
  once?: boolean;
}

export function useInView({ once = true, ...options }: UseInViewOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
      if (entry.isIntersecting && once) {
        observer.disconnect();
      }
    }, { threshold: 0.1, ...options });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [once]);

  return { ref, isInView };
}
