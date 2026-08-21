'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { LIST_ORDER, SOURCE_INFO, DEFAULT_LISTS, MovieList } from '@/lib/constants';
import Navbar from '@/components/Navbar';
import { Flame, ExternalLink, Calendar, Film, Layers, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

function NowContent() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get('category') || 'all';

  const [lists, setLists] = useState<Record<string, MovieList>>({});
  const [historyData, setHistoryData] = useState<Record<string, any>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const unsubscribeLists = onSnapshot(
      collection(db, 'movie_lists'),
      (snapshot) => {
        if (!isMounted) return;
        const fetched: Record<string, MovieList> = {};
        snapshot.docs.forEach((doc) => {
          fetched[doc.id] = doc.data() as MovieList;
        });
        setLists(fetched);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching movie_lists:', error);
        if (isMounted) setLoading(false);
      }
    );

    const unsubscribeHistory = onSnapshot(
      collection(db, 'movie_history'),
      (snapshot) => {
        if (!isMounted) return;
        const fetchedHist: Record<string, any> = {};
        snapshot.docs.forEach((doc) => {
          fetchedHist[doc.id] = doc.data();
        });
        setHistoryData(fetchedHist);
      },
      (error) => {
        console.error('Error fetching movie_history:', error);
      }
    );

    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsubscribeLists();
      unsubscribeHistory();
    };
  }, []);

  const activeCategories = useMemo(() => {
    if (selectedCategory === 'all') {
      return LIST_ORDER;
    }
    return LIST_ORDER.includes(selectedCategory) ? [selectedCategory] : LIST_ORDER;
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/80 text-orange-800 text-xs font-bold uppercase tracking-wider mb-3">
              <Flame className="w-3.5 h-3.5 text-orange-600" />
              Status: Live Scrape Terkini
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
              /Now/ — Tren Film Terkini
            </h1>
            <p className="text-neutral-600 text-sm sm:text-base mt-2 max-w-2xl">
              Memantau daftar film dan serial yang sedang menduduki peringkat teratas di 10 platform populer saat ini.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-medium">Total Platform:</span>
            <span className="text-xs font-bold bg-neutral-900 text-white px-2.5 py-1 rounded-lg">10 Sumber</span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase text-neutral-500 tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Pilih Kategori Platform:
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-neutral-900 text-white shadow-xs scale-102'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              Semua Kategori (10)
            </button>
            {LIST_ORDER.map((id) => {
              const info = SOURCE_INFO[id];
              const isSelected = selectedCategory === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelectedCategory(id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 text-white shadow-xs scale-102'
                      : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
                  }`}
                >
                  {info?.shortLabel || id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent"></div>
            <p className="text-xs font-medium text-neutral-500">Memuat data terkini dari Firebase...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {activeCategories.map((listId) => {
              const listData = lists[listId] || DEFAULT_LISTS[listId];
              const sourceInfo = SOURCE_INFO[listId];
              const title = listData?.title || sourceInfo?.label || listId;
              const sourceUrl = listData?.sourceUrl || sourceInfo?.url;
              const movies = listData?.movies || [];
              const updatedAt = listData?.updatedAt;
              const categoryHistory = historyData[listId] || {};

              return (
                <motion.section
                  key={listId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white rounded-2xl border border-neutral-200/90 overflow-hidden shadow-xs"
                >
                  {/* Category Header Bar */}
                  <div className="bg-neutral-50 p-4 sm:p-6 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shadow-2xs shrink-0">
                        <Film className="w-5 h-5 text-neutral-800" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg sm:text-xl font-bold text-neutral-900">{title}</h2>
                          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${sourceInfo?.badgeColor || 'bg-neutral-100 text-neutral-800'}`}>
                            {sourceInfo?.shortLabel || 'Live'}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {sourceInfo?.description || 'Daftar terkini hasil pemindaian sistem'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {updatedAt && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500 bg-white px-3 py-1.5 rounded-lg border border-neutral-200/80">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}

                      {sourceUrl && (
                        <a
                          href={sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          title="Buka Website Sumber Asli"
                        >
                          <span>Sumber</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Movies Grid */}
                  <div className="p-4 sm:p-6">
                    {movies.length === 0 ? (
                      <div className="text-center py-10 text-neutral-400 text-sm">
                        Belum ada data untuk kategori ini.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
                        {movies.map((movieTitle, idx) => {
                          const historyEntry = Object.values(categoryHistory).find(
                            (m: any) => m.movie === movieTitle
                          ) as any;
                          const posterUrl = historyEntry?.posterUrl;
                          const status = historyEntry?.status || 'Aktif';
                          const ageDays = historyEntry?.ageDays || 1;

                          return (
                            <div
                              key={idx}
                              className="group flex flex-col bg-white rounded-xl border border-neutral-200/90 overflow-hidden hover:border-neutral-400 hover:shadow-md transition-all duration-200"
                            >
                              {/* Poster Image Container */}
                              <div className="relative aspect-[2/3] w-full bg-neutral-100 overflow-hidden">
                                <div className="absolute top-2 left-2 z-10 w-6 h-6 sm:w-7 sm:h-7 bg-neutral-900/85 text-white rounded-lg flex items-center justify-center font-bold text-xs shadow-xs backdrop-blur-xs">
                                  {idx + 1}
                                </div>

                                {posterUrl ? (
                                  <img
                                    src={posterUrl}
                                    alt={movieTitle}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 p-3 text-center">
                                    <Film className="w-8 h-8 mb-1.5 opacity-30 text-neutral-500" />
                                    <span className="text-[10px] font-medium leading-tight">No Poster</span>
                                  </div>
                                )}
                              </div>

                              {/* Card Body */}
                              <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between">
                                <h3 className="font-bold text-neutral-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                                  {movieTitle}
                                </h3>

                                <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> {status}
                                  </span>
                                  <span className="font-mono font-bold text-neutral-700">
                                    {ageDays} Hari
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function NowPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50" />}>
      <NowContent />
    </Suspense>
  );
}
