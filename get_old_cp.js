const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-applet-config.json');

initializeApp({
  credential: cert(serviceAccount)
});
const db = getFirestore();

async function run() {
  const doc = await db.collection('movie_lists').doc('catchplay_popular').get();
  if (doc.exists) {
    const data = doc.data();
    console.log("Total movies in Firestore:", data.movies.length);
    const fs = require('fs');
    fs.writeFileSync('old_catchplay.json', JSON.stringify(data.movies, null, 2));
  } else {
    console.log("Not found");
  }
}
run();
