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
  getCards,
  setQuotes,
  getQuotes,
} = require("./handlers/cards");
const {
  commentOnCard,
  getCardComments,
  deleteComment,
} = require("./handlers/comments");
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
  dislikeQuote,
  likeQuote,
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
const { postQuiz, attemptQuiz } = require("./handlers/quiz");

app.use(cors({ origin: true })); //write frontend app url instead of  "true" (for safety)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//cards
app.get("/getCardsWithoutLogin", getCardsWithoutLogin);
app.get("/getCardsWithLogin", getCardsWithLogin); //NOT REQUIRED ANYMORE
app.get("/getAllCategoryDataFromCards", getAllCategoryDataFromCards); //returns an array with category and subcategory data. NOT TO BE USED ANYMORE
app.get("/getLikedCards/:email", getLikedCards);
app.get("/getCardsWithHashtag/:category", getCardsWithHashtag);
app.get("/getPreferredCards/:email", getPreferredCards); //NOT REQUIRED ANYMORE
app.get("/getCards/:email", getCards); //returns preferred cards and normal cards in proper order (use this to get the cards for main window)

//quotes
app.post("/dislikeQuote/:quoteid/:email", dislikeQuote);
app.post("/likeQuote/:quoteid/:email", likeQuote);
app.get("/getQuotes", getQuotes); //get latest 100 quotes

//comments
app.post("/comment/:cardid/:email", commentOnCard);
app.get("/getCardComments/:cardid", getCardComments);
app.delete("/comment/:cardid/:email/:commentid", deleteComment);

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

//quiz
app.post("/postQuiz/:email", postQuiz);
app.post("/attemptQuiz/:email/:quizid/:userans", attemptQuiz);

//test
app.get("/test/:email", test); //DO NOT USE
// app.post("/setQuotes", setQuotes);

exports.api = functions.region("asia-south1").https.onRequest(app);

exports.setTrendingCardsSchedule = functions
  .region("asia-south1")
  .pubsub.schedule("0 0 * * *")
  .onRun(async (context) => {
    await setTrendingCards();
    return console.log("Successfully updated value");
  });

exports.setQuotesSchedule = functions
  .region("asia-south1")
  .pubsub.schedule("0 */6 * * *")
  .onRun(async (context) => {
    await setQuotes();
    return console.log("Successfully set quotes!");
  });
