const axios = require('axios');
const cheerio = require('cheerio');

async function run() {
  try {
    const response = await axios.get('https://www.opensubtitles.org/id', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });
    console.log(response.data.substring(0, 1000));
  } catch (error) {
    if (error.response) {
      console.error(error.response.status);
      console.error(error.response.data.substring(0, 500));
    } else {
      console.error(error.message);
    }
  }
}
run();
