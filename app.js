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
app.get("/api/getCardsWithoutLogin", getCardsWithoutLogin);
app.get("/api/getCardsWithLogin", getCardsWithLogin);
app.get("/api/getAllCategoryData", getAllCategoryData);

//users
app.get("/api/getAllUsers", getAllUsers);
app.get("/api/getOneUser/:email", getOneUser);
app.post("/api/addCategoryPreference", addCategoryPref);
app.post("/api/removeCategoryPreference", removeCategoryPref);
app.get("/api/getLangPref", getLangPref);
app.post("/api/setLangPref", setLangPref);

//analytics
app.get("/api/getCardsWithLoginAnalytics", getCardsWithLoginAnalytics);
app.get("/api/getCardsWithoutLoginAnalytics", getCardsWithoutLoginAnalytics);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
});
