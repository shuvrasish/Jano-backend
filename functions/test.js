const { db, admin } = require("./config/firebase-config");
const axios = require("axios").default;
const trends = require("google-trends-api");
const wiki = require("wikipedia");

exports.test = async (req, res) => {
  try {
    const email = req.params.email;
    const userRef = await db.collection("Users").doc(email).get();
    const { liked, likedQuotes } = userRef.data();
    let cards = [];
    for (let likedData of liked) {
      let card = await db.doc(`CardsWithLogin/${likedData.cardid}`).get();
      if (card.exists) {
        cards.push({ ...card.data(), likedTime: likedData.time });
      }
    }
    for (let likedData of likedQuotes) {
      let quote = await db.doc(`CardsWithLogin/${likedData.quoteid}`).get();
      if (quote.exists) {
        cards.push({ ...quote.data(), likedTime: likedData.time });
      }
    }
    cards.sort((a, b) => a.likedTime > b.likedTime);
    res.status(200).send(cards);
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
            cardid: el.cardid.cardid,
            time: new Date().toISOString(),
          }));
        }
        if (disliked) {
          newDisliked = disliked.map((el) => ({
            cardid: el.cardid.cardid,
            time: new Date().toISOString(),
          }));
        }
        if (likedQuotes) {
          newLikedQuotes = likedQuotes.map((el) => ({
            quoteid: el.quoteid.cardid,
            time: new Date().toISOString(),
          }));
        }
        if (dislikedQuotes) {
          newDislikedQuotes = dislikedQuotes.map((el) => ({
            quoteid: el.quoteid.cardid,
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
