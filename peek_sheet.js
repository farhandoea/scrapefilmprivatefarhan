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
  await sheet.loadHeaderRow();
  console.log('Headers:', sheet.headerValues);
}
run();
