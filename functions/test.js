const { db, storage } = require("./config/firebase-config");
const Filter = require("bad-words"),
  filter = new Filter();
filter.addWords("sex", "sexual");

exports.test = async (req, res) => {
  try {
    res.status(200).send("hi");
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.setDb = (req, res) => {
  db.collection("Users")
    .get()
    .then((docs) => {
      let promises = [];
      docs.forEach((doc) => {
        const { liked, disliked, likedQuotes, dislikedQuotes } = doc.data();
        let newLiked = [];
        let newDisliked = [];
        let newLikedQuotes = [];
        let newDislikedQuotes = [];
        if (liked) {
          newLiked = liked.map((el) => ({
            cardid: el,
            time: new Date().toISOString(),
          }));
        }
        if (disliked) {
          newDisliked = disliked.map((el) => ({
            cardid: el,
            time: new Date().toISOString(),
          }));
        }
        if (likedQuotes) {
          newLikedQuotes = likedQuotes.map((el) => ({
            quoteid: el,
            time: new Date().toISOString(),
          }));
        }
        if (dislikedQuotes) {
          newDislikedQuotes = dislikedQuotes.map((el) => ({
            quoteid: el,
            time: new Date().toISOString(),
          }));
        }
        promises.push(
          doc.ref.set(
            {
              liked: newLiked,
              disliked: newDisliked,
              likedQuotes: newLikedQuotes,
              dislikedQuotes: newDislikedQuotes,
            },
            { merge: true }
          )
        );
      });
      Promise.all(promises);
    })
    .then(() => res.status(200).send("Docs updated"))
    .catch((err) => res.status(500).send({ error: error.code }));
};

exports.setDbx = (req, res) => {
  db.collection("category_mapping")
    .get()
    .then((docs) => {
      let promises = [];
      docs.forEach((doc) => {
        const { main_category } = doc.data();
        let newArr = [];
        if (main_category) {
          newArr = main_category.map((el) => ({
            category: el,
            cmcontinue: "",
          }));
        }
        promises.push(
          doc.ref.set(
            {
              main_category: newArr,
            },
            { merge: true }
          )
        );
      });
      Promise.all(promises);
    })
    .then(() => res.status(200).send("Docs updated"))
    .catch((err) => res.status(500).send({ error: error.code }));
};
