const trends = require("google-trends-api");
const wiki = require("wikipedia");
const { db } = require("../config/firebase-config");

const getArticle = async (topic) => {
  try {
    const page = await wiki.page(topic);
    const webpage_url = page.fulllurl || page.canonicalurl;
    const pageid = page.pageid;
    const title = page.title;
    const ns = page.ns;
    const summary = await page.summary();
    const mainImage = summary.originalimage.source;
    const coordinates = await page.coordinates();
    let categories = await page.categories();
    categories = categories.map((category) => category.split(":")[1]);
    const summ = summary.extract;
    const subheading = summary.description;
    let images = await page.images();
    images = images.slice(0, 3);
    images = images.map((imageData) => imageData.url);
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
      type: "trending",
    };
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getArticles = async (results) => {
  let articles = [];
  for (let item of results) {
    let article = await getArticle(item.topic);
    if (article) {
      articles.push({ ...article, articleHeading: item.articleHeading });
    }
  }
  return articles;
};

exports.getTrendingCards = async (req, res) => {
  let cards = [];
  db.collection("CardsWithLogin")
    .orderBy("createdOn", "desc")
    .get()
    .then((docs) => {
      docs.forEach((doc) => {
        const { type } = doc.data();
        if (type && type === "trending") {
          cards.push({ ...doc.data() });
        }
      });
    })
    .then(() => {
      res.status(200).send(cards);
    })
    .catch((err) => res.status(500).send({ error: err.code }));
};

exports.setTrendingCards = async (req, res) => {
  try {
    let results = await trends.dailyTrends({
      geo: "IN",
      trendDate: new Date(),
      category: "all",
    });

    results = JSON.parse(results);
    results = results.default.trendingSearchesDays[0].trendingSearches.map(
      (document) => ({
        topic: document.title.query,
        articleHeading: document.articles[0].title,
      })
    );

    let articles = await getArticles(results);
    let batch = db.batch();
    let docs = await db.collection("CardsWithLogin").get();
    let num = docs.size + 1;
    await articles.forEach(async (article) => {
      let dups = await db
        .collection("CardsWithLogin")
        .where("pageid", "==", article.pageid)
        .get();
      if (!dups.empty) {
        dups.forEach(async (doc) => {
          await doc.ref.update({
            summary: article.summary,
            mainImage: article.mainImage,
            type: article.type,
            createdOn: article.createdOn,
          });
        });
      } else {
        let docRef = db.collection("CardsWithLogin").doc(`${num}`);
        batch.set(docRef, {
          ...article,
          id: num.toString(),
          sid: num,
        });
        num++;
      }
    });
    await batch.commit();
    res.status(200).send({ message: "Changes Saved!" });
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.getTrends = (req, res) => {
  trends
    .dailyTrends({
      geo: "IND",
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
