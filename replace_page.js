const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

const regex = /catchplay_popular:\s*\{\s*id:\s*'catchplay_popular',\s*title:\s*'Catchplay\+\s*Most\s*Popular',\s*source:\s*'Catchplay\+\s*Popular',\s*sourceUrl:\s*'https:\/\/www\.catchplay\.com\/id\/search\/list\?args=DEFAULT%23ALL%23MOST_POPULAR_ALLBRAND',\s*movies:\s*\[([\s\S]*?)\],\s*updatedAt:\s*\d+\s*\}/m;

const newObj = `catchplay_popular: {
    id: 'catchplay_popular',
    title: 'Catchplay+ Most Popular',
    source: 'Catchplay+ Popular',
    sourceUrl: 'https://www.catchplay.com/id/search/list?args=DEFAULT%23ALL%23MOST_POPULAR_ALLBRAND',
    movies: [
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
    ],
    updatedAt: 1771706900000
  }`;

code = code.replace(regex, newObj);
fs.writeFileSync('app/page.tsx', code);
