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
    const sheet = doc.sheetsByTitle['INDONESIA'];
    if (!sheet) {
      console.log("Available sheets:", Object.keys(doc.sheetsByTitle));
      return;
    }
    console.log("Sheet title:", sheet.title);
    
    await sheet.loadCells('A1:C10');
    for(let i=0; i<5; i++) {
      console.log(`Row ${i}: A=${sheet.getCell(i, 0).value}, B=${sheet.getCell(i, 1).value}, C=${sheet.getCell(i, 2).value}`);
    }
  } catch (err) {
    console.error(err);
  }
}
check();
