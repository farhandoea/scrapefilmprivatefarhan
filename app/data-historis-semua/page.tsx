'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { LIST_ORDER, SOURCE_INFO, HistoryItem } from '@/lib/constants';
import Navbar from '@/components/Navbar';
import { History, Search, Filter, ArrowUpDown, Calendar, Award, Film, CheckCircle2, XCircle, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

function HistoryContent() {
  const searchParams = useSearchParams();
  const initialSource = searchParams?.get('source') || 'All';

  const [historyData, setHistoryData] = useState<Record<string, any>>({});
  const [sourceFilter, setSourceFilter] = useState<string>(initialSource);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'alpha'>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  const ITEMS_PER_PAGE = 30;

  useEffect(() => {
    let isMounted = true;
    const unsubscribeHistory = onSnapshot(
      collection(db, 'movie_history'),
      (snapshot) => {
        if (!isMounted) return;
        const fetched: Record<string, any> = {};
        snapshot.docs.forEach((doc) => {
          fetched[doc.id] = doc.data();
        });
        setHistoryData(fetched);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching movie_history:', error);
        if (isMounted) setLoading(false);
      }
    );

    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsubscribeHistory();
    };
  }, []);

  // Flatten and process all historical records
  const allMoviesList = useMemo(() => {
    const list: HistoryItem[] = [];

    if (sourceFilter === 'All') {
      LIST_ORDER.forEach((catId) => {
        const catHistory = historyData[catId] || {};
        const sourceInfo = SOURCE_INFO[catId];
        Object.entries(catHistory).forEach(([key, item]: [string, any]) => {
          if (key === '_updated') return;
        
          list.push({
            ...item,
            sourceName: sourceInfo?.label || catId,
            platform: sourceInfo?.shortLabel || catId,
            category: catId,
          });
        });
      });
    } else {
      const catHistory = historyData[sourceFilter] || {};
      const sourceInfo = SOURCE_INFO[sourceFilter];
      Object.entries(catHistory).forEach(([key, item]: [string, any]) => {
          if (key === '_updated') return;
        
        list.push({
          ...item,
          sourceName: sourceInfo?.label || sourceFilter,
          platform: sourceInfo?.shortLabel || sourceFilter,
          category: sourceFilter,
        });
      });
    }

    return list;
  }, [historyData, sourceFilter]);

  // Filter and sort
  const filteredMovies = useMemo(() => {
    let result = allMoviesList.filter((item) => {
      if (statusFilter !== 'All' && item.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return item.movie?.toLowerCase().includes(q);
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortOrder === 'alpha') {
        return a.movie.localeCompare(b.movie);
      }
      const ageA = a.ageDays || 1;
      const ageB = b.ageDays || 1;
      if (sortOrder === 'desc') {
        return ageB - ageA;
      }
      return ageA - ageB;
    });

    return result;
  }, [allMoviesList, statusFilter, searchQuery, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE) || 1;
  const paginatedMovies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMovies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMovies, currentPage]);

  // Statistics Summary
  const stats = useMemo(() => {
    const totalTracked = filteredMovies.length;
    const activeCount = filteredMovies.filter((m) => m.status === 'Aktif').length;
    const maxAge = filteredMovies.reduce((max, m) => Math.max(max, m.ageDays || 1), 0);
    const avgAge = totalTracked > 0 ? (filteredMovies.reduce((sum, m) => sum + (m.ageDays || 1), 0) / totalTracked).toFixed(1) : '0';

    return { totalTracked, activeCount, maxAge, avgAge };
  }, [filteredMovies]);

  const handleSourceChange = (val: string) => {
    setSourceFilter(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 border-b border-neutral-200/80 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 text-blue-800 text-xs font-bold uppercase tracking-wider mb-3">
            <History className="w-3.5 h-3.5 text-blue-600" />
            Database Historis & Ketahanan Tren
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 tracking-tight">
            Data Historis Semua
          </h1>
          <p className="text-neutral-600 text-sm sm:text-base mt-2 max-w-3xl">
            Arsip lengkap riwayat seluruh film yang pernah masuk dan bertahan di tangga popularitas 10 platform, lengkap dengan rekor umur hari dan tanggal aktifnya.
          </p>
        </div>

        {/* Quick Stats Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 mb-8">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Total Film Terlacak</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-1">{stats.totalTracked}</div>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Record dalam database</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Status Aktif Hari Ini</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">{stats.activeCount}</div>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Sedang di tangga tren</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Rekor Terlama</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 mt-1">{stats.maxAge} <span className="text-sm font-semibold text-neutral-500">Hari</span></div>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Daya tahan tertinggi</span>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Rata-rata Durasi</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-1">{stats.avgAge} <span className="text-sm font-semibold text-neutral-500">Hari</span></div>
            <span className="text-[11px] text-neutral-400 mt-0.5 block">Rata-rata bertahan</span>
          </div>
        </div>

        {/* Filter and Search Panel */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-xs mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="search-input" className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-neutral-500" /> Cari Judul Film:
              </label>
              <div className="relative">
                <input
                  id="search-input"
                  type="text"
                  placeholder="Ketik judul film..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-neutral-900"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Source / Category Filter */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="source-select" className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-neutral-500" /> Filter Platform / Sumber:
              </label>
              <select
                id="source-select"
                value={sourceFilter}
                onChange={(e) => handleSourceChange(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-neutral-900 cursor-pointer"
              >
                <option value="All">Semua Platform (10 Sumber)</option>
                {LIST_ORDER.map((id) => (
                  <option key={id} value={id}>
                    {SOURCE_INFO[id]?.label || id}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="status-select" className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" /> Filter Status:
              </label>
              <select
                id="status-select"
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-neutral-900 cursor-pointer"
              >
                <option value="All">Semua Status</option>
                <option value="Aktif">Aktif (Sedang Tren)</option>
                <option value="Keluar dari Daftar">Keluar dari Daftar</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sort-select" className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" /> Urutan (Sort):
              </label>
              <select
                id="sort-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-neutral-900 cursor-pointer"
              >
                <option value="desc">Umur Hari Tertinggi (Paling Awet)</option>
                <option value="asc">Umur Hari Terendah (Baru Masuk)</option>
                <option value="alpha">Alfabet Judul (A - Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-neutral-900 border-t-transparent"></div>
            <p className="text-xs font-medium text-neutral-500">Memuat data historis...</p>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center text-neutral-500">
            <Film className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <h3 className="font-bold text-neutral-800 text-base">Tidak ada data yang cocok</h3>
            <p className="text-xs text-neutral-500 mt-1">Coba ubah kata kunci pencarian atau reset filter sumber/status.</p>
          </div>
        ) : (
          <div>
            {/* Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
              {paginatedMovies.map((item, idx) => {
                const isActive = item.status === 'Aktif';
                const lastSeenDate = item.lastSeenDate || '';
                const ageDays = item.ageDays || 1;
                
                let firstSeenDateStr = '-';
                if (lastSeenDate) {
                  const d = new Date(lastSeenDate);
                  d.setDate(d.getDate() - ageDays + 7);
                  if (!isNaN(d.getTime())) {
                     firstSeenDateStr = d.toISOString().split('T')[0];
                  }
                }
                
                const sourceInfo = item.category ? SOURCE_INFO[item.category] : null;

                return (
                  <motion.div
                    key={`${item.category}-${item.movie}-${idx}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group flex flex-col bg-white rounded-xl border border-neutral-200/90 overflow-hidden hover:border-neutral-400 hover:shadow-md transition-all duration-200"
                  >
                    {/* Poster */}
                    <div className="relative aspect-[2/3] w-full bg-neutral-100 overflow-hidden">
                      <div className="absolute top-2 right-2 z-10">
                        <span className="bg-neutral-900/85 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs shadow-2xs">
                          {item.platform}
                        </span>
                      </div>

                      {item.posterUrl ? (
                        <img
                          src={item.posterUrl}
                          alt={item.movie}
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
                        {item.movie}
                      </h3>

                      <div className="mt-3 pt-2.5 border-t border-neutral-100 flex flex-col gap-2 text-[11px]">
                        {lastSeenDate && (
                          <div className="flex flex-col gap-0.5 text-[10px] text-neutral-500 bg-neutral-50 p-1.5 rounded-md border border-neutral-100">
                            <span className="font-medium text-neutral-700">Terlihat: {firstSeenDateStr} s/d {lastSeenDate}</span>
                            {sourceInfo?.url && (
                              <a href={sourceInfo.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 mt-0.5 w-fit">
                                <span>Kunjungi {sourceInfo.shortLabel}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-1">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[10px] ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {isActive ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                            {item.status}
                          </span>
                          <span className="font-mono font-bold text-neutral-900 text-xs">
                            {ageDays} Hari
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-between bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
                <span className="text-xs text-neutral-500 font-medium">
                  Menampilkan <span className="font-bold text-neutral-800">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold text-neutral-800">{Math.min(currentPage * ITEMS_PER_PAGE, filteredMovies.length)}</span> dari <span className="font-bold text-neutral-800">{filteredMovies.length}</span> film
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-bold px-3 py-1 bg-neutral-100 rounded-lg text-neutral-800">
                    Halaman {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50" />}>
      <HistoryContent />
    </Suspense>
  );
}
