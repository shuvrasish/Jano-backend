const wiki = require("wikipedia");
const { db } = require("./config/firebase-config");

exports.test = async (req, res) => {
  res.send("hello");
};

const getArticle = async (topic) => {
  wiki
    .page(topic)
    .then(async (page) => {
      const coordinates = await page.coordinates();
      return { coordinates };
    })
    .then((result) => console.log(result))
    .catch((err) => console.log(err));
};

getArticle("Lucknow");
