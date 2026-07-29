const axios = require('axios');
const cheerio = require('cheerio');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  console.error("❌ ERROR: Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable in GitHub Secrets!");
  console.error("Please add FIREBASE_SERVICE_ACCOUNT_KEY to your GitHub repository secrets.");
  process.exit(1);
}

try {
  let serviceAccount;
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
    const url = 'https://www.imdb.com/chart/moviemeter/'; 
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
        if (t && !movies.includes(t)) movies.push(t);
      });
    }

    // Method 2: DOM fallback
    if (movies.length === 0) {
      $('.ipc-title__text, .ipc-title-link-wrapper h3').each((i, el) => {
        const text = $(el).text().replace(/^\d+\.\s*/, '').trim();
        if (text && !movies.includes(text) && !text.toLowerCase().includes('imdb') && !text.toLowerCase().includes('recently viewed')) {
          movies.push(text);
        }
      });
    }

    if (movies.length > 0) {
      const result = movies.slice(0, 10);
      console.log(`Found ${result.length} movies for IMDB Top 10:`, result);
      return result;
    }
  } catch (error) {
    console.log("⚠️ IMDb Top 10 direct scrape failed or blocked. Using iTunes Top Movies fallback...");
  }

  // Backup source for Top 10 movies: iTunes Official Top Movies API
  try {
    console.log("🔄 Fetching iTunes Top 10 Movies fallback...");
    const res = await axios.get('https://itunes.apple.com/us/rss/topmovies/limit=10/json', { timeout: 8000 });
    const entries = res.data?.feed?.entry || [];
    const movies = entries.map(e => e['im:name']?.label).filter(Boolean);
    console.log(`Found ${movies.length} movies from iTunes Top Movies:`, movies);
    return movies.slice(0, 10);
  } catch (e) {
    console.error("❌ Fallback top 10 fetch failed:", e.message);
    return [];
  }
}

async function scrapeIMDBInTheaters() {
  try {
    console.log("🔍 Scraping IMDB In Theaters...");
    const url = 'https://www.imdb.com/showtimes/';
    const response = await axios.get(url, { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(response.data);
    
    const movies = [];
    $('.ipc-title__text, .st_title a, .ipc-title-link-wrapper h3').each((i, el) => {
      const title = $(el).text().trim().replace(/^\d+\.\s*/, '');
      if (title && !movies.includes(title) && !title.toLowerCase().includes('imdb') && title.length > 1) {
        movies.push(title);
      }
    });

    if (movies.length > 0) {
      const result = movies.slice(0, 20);
      console.log(`Found ${result.length} movies for IMDB In Theaters:`, result);
      return result;
    }
  } catch (error) {
    console.log("⚠️ IMDb In Theaters direct scrape failed or blocked.");
  }

  // Backup source for In Theaters: Rotten Tomatoes Movies In Theaters
  try {
    console.log("🔄 Fetching Rotten Tomatoes In Theaters fallback...");
    const res = await axios.get('https://www.rottentomatoes.com/browse/movies_in_theaters/sort:popular', { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(res.data);
    const movies = [];
    $('[data-qa="discovery-media-list-item-title"]').each((i, el) => {
      const title = $(el).text().trim();
      if (title && !movies.includes(title)) movies.push(title);
    });
    console.log(`Found ${movies.length} movies from fallback:`, movies.slice(0, 15));
    return movies.slice(0, 20);
  } catch (e) {
    console.error("❌ Fallback In Theaters fetch failed:", e.message);
    return [];
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
    return result;
  } catch (error) {
    console.error("⚠️ Error scraping Rotten Tomatoes:", error.message);
    return [];
  }
}

async function run() {
  const top10 = await scrapeIMDBTop10();
  const inTheaters = await scrapeIMDBInTheaters();
  const rtNew = await scrapeRottenTomatoesNew();
  
  const now = Date.now();
  let hasWrites = false;
  const batch = db.batch();
  
  if (top10.length > 0) {
    const ref = db.collection('movie_lists').doc('top_ten');
    batch.set(ref, { id: 'top_ten', title: 'Top 10 This Week', movies: top10, updatedAt: now });
    hasWrites = true;
  }
  
  if (inTheaters.length > 0) {
    const ref = db.collection('movie_lists').doc('in_theaters');
    batch.set(ref, { id: 'in_theaters', title: 'In Theaters', movies: inTheaters, updatedAt: now });
    hasWrites = true;
  }
  
  if (rtNew.length > 0) {
    const ref = db.collection('movie_lists').doc('new_in_theaters');
    batch.set(ref, { id: 'new_in_theaters', title: 'New in Theaters (Rotten Tomatoes)', movies: rtNew, updatedAt: now });
    hasWrites = true;
  }
  
  if (hasWrites) {
    await batch.commit();
    console.log("🎉 Successfully synced scraped movies to Firebase!");
  } else {
    console.warn("⚠️ No movie data scraped to write to Firebase.");
  }
}

run().catch((error) => {
  console.error("❌ Unhandled Error in scrape script:", error);
  process.exit(1);
});
