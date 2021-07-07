const { db, admin } = require("../config/firebase-config");

exports.postQuiz = (req, res) => {
  const email = req.params.email;
  let quiz = {
    quizimage: req.body.quizimage,
    cardid: req.body.cardid,
    hashtag: req.body.hashtag,
    question: req.body.question,
    option1: req.body.option1,
    option2: req.body.option2,
    option3: req.body.option3,
    option4: req.body.option4,
    ans: req.body.ans,
    createdOn: new Date().toISOString(),
    type: "quiz",
    poster: email,
  };

  db.collection("quiz")
    .add({
      ...quiz,
    })
    .then((docRef) => {
      db.doc(`Users/${email}`)
        .get()
        .then((doc) => {
          const { quizPosted } = doc.data();
          if (quizPosted) {
            doc.ref.set(
              {
                quizPosted: [...quizPosted, docRef.id],
              },
              { merge: true }
            );
          } else {
            doc.ref.set(
              {
                quizPosted: [docRef.id],
              },
              { merge: true }
            );
          }
        });
    })
    .then(() => res.status(201).send({ message: "Quiz created successfully." }))
    .catch((err) => res.status(500).send(err));
};

exports.attemptQuiz = (req, res) => {
  const email = req.params.email;
  const userans = req.params.userans;
  const quizid = req.params.quizid;
  let isCorrect = false;
  db.doc(`quiz/${quizid}`)
    .get()
    .then((doc) => {
      const { ans } = doc.data();
      if (ans === Number(userans)) {
        isCorrect = true;
      }
    })
    .then(() => {
      db.doc(`Users/${email}`)
        .get()
        .then((doc) => {
          const { attemptedQuiz } = doc.data();
          let attempt = {
            quizid: quizid,
            isCorrect,
          };
          if (attemptedQuiz) {
            doc.ref.set(
              {
                attemptedQuiz: [...attemptedQuiz, attempt],
              },
              { merge: true }
            );
          } else {
            doc.ref.set(
              {
                attemptedQuiz: [{ ...attempt }],
              },
              { merge: true }
            );
          }
        });
    })
    .then(() =>
      res.status(200).send({ message: "Quiz attempted successfully." })
    )
    .catch((err) => res.status(500).send(err));
};
