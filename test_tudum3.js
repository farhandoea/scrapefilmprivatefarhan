const axios = require('axios');
axios.get('https://www.netflix.com/tudum/top10/').then(res => {
  console.log(res.data.substring(0, 1000));
  const links = res.data.match(/href="[^"]*top10[^"]*"/g);
  console.log([...new Set(links)]);
});
