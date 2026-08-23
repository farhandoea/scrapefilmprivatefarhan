const { JWT } = require('google-auth-library');
const { GoogleSpreadsheet } = require('google-spreadsheet');

async function check() {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  let serviceAccount;
  const rawKey = serviceAccountKey.trim();
  if (rawKey.startsWith('{')) {
    serviceAccount = JSON.parse(rawKey);
  } else {
    serviceAccount = JSON.parse(Buffer.from(rawKey, 'base64').toString('utf8'));
  }

  const jwt = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet('1dIN7UNjzOgEvUF2d_w2UFXBC97mIKXQmBly4R_2730k', jwt);
  try {
    await doc.loadInfo();
    console.log("Doc title:", doc.title);
    const sheet = doc.sheetsByTitle['Sheet1'] || doc.sheetsByIndex[0];
    console.log("Sheet title:", sheet.title);
    
    await sheet.loadCells('A1:C10');
    console.log("A1:", sheet.getCell(0, 0).value);
    console.log("A2:", sheet.getCell(1, 0).value);
    console.log("A3:", sheet.getCell(2, 0).value);
  } catch (err) {
    console.error(err);
  }
}
check();
