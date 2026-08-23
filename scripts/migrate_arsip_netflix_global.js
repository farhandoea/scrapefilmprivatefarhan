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

async function fetchYearForTitle(title, category) {
    try {
        // Untuk global English kita pakai US, untuk Non-English kita pakai default agar luas
        let url = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
        if (category === 'Films (English)') {
            url += '&language=en-US';
        }
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

async function processCategory(moviesMap, maxWeekGlobally, titleToYearMap, sheetTitle, categoryName, doc) {
    let allMovies = Array.from(moviesMap.values());
    
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

    allMovies.sort((a, b) => {
        if (a.status === 'Aktif' && b.status !== 'Aktif') return -1;
        if (a.status !== 'Aktif' && b.status === 'Aktif') return 1;
        if (a.lastSeen > b.lastSeen) return -1;
        if (a.lastSeen < b.lastSeen) return 1;
        return b.age - a.age;
    });

    let sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) {
        sheet = await doc.addSheet({ title: sheetTitle });
    }

    await sheet.clear();
    await sheet.setHeaderRow(['A', 'B', 'Kategori', 'Judul', 'Terakhir Dilihat', 'Umur (Hari)', 'Status']);

    const rowsToInsert = allMovies.map(m => {
        return ['', '', categoryName, m.title, m.lastSeen, m.age, m.status];
    });

    const chunkSize = 500;
    for (let i = 0; i < rowsToInsert.length; i += chunkSize) {
        const chunk = rowsToInsert.slice(i, i + chunkSize);
        await sheet.addRows(chunk);
        console.log(`Inserted rows ${i + 1} to ${i + chunk.length} for ${sheetTitle}`);
    }
}

async function migrate() {
  try {
    console.log('Downloading TSV...');
    const response = await axios.get('https://www.netflix.com/tudum/top10/data/all-weeks-global.tsv', { responseType: 'text' });
    const lines = response.data.split('\n');

    const englishMoviesMap = new Map();
    const nonEnglishMoviesMap = new Map();
    let maxWeekGlobally = "";
    
    // format: week, category, weekly_rank, show_title, season_title, weekly_hours_viewed, runtime, weekly_views, cumulative_weeks_in_top_10
    for (let i = 1; i < lines.length; i++) {
       const line = lines[i];
       if (!line) continue;
       const cols = line.split('\t').map(c => c.trim());
       
       const week = cols[0];
       const category = cols[1];
       const title = cols[3];
       const cumulativeWeeksStr = cols[8];
       
       if (category !== 'Films (English)' && category !== 'Films (Non-English)') continue;

       const cumulativeWeeks = parseInt(cumulativeWeeksStr, 10) || 1; 
       const cumulativeDays = cumulativeWeeks * 7; 

       if (week > maxWeekGlobally) {
           maxWeekGlobally = week;
       }

       const targetMap = category === 'Films (English)' ? englishMoviesMap : nonEnglishMoviesMap;

       if (!targetMap.has(title)) {
           targetMap.set(title, {
               originalTitle: title,
               lastSeen: week,
               ageDays: cumulativeDays,
               category: category
           });
       } else {
           const m = targetMap.get(title);
           if (week > m.lastSeen) {
               m.lastSeen = week;
               m.ageDays = Math.max(m.ageDays, cumulativeDays);
           }
       }
    }

    console.log(`Max week globally: ${maxWeekGlobally}`);
    
    const titleToYearMap = new Map();
    const allUniqueMovies = [...Array.from(englishMoviesMap.values()), ...Array.from(nonEnglishMoviesMap.values())];
    
    console.log(`Total unique movies to process: ${allUniqueMovies.length}`);
    
    let fetchedCount = 0;
    const batchSize = 30;
    for (let i = 0; i < allUniqueMovies.length; i += batchSize) {
        const batch = allUniqueMovies.slice(i, i + batchSize);
        await Promise.all(batch.map(async (m) => {
            const year = await fetchYearForTitle(m.originalTitle, m.category);
            if (year) {
                titleToYearMap.set(m.originalTitle, year);
            }
        }));
        fetchedCount += batch.length;
        console.log(`Fetched ${fetchedCount}/${allUniqueMovies.length} years from TMDB`);
        await new Promise(res => setTimeout(res, 500));
    }

    const auth = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const doc = new GoogleSpreadsheet(TARGET_SPREADSHEET_ID, auth);
    await doc.loadInfo();

    console.log('Processing Global Movies English...');
    await processCategory(englishMoviesMap, maxWeekGlobally, titleToYearMap, 'Global Movies English', 'Films (English)', doc);
    
    console.log('Processing Global Films-Non-English...');
    await processCategory(nonEnglishMoviesMap, maxWeekGlobally, titleToYearMap, 'Global Films-Non-English', 'Films (Non-English)', doc);

    console.log('Done uploading to Global Sheets!');

  } catch (error) {
    console.error('Error:', error);
  }
}
migrate();
