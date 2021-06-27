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
  getCardsWithHashtag,
  getPreferredCards,
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
const {
  getTrends,
  getTrendingCards,
  setTrendingCards,
} = require("./handlers/trends");
const { getAllCategoryData } = require("./handlers/categories");
const { test } = require("./test");

app.use(cors({ origin: true })); //write frontend app url instead of  "true" (for safety)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//cards
app.get("/getCardsWithoutLogin", getCardsWithoutLogin);
app.get("/getCardsWithLogin", getCardsWithLogin);
app.get("/getAllCategoryDataFromCards", getAllCategoryDataFromCards); //returns an array with category and subcategory data. NOT TO BE USED ANYMORE
app.get("/getLikedCards/:email", getLikedCards);
app.get("/getCardsWithHashtag/:category", getCardsWithHashtag);
app.get("/getPreferredCards/:email", getPreferredCards);

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
app.get("/getTrends", getTrends); //DO NOT USE
app.get("/getTrendingCards", getTrendingCards); //Use this to get All trending Cards
app.post("/setTrendingCards", setTrendingCards); //DO NOT USE (just for testing)

//test
app.get("/test/", test);

exports.api = functions.region("asia-south1").https.onRequest(app);

exports.setTrendingCardsSchedule = functions
  .region("asia-south1")
  .pubsub.schedule("0 0 * * *")
  .onRun(async (context) => {
    await setTrendingCards();
    return console.log("Successfully updated value");
  });
