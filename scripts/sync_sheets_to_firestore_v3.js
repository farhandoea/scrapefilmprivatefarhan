const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const axios = require('axios');
const admin = require('firebase-admin');
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
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (e) {}

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
    // Note: Error 5 NOT_FOUND when updating Firestore usually means the project ID isn't correctly resolved, 
    // or the database '(default)' does not exist.
    // The service account should have project_id. Let's explicitly pass it.
    
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
        await new Promise(res => setTimeout(res, 50)); 
      }

      console.log(`Saving ${count} items to Firestore...`);
      // Since it's failing on setting a massive document, let's store it as individual documents in a subcollection
      // wait, our UI expects a single document in 'movie_history' where each key is a base64 movie title!
      // The API endpoint /api/history reads from movie_history.
      
      // Let's use Firestore REST API to avoid the grpc bugs in the container
      
      const projectId = serviceAccount.project_id;
      const dbUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/movie_history/${conf.listId}`;
      
      // We will generate an OAuth token for the service account
      const tokenAuth = new JWT({
        email: serviceAccount.client_email,
        key: serviceAccount.private_key,
        scopes: ['https://www.googleapis.com/auth/datastore'],
      });
      const tokenRes = await tokenAuth.getAccessToken();
      const accessToken = tokenRes.token;
      
      // Format the data for Firestore REST API
      const fields = {};
      for(const [k, v] of Object.entries(historyData)) {
          fields[k] = {
              mapValue: {
                  fields: {
                      movie: { stringValue: v.movie || '' },
                      sourceName: { stringValue: v.sourceName || '' },
                      category: { stringValue: v.category || '' },
                      status: { stringValue: v.status || '' },
                      ageDays: { integerValue: v.ageDays || 0 },
                      firstSeenDate: { stringValue: v.firstSeenDate || '' },
                      lastSeenDate: { stringValue: v.lastSeenDate || '' },
                      posterUrl: v.posterUrl ? { stringValue: v.posterUrl } : { nullValue: null },
                      platform: { stringValue: v.platform || '' }
                  }
              }
          };
      }
      
      const payload = { fields: fields };
      
      console.log(`Using REST API to upload ${conf.listId}...`);
      try {
          await axios.patch(dbUrl, payload, {
              headers: { Authorization: `Bearer ${accessToken}` }
          });
          console.log(`Successfully saved ${conf.sheetName}`);
      } catch (e) {
          console.error(`Failed REST API for ${conf.sheetName}:`, e.response ? e.response.data : e.message);
      }
    }
    console.log('All done!');
  } catch (err) {
    console.error('Error:', err);
  }
}

sync();
