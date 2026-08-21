const axios = require('axios');
const cheerio = require('cheerio');

async function checkScripts() {
  const url = 'https://www.catchplay.com/id/search/list?args=DEFAULT%23ALL%23MOST_POPULAR_ALLBRAND';
  const response = await axios.get(url, { headers: {'User-Agent': 'Mozilla/5.0'} });
  const $ = cheerio.load(response.data);
  
  const jsFiles = [];
  $('script[src]').each((i, el) => {
      jsFiles.push($(el).attr('src'));
  });
  console.log("JS files:", jsFiles);
}
checkScripts();
