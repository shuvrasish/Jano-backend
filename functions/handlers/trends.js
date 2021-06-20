const trends = require("google-trends-api");

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
