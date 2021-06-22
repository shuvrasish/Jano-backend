const { db } = require("../config/firebase-config");

const sendAnalytics = (docs, res) => {
  let analytics = [];
  docs.forEach((doc) => {
    analytics.push({ ...doc.data() });
  });
  return res.status(200).json(analytics);
};

exports.getCardsWithLoginAnalytics = (req, res) => {
  db.collection("CardsWithLoginAnalytics")
    .get()
    .then((docs) => sendAnalytics(docs, res))
    .catch((err) => {
      return res.status(500).json({ error: err.code });
    });
};

exports.getCardsWithoutLoginAnalytics = (req, res) => {
  db.collection("CardsWithoutLoginAnalytics")
    .get()
    .then(then((docs) => sendAnalytics(docs, res)))
    .catch((err) => {
      return res.status(500).json({ error: err.code });
    });
};

exports.getCardAnalytics = (req, res) => {
  const cardid = req.params.cardid;
  db.collection("CardsWithLoginAnalytics")
    .doc(cardid)
    .get()
    .then((doc) => {
      let analytics = {};
      if (doc.exists) {
        analytics = { ...doc.data() };
      }
      return res.status(200).send(analytics);
    })
    .catch((err) => {
      return res.status(500).json({ error: err.code });
    });
};
