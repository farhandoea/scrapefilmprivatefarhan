const fs = require('fs');
let code = fs.readFileSync('scripts/scrape.js', 'utf8');

const regex = /async function scrapeKlikFilmTrending\(\) \{[\s\S]*?\}\n\nasync function trackMovieHistory/m;

const newFunc = `async function scrapeKlikFilmTrending() {
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
            targetUrl = href.startsWith('http') ? href : \`https://klikfilm.com\${href.startsWith('/') ? '' : '/'}\${href}\`;
          }
        }
      });
      console.log(\`🎯 Dynamically resolved KlikFilm Trending URL: \${targetUrl}\`);
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
      console.log(\`Found \${result.length} movies for KlikFilm Trending:\`, result);
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

async function trackMovieHistory`;

code = code.replace(regex, newFunc);
fs.writeFileSync('scripts/scrape.js', code);
