const { db, storage } = require("./config/firebase-config");
const admin = require("firebase-admin");
const Filter = require("bad-words"),
  filter = new Filter();
filter.addWords("sex", "sexual");

exports.test = async (req, res) => {
  try {
    const docsRef = await db.collection("Users").get();
    let promises = [];
    docsRef.forEach((doc) => {
      promises.push(
        doc.ref.set(
          {
            Profile_Click: admin.firestore.FieldValue.delete(),
          },
          { merge: true }
        )
      );
    });
    await Promise.all(promises);
    res.status(200).send("DB Updated!");
  } catch (err) {
    res.status(500).send(err);
  }
};
