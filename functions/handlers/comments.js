const { db } = require("../config/firebase-config");

exports.commentOnCard = (req, res) => {
  if (req.body.message.trim() === "")
    return res.status(400).json({ comment: "Must not be empty" });
  const email = req.params.email;
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
