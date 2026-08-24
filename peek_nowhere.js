const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let serviceAccount = JSON.parse(serviceAccountKey.startsWith('{') ? serviceAccountKey : Buffer.from(serviceAccountKey, 'base64').toString('utf8'));
const auth = new JWT({
  email: serviceAccount.client_email,
  key: serviceAccount.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const doc = new GoogleSpreadsheet('17Of4jJGjERjjSIBNT9kk3K6XrRQDULnwIDBNfOjmpMk', auth);

async function run() {
  await doc.loadInfo();
  const sheets = ['ARSIP NETFLIX INDONESIA', 'Global Movies English', 'Global Films-Non-English', 'ARSIP NETFLIX US'];
  
  for (const s of sheets) {
    const sheet = doc.sheetsByTitle[s];
    if (!sheet) continue;
    const rows = await sheet.getRows();
    const hits = rows.filter(r => (r.get('Judul') || '').toLowerCase().includes('nowhere'));
    if (hits.length > 0) {
      console.log(`Found in ${s}:`);
      hits.forEach(r => {
        console.log(`- Judul: ${r.get('Judul')} | Kategori: ${r.get('Kategori')} | Terakhir Dilihat: ${r.get('Terakhir Dilihat')} | Umur: ${r.get('Umur (Hari)')}`);
      });
    }
  }
}
run();
