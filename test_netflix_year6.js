const axios = require('axios');

async function checkYear6() {
  const url = 'https://www.netflix.com/tudum/top10/indonesia';
  const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }});
  
  const text = response.data;
  const regex = /"__typename":"Top10PulseVideo","title":"([^"]+)",(?:.*?)"releaseYear":(\d+)/g;
  
  let m;
  while ((m = regex.exec(text)) !== null) {
      console.log(m[1], m[2]);
  }
}
checkYear6();
