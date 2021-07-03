const { db, admin } = require("../config/firebase-config");

exports.getAllUsers = (req, res) => {
  db.collection("Users")
    .get()
    .then((docs) => {
      let users = [];
      docs.forEach((doc) => {
        users.push({ ...doc.data() });
      });
      return res.status(200).json(users);
    })
    .catch((err) => {
      return res.status(500).json({ error: err.code });
    });
};

exports.getSelectedCategories = (req, res) => {
  const email = req.params.email;
  db.collection("Users")
    .doc(email)
    .get()
    .then((doc) => {
      const { categories } = doc.data();
      if (!categories) {
        return res.send([]);
      }
      return res.send(categories);
    })
    .then(() => {
      return res.status(200).json({ message: "Preferred categories fetched." });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.code });
    });
};

exports.getOneUser = (req, res) => {
  const email = req.params.email;
  db.collection("Users")
    .doc(email)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ message: "User doesn't exist." });
      }
      return res.status(200).json({ ...doc.data() });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.code });
    });
};

exports.addCategoryPref = async (req, res) => {
  const category = req.params.category;
  const email = req.params.email;
  db.collection("Users")
    .doc(email)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ message: "User not found!" });
      }
      const { categories } = doc.data();
      if (!categories) {
        doc.ref.set({ categories: [category] }, { merge: true });
      } else if (!categories.includes(category)) {
        doc.ref.set({ categories: [...categories, category] }, { merge: true });
      }
    })
    .then(() => {
      return res.status(201).json({ message: "Category preference added." });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.code });
    });
};

exports.removeCategoryPref = (req, res) => {
  const email = req.params.email;
  const category = req.params.category;

  db.collection("Users")
    .doc(email)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ message: "User not found!" });
      }
      let { categories } = doc.data();
      if (categories.includes(category)) {
        const removed = categories.filter((item) => item !== category);
        doc.ref.set(
          {
            categories: removed,
          },
          { merge: true }
        );
      } else {
        return res
          .status(404)
          .json({ message: "Category preference not found." });
      }
    })
    .then(() => {
      return res.status(200).json({ message: "Category preference removed." });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.code });
    });
};

exports.setLangPref = (req, res) => {
  const email = req.params.email;
  const lang = req.params.lang;
  db.collection("Users")
    .doc(email)
    .set(
      {
        language: lang,
      },
      { merge: true }
    )
    .then(() => {
      return res.status(201).json({ message: "Language preference set." });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.code });
    });
};

exports.getLangPref = (req, res) => {
  const email = req.params.email;
  db.collection("Users")
    .doc(email)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ message: "User not found!" });
      }
      const { language } = doc.data();
      if (language) {
        return res.status(200).json({ language });
      } else {
        return res.status(200).json({ language: null });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err.code });
    });
};

exports.createUserDoc = (req, res) => {
  const name = req.params.name;
  const email = req.params.email;
  db.collection("Users")
    .doc(email)
    .set(
      {
        Name: name,
        Email: email,
      },
      { merge: true }
    )
    .then(() => {
      return res.status(201).json({ message: "User document created." });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.code });
    });
};

exports.handleShareLoggedIn = (req, res) => {
  const email = req.params.email;
  db.collection("Users")
    .doc(email)
    .update({
      Profile_share: admin.firestore.FieldValue.increment(1),
    })
    .then(() => {
      res.status(201).json({ message: "Profile shares incremented" });
    })
    .catch((err) => {
      res.json({ error: err.code });
    });
};

exports.handleShareNotLoggedIn = (req, res) => {
  db.collection("WithoutLoginAnalytics")
    .doc("WithoutLogin")
    .update({
      Profile_share: admin.firestore.FieldValue.increment(1),
    })
    .then(() => {
      res.status(201).json({ message: "Profile shares incremented" });
    })
    .catch((err) => {
      res.json({ error: err.code });
    });
};

exports.getShares = (req, res) => {
  const email = req.params.email;
  db.collection("Users")
    .doc(email)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ message: "User not found!" });
      }
      const { share } = doc.data();
      if (share) {
        return res.status(200).json({ share });
      } else {
        return res.status(200).send({ share: 0 });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err.code });
    });
};

exports.getFeedbacks = (req, res) => {
  const email = req.params.email;
  db.collection("Users")
    .doc(email)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ message: "User not found!" });
      }
      const { feedback } = doc.data();
      if (feedback) {
        return res.status(200).json({ feedback });
      } else {
        return res.status(200).send({ feedback: 0 });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err.code });
    });
};

exports.likeQuote = async (req, res) => {
  try {
    const quoteid = req.params.quoteid;
    const email = req.params.email;
    let docRef = await db.collection("QuotesAnalytics").doc(quoteid).get();
    if (!docRef.exists) {
      await db
        .collection("QuotesAnalytics")
        .doc(quoteid)
        .set({
          likes: [email],
          totalLikes: 1,
        });
    } else {
      const { likes, totalLikes } = docRef.data();
      if (likes && !likes.includes(email)) {
        await docRef.ref.set(
          { likes: [...likes, email], totalLikes: totalLikes + 1 },
          { merge: true }
        );
      }
      docRef = await db.collection("Users").doc(email).get();
      const { likedQuotes, totalLikedQuotes } = docRef.data();
      if (likedQuotes) {
        await docRef.ref.set(
          {
            likedQuotes: [...likedQuotes, quoteid],
            totalLikedQuotes: totalLikedQuotes + 1,
          },
          { merge: true }
        );
      } else {
        await docRef.ref.set(
          {
            likedQuotes: [quoteid],
            totalLikedQuotes: 1,
          },
          { merge: true }
        );
      }
    }

    res.status(201).send({ message: "Liked quote added." });
  } catch (err) {
    res.status(500).send({ error: err.code });
  }
};

exports.dislikeQuote = async (req, res) => {
  try {
    const quoteid = req.params.quoteid;
    const email = req.params.email;
    const docRef = await db.collection("Users").doc(email).get();
    const { dislikedQuotes, totalDislikedQuotes } = docRef.data();
    if (dislikedQuotes) {
      await docRef.ref.set(
        {
          dislikedQuotes: [...dislikedQuotes, quoteid],
          totalDislikedQuotes: totalDislikedQuotes + 1,
        },
        { merge: true }
      );
    } else {
      await docRef.ref.set(
        {
          dislikedQuotes: [quoteid],
          totalDislikedQuotes: 1,
        },
        { merge: true }
      );
    }
    res.status(201).send({ message: "Disliked quote added." });
  } catch (err) {
    res.status(500).send({ error: err.code });
  }
};

exports.getAuthenticatedUser = (req, res) => {
  const user = admin.auth().currentUser;
  if (!user) {
    res.status(400).json({ message: "Not logged in." });
  } else {
    res.status(200).send(user);
  }
};
