const axios = require('axios');
const cheerio = require('cheerio');

async function checkConfig() {
  const url = 'https://www.catchplay.com/id/search/list?args=DEFAULT%23ALL%23MOST_POPULAR_ALLBRAND';
  const response = await axios.get(url, { 
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Cookie': 'territory=id; region=ID; locale=id; country=ID; country_code=ID; X-Country-Code=ID',
      'X-Forwarded-For': '114.124.238.1',
      'X-Country-Code': 'ID',
      'CF-IPCountry': 'ID'
    } 
  });
  const $ = cheerio.load(response.data);
  const nextData = JSON.parse($('#__NEXT_DATA__').html());
  console.log('territory:', nextData.props.territory);
  console.log('locale:', nextData.props.locale);
}
checkConfig();
