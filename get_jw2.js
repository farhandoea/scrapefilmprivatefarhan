const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeJustWatch() {
    const res = await axios.get('https://www.justwatch.com/id/provider/catchplay/movies?sort_by=popular', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    
    const $ = cheerio.load(res.data);
    let movies = [];
    $('img').each((i, el) => {
      const alt = $(el).attr('alt');
      if (alt && !alt.toLowerCase().includes('justwatch') && !alt.toLowerCase().includes('logo')) {
        movies.push(alt);
      }
    });
    console.log(movies.slice(0, 10));
}
scrapeJustWatch();
