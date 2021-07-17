const { db, admin } = require("./config/firebase-config");
const axios = require("axios").default;
const trends = require("google-trends-api");
const wiki = require("wikipedia");

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
      type: "normal",
    };
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getArticles = async (results) => {
  let articles = [];
  for (let item of results) {
    let article = await getArticle(item.pageid);
    if (article) {
      articles.push(article);
    }
  }
  return articles;
};

exports.test = async (req, res) => {
  try {
    const categoriesRef = await db.collection("category_mapping").get();
    let categories = [];
    categoriesRef.forEach((doc) => {
      const { Topic, main_category } = doc.data();
      let keywords = Topic.split(" ");
      keywords = [...new Set(keywords)];
      let unnecessary = ["a", "an", "the", "and"];
      keywords = keywords.map((keyword) => {
        if (!unnecessary.includes(keyword.toLowerCase())) {
          return keyword;
        }
      });
      keywords = keywords.filter(Boolean);
      // categories = [...categories, ...main_category, Topic];
      categories = [...categories, ...keywords];
    });
    categories = [...new Set(categories)];
    categories = categories.map((category) => category.toLowerCase());
    let topics = [];
    for (let category of categories) {
      const response = await axios.get(
        `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${category}&cmsort=timestamp&cmdir=desc&format=json&cmlimit=1`
      );
      let data = response.data.query.categorymembers.map((item) => {
        if (item.title.includes("Category:")) {
          return {
            title: item.title.replace("Category:", ""),
            pageid: item.pageid,
          };
        }
        return { title: item.title, pageid: item.pageid };
      });
      topics = [...topics, ...data];
    }

    let articles = await getArticles(topics);
    res.status(200).send(articles);
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.setDb = async (req, res) => {
  db.collection("CardsWithLogin")
    .get()
    .then((docs) => {
      let promises = [];
      docs.forEach((doc) => {
        const { trendingOn } = doc.data();
        if (trendingOn) {
          promises.push(
            doc.ref.update({
              trendingOn: admin.firestore.FieldValue.delete(),
              createdOn: new Date().toISOString(),
              type: "trending",
            })
          );
        } else {
          promises.push(
            doc.ref.set(
              {
                type: "normal",
                createdOn: new Date().toISOString(),
              },
              { merge: true }
            )
          );
        }
      });
      Promise.all(promises);
    })
    .then(() => res.status(200).send("Docs updated"))
    .catch((err) => res.status(500).send({ error: error.code }));
};
