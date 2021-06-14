const { db } = require("../config/firebase-config");

const sendCards = (docs) => {
  let cards = [];
  docs.forEach((doc) => {
    cards.push({ ...doc.data() });
  });
  return res.status(200).json(cards);
};

exports.getCardsWithoutLogin = (req, res) => {
  db.collection("CardsWithoutLogin")
    .orderBy("id", "asc")
    .get()
    .then((docs) => sendCards(docs))
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.getCardsWithLogin = (req, res) => {
  db.collection("CardsWithLogin")
    .orderBy("id", "asc")
    .get()
    .then(then((docs) => sendCards(docs)))
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
