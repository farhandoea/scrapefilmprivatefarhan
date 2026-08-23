const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const axios = require('axios');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// 1. Setup Firebase Admin
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let serviceAccount;
const rawKey = serviceAccountKey.trim();
if (rawKey.startsWith('{')) {
  serviceAccount = JSON.parse(rawKey);
} else {
  serviceAccount = JSON.parse(Buffer.from(rawKey, 'base64').toString('utf8'));
}

try {
  initializeApp({
    credential: cert(serviceAccount)
  });
} catch(e) {}
const db = getFirestore();

// 2. Setup Google Sheets
const TARGET_SPREADSHEET_ID = '17Of4jJGjERjjSIBNT9kk3K6XrRQDULnwIDBNfOjmpMk';
const auth = new JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const doc = new GoogleSpreadsheet(TARGET_SPREADSHEET_ID, auth);

const TMDB_API_KEY = 'b25dd37341986cae793e130ed3ccb7f3';
async function getPosterUrl(title) {
  try {
    let cleanTitle = title.replace(/\s*\(\d{4}\)\s*/g, '').trim();
    const url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
    const res = await axios.get(url, { timeout: 5000 });
    if (res.data && res.data.results && res.data.results.length > 0) {
      const firstHit = res.data.results[0];
      if (firstHit.poster_path) {
        return `https://image.tmdb.org/t/p/w500${firstHit.poster_path}`;
      }
    }
  } catch (err) {}
  return null;
}

const CONFIG = [
  { sheetName: 'ARSIP NETFLIX INDONESIA', listId: 'netflix_indonesia', sourceLabel: 'Netflix Indonesia Top 10' },
  { sheetName: 'Global Movies English', listId: 'netflix_global_english', sourceLabel: 'Netflix Global (English)' },
  { sheetName: 'Global Films-Non-English', listId: 'netflix_global_non_english', sourceLabel: 'Netflix Global (Non-English)' },
  { sheetName: 'ARSIP NETFLIX US', listId: 'netflix_us', sourceLabel: 'Netflix US Top 10' }
];

async function sync() {
  try {
    await doc.loadInfo();
    for (const conf of CONFIG) {
      console.log(`Syncing ${conf.sheetName}...`);
      const sheet = doc.sheetsByTitle[conf.sheetName];
      if (!sheet) {
        console.log(`Sheet ${conf.sheetName} not found, skipping.`);
        continue;
      }
      const rows = await sheet.getRows();
      
      const historyData = {};
      let count = 0;

      for (const row of rows) {
        const category = row.get('Kategori') || '';
        const title = row.get('Judul');
        const lastSeenDate = row.get('Terakhir Dilihat');
        const ageDays = parseInt(row.get('Umur (Hari)'), 10) || 7;
        const status = row.get('Status') === 'Aktif' ? 'Aktif' : 'Keluar dari Daftar';

        if (!title) continue;

        const posterUrl = await getPosterUrl(title);

        const entry = {
          movie: title,
          sourceName: conf.sourceLabel,
          category: category,
          status: status,
          ageDays: ageDays,
          firstSeenDate: '', 
          lastSeenDate: lastSeenDate,
          posterUrl: posterUrl,
          platform: conf.listId
        };

        const newKey = Buffer.from(title).toString('base64');
        historyData[newKey] = entry;

        count++;
        if (count % 100 === 0) {
          console.log(`Processed ${count} items for ${conf.sheetName}`);
        }
        // sleep a bit to avoid hitting rate limits too fast, but TMDB supports up to 50 req/sec usually.
        await new Promise(res => setTimeout(res, 50)); 
      }

      console.log(`Saving ${count} items to Firestore doc ${conf.listId}...`);
      // Since historyData can be quite large, we should save in one go if it fits within 1MB.
      // Usually, ~1000 items is < 500KB.
      const historyRef = db.collection('movie_history').doc(conf.listId);
      await historyRef.set(historyData);
      console.log(`Finished ${conf.sheetName}`);
    }
    console.log('All done!');
  } catch (err) {
    console.error('Error:', err);
  }
}

sync();
