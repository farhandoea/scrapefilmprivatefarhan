const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const axios = require('axios');

const TARGET_SPREADSHEET_ID = '17Of4jJGjERjjSIBNT9kk3K6XrRQDULnwIDBNfOjmpMk';
const TMDB_API_KEY = 'b25dd37341986cae793e130ed3ccb7f3';
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let serviceAccount;
const rawKey = serviceAccountKey.trim();
if (rawKey.startsWith('{')) {
  serviceAccount = JSON.parse(rawKey);
} else {
  serviceAccount = JSON.parse(Buffer.from(rawKey, 'base64').toString('utf8'));
}

async function fetchYearForTitle(title) {
    try {
        // Prioritas pencarian untuk region US dan bahasa English
        const url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&region=US`;
        const res = await axios.get(url, { timeout: 5000 });
        if (res.data && res.data.results && res.data.results.length > 0) {
            const firstHit = res.data.results[0];
            const dateStr = firstHit.release_date || firstHit.first_air_date;
            if (dateStr && dateStr.length >= 4) {
                return dateStr.substring(0, 4);
            }
        }
    } catch (err) {}
    return null;
}

async function migrate() {
  try {
    console.log('Downloading TSV...');
    const response = await axios.get('https://www.netflix.com/tudum/top10/data/all-weeks-countries.tsv', { responseType: 'text' });
    const lines = response.data.split('\n');

    const moviesMap = new Map();
    let maxWeekGlobally = "";

    // 1. Process all historical data to group by movie and track lifespan
    // format: country_name (0), country_iso2 (1), week (2), category (3), weekly_rank (4), show_title (5), season_title (6), cumulative_weeks_in_top_10 (7)
    for (let i = 1; i < lines.length; i++) {
       const line = lines[i];
       if (!line) continue;
       const cols = line.split('\t').map(c => c.trim());
       
       if (cols[1] === 'US' && cols[3] === 'Films') {
           const week = cols[2];
           const title = cols[5];
           const cumulativeWeeks = parseInt(cols[7], 10) || 1; 
           const cumulativeDays = cumulativeWeeks * 7; // Convert to Days

           if (week > maxWeekGlobally) {
               maxWeekGlobally = week;
           }

           if (!moviesMap.has(title)) {
               moviesMap.set(title, {
                   originalTitle: title,
                   lastSeen: week,
                   ageDays: cumulativeDays
               });
           } else {
               const m = moviesMap.get(title);
               if (week > m.lastSeen) {
                   m.lastSeen = week;
                   m.ageDays = Math.max(m.ageDays, cumulativeDays);
               }
           }
       }
    }

    console.log(`Max week globally (Current Week US) is ${maxWeekGlobally}`);
    let allMovies = Array.from(moviesMap.values());
    console.log(`Found ${allMovies.length} unique movies in US.`);

    // 2. Fetch years from TMDB
    const titleToYearMap = new Map();
    let fetchedCount = 0;
    const batchSize = 30;
    for (let i = 0; i < allMovies.length; i += batchSize) {
        const batch = allMovies.slice(i, i + batchSize);
        await Promise.all(batch.map(async (m) => {
            const year = await fetchYearForTitle(m.originalTitle);
            if (year) {
                titleToYearMap.set(m.originalTitle, year);
            }
        }));
        fetchedCount += batch.length;
        console.log(`Fetched ${fetchedCount}/${allMovies.length} years from TMDB`);
        await new Promise(res => setTimeout(res, 500));
    }

    // 3. Format final data
    allMovies = allMovies.map(m => {
        const year = titleToYearMap.get(m.originalTitle);
        const finalTitle = year ? `${m.originalTitle} (${year})` : m.originalTitle;
        const status = (m.lastSeen === maxWeekGlobally) ? 'Aktif' : 'Keluar dari Daftar';
        
        return {
            title: finalTitle,
            lastSeen: m.lastSeen,
            age: m.ageDays,
            status: status
        };
    });

    // 4. Sort
    allMovies.sort((a, b) => {
        if (a.status === 'Aktif' && b.status !== 'Aktif') return -1;
        if (a.status !== 'Aktif' && b.status === 'Aktif') return 1;
        if (a.lastSeen > b.lastSeen) return -1;
        if (a.lastSeen < b.lastSeen) return 1;
        return b.age - a.age;
    });

    // 5. Upload to Google Sheets
    const auth = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const doc = new GoogleSpreadsheet(TARGET_SPREADSHEET_ID, auth);
    await doc.loadInfo();

    let sheetName = 'ARSIP NETFLIX US';
    let sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) {
        sheet = await doc.addSheet({ title: sheetName });
    }

    await sheet.clear();
    await sheet.setHeaderRow(['A', 'B', 'Kategori', 'Judul', 'Terakhir Dilihat', 'Umur (Hari)', 'Status']);

    const rowsToInsert = allMovies.map(m => {
        return ['', '', 'Netflix Top 10 US', m.title, m.lastSeen, m.age, m.status];
    });

    const chunkSize = 500;
    for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
        const chunk = rowsToInsert.slice(i, i + chunkSize);
        await sheet.addRows(chunk);
        console.log(`Inserted rows ${i + 1} to ${i + chunk.length}`);
    }

    console.log('Done uploading to ARSIP NETFLIX US with Hari!');

  } catch (error) {
    console.error('Error:', error);
  }
}
migrate();
