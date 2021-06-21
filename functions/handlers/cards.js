const { db } = require("../config/firebase-config");

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
  //TODO: get limited cards
  db.collection("CardsWithLogin")
    .orderBy("id", "asc")
    .get()
    .then((docs) => sendCards(docs, res))
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.getAllCategoryDataFromCards = (req, res) => {
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
  const email = req.params.email;
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
