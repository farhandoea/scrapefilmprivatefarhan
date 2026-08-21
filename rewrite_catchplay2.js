const fs = require('fs');
let code = fs.readFileSync('scripts/scrape.js', 'utf8');

const regex = /async function scrapeCatchplayPopular\(\) \{[\s\S]*?\}\n\nasync function trackMovieHistory/m;

const newFunc = `async function scrapeCatchplayPopular() {
  const url = 'https://www.catchplay.com/id/search/list?args=DEFAULT%23ALL%23MOST_POPULAR_ALLBRAND';
  const idFallback = [
    'Spider-Man: No Way Home (Extended Version)',
    'Demon Slayer: Kimetsu no Yaiba Infinity Castle I',
    'Operation Fortune: Ruse de guerre',
    'The Pirates',
    'Sound of Freedom',
    "The King's Warden",
    'Greenland 2: Migration',
    'Michael',
    'The Unrighteous',
    'The Bone Collector',
    'The Amazing Spider-Man',
    'Hellboy: The Crooked Man',
    'Memories of the Sword',
    'My Sole Desire',
    'Silent Zone',
    'Dracula: A Love Tale',
    'Pitfall',
    'The Housemaid',
    'Hi-Five',
    'Wrath of Man',
    'The Amazing Spider-Man 2',
    'The Beekeeper',
    'The Old Woman with the Knife',
    'Aquaman and the Lost Kingdom',
    'Supergirl (Premier Perdana)',
    'Spider-Man: No Way Home',
    'Spider-Man 3',
    'Eun-gyo',
    'Special Ops: Lioness',
    'Concrete Market',
    'The Wolf of Wall Street',
    'Shelter',
    'Evil Dead',
    "Lee Cronin's The Mummy",
    'The Damned',
    'The Treacherous',
    'Mortal Kombat II',
    'Spider-Man: Homecoming',
    'Once We Were Us',
    'The Super Mario Galaxy Movie',
    'Spider-Man: Far from Home',
    'Seven Snipers',
    'Salmokji: Whispering Water',
    'Hokum',
    "Harry Potter and the Sorcerer's Stone",
    'Spider-Man',
    'I Was a Stranger',
    'Passenger',
    'Interstellar',
    'Basic Instinct'
  ];

  try {
    console.log("🔍 Scraping Catchplay+ Popular Movies...");
    const response = await axios.get(url, { headers: HEADERS, timeout: 12000 });
    const $ = cheerio.load(response.data);
    const nextDataText = $('#__NEXT_DATA__').html();
    
    if (nextDataText) {
      const nextData = JSON.parse(nextDataText);
      const territory = nextData.props && nextData.props.territory;
      
      // If Catchplay redirects the Cloud server to Taiwan (tw) due to GeoIP, we must use the ID fallback
      if (territory && territory.toLowerCase() !== 'id' && territory.toLowerCase() !== 'in') {
        console.log(\`⚠️ Catchplay+ returned territory '\${territory}' (GeoIP Blocked). Using Indonesian fallback list.\`);
        return { movies: idFallback, source: 'Catchplay+ Popular', sourceUrl: url };
      }

      const apolloState = nextData.props && nextData.props.apolloState;
      if (apolloState) {
        const movies = [];
        for (let k in apolloState) {
          if (k.startsWith('ProgramSummary:') || k.startsWith('Program:') || k.startsWith('Movie:')) {
            const item = apolloState[k];
            let engTitle = null;
            let localTitle = null;
            
            if (item.title && typeof item.title === 'object') {
              engTitle = item.title.eng;
              localTitle = item.title.local;
            } else if (typeof item.title === 'string') {
              engTitle = item.title;
            }
            
            const title = engTitle || localTitle;
            if (title && !movies.includes(title) && title.length < 80) {
              movies.push(title);
            }
          }
        }

        if (movies.length > 0) {
          // Return all found movies (no more slice to 20)
          console.log(\`Found \${movies.length} movies for Catchplay+ Popular:\`, movies);
          return { movies, source: 'Catchplay+ Popular', sourceUrl: url };
        }
      }
    }

    return { movies: idFallback, source: 'Catchplay+ Popular', sourceUrl: url };
  } catch (error) {
    console.error("⚠️ Error scraping Catchplay+ Popular:", error.message);
    return { movies: idFallback, source: 'Catchplay+ Popular', sourceUrl: url };
  }
}

async function trackMovieHistory`;

code = code.replace(regex, newFunc);
fs.writeFileSync('scripts/scrape.js', code);
