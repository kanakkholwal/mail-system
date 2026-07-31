import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeToggle } from '@/components/theme-toggle';
import './globals.css';

const sans = Geist({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' });
const mono = Geist_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'better-mailer studio',
  description: 'Conversion-focused email and document templates built with Unlayer Elements.',
};

/** Applied before paint so a dark session never flashes the light canvas. */
const THEME_BOOTSTRAP = `try{var t=localStorage.getItem('bm-theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>
        <header className="site-header">
          <div className="shell site-header__inner">
            <a href="/" className="wordmark">
              better<span>-</span>mailer
            </a>
            <nav className="site-nav">
              <a href="https://github.com/kanakkholwal/mail-system" rel="noreferrer noopener" target="_blank">
                GitHub
              </a>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
