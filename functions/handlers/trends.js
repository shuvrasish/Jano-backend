const trends = require("google-trends-api");
const wiki = require("wikijs").default;

exports.getTrends = (req, res) => {
  trends
    .dailyTrends({
      geo: "IN",
      trendDate: new Date(),
      category: "all",
    })
    .then((results) => {
      results = JSON.parse(results);
      results = results.default.trendingSearchesDays[0].trendingSearches.map(
        (document) => document.title.query
      );

      return res.status(200).send(results);
    })
    .catch((err) => {
      return res.status(400).send(err);
    });
};

const getArticle = async (topic) => {
  try {
    let page = await wiki().page(topic); // result type should be a page, not a list or portal or anything else
    let summary = await page.summary();
    let main_image = await page.mainImage();
    // Categories: Disambiguation pages TODO
    return {
      title: page.title,
      summary: summary,
      mainImage: main_image,
      url: page.fullurl || page.canonicalurl,
    };
  } catch (err) {
    console.log(err);
    return null;
  }
};

const getArticles = async (topics) => {
  let articles = [];
  for (let topic of topics) {
    let article = await getArticle(topic);
    if (article) {
      articles.push(article);
    }
  }
  return articles;
};

exports.getTrendingCards = async (req, res) => {
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
