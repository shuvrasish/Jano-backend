const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const app = express();
const {
  getCardsWithoutLogin,
  getCardsWithLogin,
  getAllCategoryData,
} = require("./handlers/cards");
const {
  getAllUsers,
  getOneUser,
  addCategoryPref,
  removeCategoryPref,
  getLangPref,
  setLangPref,
} = require("./handlers/users");
const {
  getCardsWithLoginAnalytics,
  getCardsWithoutLoginAnalytics,
} = require("./handlers/analytics");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).send("Hello");
});

//cards
app.get("/getCardsWithoutLogin", getCardsWithoutLogin);
app.get("/getCardsWithLogin", getCardsWithLogin);
app.get("/getAllCategoryData", getAllCategoryData);

//users
app.get("/getAllUsers", getAllUsers);
app.get("/getOneUser/:email", getOneUser);
app.post("/addCategoryPreference", addCategoryPref);
app.post("/removeCategoryPreference", removeCategoryPref);
app.get("/getLangPref", getLangPref);
app.post("/setLangPref", setLangPref);

//analytics
app.get("/getCardsWithLoginAnalytics", getCardsWithLoginAnalytics);
app.get("/getCardsWithoutLoginAnalytics", getCardsWithoutLoginAnalytics);

exports.api = functions.region("asia-south1").https.onRequest(app);
