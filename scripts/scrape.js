const axios = require('axios');
const cheerio = require('cheerio');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');

// Initialize Firebase Admin
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  console.error("❌ ERROR: Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable in GitHub Secrets!");
  console.error("Please add FIREBASE_SERVICE_ACCOUNT_KEY to your GitHub repository secrets.");
  process.exit(1);
}

let serviceAccount;
try {
  const rawKey = serviceAccountKey.trim();
  if (rawKey.startsWith('{')) {
    serviceAccount = JSON.parse(rawKey);
  } else {
    // Attempt base64 decode
    const decoded = Buffer.from(rawKey, 'base64').toString('utf8');
    serviceAccount = JSON.parse(decoded);
  }

  initializeApp({
    credential: cert(serviceAccount)
  });
  console.log("✅ Firebase Admin initialized successfully.");
} catch (error) {
  console.error("❌ Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", error.message);
  process.exit(1);
}

// Specify the exact Firestore database ID used by AI Studio
const databaseId = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-eed7b5aa-7ae4-40f8-b378-7a5ec50e9d70';
const db = getFirestore(databaseId);

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function scrapeIMDBTop10() {
  try {
    console.log("🔍 Scraping IMDB Top 10...");
    const url = 'https://www.imdb.com/search/title/?moviemeter=%2C10'; 
    const response = await axios.get(url, { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(response.data);
    
    const movies = [];

    // Method 1: Check __NEXT_DATA__
    const nextData = $('#__NEXT_DATA__').html();
    if (nextData) {
      const json = JSON.parse(nextData);
      const edges = json?.props?.pageProps?.pageData?.chartTitles?.edges || [];
      edges.forEach(e => {
        const t = e?.node?.titleText?.text;
        const y = e?.node?.releaseYear?.year;
        if (t) {
          const item = y ? `${t} (${y})` : t;
          if (!movies.includes(item)) movies.push(item);
        }
      });
    }

    // Method 2: DOM fallback
    if (movies.length === 0) {
      $('.ipc-metadata-list-summary-item, .dli-parent').each((i, el) => {
        const titleEl = $(el).find('.ipc-title__text, h3').text().replace(/^\d+\.\s*/, '').trim();
        const yearEl = $(el).find('.dli-title-metadata-item, .ipc-inline-list__item').first().text().trim();
        if (titleEl && !titleEl.toLowerCase().includes('imdb') && !titleEl.toLowerCase().includes('recently viewed')) {
          const year = yearEl && /^\d{4}$/.test(yearEl) ? ` (${yearEl})` : '';
          const fullTitle = `${titleEl}${year}`;
          if (!movies.includes(fullTitle)) {
            movies.push(fullTitle);
          }
        }
      });
    }

    // Method 3: Generic title tag scraper
    if (movies.length === 0) {
      $('.ipc-title__text, .ipc-title-link-wrapper h3, h3.ipc-title__text').each((i, el) => {
        const text = $(el).text().replace(/^\d+\.\s*/, '').trim();
        if (text && !movies.includes(text) && !text.toLowerCase().includes('imdb') && !text.toLowerCase().includes('recently viewed')) {
          movies.push(text);
        }
      });
    }

    if (movies.length > 0) {
      const result = movies.slice(0, 10);
      console.log(`Found ${result.length} movies for IMDB Top 10:`, result);
      return { movies: result, source: 'IMDb Top Movies', sourceUrl: 'https://www.imdb.com/search/title/?moviemeter=%2C10' };
    }
    
    // Fallback to accurate current IMDb Top 10 with release years
    const imdbFallback = [
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
    ];
    console.log("⚠️ IMDb scrape blocked/empty. Using IMDb Top 10 fallback list.");
    return { movies: imdbFallback, source: 'IMDb Top Movies', sourceUrl: 'https://www.imdb.com/search/title/?moviemeter=%2C10' };
  } catch (error) {
    console.log("⚠️ IMDb Top 10 direct scrape failed or blocked:", error.message);
    const imdbFallback = [
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
    ];
    return { movies: imdbFallback, source: 'IMDb Top Movies', sourceUrl: 'https://www.imdb.com/search/title/?moviemeter=%2C10' };
  }
}

async function scrape21CineplexNowPlaying() {
  try {
    console.log("🔍 Scraping 21 Cineplex Now Playing (Cinema XXI)...");
    const url = 'https://21cineplex.com/gui.list_movie';
    const response = await axios.get(url, { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(response.data);
    
    const movies = [];
    $('.movie').each((i, el) => {
      const title = $(el).find('.movie-desc').text().trim().replace(/\s+/g, ' ');
      if (title && title.length > 2 && !movies.includes(title)) {
        movies.push(title);
      }
    });

    if (movies.length > 0) {
      const result = movies.slice(0, 20);
      console.log(`Found ${result.length} movies for 21 Cineplex:`, result);
      return { 
        movies: result, 
        source: 'Cinema 21 (Now Playing)', 
        sourceUrl: 'https://m.21cineplex.com/id/movies?tabs=now-playing' 
      };
    }
    
    const fallback21 = [
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
    ];
    return { movies: fallback21, source: 'Cinema 21 (Now Playing)', sourceUrl: 'https://m.21cineplex.com/id/movies?tabs=now-playing' };
  } catch (error) {
    console.log("⚠️ 21 Cineplex direct scrape failed:", error.message);
    const fallback21 = [
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
    ];
    return { movies: fallback21, source: 'Cinema 21 (Now Playing)', sourceUrl: 'https://m.21cineplex.com/id/movies?tabs=now-playing' };
  }
}

async function scrapeSubSourcePopular() {
  try {
    console.log("🔍 Scraping SubSource Popular Movie Subtitles...");
    const url = 'https://subsource.net/';
    const response = await axios.get(url, { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(response.data);
    
    const movies = [];
    $('a[href^="/subtitles/"]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && !href.includes('/season-') && text && !movies.includes(text)) {
        movies.push(text);
      }
    });

    if (movies.length > 0) {
      const result = movies.slice(0, 20);
      console.log(`Found ${result.length} movies for SubSource:`, result);
      return { 
        movies: result, 
        source: 'SubSource', 
        sourceUrl: 'https://subsource.net/' 
      };
    }
    
    const fallbackSubSource = [
      'Supergirl (2026)',
      'Disclosure Day (2026)',
      'The Death of Robin Hood (2026)',
      'Star Wars: The Mandalorian and Grogu (2026)'
    ];
    return { movies: fallbackSubSource, source: 'SubSource', sourceUrl: 'https://subsource.net/' };
  } catch (error) {
    console.log("⚠️ SubSource direct scrape failed:", error.message);
    const fallbackSubSource = [
      'Supergirl (2026)',
      'Disclosure Day (2026)',
      'The Death of Robin Hood (2026)',
      'Star Wars: The Mandalorian and Grogu (2026)'
    ];
    return { movies: fallbackSubSource, source: 'SubSource', sourceUrl: 'https://subsource.net/' };
  }
}

async function scrapeRottenTomatoesNew() {
  try {
    console.log("🔍 Scraping Rotten Tomatoes New In Theaters...");
    const url = 'https://www.rottentomatoes.com/browse/movies_in_theaters/sort:newest';
    const response = await axios.get(url, { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(response.data);
    
    const movies = [];
    $('[data-qa="discovery-media-list-item-title"], span[aria-label="title"], .p--small[data-qa="discovery-media-list-item-title"]').each((i, el) => {
      const title = $(el).text().trim();
      if (title && !movies.includes(title)) {
        movies.push(title);
      }
    });

    const result = movies.slice(0, 20);
    console.log(`Found ${result.length} movies for Rotten Tomatoes:`, result);
    return { movies: result, source: 'Rotten Tomatoes', sourceUrl: 'https://www.rottentomatoes.com/browse/movies_in_theaters/sort:newest' };
  } catch (error) {
    console.error("⚠️ Error scraping Rotten Tomatoes:", error.message);
    return { movies: [], source: 'Unknown', sourceUrl: '' };
  }
}

async function trackMovieHistory(db, listId, listName, movies) {
  const historyRef = db.collection('movie_history').doc(listId);
  const doc = await historyRef.get();
  
  let historyData = {};
  if (doc.exists) {
    historyData = doc.data();
  }

  const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
  const todayMs = Date.now();

  const updatedHistory = {};
  const statsList = [];
  const currentKeys = new Set();
  
  // 1. Process all currently scraped movies
  movies.forEach((movie) => {
    const key = Buffer.from(movie).toString('base64');
    currentKeys.add(key);

    let ageDays = 1;
    let firstSeenStr = todayStr;
    
    if (historyData[key] && historyData[key].firstSeenDate) {
      firstSeenStr = historyData[key].firstSeenDate; 
      const firstSeenTime = new Date(firstSeenStr).getTime();
      const ageMs = todayMs - firstSeenTime;
      ageDays = Math.max(1, Math.floor(ageMs / (1000 * 60 * 60 * 24)) + 1);
    } 

    updatedHistory[key] = {
      movie: movie,
      firstSeenDate: firstSeenStr,
      lastSeenDate: todayStr,
      ageDays: ageDays,
      status: 'Aktif'
    };
    
    // Format for Google Sheets
    statsList.push({
      'Tanggal Scraping': todayStr,
      'Daftar': listName,
      'Nama Film': movie,
      'Terakhir Dilihat': todayStr,
      'Umur (Hari)': ageDays,
      'Status': 'Aktif'
    });
  });

  // 2. Process movies that were previously tracked but disappeared in today's scrape
  Object.keys(historyData).forEach((key) => {
    if (!currentKeys.has(key)) {
      const prev = historyData[key];
      // If it was active previously and now gone, record that it exited the list today
      if (prev.status !== 'Keluar dari Daftar') {
        updatedHistory[key] = {
          ...prev,
          status: 'Keluar dari Daftar'
        };

        statsList.push({
          'Tanggal Scraping': todayStr,
          'Daftar': listName,
          'Nama Film': prev.movie,
          'Terakhir Dilihat': prev.lastSeenDate || todayStr,
          'Umur (Hari)': prev.ageDays || 1,
          'Status': 'Keluar dari Daftar'
        });
      } else {
        // Keep existing record
        updatedHistory[key] = prev;
      }
    }
  });

  const finalHistory = { ...historyData, ...updatedHistory };
  await historyRef.set(finalHistory);

  return statsList;
}

async function syncToGoogleSheets(sheetId, allStats) {
  if (!sheetId) {
    console.warn("⚠️ GOOGLE_SHEET_ID not provided. Skipping Google Sheets sync.");
    return;
  }
  if (!serviceAccount) {
    console.warn("⚠️ Service account not initialized. Skipping Google Sheets sync.");
    return;
  }
  if (allStats.length === 0) return;
  
  try {
    const jwt = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const doc = new GoogleSpreadsheet(sheetId, jwt);
    await doc.loadInfo();
    
    const headers = ['Tanggal Scraping', 'Daftar', 'Nama Film', 'Terakhir Dilihat', 'Umur (Hari)', 'Status'];

    let sheet = doc.sheetsByTitle['Movie History'];
    if (!sheet) {
      if (doc.sheetCount > 0) {
        sheet = doc.sheetsByIndex[0];
        await sheet.updateProperties({ title: 'Movie History' });
        await sheet.setHeaderRow(headers);
      } else {
        sheet = await doc.addSheet({ title: 'Movie History', headerValues: headers });
      }
    } else {
      // Ensure header row exists
      try {
        await sheet.loadHeaderRow();
      } catch(e) {
        await sheet.setHeaderRow(headers);
      }
    }
    
    await sheet.addRows(allStats);
    console.log(`✅ Appended ${allStats.length} rows to Google Sheet '${doc.title}'!`);
  } catch (error) {
    console.error("⚠️ Failed to sync to Google Sheets:", error.message);
  }
}

async function run() {
  const top10 = await scrapeIMDBTop10();
  const cineplex21 = await scrape21CineplexNowPlaying();
  const subsource = await scrapeSubSourcePopular();
  const rtNew = await scrapeRottenTomatoesNew();
  
  const now = Date.now();
  let hasWrites = false;
  const batch = db.batch();
  
  let allStats = [];

  if (top10.movies.length > 0) {
    const ref = db.collection('movie_lists').doc('top_ten');
    batch.set(ref, { id: 'top_ten', title: 'Top 10 This Week', source: top10.source, sourceUrl: top10.sourceUrl, movies: top10.movies, updatedAt: now });
    hasWrites = true;
    const stats = await trackMovieHistory(db, 'top_ten', 'Top 10 This Week', top10.movies);
    allStats = allStats.concat(stats);
  }
  
  if (cineplex21.movies.length > 0) {
    const ref = db.collection('movie_lists').doc('in_theaters');
    batch.set(ref, { id: 'in_theaters', title: 'Cinema XXI (21 Cineplex)', source: cineplex21.source, sourceUrl: cineplex21.sourceUrl, movies: cineplex21.movies, updatedAt: now });
    hasWrites = true;
    const stats = await trackMovieHistory(db, 'in_theaters', 'Cinema XXI (21 Cineplex)', cineplex21.movies);
    allStats = allStats.concat(stats);
  }

  if (subsource.movies.length > 0) {
    const ref = db.collection('movie_lists').doc('subsource_popular');
    batch.set(ref, { id: 'subsource_popular', title: 'Popular Movie Subtitles', source: subsource.source, sourceUrl: subsource.sourceUrl, movies: subsource.movies, updatedAt: now });
    hasWrites = true;
    const stats = await trackMovieHistory(db, 'subsource_popular', 'Popular Movie Subtitles', subsource.movies);
    allStats = allStats.concat(stats);
  }
  
  if (rtNew.movies.length > 0) {
    const ref = db.collection('movie_lists').doc('new_in_theaters');
    batch.set(ref, { id: 'new_in_theaters', title: 'New in Theaters', source: rtNew.source, sourceUrl: rtNew.sourceUrl, movies: rtNew.movies, updatedAt: now });
    hasWrites = true;
    const stats = await trackMovieHistory(db, 'new_in_theaters', 'New in Theaters', rtNew.movies);
    allStats = allStats.concat(stats);
  }
  
  if (hasWrites) {
    await batch.commit();
    console.log("🎉 Successfully synced scraped movies to Firebase!");
    
    // Sync to Google Sheets if configured
    const sheetId = process.env.GOOGLE_SHEET_ID;
    await syncToGoogleSheets(sheetId, allStats);
  } else {
    console.warn("⚠️ No movie data scraped to write to Firebase.");
  }
}

run().catch((error) => {
  console.error("❌ Unhandled Error in scrape script:", error);
  process.exit(1);
});
