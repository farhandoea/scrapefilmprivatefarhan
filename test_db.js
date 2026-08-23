const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
let serviceAccount = JSON.parse(serviceAccountKey.startsWith('{') ? serviceAccountKey : Buffer.from(serviceAccountKey, 'base64').toString('utf8'));

const app = initializeApp({ 
  credential: cert(serviceAccount)
});

const db = getFirestore(app, 'ai-studio-eed7b5aa-7ae4-40f8-b378-7a5ec50e9d70');
async function run() {
  try {
    const docRef = db.collection('movie_history').doc('test_doc');
    await docRef.set({ hello: 'world' });
    console.log('Success with Admin SDK!');
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
