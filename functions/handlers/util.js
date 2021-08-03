const { db } = require("../config/firebase-config");

exports.setutil = async (req, res) => {
  try {
    const cardsCol = await db.collection("CardsWithLogin").get();
    let newCardids = [];
    cardsCol.forEach((doc) => {
      newCardids.push(doc.id);
    });
    let newQuoteids = [];
    const quotesCol = await db.collection("quotes").get();
    quotesCol.forEach((doc) => {
      newQuoteids.push(doc.id);
    });
    await db
      .doc("util/ids")
      .set({ cardids: newCardids, quoteids: newQuoteids });
    res.status(200).send("Done");
  } catch (err) {
    res.status(500).send(err);
  }
};
