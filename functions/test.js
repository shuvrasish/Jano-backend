const { db } = require("./config/firebase-config");
const axios = require("axios").default;

exports.test = async (req, res) => {
  let response = await axios.get("https://api.quotable.io/random");
  let quote = {
    heading: response.data.author,
    summary: response.data.content,
    type: "quote",
    categories: [...response.data.tags],
    id: response.data._id,
  };
  res.status(200).send(quote);
};
