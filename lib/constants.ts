export interface MovieList {
  id: string;
  title: string;
  source?: string;
  sourceUrl?: string;
  movies: string[];
  updatedAt: number;
}

export interface HistoryItem {
  movie: string;
  sourceName?: string;
  source?: string;
  category?: string;
  status: 'Aktif' | 'Keluar dari Daftar';
  ageDays: number;
  firstSeenDate: string;
  lastSeenDate: string;
  posterUrl?: string | null;
  platform?: string;
}

export const LIST_ORDER = [
  'top_ten',
  'in_theaters',
  'netflix_indonesia',
  'klikfilm_trending',
  'hbo_max_top10',
  'apple_tv_top10',
  'subsource_popular',
  'subdl_popular_movies',
  'subdl_most_downloaded'
];

export const SOURCE_INFO: Record<string, { label: string; shortLabel: string; url: string; badgeColor: string; description: string }> = {
  top_ten: {
    label: 'IMDb Top Movies',
    shortLabel: 'IMDb',
    url: 'https://www.imdb.com/search/title/?moviemeter=%2C10',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description: '10 Film Paling Populer di IMDb saat ini'
  },
  in_theaters: {
    label: 'Cinema 21 (Now Playing)',
    shortLabel: 'Cinema XXI',
    url: 'https://m.21cineplex.com/id/movies?tabs=now-playing',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Film yang sedang tayang di bioskop Cinema 21 / XXI'
  },
  netflix_indonesia: {
    label: 'Netflix Indonesia Top 10',
    shortLabel: 'Netflix',
    url: 'https://www.netflix.com/tudum/top10/indonesia',
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    description: '10 Film Teratas di Netflix Indonesia hari ini'
  },
  klikfilm_trending: {
    label: 'KlikFilm Trending',
    shortLabel: 'KlikFilm',
    url: 'https://klikfilm.com/v4/trending',
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
    description: 'Daftar film trending di platform KlikFilm'
  },
  
  hbo_max_top10: {
    label: 'HBO Max (10 Teratas)',
    shortLabel: 'HBO Max',
    url: 'https://www.hbomax.com/id/id',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    description: '10 Film & Serial Teratas di HBO Max Indonesia'
  },
  apple_tv_top10: {
    label: 'Apple TV+ Top 10',
    shortLabel: 'Apple TV+',
    url: 'https://tv.apple.com/id/collection/top10-movies/uts.col.ChartsMovies.tvs.sbd.4000?ctx_brand=tvs.sbd.4000&ctx_cvs=uts.tcvs.tv-plus-canvas&ctx_shelf=uts.shlf.gen.BrandChart_tvs.sbd.4000_Movie',
    badgeColor: 'bg-zinc-100 text-zinc-800 border-zinc-300',
    description: '10 Film Teratas di Apple TV+ Indonesia'
  },
  subsource_popular: {
    label: 'SubSource Popular Subtitles',
    shortLabel: 'SubSource',
    url: 'https://subsource.net/',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Subtitle film yang paling banyak dicari di SubSource'
  },
  subdl_popular_movies: {
    label: 'SubDL Popular Movies',
    shortLabel: 'SubDL Popular',
    url: 'https://subdl.com/id/trends/movies',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    description: 'Tren pencarian film teratas di SubDL'
  },
  subdl_most_downloaded: {
    label: 'SubDL Most Downloaded',
    shortLabel: 'SubDL Downloaded',
    url: 'https://subdl.com/id/latest/popular',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    description: 'Subtitle yang paling banyak diunduh di SubDL'
  }
};

export const DEFAULT_LISTS: Record<string, MovieList> = {
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
      'Spider-Man: Brand New Day (2026)',
      'Sajen Satu Suro (2026)',
      'Samakdo (2026)',
      'Ketok Mejik (2026)',
      'Kado untuk Ibu (2026)',
      'Sihir Tanah Kubur (2026)',
      'Andai Waktu Bisa Diulang Kembali (2026)',
      'Evil Dead Burn (2026)',
      'Obsession (2025)',
      'The Odyssey (IMAX 2D) (2026)',
      'Cek Khodam (2026)',
      'Petaka Gunung Welirang (2026)'
    ],
    updatedAt: 1771706900000
  },
  hbo_max_top10: {
    id: 'hbo_max_top10',
    title: 'HBO Max (10 Teratas)',
    source: 'HBO Max (10 Teratas)',
    sourceUrl: 'https://www.hbomax.com/id/id',
    movies: [
      'My Bias, My Boss (2026)',
      'Lanterns (2026)',
      'House of the Dragon (2022)',
      'Primate (2026)',
      'Undercover Chef – Korea (2026)',
      '13 Hours: The Secret Soldiers Of Benghazi (2016)',
      'Crazy Rich Asians (2018)',
      'Margaux (2022)',
      'Mortal Kombat II (2025)',
      'IT: Welcome to Derry (2025)'
    ],
    updatedAt: 1771706900000
  },
  apple_tv_top10: {
    id: 'apple_tv_top10',
    title: 'Apple TV+ Top 10 Movies',
    source: 'Apple TV+ (Top 10)',
    sourceUrl: 'https://tv.apple.com/id/collection/top10-movies/uts.col.ChartsMovies.tvs.sbd.4000?ctx_brand=tvs.sbd.4000&ctx_cvs=uts.tcvs.tv-plus-canvas&ctx_shelf=uts.shlf.gen.BrandChart_tvs.sbd.4000_Movie',
    movies: [
      'F1 The Movie (2025)',
      'Greyhound (2020)',
      'The Family Plan (2023)',
      'The Family Plan 2 (2025)',
      'The Gorge (2025)',
      'Luck (2022)',
      'Eternity (2025)',
      'Ghosted (2023)',
      'The Dink (2025)',
      'Napoleon (2023)'
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
      'Smoking Behind the Supermarket with You (2026)'
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
      'Buya Hamka Vol 1 (2023)',
      'Rumah dan Musim Hujan (2012)',
      'Bumi Manusia Extended (2019)',
      'Mayflies (2023)',
      'Cross the Line (2022)',
      'New Kung Fu Cult Master 1 (2022)',
      'Sin Extended (2019)',
      'Rembulan Tenggelam di Wajahmu Extended (2019)',
      'Berebut Jenazah (2023)',
      "Haji Backpacker - Director's Cut (2014)"
    ],
    updatedAt: 1771706900000
  },
  };
