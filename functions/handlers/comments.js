const { db } = require("../config/firebase-config");

exports.commentOnCard = (req, res) => {
  if (req.body.message.trim() === "")
    return res.status(400).json({ comment: "Must not be empty" });
  const email = req.params.email;
  const cardid = req.params.cardid;
  let comment = {
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
            comments: [{ ...comment, commentid: 0 }],
            commentCount: 1,
          });
      } else {
        let { comments, commentCount } = doc.data();
        doc.ref.set({
          comments: [...comments, { ...comment, commentid: commentCount }],
          commentCount: commentCount + 1,
        });
      }
    })
    .then(() => res.status(201).json({ message: "New comment added." }))
    .catch((err) => res.status(500).json({ error: err.code }));
};

exports.deleteComment = (req, res) => {
  const email = req.params.email;
  const cardid = req.params.cardid;
  const commentid = req.params.commentid;
  db.collection("comments")
    .doc(cardid)
    .get()
    .then((doc) => {
      let { comments } = doc.data();
      let idx = -1;
      comments.forEach((comment, index) => {
        if (
          comment.user === email &&
          comment.commentid === parseInt(commentid, 10)
        ) {
          idx = index;
        }
      });
      if (idx != -1) {
        comments.splice(idx, 1);
      }
      comments.forEach((comment, index) => {
        comment.commentid = index;
      });
      doc.ref.set({ comments, commentCount: comments.length });
    })
    .then(() => res.status(201).json({ message: "Comment Deleted." }))
    .catch((err) => res.status(500).json({ error: err.code }));
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
