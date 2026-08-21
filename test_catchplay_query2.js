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
        
        let searchListKey = Object.keys(rootQuery).find(k => k.startsWith('getSearchList'));
        if (searchListKey) {
            console.log("Found getSearchList:", searchListKey);
            const listObj = rootQuery[searchListKey];
            const items = listObj.items;
            console.log("Found items count:", items ? items.length : 0);
            
            if (items && items.length > 0) {
               for (let i = 0; i < Math.min(20, items.length); i++) {
                   const ref = items[i].__ref;
                   if (ref) {
                       const itemData = apolloState[ref];
                       const eng = itemData.title && itemData.title.eng ? itemData.title.eng : '';
                       const loc = itemData.title && itemData.title.local ? itemData.title.local : '';
                       console.log(`[${i+1}] ${eng || loc}`);
                   }
               }
            }
        } else {
            console.log("Keys in ROOT_QUERY:", Object.keys(rootQuery).filter(k => k.toLowerCase().includes('search') || k.toLowerCase().includes('list')));
        }
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testCatchplayQuery();
