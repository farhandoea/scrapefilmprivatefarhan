const axios = require('axios');
axios.get('https://www.netflix.com/tudum/top10/').then(res => {
  const match = res.data.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
  if (match) {
      const data = JSON.parse(match[1]);
      console.log(JSON.stringify(data.props.pageProps.initialState, null, 2));
  }
});
