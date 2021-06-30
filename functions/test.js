const { db } = require("./config/firebase-config");

exports.test = (req, res) => {
  res.send("hi");
};
