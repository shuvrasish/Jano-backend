const { db, auth } = require("../config/firebase-config");

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
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.getOneUser = (req, res) => {
  try {
    const userRef = db.collection("Users").doc(req.params.email);
    const doc = userRef.get();
    if (!doc.exists) {
      return res.status(400).json({ message: "User not found!" });
    }
    return res.status(200).json({ ...doc.data() });
  } catch (err) {
    return res.status(500).json({ error: err.code });
  }
};

exports.addCategoryPref = (req, res) => {
  const category = req.body.category;
  const email = req.body.email;
  const userRef = db.collection("Users").doc(email);
  userRef
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(400).json({ message: "User not found!" });
      }
      const { categories } = doc.data();
      if (!categories) {
        userRef.set({ categories: [category] }, { merge: true });
      } else if (!categories.includes(category)) {
        userRef.set({ categories: [...categories, category] }, { merge: true });
      }
    })
    .then(() => {
      return res.status(200).json({ message: "Category preference added." });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.code });
    });
};

exports.removeCategoryPref = (req, res) => {
  const email = req.body.email;
  const category = req.body.category;

  const userRef = db.collection("Users").doc(email);
  userRef
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(400).json({ message: "User not found!" });
      }
      let { categories } = doc.data();
      if (categories.includes(category)) {
        const removed = categories.filter((item) => item !== category);
        userRef.set(
          {
            categories: removed,
          },
          { merge: true }
        );
      } else {
        return res
          .status(400)
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

exports.getSelectedCategories = () => {
  const email = req.body.email;
  db.collection("Users")
    .doc(email)
    .get()
    .then((doc) => {
      const { categories } = doc.data();
      if (!categories) {
        console.log("Categories field not present for current user.");
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

exports.setLangPref = (req, res) => {
  const email = req.body.email;
  const lang = req.body.lang;
  const userRef = db.collection("Users").doc(email);
  userRef
    .set(
      {
        language: lang,
      },
      { merge: true }
    )
    .then(() => {
      return res.status(200).json({ message: "Language preference set." });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.code });
    });
};

exports.getLangPref = (req, res) => {
  const email = req.body.email;
  const userRef = db.collection("Users").doc(email);
  userRef
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(400).json({ message: "User not found!" });
      }
      const { language } = doc.data();
      if (language) {
        return res.status(200).json({ language });
      } else {
        return res
          .status(500)
          .json({ message: "User doesn't have a preferred language." });
      }
    })
    .catch((err) => {
      res.status(500).json({ error: err.code });
    });
};

exports.getAuthenticatedUser = (req, res) => {
  const user = auth.currentUser;
  res.send(user);
  console.log(user);
};
