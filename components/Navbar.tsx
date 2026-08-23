'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Film, LogOut, Table, Flame, History, RefreshCw, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleTriggerScraper = async () => {
    setIsRefreshing(true);
    setRefreshMessage('');
    try {
      const res = await fetch('/api/trigger-workflow', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setRefreshMessage('Scraper triggered! Data updates in a few mins.');
      } else {
        setRefreshMessage(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      setRefreshMessage(`Error: ${error.message}`);
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setRefreshMessage(''), 5000);
    }
  };

  const isNowActive = pathname === '/now' || pathname === '/Now';
  const isHistoryActive = pathname === '/data-historis-semua' || pathname === '/DATAHISTORISSEMUA' || pathname?.startsWith('/data-historis');
  const isHomeActive = pathname === '/';

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs group-hover:bg-neutral-800 transition-colors">
              <Film className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-neutral-900 tracking-tight leading-tight text-base sm:text-lg">
                Radar Film
              </span>
              <span className="text-[10px] text-neutral-500 font-medium tracking-wide">
                Trend Tracker 10 Platform
              </span>
            </div>
          </Link>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-neutral-100/80 p-1 rounded-xl border border-neutral-200/80">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isHomeActive
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Beranda
            </Link>
            <Link
              href="/now"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isNowActive
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              Now (Tren Terkini)
            </Link>
            <Link
              href="/data-historis-semua"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isHistoryActive
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              <History className="w-3.5 h-3.5 text-blue-500" />
              Data Historis Semua
            </Link>
            <Link
              href="/arsip-netflix"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                pathname === '/arsip-netflix'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-red-600" />
              Arsip Netflix
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="https://docs.google.com/spreadsheets/d/17Of4jJGjERjjSIBNT9kk3K6XrRQDULnwIDBNfOjmpMk/edit"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            title="Buka Google Sheets Arsip"
          >
            <Table className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Google Sheet</span>
          </a>
          <button
            onClick={handleTriggerScraper}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
            title="Jalankan Scraper Sekarang"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{isRefreshing ? 'Scraping...' : 'Sync'}</span>
          </button>
          
          {user ? (
            <div className="flex items-center gap-2 pl-1 border-l border-neutral-200">
              <span className="text-xs text-neutral-600 hidden lg:inline max-w-[130px] truncate">{user.email}</span>
              <button
                onClick={() => signOut(auth)}
                className="text-neutral-500 hover:text-neutral-900 transition-colors p-1.5 rounded-lg hover:bg-neutral-100"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-3 py-1.5 rounded-lg transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around bg-neutral-50 border-t border-neutral-200 px-2 py-1 text-xs">
        <Link
          href="/"
          className={`flex-1 text-center py-1.5 rounded-md font-semibold ${isHomeActive ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'}`}
        >
          Beranda
        </Link>
        <Link
          href="/now"
          className={`flex-1 text-center py-1.5 rounded-md font-semibold ${isNowActive ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'}`}
        >
          Now
        </Link>
        <Link
          href="/data-historis-semua"
          className={`flex-1 text-center py-1.5 rounded-md font-semibold ${isHistoryActive ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'}`}
        >
          Historis
        </Link>
        <Link
          href="/arsip-netflix"
          className={`flex-1 text-center py-1.5 rounded-md font-semibold ${pathname === '/arsip-netflix' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'}`}
        >
          Netflix
        </Link>
      </div>

      {refreshMessage && (
        <div className="bg-neutral-900 text-white text-xs px-4 py-1.5 text-center font-medium animate-pulse">
          {refreshMessage}
        </div>
      )}
    </header>
  );
}
