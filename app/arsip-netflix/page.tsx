'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import { motion } from 'motion/react';
import { Calendar, ExternalLink, Film, Search, Download } from 'lucide-react';

interface ArchiveEntry {
  week: string;
  url: string;
  movies: string[];
}

export default function ArsipNetflixPage() {
  const [archives, setArchives] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('All');

  useEffect(() => {
    async function fetchArchive() {
      try {
        const docRef = doc(db, 'movie_lists', 'netflix_archive');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setArchives(data.archives || []);
        }
      } catch (err) {
        console.error("Failed to load netflix archive:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchArchive();
  }, []);

  const years = ['All', ...Array.from(new Set(archives.map(a => a.week.split('-')[0])))].sort((a, b) => b.localeCompare(a));

  const filteredArchives = archives.filter(archive => {
    const matchYear = selectedYear === 'All' || archive.week.startsWith(selectedYear);
    const matchSearch = 
      archive.week.includes(searchTerm) || 
      archive.movies.some(m => m.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchYear && matchSearch;
  });

  return (
    <div className="min-h-screen bg-neutral-50 font-sans pb-20">
      <Navbar />

      <header className="bg-white border-b border-neutral-200 pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="inline-flex items-center justify-center p-3 bg-red-100 rounded-2xl mb-6 border border-red-200">
            <Film className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900 tracking-tight mb-4">
            Arsip Historis Netflix
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl leading-relaxed">
            Menelusuri rekam jejak Top 10 film paling populer di Netflix Indonesia setiap minggunya, mulai dari tahun 2021 hingga saat ini.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Cari judul film atau tanggal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-11 pr-4 py-3.5 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none shadow-xs transition-all"
            />
          </div>
          <div className="sm:w-48 shrink-0 relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="block w-full pl-4 pr-10 py-3.5 bg-white border border-neutral-200 rounded-xl text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none shadow-xs transition-all appearance-none cursor-pointer"
            >
              {years.map(year => (
                <option key={year} value={year}>{year === 'All' ? 'Semua Tahun' : `Tahun ${year}`}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-neutral-500" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-neutral-200 border-t-red-600 mb-4"></div>
            <p className="text-neutral-500 font-medium">Memuat arsip data (2021 - Sekarang)...</p>
          </div>
        ) : filteredArchives.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-neutral-200 shadow-sm">
            <div className="mx-auto w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 mb-2">Tidak Ditemukan</h3>
            <p className="text-neutral-500 max-w-md mx-auto">
              Tidak ada data arsip yang cocok dengan pencarian "{searchTerm}"quot;{searchTerm}"{searchTerm}"quot; di tahun tersebut.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArchives.map((archive, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                key={archive.week}
                className="bg-white rounded-2xl border border-neutral-200/80 overflow-hidden shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="bg-neutral-50 border-b border-neutral-200 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-red-600" />
                    <h3 className="font-bold text-neutral-900">
                      Minggu, {archive.week}
                    </h3>
                  </div>
                  <a
                    href={archive.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-white border border-neutral-200 rounded-lg text-neutral-500 hover:text-red-600 hover:border-red-200 transition-colors"
                    title="Lihat Sumber Asli di Netflix Tudum"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div className="p-5">
                  <ul className="space-y-3">
                    {archive.movies.map((movie, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className={`shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold ${idx < 3 ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-600'}`}>
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-neutral-800 leading-snug">
                          {movie}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
