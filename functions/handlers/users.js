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

exports.getOneUser = (req, res) => {
  const email = req.body.email;
  const userRef = db.collection("Users").doc(email);
  userRef
    .get()
    .then((doc) => {
      return res.status(200).json({ ...doc.data() });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.code });
    });
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
      return res.status(201).json({ message: "Category preference added." });
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
      return res.status(201).json({ message: "Language preference set." });
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

exports.createUserDoc = (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
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
  const email = req.body.email;
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
  const email = req.body.email;
  const userRef = database.collection("Users").doc(email);
  userRef
    .get()
    .then((doc) => {
      const { share } = doc.data();
      if (share) {
        return res.status(200).send(share);
      } else {
        return res.status(400).json({ message: "Share field empty." });
      }
    })
    .catch((err) => {
      res.status(500).send();
    });
};

exports.getFeedbacks = (req, res) => {
  const email = req.body.email;
  const userRef = database.collection("Users").doc(email);
  userRef
    .get()
    .then((doc) => {
      const { feedback } = doc.data();
      if (feedback) {
        return res.status(200).send(feedback);
      } else {
        return res.status(400).json({ message: "Feedback field empty." });
      }
    })
    .catch((err) => {
      res.status(500).send();
    });
};

exports.getAuthenticatedUser = (req, res) => {
  const user = admin.auth().currentUser;
  if (!user) {
    res.status(400).json({ message: "Not logged in." });
  } else {
    res.status(200).send(user);
  }
};
