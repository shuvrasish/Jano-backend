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
  getAuthenticatedUser,
  handleShareLoggedIn,
  handleShareNotLoggedIn,
  getShares,
  getFeedbacks,
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
app.get("/getAllCategoryData", getAllCategoryData); //returns an array with category and subcategory data

//users
app.get("/getAllUsers", getAllUsers);
app.get("/getOneUser", getOneUser); //returns all the data associated with the user
app.post("/addCategoryPreference", addCategoryPref);
app.post("/removeCategoryPreference", removeCategoryPref);
app.get("/getLangPref", getLangPref);
app.post("/setLangPref", setLangPref);
app.post("/handleShareLoggedIn", handleShareLoggedIn);
app.post("/handleShareNotLoggedIn", handleShareNotLoggedIn);
app.get("/getShares", getShares);
app.get("/getFeedbacks", getFeedbacks);
app.get("/getAuthenticatedUser", getAuthenticatedUser);

//analytics
app.get("/getCardsWithLoginAnalytics", getCardsWithLoginAnalytics);
app.get("/getCardsWithoutLoginAnalytics", getCardsWithoutLoginAnalytics);

exports.api = functions.region("asia-south1").https.onRequest(app);
