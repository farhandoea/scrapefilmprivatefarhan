'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { LIST_ORDER, SOURCE_INFO } from '@/lib/constants';
import { Flame, History, Table, Film, ArrowRight, ShieldCheck, Clock, Layers, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 text-blue-800 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Movie Trend Intelligence Tracker
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-neutral-900 tracking-tight leading-tight mb-4">
              Radar Tren Film <br className="hidden sm:inline" />
              <span className="text-neutral-500 font-normal">Lintas 10 Platform Populer</span>
            </h1>
            <p className="text-base sm:text-lg text-neutral-600 leading-relaxed mb-6">
              Sistem otomatisasi untuk memantau, mendokumentasikan, dan menganalisis dinamika popularitas film dari berbagai platform streaming, bioskop, dan komunitas subtitle secara <em>real-time</em>.
            </p>
          </div>

          {/* 2 Main Route Entry Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Card 1: /Now/ */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-orange-500/20 transition-all"></div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-5">
                  <Flame className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Rute Live Data</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-1 mb-3">
                  Now
                </h2>
                <p className="text-neutral-600 text-sm leading-relaxed mb-6">
                  Menampilkan jajaran film peringkat 1-10 yang sedang aktif dan trending hari ini di masing-masing dari 10 platform.
                </p>
              </div>

              <Link
                href="/now"
                className="inline-flex items-center justify-between w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm px-5 py-3.5 rounded-2xl transition-all shadow-xs"
              >
                <span>Buka Now (Tren Terkini)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Card 2: /DATAHISTORISSEMUA/ */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all"></div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
                  <History className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Rute Arsip & Analitik</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-1 mb-3">
                  Data Historis Semua
                </h2>
                <p className="text-neutral-600 text-sm leading-relaxed mb-6">
                  Melihat seluruh riwayat film, durasi ketahanan (Umur Hari), tanggal pertama/terakhir muncul, dan status keluar dari daftar.
                </p>
              </div>

              <Link
                href="/data-historis-semua"
                className="inline-flex items-center justify-between w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm px-5 py-3.5 rounded-2xl transition-all shadow-xs"
              >
                <span>Buka Data Historis Semua</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* 10 Platforms Category Grid */}
        <section className="mb-12">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-neutral-700" />
                10 Kategori Platform Terdaftar
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Pilih langsung platform untuk melihat daftar film aktif (/Now) atau riwayat historisnya.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {LIST_ORDER.map((id) => {
              const info = SOURCE_INFO[id];
              return (
                <div
                  key={id}
                  className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-2xs hover:border-neutral-400 hover:shadow-xs transition-all flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${info.badgeColor}`}>
                        {info.shortLabel}
                      </span>
                      <Film className="w-4 h-4 text-neutral-400" />
                    </div>
                    <h4 className="font-bold text-neutral-900 text-sm line-clamp-1">{info.label}</h4>
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{info.description}</p>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex flex-col gap-1.5 text-xs">
                    <Link
                      href={`/now?category=${id}`}
                      className="font-semibold text-orange-600 hover:text-orange-700 flex items-center justify-between"
                    >
                      <span>Lihat Live Now</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <Link
                      href={`/data-historis-semua?source=${id}`}
                      className="font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-between"
                    >
                      <span>Lihat Historis</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Documentation & System Guide */}
        <section className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
          <h3 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Arsitektur & Cara Kerja Sistem
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-neutral-600">
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80">
              <div className="w-8 h-8 rounded-lg bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-xs mb-3">
                1
              </div>
              <h4 className="font-bold text-neutral-900 mb-1.5">Otomatisasi Scraper</h4>
              <p className="text-xs sm:text-sm leading-relaxed">
                GitHub Actions menjalankan bot pemindai setiap 2 jam untuk mengekstrak data Top 10 film langsung dari situs resmi Catchplay+, KlikFilm, Netflix, HBO Max, Apple TV+, IMDb, XXI, SubDL, dan SubSource.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80">
              <div className="w-8 h-8 rounded-lg bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-xs mb-3">
                2
              </div>
              <h4 className="font-bold text-neutral-900 mb-1.5">Pelacakan Umur Hari</h4>
              <p className="text-xs sm:text-sm leading-relaxed">
                Setiap film yang masih bertengger di jajaran tren akan bertambah umur harinya secara otomatis. Begitu film tergeser, statusnya berubah menjadi <em>Keluar dari Daftar</em> dan durasinya diabadikan di arsip.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80">
              <div className="w-8 h-8 rounded-lg bg-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-xs mb-3">
                3
              </div>
              <h4 className="font-bold text-neutral-900 mb-1.5">Sinkronisasi Ganda</h4>
              <p className="text-xs sm:text-sm leading-relaxed">
                Data disimpan ke dua tempat sekaligus: <strong>Firebase Cloud Firestore</strong> untuk antarmuka web yang interaktif dan cepat, serta <strong>Google Spreadsheet</strong> untuk arsip data mentah.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-neutral-800" />
            <span className="font-bold text-neutral-800">Radar Film Trend Tracker</span>
            <span>&copy; 2026</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/now" className="hover:text-neutral-900 font-medium">Now</Link>
            <Link href="/data-historis-semua" className="hover:text-neutral-900 font-medium">Data Historis Semua</Link>
            <a
              href="https://docs.google.com/spreadsheets/d/17Of4jJGjERjjSIBNT9kk3K6XrRQDULnwIDBNfOjmpMk/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Google Sheet Arsip</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
