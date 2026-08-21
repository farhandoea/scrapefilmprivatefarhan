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
        // Look for the specific search query in root
        for (let key in rootQuery) {
          if (key.includes('search') || key.includes('list')) {
            console.log("Found query key:", key);
            // Let's inspect its contents
            const q = rootQuery[key];
            if (q.items || q.list || q.edges) {
               console.log("Found items array in this query.");
            }
          }
        }
        
        // Alternatively, search for the title 'Spider-Man: No Way Home (Extended Version)'
        let spiderRef = null;
        for (let k in apolloState) {
           let item = apolloState[k];
           let eng = item && item.title && item.title.eng ? item.title.eng : null;
           let loc = item && item.title && item.title.local ? item.title.local : null;
           if (eng && eng.includes('Spider-Man: No Way Home') || loc && loc.includes('Spider-Man: No Way Home')) {
             console.log("Found Spider-Man in apollo state:", k, eng, loc);
             spiderRef = k;
           }
        }
        
        // Let's trace where spiderRef is referenced!
        if (spiderRef) {
           for (let k in apolloState) {
             let val = JSON.stringify(apolloState[k]);
             if (val.includes(spiderRef) && k !== spiderRef) {
                console.log(spiderRef, "is referenced in:", k);
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
