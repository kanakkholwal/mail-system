'use client';

import { useEffect, useState } from 'react';

export type StudioTheme = 'light' | 'dark';

/** Broadcast by the toggle, because `data-theme` on <html> fires no event of its own. */
export const THEME_EVENT = 'bm-theme-change';

export function readTheme(): StudioTheme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

/**
 * Undefined until mounted. Email previews render server-side under `auto`, so a
 * card that guessed a theme before hydration would swap its iframe on every load.
 */
export function useStudioTheme(): StudioTheme | undefined {
  const [theme, setTheme] = useState<StudioTheme | undefined>(undefined);

  useEffect(() => {
    setTheme(readTheme());
    const onChange = () => setTheme(readTheme());
    window.addEventListener(THEME_EVENT, onChange);
    return () => window.removeEventListener(THEME_EVENT, onChange);
  }, []);

  return theme;
}
