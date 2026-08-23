const axios = require('axios');
async function check() {
    const response = await axios.get('https://www.netflix.com/tudum/top10/data/all-weeks-countries.tsv', { responseType: 'text' });
    const lines = response.data.split('\n');
    const titles = new Set();
    for (let i = 1; i < lines.length; i++) {
       const line = lines[i];
       if (!line) continue;
       const cols = line.split('\t').map(c => c.trim());
       if (cols[1] === 'ID' && cols[3] === 'Films') {
           titles.add(cols[5]);
       }
    }
    console.log(`Unique movies: ${titles.size}`);
}
check();
