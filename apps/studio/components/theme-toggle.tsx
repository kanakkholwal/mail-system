'use client';

import { useEffect, useState } from 'react';
import { readTheme, THEME_EVENT, type StudioTheme } from '@/lib/use-theme';
import styles from './theme-toggle.module.css';

export function ThemeToggle() {
  const [theme, setTheme] = useState<StudioTheme | undefined>(undefined);

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const toggle = (): void => {
    const next: StudioTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('bm-theme', next);
    setTheme(next);
    // Gallery thumbnails are iframes: they re-request their own render on this.
    window.dispatchEvent(new CustomEvent(THEME_EVENT));
  };

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {/* Rendered from the same node in both states so the swap cannot shift layout. */}
      <span aria-hidden="true">{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );
}
