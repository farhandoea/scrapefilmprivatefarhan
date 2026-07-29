'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { RefreshCw, Film, LogOut, Github } from 'lucide-react';
import { motion } from 'motion/react';

interface MovieList {
  id: string;
  title: string;
  movies: string[];
  updatedAt: number;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<Record<string, MovieList>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(collection(db, 'movie_lists'), (snapshot) => {
      const fetchedLists: Record<string, MovieList> = {};
      snapshot.docs.forEach(doc => {
        fetchedLists[doc.id] = doc.data() as MovieList;
      });
      setLists(fetchedLists);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching lists:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-200 max-w-md w-full text-center"
        >
          <div className="bg-neutral-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Film className="w-8 h-8 text-neutral-800" />
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">My Movie Scraper</h1>
          <p className="text-neutral-500 mb-8">Sign in to access your personal movie references.</p>
          
          <button
            onClick={handleLogin}
            className="w-full bg-neutral-900 text-white rounded-xl py-3 font-medium hover:bg-neutral-800 transition-colors"
          >
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  const listOrder = ['top_ten', 'in_theaters', 'new_in_theaters'];

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-6 h-6 text-neutral-900" />
            <h1 className="font-semibold text-neutral-900">Movie References</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => signOut(auth)}
              className="text-neutral-500 hover:text-neutral-900 transition-colors p-2 rounded-full hover:bg-neutral-100"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {listOrder.map(listId => {
            const listData = lists[listId];
            return (
              <motion.div 
                key={listId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm flex flex-col"
              >
                <div className="bg-neutral-100 p-4 border-b border-neutral-200">
                  <h3 className="font-semibold text-neutral-900">{listData?.title || (listId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}</h3>
                  {listData?.updatedAt && (
                    <p className="text-xs text-neutral-500 mt-1">
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
