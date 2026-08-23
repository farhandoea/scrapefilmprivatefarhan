const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let serviceAccount = JSON.parse(serviceAccountKey.startsWith('{') ? serviceAccountKey : Buffer.from(serviceAccountKey, 'base64').toString('utf8'));
const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app, 'ai-studio-eed7b5aa-7ae4-40f8-b378-7a5ec50e9d70');
async function run() {
  try {
    const doc1 = await db.collection('movie_history').doc('netflix_global_english').get();
    const doc2 = await db.collection('movie_history').doc('netflix_global_non_english').get();
    const doc3 = await db.collection('movie_history').doc('netflix_us').get();
    
    console.log('Global English keys:', doc1.exists ? Object.keys(doc1.data()).length : 0);
    console.log('Global Non-English keys:', doc2.exists ? Object.keys(doc2.data()).length : 0);
    console.log('Netflix US keys:', doc3.exists ? Object.keys(doc3.data()).length : 0);
  } catch(e) {
    console.error(e);
  }
}
run();
