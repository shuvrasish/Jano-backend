const db = require("../config/firebase-config");

const sendAnalytics = (docs) => {
  let analytics = [];
  docs.forEach((doc) => {
    analytics.push({ ...doc.data() });
  });
  return res.status(200).json(analytics);
};

exports.getCardsWithLoginAnalytics = (req, res) => {
  db.collection("CardsWithLoginAnalytics")
    .get()
    .then((docs) => sendAnalytics(docs))
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.getCardsWithoutLoginAnalytics = (req, res) => {
  db.collection("CardsWithoutLoginAnalytics")
    .get()
    .then(then((docs) => sendAnalytics(docs)))
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
