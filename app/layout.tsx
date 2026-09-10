import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Movie Scraper Reference — Radar Tren Film',
  description: 'A personal movie reference app that displays scraped data from IMDb, Cinema XXI, KlikFilm, HBO Max, Apple TV+, SubSource, and SubDL, synced via GitHub Actions.',
  openGraph: {
    title: 'Movie Scraper Reference — Radar Tren Film',
    description: 'A personal movie reference app that displays scraped data from IMDb, Cinema XXI, KlikFilm, HBO Max, Apple TV+, SubSource, and SubDL, synced via GitHub Actions.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
