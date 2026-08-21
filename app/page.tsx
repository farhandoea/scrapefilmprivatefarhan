'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { RefreshCw, Film, LogOut, Github, ExternalLink, Table } from 'lucide-react';
import { motion } from 'motion/react';

interface MovieList {
  id: string;
  title: string;
  source?: string;
  sourceUrl?: string;
  movies: string[];
  updatedAt: number;
}

const listOrder = ['top_ten', 'in_theaters', 'netflix_indonesia', 'klikfilm_trending', 'catchplay_popular', 'hbo_max_top10', 'apple_tv_top10', 'subsource_popular', 'subdl_popular_movies', 'subdl_most_downloaded'];
const defaultSourceInfo: Record<string, { label: string; url: string }> = {
  top_ten: { label: 'IMDb Top Movies', url: 'https://www.imdb.com/search/title/?moviemeter=%2C10' },
  in_theaters: { label: 'Cinema 21 (Now Playing)', url: 'https://m.21cineplex.com/id/movies?tabs=now-playing' },
  netflix_indonesia: { label: 'Netflix Indonesia', url: 'https://www.netflix.com/tudum/top10/indonesia' },
  klikfilm_trending: { label: 'KlikFilm Trending', url: 'https://klikfilm.com/v4/trending' },
  catchplay_popular: { label: 'Catchplay+ Most Popular', url: 'https://www.catchplay.com/id/search/list?args=DEFAULT%23ALL%23MOST_POPULAR_ALLBRAND' },
  hbo_max_top10: { label: 'HBO Max (10 Teratas)', url: 'https://www.hbomax.com/id/id' },
  apple_tv_top10: { label: 'Apple TV+ Top 10', url: 'https://tv.apple.com/id/collection/top10-movies/uts.col.ChartsMovies.tvs.sbd.4000?ctx_brand=tvs.sbd.4000&ctx_cvs=uts.tcvs.tv-plus-canvas&ctx_shelf=uts.shlf.gen.BrandChart_tvs.sbd.4000_Movie' },
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
  hbo_max_top10: {
    id: 'hbo_max_top10',
    title: 'HBO Max (10 Teratas)',
    source: 'HBO Max (10 Teratas)',
    sourceUrl: 'https://www.hbomax.com/id/id',
    movies: [
      'My Bias, My Boss',
      'Lanterns',
      'House of the Dragon',
      'Primate',
      'Undercover Chef – Korea',
      '13 Hours: The Secret Soldiers Of Benghazi',
      'Crazy Rich Asians',
      'Margaux',
      'Mortal Kombat Ii',
      'IT: Welcome to Derry'
    ],
    updatedAt: 1771706900000
  },
  apple_tv_top10: {
    id: 'apple_tv_top10',
    title: 'Apple TV+ Top 10 Movies',
    source: 'Apple TV+ (Top 10)',
    sourceUrl: 'https://tv.apple.com/id/collection/top10-movies/uts.col.ChartsMovies.tvs.sbd.4000?ctx_brand=tvs.sbd.4000&ctx_cvs=uts.tcvs.tv-plus-canvas&ctx_shelf=uts.shlf.gen.BrandChart_tvs.sbd.4000_Movie',
    movies: [
      'F1 The Movie',
      'Greyhound',
      'The Family Plan',
      'The Family Plan 2',
      'The Gorge',
      'Luck',
      'Eternity',
      'Ghosted',
      'The Dink',
      'Napoleon'
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
      'The End of Oak Street (2026)',
      'Silo (2023)',
      'Ted Lasso (2020)',
      'Tires (2024)',
      'Black Clover (2017)',
      'Wait For Me To Be Successful Later (2026)',
      'Re:ZERO -Starting Life in Another World- (2016)',
      'The Invite (2026)',
      'Smoking Behind the Supermarket with You (2026)',
      'The Exiled Heavy Knight Knows How to Game the System (2026)',
      'A Shop for Killers (2024)',
      'From Overshadowed to Overpowered: Second Reincarnation of a Talentless Sage (2026)',
      'Reacher (2022)',
      'The Last House (2026)',
      'The Shards (2026)'
    ],
    updatedAt: 1771706900000
  },
  netflix_indonesia: {
    id: 'netflix_indonesia',
    title: 'Netflix Top 10 Indonesia',
    source: 'Netflix Indonesia',
    sourceUrl: 'https://www.netflix.com/tudum/top10/indonesia',
    movies: [
      'Wait for Me To Be Successful Later (2026)',
      'The Last House (2026)',
      'Na Willa (2026)',
      'Extinction (2015)',
      'The Suicide Squad (2021)',
      'Danur: The Last Chapter (2026)',
      'Last Chance To Save (2026)',
      'Suzzanna: Witchcraft (2026)',
      'Suicide Squad (2016)',
      'Edge of Tomorrow (2014)'
    ],
    updatedAt: 1771706900000
  },
  klikfilm_trending: {
    id: 'klikfilm_trending',
    title: 'KlikFilm Trending',
    source: 'KlikFilm Trending',
    sourceUrl: 'https://klikfilm.com/v4/trending',
    movies: [
      "Buya Hamka Vol 1 (2023)",
      "Rumah dan Musim Hujan (2012)",
      "Bumi Manusia Extended (2019)",
      "Mayflies (2023)",
      "Cross the Line (2022)",
      "New Kung Fu Cult Master 1 (2022)",
      "Sin Extended (2019)",
      "Rembulan Tenggelam di Wajahmu Extended (2019)",
      "Berebut Jenazah (2023)",
      "Haji Backpacker - Director's Cut (2014)",
      "Friend Zone (2019)",
      "Cek Ombak (Melulu) (2022)",
      "Fight Club (1999)",
      "Demi Si Buah Hati (2024)",
      "Bumi Manusia (2019)",
      "Di Balik Layar Dilan ITB 1997 (2024)",
      "Perfect Strangers (2022)",
      "Warkop DKI Kartun Series (2021)",
      "I (2021)",
      "Dilan 1991 Extended Version (2019)"
    ],
    updatedAt: 1771706900000
  },
  catchplay_popular: {
    id: 'catchplay_popular',
    title: 'Catchplay+ Most Popular',
    source: 'Catchplay+ Popular',
    sourceUrl: 'https://www.catchplay.com/id/search/list?args=DEFAULT%23ALL%23MOST_POPULAR_ALLBRAND',
    movies: [
      "Spider-Man: No Way Home (Extended Version)",
      "Demon Slayer: Kimetsu no Yaiba Infinity Castle I",
      "Operation Fortune: Ruse de guerre",
      "The Pirates",
      "Sound of Freedom",
      "The King's Warden",
      "Greenland 2: Migration",
      "Michael",
      "The Unrighteous",
      "The Bone Collector",
      "The Amazing Spider-Man",
      "Hellboy: The Crooked Man",
      "Memories of the Sword",
      "My Sole Desire",
      "Silent Zone",
      "Dracula: A Love Tale",
      "Pitfall",
      "The Housemaid",
      "Hi-Five",
      "Wrath of Man",
      "The Amazing Spider-Man 2",
      "The Beekeeper",
      "The Old Woman with the Knife",
      "Aquaman and the Lost Kingdom",
      "Supergirl (Premier Perdana)",
      "Spider-Man: No Way Home",
      "Spider-Man 3",
      "Eun-gyo",
      "Special Ops: Lioness",
      "Concrete Market",
      "The Wolf of Wall Street",
      "Shelter",
      "Evil Dead",
      "Lee Cronin's The Mummy",
      "The Damned",
      "The Treacherous",
      "Mortal Kombat II",
      "Spider-Man: Homecoming",
      "Once We Were Us",
      "The Super Mario Galaxy Movie",
      "Spider-Man: Far from Home",
      "Seven Snipers",
      "Salmokji: Whispering Water",
      "Hokum",
      "Harry Potter and the Sorcerer's Stone",
      "Spider-Man",
      "I Was a Stranger",
      "Passenger",
      "Interstellar",
      "Basic Instinct",
      "Insidious: Chapter 2",
      "Heretic",
      "Cleaner",
      "All the Way",
      "Spider-Man 2",
      "The Divine Fury",
      "Bloody Smart",
      "Chloe",
      "The Conjuring",
      "Lost",
      "Shame",
      "The Conjuring 2",
      "The Departed",
      "Spider-Man: Into the Spider-Verse",
      "In the Lost Lands",
      "John Wick: Chapter 4",
      "Second Sister",
      "Keeper",
      "Brave Citizen",
      "Love in the Big City",
      "Children...",
      "Utusan Iblis: Dia Yang Berada di Antara Kita",
      "Subservience",
      "Apocalypto",
      "The Nun",
      "The Reader",
      "Dark Spell",
      "Love, Lies",
      "The Ritual",
      "The Neighbors",
      "The Miniature Wife",
      "Canary Black",
      "The Superdeep",
      "M.I.A.",
      "Hidden Strike",
      "Holy Night: Demon Hunters",
      "Rebirth Island",
      "Absolution",
      "Last Summer",
      "Hope",
      "Yadang: The Snitch",
      "Arwah",
      "Pee Nak 5",
      "Harry Potter and the Deathly Hallows: Part 1",
      "Annabelle Comes Home",
      "The Conjuring: Last Rites",
      "Innocent Thing",
      "Inglourious Basterds",
      "The Agency: Central Intelligence",
      "Insidious: Chapter 3",
      "Omniscient Reader: The Prophecy",
      "Legends of the Condor Heroes: The Gallants",
      "Tarot",
      "Insidious: The Last Key",
      "Misbehavior",
      "Islanders",
      "Along with the Gods: The Two Worlds",
      "Evil Dead Rise",
      "The Closet",
      "Harry Potter and the Half-Blood Prince",
      "Harry Potter and the Chamber of Secrets",
      "Mission: Impossible - The Final Reckoning",
      "Final Destination: Bloodlines",
      "Oppenheimer",
      "Harry Potter and the Prisoner of Azkaban",
      "Harry Potter and the Deathly Hallows: Part 2",
      "Inception",
      "We Bury the Dead",
      "Tenet",
      "Harry Potter and the Goblet of Fire",
      "The Hobbit: An Unexpected Journey (Extended Edition)",
      "We Live in Time",
      "Harry Potter and the Order of the Phoenix",
      "Shaolin Soccer",
      "The Hobbit: The Desolation of Smaug (Extended Edition)",
      "Weapons",
      "Zack Snyder's Justice League",
      "Spider-Man: Across the Spider-Verse",
      "Superman",
      "Den of Thieves: Pantera",
      "Crazy Rich Asians",
      "The Dark Knight Rises",
      "The Dark Knight",
      "Dune",
      "They Will Kill You",
      "Relay",
      "Whistle",
      "The Lord of the Rings: The Fellowship of the Ring (Extended Edition)",
      "The Nun II",
      "Dune: Part Two",
      "Batman Begins",
      "Wuthering Heights",
      "The Hobbit: The Battle of the Five Armies (Extended Edition)",
      "Warfare",
      "Sonic the Hedgehog 3",
      "Scream 7",
      "Murder Report",
      "The Long Walk",
      "Meg 2: The Trench",
      "The Lord of the Rings: The Return of the King (Extended Edition)",
      "Justice League",
      "A Minecraft Movie",
      "The Conjuring: The Devil Made Me Do It",
      "Afterburn",
      "The Strangers: Chapter 2",
      "It Ends With Us",
      "Wildcat",
      "Me Before You",
      "The Angry Birds Movie",
      "Black Phone 2",
      "A Man Called Otto",
      "The Lord of the Rings: The Two Towers (Extended Edition)",
      "Top Gun: Maverick",
      "28 Years Later",
      "Karate Kid: Legends",
      "That Time I Got Reincarnated as a Slime the Movie: Scarlet Bond",
      "The Exorcist: The Version You've Never Seen",
      "Fantastic Beasts and Where to Find Them",
      "Fantastic Beasts: The Secrets of Dumbledore",
      "Transformers One",
      "The Batman",
      "Transformers: Rise of the Beasts",
      "Dunkirk",
      "One Battle After Another",
      "Joker",
      "Sniper: No Nation",
      "Primate",
      "Gladiator II",
      "Sisu",
      "Anyone But You",
      "Sonic the Hedgehog 2",
      "mother!",
      "Transformers: Dark Of The Moon",
      "It: Chapter Two",
      "The Super Mario Bros. Movie",
      "Insidious: The Red Door",
      "PAW Patrol: The Mighty Movie",
      "The SpongeBob Movie: Search for SquarePants",
      "Rings",
      "Novocaine",
      "Captain Phillips",
      "Concubine",
      "Borders of Love",
      "Love at the End of the World",
      "Girls to Buy",
      "In the Room",
      "Moebius",
      "Come Undone",
      "My Sex Doll Bodyguard",
      "Nineteen: Shh! No Imagining!"
    ],
    updatedAt: 1771706900000
  }
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<Record<string, MovieList>>({});
  const [historyData, setHistoryData] = useState<Record<string, any>>({});
  const [selectedListId, setSelectedListId] = useState<string>(listOrder[0]);
  const [historySourceFilter, setHistorySourceFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'now' | 'history'>('now');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<string>('desc');
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
    const unsubscribeLists = onSnapshot(collection(db, 'movie_lists'), (snapshot) => {
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

    const unsubscribeHistory = onSnapshot(collection(db, 'movie_history'), (snapshot) => {
      if (!isMounted) return;
      const fetchedHistory: Record<string, any> = {};
      snapshot.docs.forEach(doc => {
        fetchedHistory[doc.id] = doc.data();
      });
      setHistoryData(fetchedHistory);
    }, (error) => {
      console.error("Error fetching history:", error);
    });

    // Fallback timeout so it never hangs indefinitely
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 4000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsubscribeLists();
      unsubscribeHistory();
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
        {/* Hero Section / Penjelasan Landing Page */}
        <div className="mb-10 flex flex-col items-start text-left">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-4 flex items-center gap-3">
            Radar Tren Film (Trend Tracker)
            <span className="text-sm inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold align-middle">v1.0</span>
          </h1>
          <p className="text-neutral-600 leading-relaxed max-w-3xl text-base sm:text-lg mb-6">
            Website ini dibuat untuk melacak, memantau, dan mendokumentasikan tren film secara otomatis dari berbagai platform populer (Catchplay+, KlikFilm, Netflix, HBO Max, Apple TV+, IMDb, Cinema 21, SubDL, SubSource). Dengan tracker ini, kita bisa memetakan film apa yang sedang naik daun dan berapa lama ketahanannya di puncak popularitas.
          </p>
          
          <div className="bg-neutral-50 rounded-2xl border border-neutral-200 p-5 sm:p-6 text-sm sm:text-base text-neutral-600 w-full flex flex-col gap-4">
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Bagaimana cara kerjanya dan dari mana data didapatkan?
              </h3>
              <p className="leading-relaxed">
                Data di halaman ini diambil secara otomatis setiap 2 jam langsung dari situs resminya menggunakan <strong>GitHub Actions</strong>. Bot kami akan mencatat nama film tersebut, menghitung Umur Hari aktifnya secara kumulatif tampil di web tersebut, dan menyimpannya secara <em>real-time</em> ke dalam <strong>Firebase Database</strong> (untuk web) dan <strong>Google Sheets</strong> (untuk arsip).
              </p>
            </div>
            
            <div className="border-t border-neutral-200 pt-4 mt-2">
              <h3 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Panduan Status & Penggunaan
              </h3>
              <ul className="flex flex-col gap-3">
                <li className="flex items-start gap-3">
                  <span className="shrink-0 mt-0.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aktif</span>
                  <span className="leading-relaxed text-sm">
                    Film sedang berada di jajaran tren (Top 10) saat ini. Selama berstatus Aktif, sistem akan terus menambah &quot;Umur Hari&quot; setiap berganti hari untuk melacak seberapa lama film tersebut bertahan di puncak popularitas.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 mt-0.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-200 text-neutral-800">Keluar dari Daftar</span>
                  <span className="leading-relaxed text-sm">
                    Film sudah tergeser dari jajaran tren hari ini. Penghitungan umurnya berapa hari tampil di web tersebut dihentikan sementara .
                  </span>
                </li>
                <li className="flex items-start gap-3 mt-1">
                  <span className="shrink-0 mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-blue-800"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span>
                  <span className="leading-relaxed text-sm font-medium text-neutral-700">
                    Silakan klik tombol &quot;Open Spreadsheet&quot; di bawah untuk melihat semua arsip data secara mentah. Catatan: Tombol &quot;Refresh Data&quot; saat ini belum bisa digunakan untuk semua pengguna (hanya khusus untuk Admin).
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium text-neutral-900 mb-1">Data Synchronization</h2>
            <p className="text-neutral-500 text-sm">
              Trigger the GitHub Actions scraper workflow to refresh the data below.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <a
                href="https://docs.google.com/spreadsheets/d/17Of4jJGjERjjSIBNT9kk3K6XrRQDULnwIDBNfOjmpMk/edit"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                <Table className="w-4 h-4" />
                Open Spreadsheet
              </a>
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

        <div className="flex items-center gap-6 mb-6 border-b border-neutral-200">
          <button 
            onClick={() => setViewMode('now')} 
            className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${viewMode === 'now' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
          >
            NOW (Scrape Terakhir)
          </button>
          <button 
            onClick={() => setViewMode('history')} 
            className={`pb-3 px-2 text-sm font-medium border-b-2 transition-colors ${viewMode === 'history' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
          >
            Data Historis (Semua)
          </button>
        </div>

        <div className="pb-8">
          {(() => {
            if (viewMode === 'now') {
              const listId = selectedListId;
              const listData = lists[listId] || defaultLists[listId];
              const sourceLabel = listData?.source || defaultSourceInfo[listId]?.label || 'Web Scraper';
              const sourceUrl = listData?.sourceUrl || defaultSourceInfo[listId]?.url;

              return (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm">
                    <label htmlFor="list-selector" className="text-sm font-medium text-neutral-600 shrink-0">
                      Select Category:
                    </label>
                    <div className="relative w-full sm:w-auto flex-1 max-w-sm">
                      <select
                        id="list-selector"
                        value={selectedListId}
                        onChange={(e) => setSelectedListId(e.target.value)}
                        className="w-full appearance-none bg-neutral-50 border border-neutral-200 text-neutral-900 font-medium text-sm rounded-xl focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 block pl-4 pr-10 py-2.5 transition-colors cursor-pointer"
                      >
                        {listOrder.map((id) => (
                          <option key={id} value={id}>
                            {defaultSourceInfo[id]?.label || id}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  <motion.div 
                    key={`now-${listId}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm flex flex-col w-full"
                  >
                    <div className="bg-neutral-100 p-5 md:p-6 border-b border-neutral-200">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-neutral-900 leading-snug">{listData?.title || (listId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))}</h3>
                        {sourceUrl ? (
                          <a
                            href={sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-[12px] font-medium px-3.5 py-1.5 rounded-full bg-neutral-200/90 hover:bg-neutral-300 text-neutral-800 border border-neutral-300/60 inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap self-start"
                            title={`Visit source: ${sourceUrl}`}
                          >
                            <span>{sourceLabel}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                          </a>
                        ) : (
                          <span className="shrink-0 text-[12px] font-medium px-3.5 py-1.5 rounded-full bg-neutral-200/90 text-neutral-700 border border-neutral-300/60 whitespace-nowrap self-start">
                            {sourceLabel}
                          </span>
                        )}
                      </div>
                      {listData?.updatedAt && (
                        <p className="text-sm text-neutral-500">
                          Last updated: {new Date(listData.updatedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    <div className="p-5 md:p-6 flex-1">
                      {!listData ? (
                        <div className="h-full flex items-center justify-center text-center text-neutral-400 py-12 text-sm">
                          <div>No data available.<br/>Click refresh to scrape.</div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                          {listData.movies.map((movie, idx) => {
                            const listHistory = historyData[listId] || {};
                            const historyEntry = Object.values(listHistory).find((m: any) => m.movie === movie) as any;
                            const posterUrl = historyEntry?.posterUrl;
                            const status = historyEntry?.status || 'Aktif';
                            const ageDays = historyEntry?.ageDays || 1;
                            
                            return (
                              <div key={idx} className="flex flex-col bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                                <div className="relative aspect-[2/3] w-full bg-neutral-200 overflow-hidden">
                                  <div className="absolute top-2 left-2 z-10 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white font-bold text-xs backdrop-blur-sm">
                                    {idx + 1}
                                  </div>
                                  {posterUrl ? (
                                    <img src={posterUrl} alt={movie} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
                                      <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                      <span className="text-xs font-medium">No Poster</span>
                                    </div>
                                  )}
                                </div>
                                <div className="p-4 flex flex-col flex-1">
                                  <h4 className="font-semibold text-neutral-900 line-clamp-2 leading-tight mb-auto">{movie}</h4>
                                  <div className="mt-4 flex items-center justify-between text-xs border-t border-neutral-100 pt-3">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>
                                      {status}
                                    </span>
                                    <span className="font-mono text-neutral-700 font-bold">{ageDays} Hari</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              );
            }

            // View Mode == 'history'
            let moviesArray: any[] = [];
            
            if (historySourceFilter === 'All') {
              listOrder.forEach(id => {
                const listHistory = historyData[id] || {};
                const sourceName = defaultSourceInfo[id]?.label || id;
                Object.values(listHistory).forEach((m: any) => {
                  moviesArray.push({ ...m, sourceName });
                });
              });
            } else {
              const listHistory = historyData[historySourceFilter] || {};
              const sourceName = defaultSourceInfo[historySourceFilter]?.label || historySourceFilter;
              Object.values(listHistory).forEach((m: any) => {
                moviesArray.push({ ...m, sourceName });
              });
            }
            
            // Filter
            let filteredMovies = moviesArray.filter((m: any) => {
              if (filterStatus !== 'All' && m.status !== filterStatus) return false;
              return true;
            });
            
            // Sort
            filteredMovies.sort((a: any, b: any) => {
              const ageA = a.ageDays || 1;
              const ageB = b.ageDays || 1;
              if (sortOrder === 'desc') return ageB - ageA;
              return ageA - ageB;
            });

            return (
              <motion.div 
                key="history-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm flex flex-col w-full"
              >
                <div className="bg-neutral-100 p-5 md:p-6 border-b border-neutral-200">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-neutral-900 leading-snug">
                      Data Historis Global
                    </h3>
                  </div>
                  <p className="text-sm text-neutral-500 mb-6">Melihat histori dari {historySourceFilter === 'All' ? 'semua sumber' : defaultSourceInfo[historySourceFilter]?.label || historySourceFilter}.</p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label htmlFor="source-filter" className="text-xs font-medium text-neutral-600">Filter Sumber</label>
                      <select
                        id="source-filter"
                        value={historySourceFilter}
                        onChange={(e) => setHistorySourceFilter(e.target.value)}
                        className="w-full appearance-none bg-white border border-neutral-200 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 block px-3 py-2 transition-colors cursor-pointer"
                      >
                        <option value="All">Semua Sumber</option>
                        {listOrder.map(id => (
                          <option key={id} value={id}>{defaultSourceInfo[id]?.label || id}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 flex-1">
                      <label htmlFor="status-filter" className="text-xs font-medium text-neutral-600">Filter Status</label>
                      <select
                        id="status-filter"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full appearance-none bg-white border border-neutral-200 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 block px-3 py-2 transition-colors cursor-pointer"
                      >
                        <option value="All">Semua Status</option>
                        <option value="Aktif">Aktif</option>
                        <option value="Keluar dari Daftar">Keluar dari Daftar</option>
                      </select>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 flex-1">
                      <label htmlFor="sort-order" className="text-xs font-medium text-neutral-600">Urutkan (Umur Hari)</label>
                      <select
                        id="sort-order"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="w-full appearance-none bg-white border border-neutral-200 text-neutral-900 text-sm rounded-lg focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 block px-3 py-2 transition-colors cursor-pointer"
                      >
                        <option value="desc">Tertinggi ke Terendah</option>
                        <option value="asc">Terendah ke Tertinggi</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 md:p-6 bg-neutral-50/50">
                  {filteredMovies.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center text-neutral-400 py-12 text-sm bg-white rounded-xl border border-neutral-200">
                      <div>Data historis kosong atau tidak ditemukan.</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      {filteredMovies.map((m: any, idx: number) => (
                        <div key={idx} className="flex flex-col bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                          <div className="relative aspect-[2/3] w-full bg-neutral-200 overflow-hidden">
                            <div className="absolute top-2 right-2 z-10">
                               <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm uppercase tracking-wider">{m.sourceName}</span>
                            </div>
                            {m.posterUrl ? (
                              <img src={m.posterUrl} alt={m.movie} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400">
                                <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <span className="text-xs font-medium">No Poster</span>
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex flex-col flex-1">
                            <h4 className="font-semibold text-neutral-900 line-clamp-2 leading-tight mb-auto">{m.movie}</h4>
                            <div className="mt-4 flex flex-col gap-2 text-[11px] text-neutral-500 border-t border-neutral-100 pt-3">
                              <div className="flex justify-between items-center">
                                <span>First: {m.firstSeenDate}</span>
                                <span>Last: {m.lastSeenDate}</span>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${m.status === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>
                                  {m.status}
                                </span>
                                <span className="font-mono text-neutral-700 font-bold">{m.ageDays || 1} Hari</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })()}
        </div>
      </main>
    </div>
  );
}
