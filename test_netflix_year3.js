const axios = require('axios');
const cheerio = require('cheerio');

async function checkYear3() {
  const url = 'https://www.netflix.com/tudum/top10/indonesia';
  const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
  const $ = cheerio.load(response.data);
  
  $('script').each((i, el) => {
    const text = $(el).html();
    if (text && text.includes('netflix.reactContext.models.graphql')) {
      const match = text.match(/netflix\.reactContext\.models\.graphql = JSON\.parse\('(.*?)'\);/);
      if (match) {
        try {
          // It's encoded usually
          let parsed;
          try {
             const unescaped = match[1].replace(/\\'/g, "'").replace(/\\\\/g, "\\");
             parsed = JSON.parse(unescaped);
          } catch(e) {
             console.log("direct parse fail, trying without unescape", e.message);
             try {
                parsed = JSON.parse(match[1]);
             } catch(e2) {
               console.log("parse fail", e2.message);
             }
          }
          if(parsed) {
             const jsonString = JSON.stringify(parsed, null, 2);
             console.log("Keys in data:", Object.keys(parsed.data || {}).length);
             const lines = jsonString.split('\n');
             const idx = lines.findIndex(l => l.includes('Wait for Me'));
             if (idx !== -1) {
                console.log(lines.slice(Math.max(0, idx - 10), idx + 20).join('\n'));
             }
          }
        } catch(e) { console.error(e) }
      }
    }
  });
}
checkYear3();
