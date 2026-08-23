const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const axios = require('axios');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// 1. Setup Firebase Admin logic
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let serviceAccount = JSON.parse(serviceAccountKey.startsWith('{') ? serviceAccountKey : Buffer.from(serviceAccountKey, 'base64').toString('utf8'));
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app, 'ai-studio-eed7b5aa-7ae4-40f8-b378-7a5ec50e9d70');

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
  { sheetName: 'ARSIP NETFLIX US', listId: 'netflix_us', sourceLabel: 'Netflix US Top 10' }
];

async function sync() {
  try {
    await doc.loadInfo();
    for (const conf of CONFIG) {
      console.log(`Syncing ${conf.sheetName}...`);
      const sheet = doc.sheetsByTitle[conf.sheetName];
      if (!sheet) continue;
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
        if (count % 100 === 0) console.log(`Processed ${count} items for ${conf.sheetName}`);
        await new Promise(res => setTimeout(res, 30)); 
      }

      console.log(`Saving ${count} items to Firestore doc ${conf.listId}...`);
      const historyRef = db.collection('movie_history').doc(conf.listId);
      
      const entries = Object.entries(historyData);
      const chunkSize = 200;
      await historyRef.set({ _updated: Date.now() }, { merge: true });
      for (let i = 0; i < entries.length; i += chunkSize) {
        const chunk = entries.slice(i, i + chunkSize);
        const chunkObj = {};
        chunk.forEach(([k, v]) => { chunkObj[k] = v; });
        await historyRef.set(chunkObj, { merge: true });
        console.log(`Saved chunk ${i} to ${i + chunk.length} for ${conf.listId}`);
      }
      console.log(`Successfully saved ${conf.sheetName}`);
    }
    console.log('All done!');
  } catch (err) {
    console.error('Error:', err);
  }
}

sync();
