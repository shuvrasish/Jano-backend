const { db, admin } = require("../config/firebase-config");
const axios = require("axios").default;
const wiki = require("wikipedia");
const Filter = require("bad-words"),
  filter = new Filter();
filter.addWords("sex", "sexual", "sex positions");

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

exports.getLiked = async (req, res) => {
  try {
    const email = req.params.email;
    const userRef = await db.collection("Users").doc(email).get();
    const { liked, likedQuotes } = userRef.data();

    let likedArray = [];
    if (liked) {
      likedArray = [...liked];
    }
    let cards = [];
    if (liked) {
      likedArray = likedArray
        .sort((a, b) => {
          return new Date(b.time) - new Date(a.time);
        })
        .slice(0, 5);
      for (let likedData of likedArray) {
        let card = await db.doc(`CardsWithLogin/${likedData.cardid}`).get();
        if (card.exists) {
          cards.push({ ...card.data(), likedTime: likedData.time });
        }
      }
    }

    let likedQuotesArray = [];
    if (likedQuotes) {
      likedQuotesArray = [...likedQuotes];
    }
    if (likedQuotes) {
      likedQuotesArray = likedQuotesArray
        .sort((a, b) => {
          return new Date(b.time) - new Date(a.time);
        })
        .slice(0, 5);
      for (let likedData of likedQuotesArray) {
        let quote = await db.doc(`quotes/${likedData.quoteid}`).get();
        if (quote.exists) {
          cards.push({ ...quote.data(), likedTime: likedData.time });
        }
      }
    }

    cards = cards.filter(Boolean);
    cards = cards.filter((card) => Object.entries(card).length !== 0);

    let uniq = new Set(cards);
    cards = Array.from(uniq);
    cards = cards.sort((a, b) => {
      return new Date(b.likedTime) - new Date(a.likedTime);
    });
    res.status(200).send(cards);
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.getCardsWithHashtag = (req, res) => {
  const category = req.params.category;
  let cards = [];
  db.collection("CardsWithLogin")
    .orderBy("sid", "desc")
    .limit(100)
    .get()
    .then((docs) => {
      docs.forEach((doc) => {
        const { categories, main_category } = doc.data();
        if (main_category === category || categories.includes(category)) {
          cards.push({ ...doc.data() });
        }
      });
    })
    .then(() => {
      cards = cards.sort((a, b) => {
        return new Date(b.createdOn) - new Date(a.createdOn);
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

// exports.getCards = async (req, res) => {
//   try {
//     const email = req.params.email;
//     const userRef = await db.collection("Users").doc(email).get();
//     const {
//       categories,
//       liked,
//       disliked,
//       likedQuotes,
//       dislikedQuotes,
//       attemptedQuiz,
//     } = userRef.data();
//     let seen = new Set();
//     if (liked) {
//       liked.forEach((likedData) => {
//         seen.add(likedData.cardid);
//       });
//     }
//     if (disliked) {
//       disliked.forEach((dislikedData) => {
//         seen.add(dislikedData.cardid);
//       });
//     }

//     let userCats = new Set();
//     if (categories) {
//       userCats = new Set([...categories]);
//     }
//     let cardsRef = await db
//       .collection("CardsWithLogin")
//       .limit(3 + seen.size)
//       .get();
//     let vis = new Set();
//     let prefCards = [];
//     let normalCards = [];
//     cardsRef.forEach((card) => {
//       const { categories, main_category, id, image_links, mainImage } =
//         card.data();
//       let isSafe = true;
//       if (main_category !== filter.clean(main_category)) {
//         isSafe = false;
//       }
//       let newImageLinks = [];
//       let imgProb = false;
//       if (
//         !mainImage &&
//         (image_links.length === 0 || image_links[0].trim() === "")
//       ) {
//         newImageLinks.push(
//           "https://firebasestorage.googleapis.com/v0/b/swipeekaro.appspot.com/o/Generic%20Jano%203.gif?alt=media&token=8352d5c6-5949-4188-9cb8-b041799a45a2"
//         );
//         imgProb = true;
//       }

//       if (!seen.has(id) && isSafe) {
//         for (let category of categories) {
//           if (category === filter.clean(category)) {
//             if (
//               (userCats.has(category) || userCats.has(main_category)) &&
//               !vis.has(id)
//             ) {
//               prefCards.push({
//                 ...card.data(),
//                 image_links: imgProb ? newImageLinks : image_links,
//               });
//               vis.add(id);
//             } else if (
//               (!userCats.has(category) || !userCats.has(main_category)) &&
//               !vis.has(id)
//             ) {
//               normalCards.push({
//                 ...card.data(),
//                 image_links: imgProb ? newImageLinks : image_links,
//               });
//               vis.add(id);
//             }
//           }
//         }
//       }
//     });
//     let quoteCards = [];
//     let seenQuotes = new Set();
//     if (likedQuotes) {
//       likedQuotes.forEach((likedData) => {
//         seenQuotes.add(likedData.quoteid);
//       });
//     }
//     if (dislikedQuotes) {
//       dislikedQuotes.forEach((dislikedData) => {
//         seenQuotes.add(dislikedData.quoteid);
//       });
//     }
//     console.log(seenQuotes.size);
//     let quoteCardsRef = await db
//       .collection("quotes")
//       .limit(1 + seenQuotes.size)
//       .get();
//     quoteCardsRef.forEach((card) => {
//       const { categories, author, body, type, id, mainImage } = card.data();
//       if (!seenQuotes.has(id)) {
//         quoteCards.push({
//           heading: author,
//           summary: body,
//           type: type,
//           id: id,
//           categories: categories,
//           mainImage: mainImage,
//         });
//       }
//     });

//     let quizCards = [];
//     let seenQuiz = new Set();
//     if (attemptedQuiz) {
//       attemptedQuiz.forEach((quiz) => {
//         seenQuiz.add(quiz.quizid);
//       });
//     }
//     const quizCardsRef = await db
//       .collection("quiz")
//       .limit(seenQuiz.size + 1)
//       .get();

//     let likedSet = new Set();
//     if (liked) {
//       liked.forEach((likedData) => {
//         likedSet.add(likedData.cardid);
//       });
//     }
//     quizCardsRef.forEach((doc) => {
//       const quizid = doc.id;
//       const { cardid } = doc.data();
//       if (!seenQuiz.has(quizid) && likedSet.has(String(cardid))) {
//         quizCards.push({ ...doc.data });
//       }
//     });

//     let cards = [];
//     const n = normalCards.length;
//     const p = prefCards.length;
//     const q = quoteCards.length;
//     const qz = quizCards.length;
//     let numPref = (n / p) | 0;
//     let numQuotes = (n / q) | 0;
//     let numQuiz = (n / qz) | 0;
//     let k = 0; //for preferred
//     let m = 0; //for quotes
//     let o = 0; //for quiz
//     for (let i = 0; i < n; ++i) {
//       if (i % numPref === 0 && k < p) {
//         cards.push(prefCards[k++]);
//       }
//       if (i % numQuotes === 0 && m < q) {
//         cards.push(quoteCards[m++]);
//       }
//       if (i % numQuiz === 0 && o < qz) {
//         cards.push(quizCards[o++]);
//       }
//       cards.push(normalCards[i]);
//     }

//     cards = cards.filter((item) => Object.keys(item).length !== 0);
//     res.status(200).send({ cardsLength: cards.length, cards });
//   } catch (err) {
//     res.status(500).send(err);
//   }
// };

exports.getCards = async (req, res) => {
  try {
    const email = req.params.email;
    const userRef = await db.collection("Users").doc(email).get();
    const { categories, liked, disliked, likedQuotes, dislikedQuotes } =
      userRef.data();
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

    let userCats = new Set();
    if (categories) {
      userCats = new Set([...categories]);
    }
    const util = await db.doc("util/ids").get();
    let { cardids, quoteids } = util.data();
    let unseenCardids = cardids
      .filter((x) => !seenCardids.includes(x))
      .concat(seenCardids.filter((x) => !cardids.includes(x)));

    unseenCardids = unseenCardids.slice(0, 9);
    let prefCards = [];
    let normalCards = [];
    let docs = await db
      .collection("CardsWithLogin")
      .where("id", "in", unseenCardids)
      .get();
    docs.forEach((card) => {
      const { main_category, image_links, mainImage } = card.data();
      let newImageLinks = [];
      let isSafe = true;
      if (
        main_category.toLowerCase() !==
        filter.clean(main_category.toLowerCase())
      ) {
        isSafe = false;
      }
      let imgProb = false;
      if (
        !mainImage &&
        (image_links.length === 0 || image_links[0].trim() === "")
      ) {
        newImageLinks.push(
          "https://firebasestorage.googleapis.com/v0/b/swipeekaro.appspot.com/o/Generic%20Jano%203.gif?alt=media&token=8352d5c6-5949-4188-9cb8-b041799a45a2"
        );
        imgProb = true;
      }
      if (isSafe) {
        if (userCats.has(main_category)) {
          prefCards.push({
            ...card.data(),
            image_links: imgProb ? newImageLinks : image_links,
          });
        } else {
          normalCards.push({
            ...card.data(),
            image_links: imgProb ? newImageLinks : image_links,
          });
        }
      }
    });
    let seenQuoteids = [];
    if (likedQuotes) {
      likedQuotes.forEach((likedData) => {
        seenQuoteids.push(likedData.quoteid);
      });
    }
    if (dislikedQuotes) {
      dislikedQuotes.forEach((dislikedData) => {
        seenQuoteids.push(dislikedData.quoteid);
      });
    }

    let unseenQuoteids = quoteids
      .filter((x) => !seenQuoteids.includes(x))
      .concat(seenQuoteids.filter((x) => !quoteids.includes(x)));

    unseenQuoteids = unseenQuoteids.slice(0, 3);
    let quoteCards = [];

    let quoteDocs = await db
      .collection("quotes")
      .where("id", "in", unseenQuoteids)
      .get();
    quoteDocs.forEach((quote) => {
      const { categories, author, body, type, id, mainImage } = quote.data();
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
    let numPref = (n / p) | 0;
    let numQuotes = (n / q) | 0;
    let k = 0; //for preferred
    let m = 0; //for quotes
    for (let i = 0; i < n; ++i) {
      if (i % numPref === 0 && k < p) {
        cards.push(prefCards[k++]);
      }
      if (i % numQuotes === 0 && m < q) {
        cards.push(quoteCards[m++]);
      }
      cards.push(normalCards[i]);
    }
    cards = cards.filter((item) => Object.keys(item).length !== 0);
    res.status(200).send({ cardsLength: cards.length, cards });
  } catch (err) {
    res.status(500).send(err);
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
    await db.collection("fcm").doc("fcmnotifquotes").set({
      numQuotes: 1,
      author: quote.author,
      quoteBody: quote.body,
      image: quote.mainImage,
      time: new Date().toISOString(),
    });
    res.status(200).send({ message: "Changes Saved!" });
  } catch (err) {
    res.status(500).send(err);
  }
};
