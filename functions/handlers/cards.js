const { db, admin } = require("../config/firebase-config");

const sendCards = (docs, res) => {
  let cards = [];
  docs.forEach((doc) => {
    cards.push({ ...doc.data() });
  });
  return res.status(200).send(cards);
};

exports.getCardsWithoutLogin = (req, res) => {
  db.collection("CardsWithoutLogin")
    .orderBy("id", "asc")
    .get()
    .then((docs) => sendCards(docs, res))
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.getCardsWithLogin = (req, res) => {
  db.collection("CardsWithLogin")
    .orderBy("id", "asc")
    .get()
    .then((docs) => sendCards(docs, res))
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.getAllCategoryData = (req, res) => {
  db.collection("CardsWithLogin")
    .get()
    .then((querySnapshot) => {
      let category_deets = [];
      querySnapshot.docs.forEach((doc) => {
        const { main_category, categories } = doc.data();
        if (!category_deets.find((o) => o.main === main_category)) {
          category_deets.push({
            main: main_category,
            cat: [...categories],
          });
        } else {
          let idx = category_deets.findIndex((o) => o.main === main_category);
          category_deets[idx] = {
            main: main_category,
            cat: [...category_deets[idx].cat, ...categories].filter(
              (item, pos, self) => {
                return self.indexOf(item) === pos;
              }
            ),
          };
        }
      });

      return res.status(200).send(category_deets);
    })
    .catch((err) => console.error(err));
};

exports.getLikedCards = (req, res) => {
  const email = req.body.email;
  let likedNumbers = [];
  db.collection("Users")
    .doc(email)
    .get()
    .then((doc) => {
      const { liked } = doc.data();
      if (liked) likedNumbers = liked;
    })
    .catch((err) => {
      return res.status(500).json({ error: err.code });
    });
  let likedCards = [];
  db.collection("CardsWithLogin")
    .get()
    .then((querySnapshot) => {
      querySnapshot.docs.forEach((doc) => {
        const { id } = doc.data();
        if (likedNumbers.includes(id)) {
          likedCards.push({ ...doc.data() });
        }
      });
    })
    .then(() => {
      return res.status(200).send(likedCards);
    })
    .catch((err) => {
      return res.status(500).json({ error: err.code });
    });
};

exports.commentOnCard = (req, res) => {
  const email = req.body.email;
  const cardid = req.params.cardid;
  const comment = {
    body: req.body.message,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    user: email,
    cardid: cardid,
  };
  db.collection("comments")
    .doc(cardid)
    .set(
      {
        comments: [...comments, comment],
      },
      { merge: true }
    )
    .then(() => {
      return res.status(200).json({ message: "Comment Added" });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.code });
    });
};
