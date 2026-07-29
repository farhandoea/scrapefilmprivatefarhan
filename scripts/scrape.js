const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');

// Initialize Firebase Admin
// The GitHub Action will provide the service account key as a base64 encoded string or JSON string in the environment
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable.");
  process.exit(1);
}

try {
  let serviceAccount;
  if (serviceAccountKey.startsWith('{')) {
    serviceAccount = JSON.parse(serviceAccountKey);
  } else {
    // Attempt base64 decode if it's not JSON
    serviceAccount = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString('utf8'));
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", error.message);
  process.exit(1);
}

const db = admin.firestore();

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function scrapeIMDBTop10() {
  try {
    console.log("Scraping IMDB Top 10...");
    const url = 'https://www.imdb.com/chart/moviemeter/'; 
    // Using the main chart URL since search URLs can be flaky with scraping
    const response = await axios.get(url, { headers: HEADERS });
    const $ = cheerio.load(response.data);
    
    const movies = [];
    $('.ipc-title__text').each((i, el) => {
      const text = $(el).text();
      // Remove numbering if present (e.g. "1. Title")
      const title = text.replace(/^\d+\.\s*/, '').trim();
      if (title && movies.length < 10 && !title.includes('IMDb')) {
        movies.push(title);
      }
    });
    return movies;
  } catch (error) {
    console.error("Error scraping IMDB Top 10:", error.message);
    return [];
  }
}

async function scrapeIMDBInTheaters() {
  try {
    console.log("Scraping IMDB In Theaters...");
    const url = 'https://www.imdb.com/showtimes/';
    const response = await axios.get(url, { headers: HEADERS });
    const $ = cheerio.load(response.data);
    
    const movies = [];
    $('.ipc-title__text').each((i, el) => {
      const title = $(el).text().trim();
      if (title && !movies.includes(title) && !title.includes('IMDb')) {
        movies.push(title);
      }
    });
    return movies.slice(0, 20); // Limit to top 20
  } catch (error) {
    console.error("Error scraping IMDB In Theaters:", error.message);
    return [];
  }
}

async function scrapeRottenTomatoesNew() {
  try {
    console.log("Scraping Rotten Tomatoes New In Theaters...");
    const url = 'https://www.rottentomatoes.com/browse/movies_in_theaters/sort:newest';
    const response = await axios.get(url, { headers: HEADERS });
    const $ = cheerio.load(response.data);
    
    const movies = [];
    $('[data-qa="discovery-media-list-item-title"]').each((i, el) => {
      const title = $(el).text().trim();
      if (title && !movies.includes(title)) {
        movies.push(title);
      }
    });
    return movies.slice(0, 20);
  } catch (error) {
    console.error("Error scraping Rotten Tomatoes:", error.message);
    return [];
  }
}

async function run() {
  const top10 = await scrapeIMDBTop10();
  const inTheaters = await scrapeIMDBInTheaters();
  const rtNew = await scrapeRottenTomatoesNew();
  
  const now = Date.now();
  
  const batch = db.batch();
  
  if (top10.length > 0) {
    const ref = db.collection('movie_lists').doc('top_ten');
    batch.set(ref, { id: 'top_ten', title: 'Top 10 This Week', movies: top10, updatedAt: now });
  }
  
  if (inTheaters.length > 0) {
    const ref = db.collection('movie_lists').doc('in_theaters');
    batch.set(ref, { id: 'in_theaters', title: 'In Theaters (IMDB)', movies: inTheaters, updatedAt: now });
  }
  
  if (rtNew.length > 0) {
    const ref = db.collection('movie_lists').doc('new_in_theaters');
    batch.set(ref, { id: 'new_in_theaters', title: 'New in Theaters (Rotten Tomatoes)', movies: rtNew, updatedAt: now });
  }
  
  await batch.commit();
  console.log("Successfully synced movies to Firebase!");
}

run().catch(console.error);
