const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const {
  getCardsWithoutLogin,
  getCardsWithLogin,
  getAllCategoryDataFromCards,
  getLikedCards,
} = require("./handlers/cards");
const { commentOnCard, getCardComments } = require("./handlers/comments");
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
  getSelectedCategories,
} = require("./handlers/users");
const {
  getCardsWithLoginAnalytics,
  getCardsWithoutLoginAnalytics,
  getCardAnalytics,
} = require("./handlers/analytics");
const { getTrends } = require("./handlers/trends");
const { getAllCategoryData } = require("./handlers/categories");

app.use(cors({ origin: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//cards
app.get("/getCardsWithoutLogin", getCardsWithoutLogin);
app.get("/getCardsWithLogin", getCardsWithLogin);
app.get("/getAllCategoryDataFromCards", getAllCategoryDataFromCards); //returns an array with category and subcategory data. NOT TO BE USED ANYMORE
app.get("/getLikedCards/:email", getLikedCards);

//comments
app.post("/comment/:cardid/:email", commentOnCard);
app.get("/getCardComments/:cardid", getCardComments);

//users
app.get("/getAllUsers", getAllUsers);
app.get("/getOneUser/:email", getOneUser); //returns all the data associated with the user
app.post("/addCategoryPreference/:email/:category", addCategoryPref);
app.delete("/removeCategoryPreference/:email/:category", removeCategoryPref);
app.get("/getLangPref/:email", getLangPref);
app.post("/setLangPref/:email/:lang", setLangPref);
app.post("/handleShareLoggedIn/:email", handleShareLoggedIn);
app.post("/handleShareNotLoggedIn", handleShareNotLoggedIn);
app.get("/getShares/:email", getShares);
app.get("/getFeedbacks/:email", getFeedbacks);
app.get("/getAuthenticatedUser", getAuthenticatedUser);
app.get("/getSelectedCategories/:email", getSelectedCategories);

//analytics
app.get("/getCardsWithLoginAnalytics", getCardsWithLoginAnalytics);
app.get("/getCardsWithoutLoginAnalytics", getCardsWithoutLoginAnalytics);
app.get("/getCardAnalytics/:cardid", getCardAnalytics);

//categories
app.get("/getAllCategories", getAllCategoryData);

//trends
app.get("/getTrends", getTrends);

exports.api = functions.region("asia-south1").https.onRequest(app);
