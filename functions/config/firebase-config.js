const admin = require("firebase-admin");
const firebase = require("firebase");
var serviceAccount = require("./swipeekaro-firebase-adminsdk-dnc14-595c45a48e.json");

admin.initializeApp({credential: admin.credential.cert(serviceAccount)});

const db = admin.firestore();

module.exports = { admin, db, firebase };
