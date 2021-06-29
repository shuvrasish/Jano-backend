const { db } = require("./config/firebase-config");

exports.test = (req, res) => {
  res.status(200).send("hi");
};
