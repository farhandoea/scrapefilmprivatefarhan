const axios = require('axios');

async function checkYear2() {
  const url = 'https://www.netflix.com/tudum/top10/indonesia';
  const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
  
  const text = response.data;
  const index = text.indexOf('Wait for Me To Be Successful Later');
  console.log("Larger Snippet around title:", text.slice(Math.max(0, index - 500), Math.min(text.length, index + 500)));
}
checkYear2();
