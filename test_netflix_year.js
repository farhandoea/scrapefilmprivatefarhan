const axios = require('axios');
const cheerio = require('cheerio');

async function checkYear() {
  const url = 'https://www.netflix.com/tudum/top10/indonesia';
  const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
  const $ = cheerio.load(response.data);
  
  // Find script tags containing JSON data
  $('script').each((i, el) => {
    const text = $(el).html();
    if (text && text.includes('Wait for Me To Be Successful Later')) {
      console.log(`Found title in script ${i}.`);
      
      // Try to find a snippet around the title
      const index = text.indexOf('Wait for Me To Be Successful Later');
      console.log("Snippet:", text.slice(Math.max(0, index - 200), Math.min(text.length, index + 200)));
    }
  });
}
checkYear();
