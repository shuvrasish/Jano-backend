const { db } = require("../config/firebase-config");
const axios = require("axios").default;
const wiki = require("wikipedia");
const Filter = require("bad-words"),
  filter = new Filter();
filter.addWords("sex", "sexual");

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
  let likedQuotesNumbers = [];
  db.doc(`Users/${email}`)
    .get()
    .then((user) => {
      const { liked, likedQuotes } = user.data();
      if (liked) {
        likedNumbers = [...liked];
      }
      if (likedQuotes) {
        likedQuotesNumbers = [...likedQuotes];
      }
    })
    .then(() => {
      let likedCards = [];
      let likedQuotesCards = [];
      let cards = [];
      let p = [];
      likedNumbers.forEach((id) => {
        p.push(
          db
            .doc(`CardsWithLogin/${id}`)
            .get()
            .then((card) => {
              likedCards.push({ ...card.data() });
            })
        );
      });
      likedQuotesNumbers.forEach((id) => {
        p.push(
          db
            .doc(`quotes/${id}`)
            .get()
            .then((card) => {
              likedQuotesCards.push({ ...card.data() });
            })
        );
      });
      Promise.all(p).then(() => {
        cards = [...likedCards, ...likedQuotesCards];
        cards = cards.filter(Boolean);
        cards = cards.filter((card) => Object.entries(card).length !== 0);
        return res.status(200).send(cards);
      });
    })
    .catch((err) => res.status(500).send(err));
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
    const {
      categories,
      liked,
      disliked,
      likedQuotes,
      dislikedQuotes,
      attemptedQuiz,
    } = userRef.data();
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
    let cardsRef;
    if (seen.length > 0 && seen.length < 10) {
      cardsRef = await db
        .collection("CardsWithLogin")
        .where("sid", "not-in", seen)
        .limit(40)
        .get();
    } else {
      cardsRef = await db
        .collection("CardsWithLogin")
        .limit(40 + seen.length)
        .get();
    }
    let vis = [];
    let prefCards = [];
    let normalCards = [];
    let vispages = [];
    cardsRef.forEach((card) => {
      const { categories, main_category, id, heading, pageid } = card.data();
      let isSafe = true;
      for (let category of categories) {
        if (category !== filter.clean(category)) {
          isSafe = false;
        }
      }
      if (
        main_category !== filter.clean(main_category) ||
        heading !== filter.clean(heading)
      ) {
        isSafe = false;
      }
      if (!seen.includes(id) && isSafe) {
        for (let category of categories) {
          if (
            (userCats.includes(category) || userCats.includes(main_category)) &&
            !vis.includes(id) &&
            !vispages.includes(pageid)
          ) {
            prefCards.push({ ...card.data() });
            vispages.push(pageid);
            vis.push(id);
          } else if (
            (!userCats.includes(category) ||
              !userCats.includes(main_category)) &&
            !vis.includes(id) &&
            !vispages.includes(pageid)
          ) {
            normalCards.push({ ...card.data() });
            vispages.push(pageid);
            vis.push(id);
          }
        }
      }
    });
    let quoteCards = [];
    let seenQuotes = [];
    if (likedQuotes) {
      seenQuotes = [...likedQuotes];
    }
    if (dislikedQuotes) {
      seenQuotes = [...seenQuotes, dislikedQuotes];
    }
    const quoteCardsRef = await db
      .collection("quotes")
      .limit(20 + seenQuotes.length)
      .get();
    quoteCardsRef.forEach((card) => {
      const { categories, author, body, type, id, mainImage } = card.data();
      if (!seenQuotes.includes(id)) {
        quoteCards.push({
          heading: author,
          summary: body,
          type: type,
          id: id,
          categories: categories,
          mainImage: mainImage,
        });
      }
    });

    let quizCards = [];
    let seenQuiz = [];
    if (attemptedQuiz) {
      attemptedQuiz.forEach((quiz) => {
        seenQuiz.push(quiz.quizid);
      });
    }
    const quizCardsRef = await db
      .collection("quiz")
      .limit(seenQuiz.length + 15)
      .get();

    quizCardsRef.forEach((doc) => {
      const quizid = doc.id;
      const { cardid } = doc.data();
      if (!seenQuiz.includes(quizid) && likedCards.includes(cardid)) {
        quizCards.push({ ...doc.data() });
      }
    });
    let cards = [];
    const n = normalCards.length;
    const p = prefCards.length;
    const q = quoteCards.length;
    const qz = quizCards.length;
    let numPref = (n / p) | 0;
    let numQuotes = (n / q) | 0;
    let numQuiz = (n / qz) | 0;
    let k = 0; //for preferred
    let m = 0; //for quotes
    let o = 0; //for quiz
    for (let i = 0; i < n; ++i) {
      if (i % numPref === 0 && k < p) {
        cards.push(prefCards[k++]);
      }
      if (i % numQuotes === 0 && m < q) {
        cards.push(quoteCards[m++]);
      }
      if (i % numQuiz === 0 && o < qz) {
        cards.push(quizCards[o++]);
      }
      cards.push(normalCards[i]);
    }

    res.status(200).send({ cardsLength: cards.length, cards });
  } catch (err) {
    res.status(500).send({ error: err.code });
  }
};

exports.getQuotes = (req, res) => {
  db.collection("quotes")
    .orderBy("createdOn", "desc")
    .limit(100)
    .get()
    .then((docs) => {
      let quotes = [];
      docs.forEach((doc) => {
        quotes.push({ ...doc.data() });
      });
      return quotes;
    })
    .then((quotes) => res.status(200).send(quotes))
    .catch((err) => res.status(500).send(err));
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
      createdOn: new Date().toISOString(),
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
