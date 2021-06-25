const axios = require("axios");
const trends = require("google-trends-api");
const wiki = require("wikijs").default;

// wiki()
//   .page("Hello")
//   .then((page) => console.log(page))
//   .catch((err) => console.log(err));

const wikiapi = async (topic) => {
  try {
    let page = await wiki().page(topic);
    let summary = await page.summary();
    // let main_image = await page.mainImage();
    return {
      title: page.title,
      summary: summary,
      // mainImage: main_image,
      url: page.fullurl || page.canonicalurl,
    };
  } catch (err) {
    console.log(err);
    return null;
  }
};

// wikiapi("UPSSSC PET");
let arr = [
  "Nelson Mandela",
  "Parker",
  "UPSSSC PET",
  "Bolt",
  "Rainbow",
  "Crossword",
];

const getArticles = async (topics) => {
  let articles = [];
  for (let topic of topics) {
    let article = await wikiapi(topic);
    if (article) {
      articles.push(article);
    }
  }
  // console.log(articles);
  return articles;
};

// getArticles(arr);

exports.getData = async (req, res) => {
  try {
    let results = await trends.dailyTrends({
      geo: "IN",
      trendDate: new Date(),
      category: "all",
    });

    results = JSON.parse(results);
    results = results.default.trendingSearchesDays[0].trendingSearches.map(
      (document) => document.title.query
    );

    let articles = await getArticles(results);
    res.status(200).send(articles);
  } catch (err) {
    res.status(500).send(err);
  }
};
