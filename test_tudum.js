const axios = require('axios');
axios.get('https://www.netflix.com/tudum/top10/').then(res => {
  const match = res.data.match(/"categories":\[([^\]]+)\]/);
  if (match) console.log(match[0]);
  else {
    const list = res.data.match(/href="\/tudum\/top10\/([^"]+)"/g);
    console.log([...new Set(list)]);
  }
});
