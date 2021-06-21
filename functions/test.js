const axios = require("axios");
const trends = require("google-trends-api");

exports.getData = (req, res) => {
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
      let articles = [];
      let promises = [];
      results.forEach((term, index) => {
        let url = "https://en.wikipedia.org/w/api.php";

        const params = {
          action: "query",
          list: "search",
          srsearch: term,
          format: "json",
        };

        url = url + "?origin=*";
        Object.keys(params).forEach(function (key) {
          url += "&" + key + "=" + params[key];
        });
        promises.push(
          axios.get(url).then((response) => {
            if (response.data.query.searchinfo.totalhits > 0) {
              articles.push(response.data.query.search[0]);
            }
          })
        );
      });
      Promise.all(promises).then(() => res.send(articles));
    })
    .catch((err) => {
      return res.status(400).send(err);
    });
};

const getArticle = (term) => {
  var url = "https://en.wikipedia.org/w/api.php";

  var params = {
    action: "query",
    list: "search",
    srsearch: term,
    format: "json",
  };

  url = url + "?origin=*";
  Object.keys(params).forEach(function (key) {
    url += "&" + key + "=" + params[key];
  });

  let article = {};
  axios
    .get(url)
    .then((resp) => {
      article = resp;
      return resp.data.query.search[0];
    })
    .catch((err) => console.log(err));
  return article;
};
