const axios = require('axios');
const cheerio = require('cheerio');

async function checkApollo() {
  const url = 'https://www.catchplay.com/id/search/list?args=DEFAULT%23ALL%23MOST_POPULAR_ALLBRAND';
  const response = await axios.get(url, { headers: {'User-Agent': 'Mozilla/5.0'} });
  const $ = cheerio.load(response.data);
  const nextData = JSON.parse($('#__NEXT_DATA__').html());
  console.log(nextData.props.apolloClient);
  console.log("env:", nextData.env);
  console.log("runtimeConfig:", nextData.runtimeConfig);
}
checkApollo();
