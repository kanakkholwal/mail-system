'use client';

import { useEffect, useState } from 'react';
import styles from './theme-toggle.module.css';

type Theme = 'light' | 'dark';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | undefined>(undefined);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  }, []);

  const toggle = (): void => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('bm-theme', next);
    setTheme(next);
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
