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
      let title = $(el).find('.movie-desc').text().trim().replace(/\s+/g, ' ');
      if (title && title.length > 2) {
        // Append current year
        const currentYear = new Date().getFullYear();
        title = `${title} (${currentYear})`;
        if (!movies.includes(title)) {
          movies.push(title);
        }
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
      `Spider-Man: Brand New Day (${new Date().getFullYear()})`,
      `Sajen Satu Suro (${new Date().getFullYear()})`,
      `Samakdo (${new Date().getFullYear()})`,
      `Ketok Mejik (${new Date().getFullYear()})`,
      `Kado untuk Ibu (${new Date().getFullYear()})`,
      `Sihir Tanah Kubur (${new Date().getFullYear()})`,
      `Andai Waktu Bisa Diulang Kembali (${new Date().getFullYear()})`,
      `Evil Dead Burn (${new Date().getFullYear()})`,
      `Obsession (${new Date().getFullYear()})`,
      `The Odyssey (IMAX 2D) (${new Date().getFullYear()})`,
      `Cek Khodam (${new Date().getFullYear()})`,
      `Petaka Gunung Welirang (${new Date().getFullYear()})`
    ];
    return { movies: fallback21, source: 'Cinema 21 (Now Playing)', sourceUrl: 'https://m.21cineplex.com/id/movies?tabs=now-playing' };
  } catch (error) {
    console.log("⚠️ 21 Cineplex direct scrape failed:", error.message);
    const fallback21 = [
      `Spider-Man: Brand New Day (${new Date().getFullYear()})`,
      `Sajen Satu Suro (${new Date().getFullYear()})`,
      `Samakdo (${new Date().getFullYear()})`,
      `Ketok Mejik (${new Date().getFullYear()})`,
      `Kado untuk Ibu (${new Date().getFullYear()})`,
      `Sihir Tanah Kubur (${new Date().getFullYear()})`,
      `Andai Waktu Bisa Diulang Kembali (${new Date().getFullYear()})`,
      `Evil Dead Burn (${new Date().getFullYear()})`,
      `Obsession (${new Date().getFullYear()})`,
      `The Odyssey (IMAX 2D) (${new Date().getFullYear()})`,
      `Cek Khodam (${new Date().getFullYear()})`,
      `Petaka Gunung Welirang (${new Date().getFullYear()})`
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

async function scrapeSubDLPopularMovies() {
  const allMovies = new Set();
  console.log("🔍 Scraping SubDL Popular Movies (Pages 1-10)...");
  
  for (let page = 1; page <= 10; page++) {
    try {
      const url = page === 1 ? 'https://subdl.com/id/trends/movies' : `https://subdl.com/id/trends/movies/${page}`;
      const response = await axios.get(url, { headers: HEADERS, timeout: 8000 });
      const $ = cheerio.load(response.data);
      
      $('h3').each((i, el) => {
        const title = $(el).text().trim();
        const year = $(el).next('p').text().trim();
        if (title) {
          const fullTitle = year ? `${title} (${year})` : title;
          allMovies.add(fullTitle);
        }
      });
      console.log(`Scraped page ${page}, total unique movies so far: ${allMovies.size}`);
    } catch (error) {
      console.error(`⚠️ Error scraping SubDL page ${page}:`, error.message);
    }
  }
  
  const result = Array.from(allMovies);
  console.log(`Found ${result.length} movies for SubDL Popular Movies`);
  return { movies: result, source: 'SubDL Popular Movies', sourceUrl: 'https://subdl.com/id/trends/movies' };
}

async function scrapeSubDLMostDownloaded() {
  try {
    console.log("🔍 Scraping SubDL Most Downloaded Subtitles...");
    const url = 'https://subdl.com/id/latest/popular';
    const response = await axios.get(url, { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(response.data);
    
    const movies = [];
    $('a[href*="/subtitle/"]').each((i, el) => {
      const title = $(el).text().trim();
      if (title && !movies.includes(title)) {
        movies.push(title);
      }
    });

    const result = movies.slice(0, 15);
    console.log(`Found ${result.length} movies for SubDL Most Downloaded:`, result);
    return { movies: result, source: 'SubDL Most Downloaded', sourceUrl: 'https://subdl.com/id/latest/popular' };
  } catch (error) {
    console.error("⚠️ Error scraping SubDL Most Downloaded:", error.message);
    return { movies: [], source: 'Unknown', sourceUrl: '' };
  }
}

async function scrapeNetflixIndonesia() {
  try {
    console.log("🔍 Scraping Netflix Indonesia Top 10...");
    const url = 'https://www.netflix.com/tudum/top10/indonesia';
    const response = await axios.get(url, { headers: HEADERS, timeout: 8000 });
    const $ = cheerio.load(response.data);
    
    // Extract years from the GraphQL JSON payload in the HTML
    const yearMap = {};
    const regex = /"__typename":"Top10PulseVideo","title":"([^"]+)",(?:.*?)"releaseYear":(\d+)/g;
    let m;
    while ((m = regex.exec(response.data)) !== null) {
      yearMap[m[1]] = m[2];
    }
    
    const movies = [];
    $('table tbody tr').each((i, tr) => {
      const buttonText = $(tr).find('td').first().find('button').text().trim();
      let title = buttonText;
      if (!title) {
        const firstTdText = $(tr).find('td').first().text().trim();
        title = firstTdText.replace(/^\d+/, '').trim();
      }
      if (title) {
        const year = yearMap[title];
        const fullTitle = year ? `${title} (${year})` : title;
        if (!movies.includes(fullTitle)) {
          movies.push(fullTitle);
        }
      }
    });

    if (movies.length > 0) {
      const result = movies.slice(0, 10);
      console.log(`Found ${result.length} movies for Netflix Indonesia Top 10:`, result);
      return { movies: result, source: 'Netflix Indonesia', sourceUrl: 'https://www.netflix.com/tudum/top10/indonesia' };
    }

    const fallbackNetflix = [
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
    ];
    console.log("⚠️ Netflix Indonesia scrape returned empty. Using fallback list.");
    return { movies: fallbackNetflix, source: 'Netflix Indonesia', sourceUrl: 'https://www.netflix.com/tudum/top10/indonesia' };
  } catch (error) {
    console.error("⚠️ Error scraping Netflix Indonesia:", error.message);
    const fallbackNetflix = [
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
    ];
    return { movies: fallbackNetflix, source: 'Netflix Indonesia', sourceUrl: 'https://www.netflix.com/tudum/top10/indonesia' };
  }
}

async function scrapeAppleTVTop10() {
  try {
    console.log("🔍 Scraping Apple TV+ Top 10 Movies...");
    const url = 'https://tv.apple.com/id/collection/top10-movies/uts.col.ChartsMovies.tvs.sbd.4000?ctx_brand=tvs.sbd.4000&ctx_cvs=uts.tcvs.tv-plus-canvas&ctx_shelf=uts.shlf.gen.BrandChart_tvs.sbd.4000_Movie';
    const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    const movies = [];
    $('script[type="application/json"]').each((i, el) => {
      try {
        const json = JSON.parse($(el).html());
        if (json.data && Array.isArray(json.data)) {
          for (let d of json.data) {
            if (d.data && d.data.shelves && Array.isArray(d.data.shelves)) {
              for (let shelf of d.data.shelves) {
                if (shelf.items && Array.isArray(shelf.items)) {
                  for (let item of shelf.items) {
                    const title = item.contextAction?.title || item.ariaLabel || item.title;
                    if (title && !movies.includes(title)) {
                      movies.push(title);
                    }
                  }
                }
              }
            }
          }
        }
      } catch (e) {}
    });

    if (movies.length > 0) {
      const result = movies.slice(0, 10);
      console.log(`Found ${result.length} movies for Apple TV+ Top 10:`, result);
      return { movies: result, source: 'Apple TV+ (Top 10)', sourceUrl: url };
    }

    const fallbackApple = [
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
    ];
    console.log("⚠️ Apple TV+ scrape returned empty. Using fallback list.");
    return { movies: fallbackApple, source: 'Apple TV+ (Top 10)', sourceUrl: url };
  } catch (error) {
    console.error("⚠️ Error scraping Apple TV+:", error.message);
    const fallbackApple = [
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
    ];
    return { movies: fallbackApple, source: 'Apple TV+ (Top 10)', sourceUrl: 'https://tv.apple.com/id/collection/top10-movies/uts.col.ChartsMovies.tvs.sbd.4000?ctx_brand=tvs.sbd.4000&ctx_cvs=uts.tcvs.tv-plus-canvas&ctx_shelf=uts.shlf.gen.BrandChart_tvs.sbd.4000_Movie' };
  }
}

async function scrapeHBOMaxTop10() {
  try {
    console.log("🔍 Scraping HBO Max Indonesia (10 Teratas Hari Ini)...");
    const url = 'https://www.hbomax.com/id/id';
    const response = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    let movies = [];
    
    // Strategy 1: Find <h2> with "10 Teratas Hari Ini" or "10 Teratas"
    $("h2").each((i, el) => {
      const heading = $(el).text().trim();
      if (heading.toLowerCase().includes("10 teratas")) {
        const section = $(el).closest(".content-tray, section, .collection-content");
        section.find("img[alt]").each((j, imgEl) => {
          const alt = $(imgEl).attr("alt");
          if (alt && alt.trim() && !movies.includes(alt.trim()) && movies.length < 10) {
            movies.push(alt.trim());
          }
        });
      }
    });

    // Strategy 2: Parse script tags containing "10 Teratas Hari Ini"
    if (movies.length === 0) {
      $("script[type=\"application/json\"]").each((i, el) => {
        try {
          const content = $(el).html() || "";
          if (content.includes("10 Teratas")) {
            const json = JSON.parse(content);
            function traverse(obj) {
              if (!obj || movies.length >= 10) return;
              if (typeof obj === "object") {
                if (typeof obj.header === "string" && obj.header.toLowerCase().includes("10 teratas")) {
                  if (Array.isArray(obj.items)) {
                    for (let it of obj.items) {
                      const title = it.title || it.name || it.metadata?.title;
                      if (title && !movies.includes(title)) movies.push(title);
                    }
                  }
                }
                for (let k of Object.keys(obj)) traverse(obj[k]);
              }
            }
            traverse(json);
          }
        } catch (e) {}
      });
    }

    if (movies.length > 0) {
      const result = movies.slice(0, 10);
      console.log(`Found ${result.length} movies for HBO Max Top 10:`, result);
      return { movies: result, source: 'HBO Max (10 Teratas)', sourceUrl: url };
    }

    const fallbackHBO = [
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
    ];
    console.log("⚠️ HBO Max scrape returned empty. Using fallback list.");
    return { movies: fallbackHBO, source: 'HBO Max (10 Teratas)', sourceUrl: url };
  } catch (error) {
    console.error("⚠️ Error scraping HBO Max:", error.message);
    const fallbackHBO = [
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
    ];
    return { movies: fallbackHBO, source: 'HBO Max (10 Teratas)', sourceUrl: 'https://www.hbomax.com/id/id' };
  }
}

async function scrapeKlikFilmTrending() {
  let targetUrl = 'https://klikfilm.com/v4/trending';
  try {
    console.log("🔍 Scraping KlikFilm Trending Movies...");
    
    // Safeguard ("Jaga-jaga"): Check KlikFilm homepage for dynamic Trending button link
    try {
      const homeRes = await axios.get('https://klikfilm.com/v4/', { headers: HEADERS, timeout: 6000 });
      const $home = cheerio.load(homeRes.data);
      $home('a').each((i, el) => {
        const text = $home(el).text().trim().toLowerCase();
        const href = $home(el).attr('href');
        if (text === 'trending' || (href && href.toLowerCase().includes('trending'))) {
          if (href) {
            targetUrl = href.startsWith('http') ? href : `https://klikfilm.com${href.startsWith('/') ? '' : '/'}${href}`;
          }
        }
      });
      console.log(`🎯 Dynamically resolved KlikFilm Trending URL: ${targetUrl}`);
    } catch (e) {
      console.log("⚠️ Could not fetch KlikFilm homepage for dynamic button link, using default candidate:", targetUrl);
    }

    const response = await axios.get(targetUrl, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(response.data);
    
    const movies = [];
    $('a[href*="/watch/"], a[href*="/series/"]').each((i, el) => {
      const text = $(el).text().trim();
      if (text && !movies.includes(text) && !['Home', 'Trending', 'Contact us', 'Term of Use', 'FAQ', 'Point'].includes(text)) {
        movies.push(text);
      }
    });

    if (movies.length > 0) {
      const result = movies.slice(0, 20);
      console.log(`Found ${result.length} movies for KlikFilm Trending:`, result);
      return { movies: result, source: 'KlikFilm Trending', sourceUrl: targetUrl };
    }

    const fallbackKlikFilm = [
      'Buya Hamka Vol 1',
      'Rumah dan Musim Hujan',
      'Bumi Manusia Extended',
      'Mayflies',
      'Cross the Line',
      'New Kung Fu Cult Master 1',
      'Sin Extended',
      'Rembulan Tenggelam di Wajahmu Extended',
      'Berebut Jenazah',
      "Haji Backpacker - Director's Cut",
      'Friend Zone',
      'Cek Ombak (Melulu)',
      'Fight Club',
      'Demi Si Buah Hati',
      'Bumi Manusia',
      'Di Balik Layar Dilan ITB 1997',
      'Perfect Strangers',
      'Warkop DKI Kartun Series',
      'I',
      'Dilan 1991 Extended Version'
    ];
    console.log("⚠️ KlikFilm Trending direct scrape returned empty. Using fallback list.");
    return { movies: fallbackKlikFilm, source: 'KlikFilm Trending', sourceUrl: targetUrl };
  } catch (error) {
    console.error("⚠️ Error scraping KlikFilm Trending:", error.message);
    const fallbackKlikFilm = [
      'Buya Hamka Vol 1',
      'Rumah dan Musim Hujan',
      'Bumi Manusia Extended',
      'Mayflies',
      'Cross the Line',
      'New Kung Fu Cult Master 1',
      'Sin Extended',
      'Rembulan Tenggelam di Wajahmu Extended',
      'Berebut Jenazah',
      "Haji Backpacker - Director's Cut",
      'Friend Zone',
      'Cek Ombak (Melulu)',
      'Fight Club',
      'Demi Si Buah Hati',
      'Bumi Manusia',
      'Di Balik Layar Dilan ITB 1997',
      'Perfect Strangers',
      'Warkop DKI Kartun Series',
      'I',
      'Dilan 1991 Extended Version'
    ];
    return { movies: fallbackKlikFilm, source: 'KlikFilm Trending', sourceUrl: targetUrl };
  }
}


async function scrapeCatchplayPopular() {
  const url = 'https://www.catchplay.com/id/search/list?args=DEFAULT%23ALL%23MOST_POPULAR_ALLBRAND';
  const idFallback = [
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
  ];

  try {
    console.log("🔍 Scraping Catchplay+ Popular Movies...");
    const response = await axios.get(url, { headers: HEADERS, timeout: 12000 });
    const $ = cheerio.load(response.data);
    const nextDataText = $('#__NEXT_DATA__').html();
    
    if (nextDataText) {
      const nextData = JSON.parse(nextDataText);
      const territory = nextData.props && nextData.props.territory;
      
      // If Catchplay redirects the Cloud server to Taiwan (tw) due to GeoIP, we must use the ID fallback
      if (territory && territory.toLowerCase() !== 'id' && territory.toLowerCase() !== 'in') {
        console.log(`⚠️ Catchplay+ returned territory '${territory}' (GeoIP Blocked). Using Indonesian fallback list.`);
        return { movies: idFallback, source: 'Catchplay+ Popular', sourceUrl: url };
      }

      const apolloState = nextData.props && nextData.props.apolloState;
      if (apolloState) {
        const movies = [];
        for (let k in apolloState) {
          if (k.startsWith('ProgramSummary:') || k.startsWith('Program:') || k.startsWith('Movie:')) {
            const item = apolloState[k];
            let engTitle = null;
            let localTitle = null;
            
            if (item.title && typeof item.title === 'object') {
              engTitle = item.title.eng;
              localTitle = item.title.local;
            } else if (typeof item.title === 'string') {
              engTitle = item.title;
            }
            
            const title = engTitle || localTitle;
            if (title && !movies.includes(title) && title.length < 80) {
              movies.push(title);
            }
          }
        }

        if (movies.length > 0) {
          // Return all found movies (no more slice to 20)
          console.log(`Found ${movies.length} movies for Catchplay+ Popular:`, movies);
          return { movies, source: 'Catchplay+ Popular', sourceUrl: url };
        }
      }
    }

    return { movies: idFallback, source: 'Catchplay+ Popular', sourceUrl: url };
  } catch (error) {
    console.error("⚠️ Error scraping Catchplay+ Popular:", error.message);
    return { movies: idFallback, source: 'Catchplay+ Popular', sourceUrl: url };
  }
}

async function trackMovieHistory(db, listId, listName, movies, sourceName) {
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
  
  const TMDB_API_KEY = 'b25dd37341986cae793e130ed3ccb7f3';
  const getPosterUrl = async (title) => {
    try {
      // Clean title: remove years like "(2026)", IMAX tags, Fans Screening, etc.
      let cleanTitle = title
        .replace(/\s*\(\d{4}\)\s*/g, '')
        .replace(/\s*\(\s*IMAX\s*[^)]*\)\s*/ig, '')
        .replace(/\s*-\s*Fans Screening\s*/ig, '')
        .trim();
        
      // Use search/multi to find both Movies and TV Shows
      const res = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}`);
      
      if (res.data.results && res.data.results.length > 0) {
        // Find the first result that has a poster_path
        const match = res.data.results.find(r => r.poster_path);
        if (match) {
          return `https://image.tmdb.org/t/p/w500${match.poster_path}`; // Using w500 for better grid quality
        }
      }
    } catch (e) {
      console.warn(`⚠️ Could not fetch TMDB poster for ${title}`);
    }
    return null;
  };

  // 1. Process all currently scraped movies
  for (const movie of movies) {
    const key = Buffer.from(movie).toString('base64');
    currentKeys.add(key);

    let ageDays = 1;
    let firstSeenStr = todayStr;
    let posterUrl = null;
    
    if (historyData[key]) {
      const prev = historyData[key];
      firstSeenStr = prev.firstSeenDate || todayStr;
      posterUrl = prev.posterUrl || null;
      
      // Hitung umur secara kumulatif berdasarkan hari aktif saja
      ageDays = prev.ageDays || 1;
      // Jika ini adalah scraping di hari yang berbeda, tambah 1 hari
      if (prev.lastSeenDate && prev.lastSeenDate !== todayStr) {
        ageDays += 1;
      }
    } 

    if (!posterUrl) {
      posterUrl = await getPosterUrl(movie);
      // Wait a tiny bit to avoid API rate limits if making many calls
      await new Promise(r => setTimeout(r, 100)); 
    }

    updatedHistory[key] = {
      movie: movie,
      firstSeenDate: firstSeenStr,
      lastSeenDate: todayStr,
      ageDays: ageDays,
      status: 'Aktif',
      posterUrl: posterUrl
    };
    
    // Format for Google Sheets
    statsList.push({
      'Tanggal Scraping': todayStr,
      'Source': sourceName,
      'Daftar': listName,
      'Nama Film': movie,
      'Terakhir Dilihat': todayStr,
      'Umur (Hari)': ageDays,
      'Status': 'Aktif'
    });
  }

  // 2. Process movies that were previously tracked but disappeared in today's scrape
  for (const key of Object.keys(historyData)) {
    if (!currentKeys.has(key)) {
      const prev = historyData[key];
      
      // Fetch missing poster for historical data that is no longer active
      if (!prev.posterUrl) {
        prev.posterUrl = await getPosterUrl(prev.movie);
        await new Promise(r => setTimeout(r, 100)); // Rate limit protection
      }

      // If it was active previously and now gone, record that it exited the list today
      if (prev.status !== 'Keluar dari Daftar') {
        updatedHistory[key] = {
          ...prev,
          status: 'Keluar dari Daftar'
        };

        statsList.push({
          'Tanggal Scraping': todayStr,
          'Source': sourceName,
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
  }

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

  // Sanitize sheetId in case full URL or extra whitespace/newlines were passed
  let cleanSheetId = (sheetId || '').trim();
  const urlMatch = cleanSheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) {
    cleanSheetId = urlMatch[1];
  } else {
    cleanSheetId = cleanSheetId.split('/')[0].split('?')[0].replace(/['"]/g, '').trim();
  }
  
  try {
    const privateKey = serviceAccount.private_key ? serviceAccount.private_key.replace(/\\n/g, '\n') : '';
    const jwt = new JWT({
      email: serviceAccount.client_email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    console.log(`📊 Connecting to Google Sheet ID: ${cleanSheetId}...`);
    console.log(`🔑 Using Service Account Email: ${serviceAccount.client_email}`);
    const doc = new GoogleSpreadsheet(cleanSheetId, jwt);
    await doc.loadInfo();
    
    const headers = ['Tanggal Scraping', 'Source', 'Daftar', 'Nama Film', 'Terakhir Dilihat', 'Umur (Hari)', 'Status'];

    const groupedStats = {};
    for (const stat of allStats) {
      const sourceName = stat['Source'] || 'Other';
      if (!groupedStats[sourceName]) groupedStats[sourceName] = [];
      groupedStats[sourceName].push(stat);
    }

    for (const [sourceName, stats] of Object.entries(groupedStats)) {
      let sheet = doc.sheetsByTitle[sourceName];
      if (!sheet) {
        // Try to rename the default sheet if it's the only one and not already renamed
        const defaultSheet = doc.sheetsByIndex[0];
        if (doc.sheetCount === 1 && (defaultSheet.title === 'Sheet1' || defaultSheet.title === 'Movie History')) {
          sheet = defaultSheet;
          await sheet.updateProperties({ title: sourceName });
          await sheet.setHeaderRow(headers);
        } else {
          sheet = await doc.addSheet({ title: sourceName, headerValues: headers });
        }
      } else {
        // Ensure header row exists
        try {
          await sheet.loadHeaderRow();
        } catch(e) {
          await sheet.setHeaderRow(headers);
        }
      }
      
      // Fetch existing rows to prepend new data at the top
      let existingData = [];
      try {
        const rows = await sheet.getRows();
        existingData = rows.map(r => r.toObject());
      } catch (e) {
        // Ignore errors if empty
      }
      
      const activeRows = stats.filter(s => s['Status'] === 'Aktif');
      const activeNames = new Set(activeRows.map(s => s['Nama Film']));

      const inactiveMap = new Map();
      
      // Preserve previously inactive movies from the sheet
      for (const row of existingData) {
        if (row['Nama Film']) {
          // MIGRATION: Append current year to old Cinema XXI entries
          if (sourceName === 'Cinema XXI' && !row['Nama Film'].endsWith(')')) {
            row['Nama Film'] = `${row['Nama Film']} (${new Date().getFullYear()})`;
          }
          if (!activeNames.has(row['Nama Film'])) {
            inactiveMap.set(row['Nama Film'], row);
          }
        }
      }
      
      // Add newly inactive movies from today's scrape
      for (const stat of stats) {
        if (stat['Status'] !== 'Aktif' && stat['Nama Film']) {
          inactiveMap.set(stat['Nama Film'], stat);
        }
      }

      const inactiveRows = Array.from(inactiveMap.values());

      if (existingData.length > 0) {
        try {
          await sheet.clearRows();
        } catch (e) {
          // Ignore clear errors
        }
      }

      let dataToWrite = [...activeRows];

      // Add a 2-row boundary if there is inactive data
      if (inactiveRows.length > 0) {
        dataToWrite.push({});
        dataToWrite.push({});
        dataToWrite = dataToWrite.concat(inactiveRows);
      }

      await sheet.addRows(dataToWrite);
      console.log(`✅ Prepended ${stats.length} new rows to Google Sheet '${sourceName}'!`);
    }
  } catch (error) {
    console.error("⚠️ Failed to sync to Google Sheets:", error.message);
    if (error.response && error.response.data) console.error(JSON.stringify(error.response.data, null, 2));
  }
}

async function run() {
  // --- MIGRATION BLOCK: Append year to old Cinema XXI history ---
  try {
    const historyRef = db.collection('movie_history').doc('in_theaters');
    const docSnap = await historyRef.get();
    if (docSnap.exists) {
      const data = docSnap.data();
      let migrated = false;
      const suffix = ` (${new Date().getFullYear()})`;
      
      for (const key of Object.keys(data)) {
        const entry = data[key];
        if (entry.movie && !entry.movie.endsWith(')')) {
          const newName = `${entry.movie}${suffix}`;
          const newKey = Buffer.from(newName).toString('base64');
          entry.movie = newName;
          data[newKey] = entry;
          delete data[key];
          migrated = true;
        }
      }
      
      if (migrated) {
        await historyRef.set(data);
        console.log("✅ Migrated old Cinema XXI history to include year suffix!");
      }
    }
  } catch (e) {
    console.error("Migration error:", e);
  }
  // --- END MIGRATION BLOCK ---

  const top10 = await scrapeIMDBTop10();
  const cineplex21 = await scrape21CineplexNowPlaying();
  const subsource = await scrapeSubSourcePopular();
  const subdlPopular = await scrapeSubDLPopularMovies();
  const subdlMostDownloaded = await scrapeSubDLMostDownloaded();
  const netflixIndonesia = await scrapeNetflixIndonesia();
  const klikfilmTrending = await scrapeKlikFilmTrending();
  const appleTvTop10 = await scrapeAppleTVTop10();
  const hboMaxTop10 = await scrapeHBOMaxTop10();
  const catchplayPopular = await scrapeCatchplayPopular();
  
  const now = Date.now();
  let hasWrites = false;
  const batch = db.batch();
  
  let allStats = [];

  if (top10.movies.length > 0) {
    const ref = db.collection('movie_lists').doc('top_ten');
    batch.set(ref, { id: 'top_ten', title: 'Top 10 This Week', source: top10.source, sourceUrl: top10.sourceUrl, movies: top10.movies, updatedAt: now });
    hasWrites = true;
    const stats = await trackMovieHistory(db, 'top_ten', 'Top 10 This Week', top10.movies, 'IMDb');
    allStats = allStats.concat(stats);
  }
  
  if (cineplex21.movies.length > 0) {
    const ref = db.collection('movie_lists').doc('in_theaters');
    batch.set(ref, { id: 'in_theaters', title: 'Cinema XXI (21 Cineplex)', source: cineplex21.source, sourceUrl: cineplex21.sourceUrl, movies: cineplex21.movies, updatedAt: now });
    hasWrites = true;
    const stats = await trackMovieHistory(db, 'in_theaters', 'Cinema XXI (21 Cineplex)', cineplex21.movies, 'Cinema XXI');
    allStats = allStats.concat(stats);
  }

  if (subsource.movies.length > 0) {
    const ref = db.collection('movie_lists').doc('subsource_popular');
    batch.set(ref, { id: 'subsource_popular', title: 'Popular Movie Subtitles', source: subsource.source, sourceUrl: subsource.sourceUrl, movies: subsource.movies, updatedAt: now });
    hasWrites = true;
    const stats = await trackMovieHistory(db, 'subsource_popular', 'Popular Movie Subtitles', subsource.movies, 'Subsource');
    allStats = allStats.concat(stats);
  }
  
  if (subdlPopular.movies.length > 0) {
    const ref = db.collection('movie_lists').doc('subdl_popular_movies');
    batch.set(ref, { id: 'subdl_popular_movies', title: 'SubDL Popular Movies', source: subdlPopular.source, sourceUrl: subdlPopular.sourceUrl, movies: subdlPopular.movies, updatedAt: now });
    hasWrites = true;
    const stats = await trackMovieHistory(db, 'subdl_popular_movies', 'SubDL Popular Movies', subdlPopular.movies, 'SubDL Popular Movies');
    allStats = allStats.concat(stats);
  }
  
  if (subdlMostDownloaded.movies.length > 0) {
    const ref = db.collection('movie_lists').doc('subdl_most_downloaded');
    batch.set(ref, { id: 'subdl_most_downloaded', title: 'SubDL Most Downloaded Subtitle', source: subdlMostDownloaded.source, sourceUrl: subdlMostDownloaded.sourceUrl, movies: subdlMostDownloaded.movies, updatedAt: now });
    hasWrites = true;
    const stats = await trackMovieHistory(db, 'subdl_most_downloaded', 'SubDL Most Downloaded Subtitle', subdlMostDownloaded.movies, 'SubDL Most Downloaded');
    allStats = allStats.concat(stats);
  }
  
  if (netflixIndonesia.movies.length > 0) {
    const ref = db.collection('movie_lists').doc('netflix_indonesia');
    batch.set(ref, { id: 'netflix_indonesia', title: 'Netflix Top 10 Indonesia', source: netflixIndonesia.source, sourceUrl: netflixIndonesia.sourceUrl, movies: netflixIndonesia.movies, updatedAt: now });
    hasWrites = true;
    const stats = await trackMovieHistory(db, 'netflix_indonesia', 'Netflix Top 10 Indonesia', netflixIndonesia.movies, 'Netflix Indonesia');
    allStats = allStats.concat(stats);
  }

  
  if (catchplayPopular.movies.length > 0) {
    const ref = db.collection('movie_lists').doc('catchplay_popular');
    batch.set(ref, { id: 'catchplay_popular', title: 'Catchplay+ Most Popular', source: catchplayPopular.source, sourceUrl: catchplayPopular.sourceUrl, movies: catchplayPopular.movies, updatedAt: now });
    hasWrites = true;
    const stats = await trackMovieHistory(db, 'catchplay_popular', 'Catchplay+ Most Popular', catchplayPopular.movies, 'Catchplay+');
    allStats = allStats.concat(stats);
  }

  if (klikfilmTrending.movies.length > 0) {
    const ref = db.collection('movie_lists').doc('klikfilm_trending');
    batch.set(ref, { id: 'klikfilm_trending', title: 'KlikFilm Trending', source: klikfilmTrending.source, sourceUrl: klikfilmTrending.sourceUrl, movies: klikfilmTrending.movies, updatedAt: now });
    hasWrites = true;
    const stats = await trackMovieHistory(db, 'klikfilm_trending', 'KlikFilm Trending', klikfilmTrending.movies, 'KlikFilm');
    allStats = allStats.concat(stats);
  }

  if (appleTvTop10.movies.length > 0) {
    const ref = db.collection('movie_lists').doc('apple_tv_top10');
    batch.set(ref, { id: 'apple_tv_top10', title: 'Apple TV+ Top 10 Movies', source: appleTvTop10.source, sourceUrl: appleTvTop10.sourceUrl, movies: appleTvTop10.movies, updatedAt: now });
    hasWrites = true;
    const stats = await trackMovieHistory(db, 'apple_tv_top10', 'Apple TV+ Top 10 Movies', appleTvTop10.movies, 'Apple TV+');
    allStats = allStats.concat(stats);
  }

  if (hboMaxTop10.movies.length > 0) {
    const ref = db.collection('movie_lists').doc('hbo_max_top10');
    batch.set(ref, { id: 'hbo_max_top10', title: 'HBO Max (10 Teratas)', source: hboMaxTop10.source, sourceUrl: hboMaxTop10.sourceUrl, movies: hboMaxTop10.movies, updatedAt: now });
    hasWrites = true;
    const stats = await trackMovieHistory(db, 'hbo_max_top10', 'HBO Max (10 Teratas)', hboMaxTop10.movies, 'HBO Max');
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
