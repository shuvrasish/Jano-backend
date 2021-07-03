const { db } = require("./config/firebase-config");
const axios = require("axios").default;

exports.test = (req, res) => {
  db.collection("CardsWithLogin")
    .get()
    .then((docs) => {
      let promises = [];
      docs.forEach((doc) => {
        const { trendingOn } = doc.data()
        if (trendingOn) {
          promises.push(
            doc.ref.set(
              {
                type: "trending",
              },
              { merge: true }
            )
          );
        } else {
          promises.push(
            doc.ref.set(
              {
                type: "normal",
              },
              { merge: true }
            )
          );
        }
        
      });
      Promise.all(promises);
    })
    .then(() => res.status(200).send("hi"))
    .catch((err) => res.status(500).send({ error: error.code }));
};
