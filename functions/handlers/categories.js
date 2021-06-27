const { db } = require("../config/firebase-config");

exports.getAllCategoryData = (req, res) => {
  db.collection("category_mapping")
    .get()
    .then((docs) => {
      let category_deets = [];
      docs.forEach((doc) => {
        let { Topic, main_category, translated_hindi } = doc.data();
        category_deets.push({ Topic, main_category, translated_hindi });
      });
      return res.status(200).send(category_deets);
    })
    .catch((err) => {
      return res.status(500).send({ error: err.code });
    });
};
