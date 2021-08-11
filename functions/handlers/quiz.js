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
            attemptNum: Number(userans),
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

exports.getAttemptedQuizes = async (req, res) => {
  try {
    const email = req.params.email;
    let results = [];
    const docRef = await db.doc(`Users/${email}`).get();
    const { attemptedQuiz } = docRef.data();
    if (attemptedQuiz) {
      for (let attempt of attemptedQuiz) {
        let quizRef = await db.doc(`quiz/${attempt.quizid}`).get();
        results.push({
          ...quizRef.data(),
          isCorrect: attempt.isCorrect,
          attemptNum: attempt.attemptNum,
        });
      }
    }
    res.status(200).send(results);
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.reAttemptQuiz = async (req, res) => {
  try {
    const email = req.params.email;
    const userans = req.params.userans;
    const quizid = req.params.quizid;
    let isCorrect = false;
    const quizRef = await db.doc(`quiz/${quizid}`).get();
    const { ans } = quizRef.data();
    if (ans === Number(userans)) {
      isCorrect = true;
    }
    const userRef = await db.doc(`Users/${email}`).get();
    const { attemptedQuiz } = userRef.data();
    let attempt = {
      quizid: quizid,
      isCorrect,
      attemptNum: Number(userans),
    };
    if (attemptedQuiz) {
      let newArr = attemptedQuiz.map((val) => {
        if (val.quizid === quizid) {
          return { ...attempt };
        }
        return val;
      });
      await userRef.ref.set({ attemptedQuiz: [...newArr] }, { merge: true });
    }
    return res.status(201).send("Successfully reattempted.");
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.getPostedQuiz = async (req, res) => {
  try {
    const email = req.params.email;
    const quizRef = await db
      .collection("quiz")
      .where("poster", "==", email)
      .get();
    let postedQuiz = [];
    quizRef.forEach((quiz) => {
      postedQuiz.push({ ...quiz.data() });
    });
    res.status(200).send(postedQuiz);
  } catch (err) {
    res.status(500).send(err.code);
  }
};

exports.getQuiz = async (req, res) => {
  try {
    const email = req.params.email;
    const userRef = await db.doc(`Users/${email}`).get();
    const { attemptedQuiz, liked } = userRef.data();
    let quizCards = [];
    let seenQuiz = new Set();
    if (attemptedQuiz) {
      attemptedQuiz.forEach((quiz) => {
        seenQuiz.add(quiz.quizid);
      });
    }
    let likedSet = new Set();
    if (liked) {
      liked.forEach((likedData) => {
        likedSet.add(likedData.cardid);
      });
    }
    const quizCardsRef = await db.collection("quiz").get();
    quizCardsRef.forEach((quiz) => {
      const { poster, cardid } = quiz.data();
      if (
        !seenQuiz.has(quiz.id) &&
        poster !== email &&
        likedSet.has(String(cardid))
      ) {
        quizCards.push({ ...quiz.data() });
      }
    });
    quizCards = quizCards.slice(0, 2);
    res.status(200).send(quizCards);
  } catch (err) {
    res.status(500).send(err.code);
  }
};
