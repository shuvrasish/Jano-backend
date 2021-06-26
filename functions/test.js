const { db } = require("./config/firebase-config");

exports.getCards = async (req, res) => {
  const email = req.params.email;
  db.collection("Users")
    .doc(email)
    .get()
    .then((doc) => {
      const { categories } = doc.data();
      let cats = categories;
    });
};
