const { db, storage } = require("./config/firebase-config");
const admin = require("firebase-admin");
const Filter = require("bad-words"),
  filter = new Filter();
filter.addWords("sex", "sexual");

exports.test = async (req, res) => {
  try {
    const email = req.params.email;
    const userRef = await db.collection("Users").doc(email).get();
    const { liked, disliked } = userRef.data();
    let seenCardids = [];
    if (liked) {
      liked.forEach((likedData) => {
        seenCardids.push(likedData.cardid);
      });
    }
    if (disliked) {
      disliked.forEach((dislikedData) => {
        seenCardids.push(dislikedData.cardid);
      });
    }

    const util = await db.doc("util/ids").get();
    let cards = [];
    const cardsRef = await db
      .collection("CardsWithLogin")
      .where("type", "==", "trending")
      .orderBy("sid", "desc")
      .limit(100)
      .get();
    cardsRef.forEach((card) => {
      cards.push(card.data());
    });
    let { cardids } = util.data();
    let unseenCardids = cardids
      .filter((x) => !seenCardids.includes(x))
      .concat(seenCardids.filter((x) => !cardids.includes(x)));

    res.status(200).send({ cards });
  } catch (err) {
    res.status(500).send(err);
  }
};
