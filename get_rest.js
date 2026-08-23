const axios = require('axios');
const fs = require('fs');

async function run() {
  try {
    // Project ID is likely "ai-studio-eed7b5aa-7ae4-40f8-b378-7a5ec50e9d70"
    const res = await axios.get('https://firestore.googleapis.com/v1/projects/ai-studio-eed7b5aa-7ae4-40f8-b378-7a5ec50e9d70/databases/(default)/documents/movie_lists/catchplay_popular');
    const fields = res.data.fields;
    const movies = fields.movies.arrayValue.values.map(v => v.stringValue);
    console.log("Found movies:", movies.length);
    fs.writeFileSync('old_catchplay.json', JSON.stringify(movies, null, 2));
  } catch (e) {
    console.log(e.message);
  }
}
run();
