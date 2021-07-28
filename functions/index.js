const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const wiki = require("wikipedia");
const { db } = require("./config/firebase-config");
const axios = require("axios").default;
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
  getLiked,
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
  likeCard,
  dislikeCard,
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
const { test, setDb, setDbx } = require("./test");
const {
  postQuiz,
  attemptQuiz,
  getAttemptedQuizes,
  reAttemptQuiz,
} = require("./handlers/quiz");

app.use(cors({ origin: true })); //write frontend app url instead of  "true" (for safety)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//cards
app.get("/getCardsWithoutLogin", getCardsWithoutLogin);
app.get("/getCardsWithHashtag/:category", getCardsWithHashtag);
app.get("/getPreferredCards/:email", getPreferredCards); //NOT REQUIRED ANYMORE
app.get("/getCards/:email", getCards); //returns preferred cards and normal cards in proper order (use this to get the cards for main window)
app.get("/getLiked/:email", getLiked);

//quotes
app.post("/dislikeQuote/:quoteid/:email", dislikeQuote);
app.post("/likeQuote/:quoteid/:email", likeQuote);
app.get("/getQuotes", getQuotes); //get latest 100 quotes
app.post("/setQuotes", setQuotes); //not necessary

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
app.post("/likeCard/:email/:cardid", likeCard);
app.post("/dislikeCard/:email/:cardid", dislikeCard);

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
app.get("/getAttemptedQuizes/:email", getAttemptedQuizes);
app.post("/reAttemptQuiz/:email/:userans/:quizid", reAttemptQuiz);

//test
app.get("/test/:email", test); //DO NOT USE
app.put("/setDb", setDb);
app.put("/setDbx", setDbx);

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

const getArticle = async (topic) => {
  try {
    const page = await wiki.page(topic);
    if (page) {
      const webpage_url = page.fulllurl || page.canonicalurl;
      const pageid = page.pageid;
      const title = page.title;
      const ns = page.ns;

      const summary = await page.summary();
      if (summary.type === "no-extract") {
        return null;
      }
      let mainImage = summary.originalimage
        ? summary.originalimage.source
        : null;
      const coordinates = await page.coordinates();
      let categories = await page.categories();
      categories = categories.map((category) => category.split(":")[1]);
      const summ = summary.extract;
      const subheading = summary.description
        ? summary.description
        : categories[0];
      let images = await page.images();
      images = images.slice(0, 3);
      images = images.map((imageData) => imageData.url);
      if (!mainImage) mainImage = images[0];
      return {
        heading: title,
        summary: summ,
        pageid: pageid,
        subheading: subheading,
        main_category: categories[0],
        categories,
        mainImage,
        ns: ns,
        webpage_url: webpage_url,
        reference: "From Wikipedia, the free encyclopedia",
        image_links: images,
        coordinates: coordinates,
        createdOn: new Date().toISOString(),
        type: "normal",
      };
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
    return null;
  }
};

exports.setNewCards = functions
  .runWith({ timeoutSeconds: 540, memory: "1GB" })
  .pubsub.schedule("0 1 * * *")
  .onRun(async (context) => {
    try {
      const resp = await axios.get(
        "https://asia-south1-swipeekaro.cloudfunctions.net/api/getAllCategories"
      );
      let categoriesCol = resp.data;
      let topics = [];
      for (let doc of categoriesCol) {
        for (let categoryData of doc.main_category) {
          let response;
          if (categoryData.cmcontinue !== "") {
            try {
              response = await axios.get(
                `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${categoryData.category}&cmsort=timestamp&cmcontinue=${categoryData.cmcontinue}&cmtype=page&cmdir=desc&format=json&cmlimi=1`
              );
            } catch (err) {
              console.log(err);
            }
          } else {
            try {
              response = await axios.get(
                `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${categoryData.category}&cmsort=timestamp&cmtype=page&cmdir=desc&format=json&cmlimit=1`
              );
            } catch (err) {
              console.log(err);
            }
          }
          if (response.data.continue.cmcontinue) {
            let pages = [...response.data.query.categorymembers];
            pages = pages.map((pagedata) => ({
              ...pagedata,
              main_category: categoryData.category,
            }));
            topics = [...topics, ...pages];
            categoryData.cmcontinue = response.data.continue.cmcontinue;
          }
        }
      }

      let articles = [];
      for (let topicData of topics) {
        let article = await getArticle(topicData.pageid);
        if (article) {
          articles.push({ ...article, main_category: topicData.main_category });
        }
      }

      let newcardsRef = await db.collection("CardsWithLogin").get();
      let num = newcardsRef.size + 1;
      let batch = db.batch();
      articles.forEach((article) => {
        let docRef = db.collection("CardsWithLogin").doc(`${num}`);
        batch.set(docRef, {
          ...article,
          id: num.toString(),
          sid: num,
        });
        num++;
      });
      let promises = [];
      let index = 0;
      let catRef = await db.collection("category_mapping").get();
      catRef.forEach((doc) => {
        promises.push(
          doc.ref.set(
            { main_category: categoriesCol[index++].main_category },
            { merge: true }
          )
        );
      });
      await Promise.all(promises);
      await batch.commit();
      console.log("Docs updated!");
    } catch (err) {
      console.log(err);
    }
  });
