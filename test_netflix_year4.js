const axios = require('axios');
const cheerio = require('cheerio');

async function checkYear4() {
  const url = 'https://www.netflix.com/tudum/top10/indonesia';
  const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
  
  const text = response.data;
  const match = text.match(/netflix\.reactContext\.models\.graphql = JSON\.parse\('(.*?)'\);/);
  if (match) {
    let unescaped = match[1].replace(/\\'/g, "'").replace(/\\\\/g, "\\");
    // Some values might be encoded like \x20, we can evaluate it if we are careful, or just parse it.
    // JSON.parse might fail if it's not strictly valid.
    let parsed;
    try {
        parsed = JSON.parse(unescaped);
    } catch(e) {
        console.log("Failed to parse JSON", e.message);
    }
    
    if (parsed && parsed.data) {
        const top10Items = Object.values(parsed.data).filter(item => item.__typename === 'Top10Item');
        
        // Let's sort them or print them
        // the items might have a 'rank' or 'weeksInTop10' or we just match the titles we parsed from HTML with the release year from this JSON.
        
        const videoMetadata = Object.values(parsed.data).filter(item => item.__typename === 'Top10PulseVideo');
        videoMetadata.forEach(v => {
            console.log(v.title, v.releaseYear);
        });
    }
  }
}
checkYear4();
