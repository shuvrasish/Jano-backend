const { db, admin } = require("./config/firebase-config");
const axios = require("axios").default;
const wiki = require("wikipedia");
const keyword_extractor = require("keyword-extractor");

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
    const title = item.title;
    if (title === filter.clean(title)) {
      let article = await getArticle(item.pageid);
      if (article) {
        articles.push(article);
      }
    }
  }
  return articles;
};

exports.test = async (req, res) => {
  try {
    const categoriesRef = await db.collection("category_mapping").get();
    let categories = [];
    categoriesRef.forEach((doc) => {
      const { Topic } = doc.data();
      const extracted = keyword_extractor.extract(Topic, {
        language: "english",
        remove_digits: true,
        return_changed_case: true,
        remove_duplicates: true,
      });
      categories = [...categories, ...extracted];
    });
    categories = [...new Set(categories)];
    categories = categories.map((category) => category.toLowerCase());
    let topics = [];
    for (let category of categories) {
      const response = await axios.get(
        `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${category}&cmsort=timestamp&&cmtype=page&cmdir=desc&format=json&cmlimit=20`
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
    res.status(200).send({ length: articles.length, array: articles });
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.setDb = async (req, res) => {
  db.collection("category_mapping")
    .get()
    .then((docs) => {
      let promises = [];
      docs.forEach((doc) => {
        const { main_category } = doc.data();
        const newArr = main_category.map((category) => ({
          category,
          cmcontinue: "",
        }));
        promises.push(
          doc.ref.update({
            main_category: newArr,
          })
        );
      });
      Promise.all(promises);
    })
    .then(() => res.status(200).send("Docs updated"))
    .catch((err) => res.status(500).send({ error: error.code }));
};
