const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const url = 'https://www.netflix.com/tudum/top10/indonesia?week=2021-07-04';
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const $ = cheerio.load(data);
  const rows = [];
  $('table tbody tr').each((i, el) => {
    const rank = $(el).find('td').eq(0).text().trim();
    const title = $(el).find('td').eq(1).text().trim();
    const weeks = $(el).find('td').eq(2).text().trim();
    if(title) rows.push({ rank, title, weeks });
  });
  console.log("Total rows found:", rows.length);
  console.log(rows.slice(0, 15));
}
test();
