const { db, storage } = require("./config/firebase-config");
const Filter = require("bad-words"),
  filter = new Filter();
filter.addWords("sex", "sexual");

exports.test = async (req, res) => {
  try {
    res.status(200).send("test");
  } catch (err) {
    res.status(500).send(err);
  }
};
