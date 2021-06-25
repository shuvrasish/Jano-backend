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
    .catch((err) => res.status(500).json({ error: err.code })
    );
};

exports.getCardsWithLogin = (req, res) => {
  //TODO: get limited cards
  db.collection("CardsWithLogin")
    .orderBy("id", "asc")
    .get()
    .then((docs) => sendCards(docs, res))
    .catch((err) => res.status(500).json({ error: err.code })
    );
};

exports.getAllCategoryDataFromCards = (req, res) => {
  db.collection("CardsWithLogin")
    .get()
    .then((docs) => {
      let category_deets = [];
      docs.forEach((doc) => {
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
    .catch((err) => res.status(500).json({ error: err.code })
    );
  let likedCards = [];
  db.collection("CardsWithLogin")
    .get()
    .then((docs) => {
      docs.forEach((doc) => {
        const { id } = doc.data();
        if (likedNumbers.includes(id)) {
          likedCards.push({ ...doc.data() });
        }
      });
      //for chronological order
      let result = [];
      likedNumbers.forEach(num => {
        let card = likedCards.find(c => c.id === num);
        result.push(card);
      })
      result.reverse()
      return result;
    })
    .then((result) => res.status(200).send(result)
    )
    .catch((err) => res.status(500).json({ error: err.code })
    );
};

exports.getCardsWithHashtag = (req, res) => {
  const category = req.params.category;
  let cards = []
  db.collection("CardsWithLogin").get().then(docs => {
    docs.forEach(doc => {
      const { categories } = doc.data();
      if (categories.includes(category)) {
        cards.push({ ...doc.data() })
      }
    })
  }).then(() => res.status(200).send(cards)).catch(err => 
    res.status(500).json({ error: err.code })
  )
}
