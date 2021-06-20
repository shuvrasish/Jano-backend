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
  if (req.body.message.trim() === "")
    return res.status(400).json({ comment: "Must not be empty" });
  const email = req.body.email;
  const cardid = req.params.cardid;
  const comment = {
    body: req.body.message,
    createdAt: new Date().toISOString(),
    user: email,
    cardid: cardid,
  };

  db.collection("comments")
    .doc(cardid)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        db.collection("comments")
          .doc(cardid)
          .set({
            comments: [comment],
            commentCount: 1,
          });
      } else {
        let { comments } = doc.data();
        comments.push(comment);
        doc.ref.set({ comments, commentCount: doc.data().commentCount + 1 });
      }
    })
    .then(() => {
      return res.status(201).json({ message: "New comment added." });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.code });
    });
};

exports.getCardComments = (req, res) => {
  const cardid = req.params.cardid;

  db.collection("comments")
    .doc(cardid)
    .get()
    .then((doc) => {
      let commentsList = [];
      if (!doc.exists) {
        return res.status(200).send(commentsList);
      }

      const { comments } = doc.data();
      if (comments) {
        commentsList = [...comments];
      }
      return res.status(200).send(commentsList);
    })
    .catch((err) => {
      return res.status(500).json({ error: err.code });
    });
};
