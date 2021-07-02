const { db } = require("../config/firebase-config");
const axios = require("axios").default;
const wiki = require("wikipedia");

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
    .catch((err) => res.status(500).json({ error: err.code }));
};

exports.getCardsWithLogin = (req, res) => {
  //TODO: get limited cards
  db.collection("CardsWithLogin")
    .orderBy("id", "asc")
    .get()
    .then((docs) => sendCards(docs, res))
    .catch((err) => res.status(500).json({ error: err.code }));
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
    .catch((err) => res.status(500).json({ error: err.code }));
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
      likedNumbers.forEach((num) => {
        let card = likedCards.find((c) => c.id === num);
        result.push(card);
      });
      result.reverse();
      return result;
    })
    .then((result) => res.status(200).send(result))
    .catch((err) => res.status(500).json({ error: err.code }));
};

exports.getCardsWithHashtag = (req, res) => {
  const category = req.params.category;
  let cards = [];
  db.collection("CardsWithLogin")
    .get()
    .then((docs) => {
      docs.forEach((doc) => {
        const { categories } = doc.data();
        if (categories.includes(category)) {
          cards.push({ ...doc.data() });
        }
      });
    })
    .then(() => res.status(200).send(cards))
    .catch((err) => res.status(500).json({ error: err.code }));
};

exports.getPreferredCards = (req, res) => {
  const email = req.params.email;
  let cats = [];
  let results = [];
  db.collection("Users")
    .doc(email)
    .get()
    .then((doc) => {
      const { categories } = doc.data();
      if (categories) {
        cats = [...categories];
      }
    })
    .then(() => {
      db.collection("CardsWithLogin")
        .get()
        .then((docs) => {
          let vis = [];
          docs.forEach((doc) => {
            const { categories, main_category, id } = doc.data();
            for (let category of categories) {
              if (
                (cats.includes(category) || cats.includes(main_category)) &&
                !vis.includes(id)
              ) {
                results.push({ ...doc.data() });
                vis.push(id);
              }
            }
          });
        })
        .then(() => res.status(200).send(results));
    })
    .catch((err) => res.status(500).json({ error: err.code }));
};

exports.getCards = async (req, res) => {
  try {
    const email = req.params.email;
    const userRef = await db.collection("Users").doc(email).get();
    const { categories, liked, disliked } = userRef.data();
    let seen = [];
    if (liked) {
      seen = [...liked];
    }
    if (disliked) {
      seen = [...seen, ...disliked];
    }
    let userCats = [];
    if (categories) {
      userCats = [...categories];
    }
    const lastSeen = Math.max(...seen);
    const cardsRef = await db
      .collection("CardsWithLogin")
      .where("sid", ">", lastSeen)
      .limit(40)
      .get();
    let vis = [];
    let prefCards = [];
    let normalCards = [];
    cardsRef.forEach((card) => {
      const { categories, main_category, id } = card.data();
      for (let category of categories) {
        if (
          (userCats.includes(category) || userCats.includes(main_category)) &&
          !vis.includes(id)
        ) {
          prefCards.push({ ...card.data() });
          vis.push(id);
        } else if (
          (!userCats.includes(category) || !userCats.includes(main_category)) &&
          !vis.includes(id)
        ) {
          normalCards.push({ ...card.data() });
          vis.push(id);
        }
      }
    });
    let quoteCards = [];
    const quoteCardsRef = await db.collection("quotes").limit(20).get();
    quoteCardsRef.forEach((card) => {
      const { categories, author, body, type, id, mainImage } = card.data();
      quoteCards.push({
        heading: author,
        summary: body,
        type: type,
        id: id,
        categories: categories,
        mainImage: mainImage,
      });
    });
    let cards = [];
    const n = normalCards.length;
    const p = prefCards.length;
    const q = quoteCards.length;
    if (p > 0) {
      let numPref = (n / p) | 0;
      let numQuotes = (n / q) | 0;
      let k = 0;
      let m = 0;
      for (let i = 0; i < n; ++i) {
        if (i % numPref === 0 && k < p) {
          cards.push(prefCards[k++]);
        }
        if (i % numQuotes === 0 && m < q) {
          cards.push(quoteCards[m++]);
        }
        cards.push(normalCards[i]);
      }
    } else {
      cards = [...normalCards];
    }
    res.status(200).send({ cardsLength: cards.length, cards });
  } catch (err) {
    res.status(500).send({ error: err.code });
  }
};

exports.setQuotes = async (req, res) => {
  try {
    let response = await axios.get("https://api.quotable.io/random");
    const page = await wiki.page(response.data.author);
    const summary = await page.summary();
    const mainImage = summary.originalimage.source;
    let quote = {
      author: response.data.author,
      body: response.data.content,
      type: "quote",
      categories: [...response.data.tags],
      id: response.data._id,
      mainImage: mainImage,
    };
    await db
      .collection("quotes")
      .doc(quote.id)
      .set({ ...quote }, { merge: true });
    res.status(200).send({ message: "Changes Saved!" });
  } catch (err) {
    res.status(500).send(err);
  }
};
