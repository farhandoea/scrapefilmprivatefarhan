const axios = require('axios');
const cheerio = require('cheerio');

async function checkYear5() {
  const url = 'https://www.netflix.com/tudum/top10/indonesia';
  const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
  
  const text = response.data;
  const match = text.match(/netflix\.reactContext\.models\.graphql = JSON\.parse\((.*?)\);/);
  if (match) {
    let jsonStringRaw = match[1];
    // jsonStringRaw is a javascript string literal like '{"data":...}'
    // We can evaluate it safely using new Function
    try {
        const jsonString = new Function('return ' + jsonStringRaw)();
        const parsed = JSON.parse(jsonString);
        
        const videoMetadata = Object.values(parsed.data).filter(item => item.__typename === 'Top10PulseVideo');
        videoMetadata.forEach(v => {
            console.log(v.title, v.releaseYear);
        });
    } catch (e) {
        console.error(e.message);
    }
  }
}
checkYear5();
