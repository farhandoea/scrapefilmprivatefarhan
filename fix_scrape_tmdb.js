const fs = require('fs');

let scrapeJs = fs.readFileSync('scripts/scrape.js', 'utf8');
const fallbackData = fs.readFileSync('tmdb_catchplay.json', 'utf8');

// Replace the idFallback array in scrapeCatchplayPopular
const regex = /(const idFallback = )\[[\s\S]*?\];/;
scrapeJs = scrapeJs.replace(regex, `$1${fallbackData};`);

fs.writeFileSync('scripts/scrape.js', scrapeJs);
console.log("Updated scripts/scrape.js with TMDB data");
