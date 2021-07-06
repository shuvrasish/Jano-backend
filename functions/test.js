const { db } = require("./config/firebase-config");
const axios = require("axios").default;

// exports.test = (req, res) => {
//   db.collection("CardsWithLogin")
//     .get()
//     .then((docs) => {
//       let promises = [];
//       docs.forEach((doc) => {
//         const { trendingOn } = doc.data()
//         if (trendingOn) {
//           promises.push(
//             doc.ref.set(
//               {
//                 type: "trending",
//               },
//               { merge: true }
//             )
//           );
//         } else {
//           promises.push(
//             doc.ref.set(
//               {
//                 type: "normal",
//               },
//               { merge: true }
//             )
//           );
//         }

//       });
//       Promise.all(promises);
//     })
//     .then(() => res.status(200).send("hi"))
//     .catch((err) => res.status(500).send({ error: error.code }));
// };

exports.test = (req, res) => {
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
        return res.status(200).send(cards);
      });
    })
    .catch((err) => res.status(500).send(err));
};
