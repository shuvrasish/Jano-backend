const firebase = require("firebase");

const firebaseConfig = {
  apiKey: "AIzaSyC_PJ7fe-WikPfEpF-eL_qft93gezWfUeA",
  authDomain: "swipeekaro.firebaseapp.com",
  projectId: "swipeekaro",
  storageBucket: "swipeekaro.appspot.com",
  messagingSenderId: "110354245418",
  appId: "1:110354245418:web:832d427fc6da9882abe053",
  measurementId: "G-C27D345JWK",
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebaseApp.firestore();
const auth = firebase.auth();

module.exports = { db, auth };
