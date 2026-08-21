const axios = require('axios');
const cheerio = require('cheerio');

async function testCatchplayQuery() {
  const url = 'https://www.catchplay.com/id/search/list?args=DEFAULT%23ALL%23MOST_POPULAR_ALLBRAND';
  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'X-Forwarded-For': '114.124.238.1', // Indonesian IP
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
        // Find the most popular query key
        let listKey = Object.keys(apolloState['ROOT_QUERY']).find(k => k.includes('MOST_POPULAR_ALLBRAND') && k.includes('getProgramSummaries'));
        
        if (listKey) {
            const listObj = apolloState['ROOT_QUERY'][listKey];
            const records = listObj.records;
            
            for(let i = 0; i < Math.min(20, records.length); i++) {
                const ref = records[i].__ref;
                const item = apolloState[ref];
                if (item) {
                    const eng = item.title && item.title.eng ? item.title.eng : '';
                    const loc = item.title && item.title.local ? item.title.local : '';
                    console.log(`[${i+1}] ${eng || loc}`);
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
