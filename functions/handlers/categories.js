const { db } = require("../config/firebase-config");

exports.getAllCategoryData = (req, res) => {
  db.collection("category_mapping")
    .get()
    .then((querySnapshot) => {
      let category_deets = [];
      querySnapshot.docs.forEach((doc) => {
        let { Topic, main_category } = doc.data();
        category_deets.push({ Topic, main_category });
      });
      return res.status(200).send(category_deets);
    })
    .catch((err) => {
      return res.status(500).send({ error: err.code });
    });
};
