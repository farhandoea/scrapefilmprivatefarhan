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
  const sheet = doc.sheetsByTitle['ARSIP NETFLIX INDONESIA'];
  const rows = await sheet.getRows({ limit: 5 });
  rows.forEach(r => {
    console.log(r.get('Judul'), '|', r.get('Terakhir Dilihat'), '|', r.get('Umur (Hari)'), '|', r.get('A'), '|', r.get('B'));
  });
}
run();
