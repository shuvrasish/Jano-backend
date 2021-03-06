const admin = require("firebase-admin");
const firebase = require("firebase");
var serviceAccount = require("./admin-sdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://swipeekaro.firebaseio.com",
});

const db = admin.firestore();
const storage = admin.storage();
module.exports = { admin, db, firebase, storage };
