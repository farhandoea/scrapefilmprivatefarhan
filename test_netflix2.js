const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const url = 'https://www.netflix.com/tudum/top10/indonesia?week=2021-07-04';
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const $ = cheerio.load(data);
  const movies = [];
  $('td.title').each((i, el) => {
    movies.push($(el).text().trim());
  });
  console.log("Titles found:", movies);
}
test();
