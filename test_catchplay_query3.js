const axios = require('axios');
const cheerio = require('cheerio');

async function testCatchplayQuery() {
  const url = 'https://www.catchplay.com/id/search/list?args=DEFAULT%23ALL%23MOST_POPULAR_ALLBRAND';
  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cookie': 'region=ID; language=id'
  };

  try {
    const response = await axios.get(url, { headers: HEADERS, timeout: 12000 });
    const $ = cheerio.load(response.data);
    const nextDataText = $('#__NEXT_DATA__').html();
    
    if (nextDataText) {
      const nextData = JSON.parse(nextDataText);
      const apolloState = nextData.props && nextData.props.apolloState;
      if (apolloState) {
        const rootQuery = apolloState['ROOT_QUERY'];
        console.log("ROOT_QUERY keys:", Object.keys(rootQuery || {}));
        
        // Find which keys map to arrays of references
        for (let k in rootQuery) {
            let val = rootQuery[k];
            if (val && val.items && Array.isArray(val.items)) {
                console.log("Found array of items in:", k);
            }
            if (Array.isArray(val)) {
                console.log("Found direct array in:", k);
            }
            if (val && typeof val === 'object' && !Array.isArray(val)) {
                // look for nested array
                for (let k2 in val) {
                    if (val[k2] && Array.isArray(val[k2])) {
                        console.log("Found nested array in:", k, "->", k2);
                        console.log("Sample:", val[k2][0]);
                    }
                }
            }
        }
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testCatchplayQuery();
