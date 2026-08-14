'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { RefreshCw, Film, LogOut, Github, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

interface MovieList {
  id: string;
  title: string;
  source?: string;
  sourceUrl?: string;
  movies: string[];
  updatedAt: number;
}

const listOrder = ['top_ten', 'in_theaters', 'subsource_popular', 'subdl_popular_movies', 'subdl_most_downloaded'];
const defaultSourceInfo: Record<string, { label: string; url: string }> = {
  top_ten: { label: 'IMDb Top Movies', url: 'https://www.imdb.com/search/title/?moviemeter=%2C10' },
  in_theaters: { label: 'Cinema 21 (Now Playing)', url: 'https://m.21cineplex.com/id/movies?tabs=now-playing' },
  subsource_popular: { label: 'SubSource Subtitles', url: 'https://subsource.net/' },
  subdl_popular_movies: { label: 'SubDL Popular Movies', url: 'https://subdl.com/id/trends/movies' },
  subdl_most_downloaded: { label: 'SubDL Most Downloaded', url: 'https://subdl.com/id/latest/popular' },
};

const defaultLists: Record<string, MovieList> = {
  top_ten: {
    id: 'top_ten',
    title: 'Top 10 This Week',
    source: 'IMDb Top Movies',
    sourceUrl: 'https://www.imdb.com/search/title/?moviemeter=%2C10',
    movies: [
      'The Odyssey (2026)',
      'Masters of the Universe (2026)',
      'Obsession (2025)',
      '72 Hours (2026)',
      'House of the Dragon (2024)',
      'Disclosure Day (2026)',
      'The Hawk (2026)',
      'Project Hail Mary (2026)',
      'Avatar Aang: The Last Airbender (2026)',
      'Backrooms (2026)'
    ],
    updatedAt: 1771706900000
  },
  in_theaters: {
    id: 'in_theaters',
    title: 'Cinema XXI (21 Cineplex)',
    source: 'Cinema 21 (Now Playing)',
    sourceUrl: 'https://m.21cineplex.com/id/movies?tabs=now-playing',
    movies: [
      'Spider-Man: Brand New Day',
      'Sajen Satu Suro',
      'Samakdo',
      'Ketok Mejik',
      'Kado untuk Ibu',
      'Sihir Tanah Kubur',
      'Andai Waktu Bisa Diulang Kembali',
      'Evil Dead Burn',
      'Obsession',
      'The Odyssey (IMAX 2D)',
      'Cek Khodam',
      'Petaka Gunung Welirang'
    ],
    updatedAt: 1771706900000
  },
  subsource_popular: {
    id: 'subsource_popular',
    title: 'Popular Movie Subtitles',
    source: 'SubSource',
    sourceUrl: 'https://subsource.net/',
    movies: [
      'Supergirl (2026)',
      'Disclosure Day (2026)',
      'The Death of Robin Hood (2026)',
      'Star Wars: The Mandalorian and Grogu (2026)'
    ],
    updatedAt: 1771706900000
  },
  subdl_popular_movies: {
    id: 'subdl_popular_movies',
    title: 'SubDL Popular Movies',
    source: 'SubDL Popular Movies',
    sourceUrl: 'https://subdl.com/id/trends/movies',
    movies: [
      'Spider-Man: Brand New Day (2026)',
      'The Odyssey (2026)'
    ],
    updatedAt: 1771706900000
  },
  subdl_most_downloaded: {
    id: 'subdl_most_downloaded',
    title: 'SubDL Most Downloaded Subtitle',
    source: 'SubDL Most Downloaded',
    sourceUrl: 'https://subdl.com/id/latest/popular',
    movies: [
      'Spider-Man: Brand New Day (2026)'
    ],
    updatedAt: 1771706900000
  }
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<Record<string, MovieList>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onSnapshot(collection(db, 'movie_lists'), (snapshot) => {
      if (!isMounted) return;
      const fetchedLists: Record<string, MovieList> = {};
      snapshot.docs.forEach(doc => {
        fetchedLists[doc.id] = doc.data() as MovieList;
      });
      setLists(fetchedLists);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching lists:", error);
      if (isMounted) setLoading(false);
    });

    // Fallback timeout so it never hangs indefinitely
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 4000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsubscribe();
    };
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
        setRefreshMessage('Scraper workflow triggered! Data will update in a few minutes.');
      } else {
        setRefreshMessage(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      setRefreshMessage(`Error: ${error.message}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-6 h-6 text-neutral-900" />
            <h1 className="font-semibold text-neutral-900">Movie References</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-600 hidden sm:inline">{user.email}</span>
                <button
                  onClick={() => signOut(auth)}
                  className="text-neutral-500 hover:text-neutral-900 transition-colors p-2 rounded-full hover:bg-neutral-100"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-3 py-1.5 rounded-lg transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-neutral-900 mb-1">Data Synchronization</h2>
            <p className="text-neutral-500 text-sm">
              Trigger the GitHub Actions scraper workflow to refresh the data below.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            <button
              onClick={handleTriggerScraper}
              disabled={isRefreshing}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-neutral-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Triggering...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {refreshMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl mb-8 text-sm font-medium ${refreshMessage.includes('Failed') || refreshMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
          >
            {refreshMessage}
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {listOrder.map(listId => {
            const listData = lists[listId] || defaultLists[listId];
            const sourceLabel = listData?.source || defaultSourceInfo[listId]?.label || 'Web Scraper';
            const sourceUrl = listData?.sourceUrl || defaultSourceInfo[listId]?.url;

            return (
              <motion.div 
                key={listId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm flex flex-col"
              >
                <div className="bg-neutral-100 p-4 border-b border-neutral-200">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-neutral-900 leading-snug">{listData?.title || (listId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}</h3>
                    {sourceUrl ? (
                      <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-neutral-200/90 hover:bg-neutral-300 text-neutral-800 border border-neutral-300/60 inline-flex items-center gap-1 transition-colors"
                        title={`Visit source: ${sourceUrl}`}
                      >
                        <span>{sourceLabel}</span>
                        <ExternalLink className="w-3 h-3 text-neutral-500" />
                      </a>
                    ) : (
                      <span className="shrink-0 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-neutral-200/90 text-neutral-700 border border-neutral-300/60">
                        {sourceLabel}
                      </span>
                    )}
                  </div>
                  {listData?.updatedAt && (
                    <p className="text-xs text-neutral-500">
                      Last updated: {new Date(listData.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                
                <div className="p-4 flex-1">
                  {!listData ? (
                    <div className="h-full flex items-center justify-center text-center text-neutral-400 py-8 text-sm">
                      <div>No data available.<br/>Click refresh to scrape.</div>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {listData.movies.map((movie, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <span className="text-neutral-400 font-mono text-xs mt-0.5">{idx + 1}.</span>
                          <span className="text-neutral-800 font-medium leading-tight">{movie}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
