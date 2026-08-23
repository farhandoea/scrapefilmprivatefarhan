const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let serviceAccount;
const rawKey = serviceAccountKey.trim();
if (rawKey.startsWith('{')) {
  serviceAccount = JSON.parse(rawKey);
} else {
  const decoded = Buffer.from(rawKey, 'base64').toString('utf8');
  serviceAccount = JSON.parse(decoded);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore('ai-studio-eed7b5aa-7ae4-40f8-b378-7a5ec50e9d70');

const movies = [
  "The Unrighteous", "The Damned", "Demon Slayer: Kimetsu no Yaiba Infinity Castle I", "Silent Zone", "Mortal Kombat II",
  "Spider-Man: No Way Home", "Spider-Man: No Way Home (Extended Version)", "Special Ops: Lioness", "Evil Dead", "Basic Instinct",
  "Eungyo", "The Super Mario Galaxy Movie", "Spider-Man: Far From Home", "Concrete Market", "The Treacherous",
  "Supergirl (Premier Perdana)", "Aquaman and the Lost Kingdom", "The Wolf of Wall Street", "The King's Warden", "Greenland 2: Migration",
  "Pitfall", "Seven Snipers", "Hi-Five", "I Was a Stranger", "The Beekeeper",
  "Memories of the Sword", "Salmokji: Whispering Water", "Hokum", "Hellboy: The Crooked Man", "Dracula: A Love Tale",
  "Spider-Man 3", "Spider-Man: Homecoming", "The Amazing Spider-Man 2", "My Sole Desire", "Shelter",
  "Wrath of Man", "Once We Were Us", "Harry Potter and the Sorcerer's Stone", "Michael", "The Amazing Spider-Man",
  "Spider-Man", "The Pirates", "The Old Woman with the Knife", "Operation Fortune: Ruse de guerre", "Lee Cronin's The Mummy",
  "The Housemaid", "Passenger", "The Bone Collector", "Interstellar", "Sound of Freedom",
  "Insidious: Chapter 2", "Heretic", "Cleaner", "All the Way", "Spider-Man 2",
  "The Divine Fury", "Bloody Smart", "Chloe", "The Conjuring", "Lost",
  "Shame", "The Conjuring 2", "The Departed", "Spider-Man: Into the Spider-Verse", "In the Lost Lands",
  "John Wick: Chapter 4", "Second Sister", "Keeper", "Brave Citizen", "Love in the Big City",
  "Children...", "Utusan Iblis: Dia Yang Berada di Antara Kita", "Subservience", "Apocalypto", "The Nun",
  "The Reader", "Dark Spell", "Love, Lies", "The Ritual", "The Neighbors",
  "The Miniature Wife", "Canary Black", "The Superdeep", "M.I.A.", "Hidden Strike",
  "Holy Night: Demon Hunters", "Rebirth Island", "Absolution", "Last Summer", "Hope",
  "Yadang: The Snitch", "Arwah", "Pee Nak 5", "Harry Potter and the Deathly Hallows: Part 1", "Annabelle Comes Home",
  "The Conjuring: Last Rites", "Innocent Thing", "Inglourious Basterds", "The Agency: Central Intelligence", "Insidious: Chapter 3",
  "Omniscient Reader: The Prophecy", "Legends of the Condor Heroes: The Gallants", "Tarot", "Insidious: The Last Key", "Misbehavior",
  "Islanders", "Along with the Gods: The Two Worlds", "Evil Dead Rise", "The Closet", "Harry Potter and the Half-Blood Prince",
  "Harry Potter and the Chamber of Secrets", "Mission: Impossible - The Final Reckoning", "Final Destination: Bloodlines", "Oppenheimer", "Harry Potter and the Prisoner of Azkaban",
  "Harry Potter and the Deathly Hallows: Part 2", "Inception", "We Bury The Dead", "Tenet", "Harry Potter and the Goblet of Fire",
  "The Hobbit: An Unexpected Journey (Extended Edition)", "We Live in Time", "Harry Potter and the Order of the Phoenix", "Shaolin Soccer", "The Hobbit: The Desolation of Smaug (Extended Edition)",
  "Weapons", "Zack Snyder's Justice League", "Spider-Man: Across the Spider-Verse", "Superman", "Den of Thieves: Pantera",
  "Crazy Rich Asians", "The Dark Knight Rises", "The Dark Knight", "Dune", "They Will Kill You",
  "Relay", "Whistle", "The Lord of the Rings: The Fellowship of the Ring (Extended Edition)", "The Nun II", "Dune: Part Two",
  "Batman Begins", "Wuthering Heights", "The Hobbit: The Battle of the Five Armies (Extended Edition)", "Warfare", "Sonic the Hedgehog 3",
  "Scream 7", "Murder Report", "The Long Walk", "Meg 2: The Trench", "The Lord of the Rings: The Return of the King (Extended Edition)",
  "Justice League", "A Minecraft Movie", "The Conjuring: The Devil Made Me Do It", "Afterburn", "The Strangers: Chapter 2",
  "It Ends With Us", "Wildcat", "Me Before You", "The Angry Birds Movie", "Black Phone 2",
  "A Man Called Otto", "The Lord of the Rings: The Two Towers (Extended Edition)", "Top Gun: Maverick", "28 Years Later", "Karate Kid: Legends",
  "That Time I Got Reincarnated as a Slime the Movie: Scarlet Bond", "The Exorcist: The Version You've Never Seen", "Fantastic Beasts and Where to Find Them", "Fantastic Beasts: The Secrets of Dumbledore", "Transformers One",
  "The Batman", "Transformers: Rise of the Beasts", "Dunkirk", "One Battle After Another", "Joker",
  "Sniper: No Nation", "Primate", "Gladiator II", "Sisu", "Anyone But You",
  "Sonic the Hedgehog 2", "Mother!", "Transformers: Dark Of The Moon", "It: Chapter Two", "The Super Mario Bros. Movie",
  "Insidious: The Red Door", "PAW Patrol: The Mighty Movie", "The SpongeBob Movie: Search for SquarePants", "Rings", "Novocaine",
  "Captain Phillips", "Concubine", "Borders of Love", "Love at the End of the World", "Girls to Buy",
  "In the Room", "Moebius", "Come Undone", "My Sex Doll Bodyguard", "Nineteen: Shh! No Imagining!"
];

async function run() {
  const ref = db.collection('movie_lists').doc('catchplay_popular');
  await ref.update({
    movies: movies,
    updatedAt: new Date().toISOString()
  });
  console.log("Updated Catchplay lists! Count:", movies.length);

  const historyRef = db.collection('movie_history').doc('catchplay_popular');
  const doc = await historyRef.get();
  let existingStats = doc.exists ? doc.data().movies || [] : [];
  
  const now = new Date().toISOString();
  let updatedStats = [...existingStats];

  for (const title of movies) {
      const existing = updatedStats.find(m => m.title === title);
      if (existing) {
          existing.daysInTop = (existing.daysInTop || 0) + 1;
          existing.lastSeenAt = now;
      } else {
          updatedStats.push({
              title,
              source: 'Catchplay+',
              daysInTop: 1,
              firstSeenAt: now,
              lastSeenAt: now
          });
      }
  }

  updatedStats.sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt));
  updatedStats = updatedStats.slice(0, 1000);

  await historyRef.set({
      id: 'catchplay_popular',
      listName: 'Catchplay+ Popular Movies',
      updatedAt: now,
      movies: updatedStats
  });
  console.log("Updated Catchplay history!");
  
  let scrapeJs = fs.readFileSync('scripts/scrape.js', 'utf8');
  const fallbackString = JSON.stringify(movies, null, 2);
  const regex = /(const idFallback = )\[[\s\S]*?\];/;
  scrapeJs = scrapeJs.replace(regex, `$1${fallbackString};`);
  fs.writeFileSync('scripts/scrape.js', scrapeJs);
  console.log("Updated scrape.js with precise image fallback");
  
  process.exit(0);
}
run().catch(console.error);
