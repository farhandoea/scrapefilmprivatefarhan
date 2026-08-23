const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let serviceAccount;
const rawKey = serviceAccountKey.trim();
if (rawKey.startsWith('{')) {
  serviceAccount = JSON.parse(rawKey);
} else {
  serviceAccount = JSON.parse(Buffer.from(rawKey, 'base64').toString('utf8'));
}
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
async function run() {
  try {
    const docRef = db.collection('movie_history').doc('test_doc');
    await docRef.set({ hello: 'world' });
    console.log('Success!');
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
