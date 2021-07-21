const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const {
  getCardsWithoutLogin,
  getCardsWithLogin,
  getAllCategoryDataFromCards,
  getLikedCards,
  getCardsWithHashtag,
  getPreferredCards,
  getCards,
  setQuotes,
  getQuotes,
} = require("./handlers/cards");
const {
  commentOnCard,
  getCardComments,
  deleteComment,
} = require("./handlers/comments");
const {
  getAllUsers,
  getOneUser,
  addCategoryPref,
  removeCategoryPref,
  getLangPref,
  setLangPref,
  getAuthenticatedUser,
  handleShareLoggedIn,
  handleShareNotLoggedIn,
  getShares,
  getFeedbacks,
  getSelectedCategories,
  dislikeQuote,
  likeQuote,
} = require("./handlers/users");
const {
  getCardsWithLoginAnalytics,
  getCardsWithoutLoginAnalytics,
  getCardAnalytics,
} = require("./handlers/analytics");
const {
  getTrends,
  getTrendingCards,
  setTrendingCards,
} = require("./handlers/trends");
const { getAllCategoryData } = require("./handlers/categories");
const { test, setDb } = require("./test");
const {
  postQuiz,
  attemptQuiz,
  getAttemptedQuizes,
  reAttemptQuiz,
} = require("./handlers/quiz");

app.use(cors({ origin: true })); //write frontend app url instead of  "true" (for safety)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//cards
app.get("/getCardsWithoutLogin", getCardsWithoutLogin);
app.get("/getCardsWithLogin", getCardsWithLogin); //NOT REQUIRED ANYMORE
app.get("/getAllCategoryDataFromCards", getAllCategoryDataFromCards); //returns an array with category and subcategory data. NOT TO BE USED ANYMORE
app.get("/getLikedCards/:email", getLikedCards);
app.get("/getCardsWithHashtag/:category", getCardsWithHashtag);
app.get("/getPreferredCards/:email", getPreferredCards); //NOT REQUIRED ANYMORE
app.get("/getCards/:email", getCards); //returns preferred cards and normal cards in proper order (use this to get the cards for main window)

//quotes
app.post("/dislikeQuote/:quoteid/:email", dislikeQuote);
app.post("/likeQuote/:quoteid/:email", likeQuote);
app.get("/getQuotes", getQuotes); //get latest 100 quotes
app.post("/setQuotes", setQuotes); //not necessary

//comments
app.post("/comment/:cardid/:email", commentOnCard);
app.get("/getCardComments/:cardid", getCardComments);
app.delete("/comment/:cardid/:email/:commentid", deleteComment);

//users
app.get("/getAllUsers", getAllUsers);
app.get("/getOneUser/:email", getOneUser); //returns all the data associated with the user
app.post("/addCategoryPreference/:email/:category", addCategoryPref);
app.delete("/removeCategoryPreference/:email/:category", removeCategoryPref);
app.get("/getLangPref/:email", getLangPref);
app.post("/setLangPref/:email/:lang", setLangPref);
app.post("/handleShareLoggedIn/:email", handleShareLoggedIn);
app.post("/handleShareNotLoggedIn", handleShareNotLoggedIn);
app.get("/getShares/:email", getShares);
app.get("/getFeedbacks/:email", getFeedbacks);
app.get("/getAuthenticatedUser", getAuthenticatedUser);
app.get("/getSelectedCategories/:email", getSelectedCategories);

//analytics
app.get("/getCardsWithLoginAnalytics", getCardsWithLoginAnalytics);
app.get("/getCardsWithoutLoginAnalytics", getCardsWithoutLoginAnalytics);
app.get("/getCardAnalytics/:cardid", getCardAnalytics);

//categories
app.get("/getAllCategories", getAllCategoryData);

//trends
app.get("/getTrends", getTrends); //DO NOT USE
app.get("/getTrendingCards", getTrendingCards); //Use this to get All trending Cards
app.post("/setTrendingCards", setTrendingCards); //DO NOT USE (just for testing)

//quiz
app.post("/postQuiz/:email", postQuiz);
app.post("/attemptQuiz/:email/:quizid/:userans", attemptQuiz);
app.get("/getAttemptedQuizes/:email", getAttemptedQuizes);
app.post("/reAttemptQuiz/:email/:userans/:quizid", reAttemptQuiz);

//test
app.get("/test", test); //DO NOT USE
app.put("/setDb", setDb);

exports.api = functions.region("asia-south1").https.onRequest(app);

exports.setTrendingCardsSchedule = functions
  .region("asia-south1")
  .pubsub.schedule("0 0 * * *")
  .onRun(async (context) => {
    await setTrendingCards();
    return console.log("Successfully updated value");
  });

exports.setQuotesSchedule = functions
  .region("asia-south1")
  .pubsub.schedule("0 */6 * * *")
  .onRun(async (context) => {
    await setQuotes();
    return console.log("Successfully set quotes!");
  });

const wiki = require("wikipedia");
const { db, admin } = require("./config/firebase-config");
const axios = require("axios").default;
const keyword_extractor = require("keyword-extractor");

const getArticle = async (topic) => {
  try {
    const page = await wiki.page(topic);
    if (page) {
      const webpage_url = page.fulllurl || page.canonicalurl;
      const pageid = page.pageid;
      const title = page.title;
      const ns = page.ns;

      const summary = await page.summary();
      if (summary.type === "no-extract") {
        return null;
      }
      let mainImage = summary.originalimage
        ? summary.originalimage.source
        : null;
      const coordinates = await page.coordinates();
      let categories = await page.categories();
      categories = categories.map((category) => category.split(":")[1]);
      const summ = summary.extract;
      const subheading = summary.description;
      let images = await page.images();
      images = images.slice(0, 3);
      images = images.map((imageData) => imageData.url);
      if (!mainImage) mainImage = images[0];
      return {
        heading: title,
        summary: summ,
        pageid: pageid,
        subheading: subheading,
        main_category: categories[0],
        categories,
        mainImage,
        ns: ns,
        webpage_url: webpage_url,
        reference: "From Wikipedia, the free encyclopedia",
        image_links: images,
        coordinates: coordinates,
        createdOn: new Date().toISOString(),
        type: "normal",
      };
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
    return null;
  }
};

const getArticles = async (results) => {
  let articles = [];
  for (let item of results) {
    let article = await getArticle(item.pageid);
    if (article) {
      articles.push({ ...article, main_category: item.main_category });
    }
  }
  return articles;
};

exports.setArticles = functions
  .region("asia-south1")
  .runWith({ timeoutSeconds: 540, memory: "1GB" })
  .https.onRequest(async (req, res) => {
    try {
      const categoriesRef = await db.collection("category_mapping").get();
      let topics = [];
      let categories = [];
      categoriesRef.forEach((doc) => {
        const { main_category } = doc.data();
        categories = [...categories, main_category];
      });

      for (let maincategory of categories) {
        for (let item of maincategory) {
          let response;
          if (item.cmcontinue !== "") {
            response = await axios.get(
              `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${item.category}&cmsort=timestamp&cmcontinue=${item.cmcontinue}&cmtype=page&cmdir=desc&format=json&cmlimi=1`
            );
          } else {
            response = await axios.get(
              `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:${item.category}&cmsort=timestamp&cmtype=page&cmdir=desc&format=json&cmlimit=1`
            );
          }
          if (response.data.continue.cmcontinue) {
            let pages = [...response.data.query.categorymembers];
            pages = pages.map((pagedata) => ({
              ...pagedata,
              main_category: item.category,
            }));
            topics = [...topics, ...pages];
            item.cmcontinue = response.data.continue.cmcontinue;
          }
        }
      }

      let articles = await getArticles(topics);
      // let articles = [
      //   {
      //     heading: "Cannabis and Sikhism",
      //     summary:
      //       "In Sikhism, some Sikhs particularly of the Nihang community use edible cannabis in a religious context. They make use of Bhang, which is an edible preparation of cannabis made out of the leaves and the seeds of the plant.",
      //     pageid: 53152209,
      //     main_category: "Cannabis in India",
      //     categories: [
      //       "Cannabis and Sikhism",
      //       "Cannabis culture",
      //       "Cannabis in India",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/commons/9/9f/Process_of_making_bhang_in_Punjab%2C_India.jpg",
      //     ns: 0,
      //     webpage_url: "https://en.wikipedia.org/wiki/Cannabis_and_Sikhism",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/commons/9/9f/Process_of_making_bhang_in_Punjab%2C_India.jpg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:52:57.752Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Blood antiquities",
      //     summary:
      //       "Blood antiquities are archaeological artefacts that have been plundered during conflicts and have been used to fund these wars. The looting of archaeological sites and the illicit trafficking of cultural property is, and has been, a common practice for terrorist groups in war zones. The pieces mostly end up on the black market, art galleries and antique shops in Europe and North America, or in millionaire private collections. The looting of blood antiquities especially affects the Middle East, because it is a very conflictive area and at the same time with a great density of archaeological sites.",
      //     pageid: 68209091,
      //     subheading: "Archaeological artefacts looted during conflict",
      //     main_category: "Stolen works of art",
      //     categories: [
      //       "Archaeological artifacts",
      //       "Articles with short description",
      //       "CS1 French-language sources (fr)",
      //       "CS1 Spanish-language sources (es)",
      //       "Looting",
      //       "Short description matches Wikidata",
      //       "Stolen works of art",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/commons/2/21/Palmyra_-_Monumental_Arch.jpg",
      //     ns: 0,
      //     webpage_url: "https://en.wikipedia.org/wiki/Blood_antiquities",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/commons/2/21/Palmyra_-_Monumental_Arch.jpg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:53:04.096Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Grubhub",
      //     summary:
      //       'Grubhub Inc. is an American online and mobile prepared food ordering and delivery platform owned by Just Eat Takeaway that connects diners with local restaurants. The company is based in Chicago, Illinois and was founded in 2004. Their slogan is "grub what you love." As of 2019, the company had 19.9 million active users and 115,000 associated restaurants across 3,200 cities and all 50 states in the United States. Grubhub Seamless went public in April 2014 and is traded on the New York Stock Exchange (NYSE) under the ticker symbol "GRUB".',
      //     pageid: 40439540,
      //     subheading: "On-demand restaurant food delivery service",
      //     main_category: "Internet memes introduced in 2021",
      //     categories: [
      //       "2014 initial public offerings",
      //       "2021 mergers and acquisitions",
      //       "AC with 0 elements",
      //       "All articles with dead external links",
      //       "American companies established in 2004",
      //       "American subsidiaries of foreign companies",
      //       "Articles with dead external links from July 2021",
      //       "Articles with short description",
      //       "Companies formerly listed on the New York Stock Exchange",
      //       "Internet memes introduced in 2021",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/commons/e/ed/Decrease2.svg",
      //     ns: 0,
      //     webpage_url: "https://en.wikipedia.org/wiki/Grubhub",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/commons/e/ed/Decrease2.svg",
      //       "https://upload.wikimedia.org/wikipedia/commons/a/a4/Food_Delivery_Service.jpg",
      //       "https://upload.wikimedia.org/wikipedia/commons/d/d6/Foodlogo2.svg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:53:07.152Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Low-crotch pants",
      //     summary:
      //       "Low-crotch pants, also known as drop-crotch pants, are a type of pants with the crotch of trousers designed to sag down loosely toward the knees. Low-crotch pants have been available in styles for both men and women but the skinny-legged, dropped-crotch types of jeans and pants rose to popularity in the 2010s.",
      //     pageid: 68243440,
      //     subheading: "Style of pants",
      //     main_category: "Trousers and shorts",
      //     categories: [
      //       "20th-century fashion",
      //       "21st-century fashion",
      //       "All orphaned articles",
      //       "Articles with short description",
      //       "Casual wear",
      //       "Hip hop fashion",
      //       "Jeans by type",
      //       "Orphaned articles from July 2021",
      //       "Short description with empty Wikidata description",
      //       "Street fashion",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/commons/a/a9/Kanye_West_At_the_Big_Chill_2011.jpg",
      //     ns: 0,
      //     webpage_url: "https://en.wikipedia.org/wiki/Low-crotch_pants",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/en/6/6c/Wiki_letter_w.svg",
      //       "https://upload.wikimedia.org/wikipedia/commons/1/1d/Believe_Tour_5%2C_2012.jpg",
      //       "https://upload.wikimedia.org/wikipedia/commons/6/69/Gwen_Stefani%2C_No_Doubt_%28crop_2%29.jpg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:53:10.255Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "List of tourist attractions in Lucknow",
      //     summary:
      //       "List of tourist attractions in Lucknow, capital city of Indian state of Uttar Pradesh",
      //     pageid: 64701754,
      //     main_category: "Tourist attractions in Lucknow",
      //     categories: [
      //       "Lists of tourist attractions in India by city",
      //       "Lists of tourist attractions in Uttar Pradesh",
      //       "Lucknow-related lists",
      //       "Tourist attractions in Lucknow",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/en/7/71/Lucknow_skyline.png",
      //     ns: 0,
      //     webpage_url:
      //       "https://en.wikipedia.org/wiki/List_of_tourist_attractions_in_Lucknow",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/en/7/71/Lucknow_skyline.png",
      //       "https://upload.wikimedia.org/wikipedia/commons/f/fd/Chhota_imambara_Lucknow.jpg",
      //       "https://upload.wikimedia.org/wikipedia/commons/e/e4/Adnanwiki.badaimambada1.JPG",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:53:13.666Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Japanese ideals of female beauty",
      //     summary:
      //       "Japanese ideals of female beauty are a cultural set of aesthetic standards in relevance to physical beauty. From the history, up until today the standards have changed throughout evolution, but well cared for skin and a light skin tone remains to be the foundation of Japanese beauty.",
      //     pageid: 60810285,
      //     main_category: "Female beauty",
      //     categories: ["Female beauty", "Japanese culture", "Women in Japan"],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/commons/d/de/Ukiyo-e_by_Kitagawa_Utamaro.jpg",
      //     ns: 0,
      //     webpage_url:
      //       "https://en.wikipedia.org/wiki/Japanese_ideals_of_female_beauty",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/commons/d/de/Ukiyo-e_by_Kitagawa_Utamaro.jpg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:53:18.400Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Healthcare in India",
      //     summary:
      //       "India has a universal multi-payer health care model that is paid for by a combination of public and private health insurances along with the element of almost entirely tax-funded public hospitals. The public hospital system is essentially free for all Indian residents except for small, often symbolic co-payments in some services. At the federal level, a national publicly funded health insurance program was launched in 2018 by the Government of India, called Ayushman Bharat. This aimed to cover the bottom 50% of the country's population working in the unorganized sector and offers them free treatment at both public and private hospitals. For people working in the organized sector and earning a monthly salary of up to ₹21,000 are covered by the social insurance scheme of Employees' State Insurance which entirely funds their healthcare, both in public and private hospitals. People earning more than that amount are provided health insurance coverage by their employers through the many public or private insurance companies. As of 2020, 300 million Indians are covered by insurance bought from one of the public or private insurance companies by their employers as group or individual plans. Unemployed people without coverage are covered by the various state funding schemes for emergency hospitalization if they do not have the means to pay for it.\nIn 2019, the total net government spending on healthcare was $36 billion or 1.23% of its GDP. Since the country's independence, the public hospital system has been entirely funded through general taxation.",
      //     pageid: 39071263,
      //     subheading: "Overview of the health care system in India",
      //     main_category: "Healthcare in India",
      //     categories: [
      //       "All Wikipedia articles written in Indian English",
      //       "Articles with short description",
      //       "CS1 errors",
      //       "Health care by country",
      //       "Healthcare in India",
      //       "Short description is different from Wikidata",
      //       "Use Indian English from November 2015",
      //       "Use dmy dates from November 2015",
      //       "Wikipedia articles with LCCN identifiers",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/commons/6/6d/AIIMS_central_lawn.jpg",
      //     ns: 0,
      //     webpage_url: "https://en.wikipedia.org/wiki/Healthcare_in_India",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg",
      //       "https://upload.wikimedia.org/wikipedia/en/4/4a/Commons-logo.svg",
      //       "https://upload.wikimedia.org/wikipedia/commons/6/6d/AIIMS_central_lawn.jpg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:53:22.175Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Presidencies and provinces of British India",
      //     summary:
      //       'The provinces of India, earlier presidencies of British India and still earlier, presidency towns, were the administrative divisions of British governance in the Indian subcontinent. Collectively, they have been called British India. In one form or another, they existed between 1612 and 1947, conventionally divided into three historical periods:Between 1612 and 1757 the East India Company set up "factories" in several locations, mostly in coastal India, with the consent of the Mughal emperors, Maratha empire or local rulers. Its rivals were the merchant trading companies of Portugal, Denmark, the Netherlands, and France. By the mid-18th century three Presidency towns: Madras, Bombay and Calcutta, had grown in size.\nDuring the period of Company rule in India, 1757–1858, the Company gradually acquired sovereignty over large parts of India, now called "Presidencies". However, it also increasingly came under British government oversight, in effect sharing sovereignty with the Crown. At the same time, it gradually lost its mercantile privileges.\nFollowing the Indian Rebellion of 1857 the company\'s remaining powers were transferred to the Crown. Under the British Raj (1858–1947), administrative boundaries were extended to include a few other British-administered regions, such as Upper Burma. Increasingly, however, the unwieldy presidencies were broken up into "Provinces".',
      //     pageid: 3574003,
      //     subheading:
      //       "Administrative divisions of British governance in India between 1612 AD and 1947 AD",
      //     main_category: "History of India",
      //     categories: [
      //       "All Wikipedia articles written in Indian English",
      //       "Articles with short description",
      //       "British India",
      //       "CS1 maint",
      //       "Former British colonies and protectorates in Asia",
      //       "History of India",
      //       "History of Pakistan",
      //       "Presidencies of British India",
      //       "Short description is different from Wikidata",
      //       "Subdivisions of British India",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/en/9/90/IndiaPolitical1893ConstablesHandAtlas.jpg",
      //     ns: 0,
      //     webpage_url:
      //       "https://en.wikipedia.org/wiki/Presidencies_and_provinces_of_British_India",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/en/c/c3/IGI1908Beluchistan2.jpg",
      //       "https://upload.wikimedia.org/wikipedia/en/a/ae/Flag_of_the_United_Kingdom.svg",
      //       "https://upload.wikimedia.org/wikipedia/en/4/4a/Commons-logo.svg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:53:25.598Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Artwashing",
      //     summary:
      //       "Artwashing describes the use of art and artists in a positive way to distract from or legitimize negative actions by an individual, organization, country, or government—especially in reference to gentrification.",
      //     pageid: 67938698,
      //     subheading: "Type of whitewashing",
      //     main_category: "Cover-ups",
      //     categories: [
      //       "All stub articles",
      //       "Art",
      //       "Articles with short description",
      //       "Corruption",
      //       "Cover-ups",
      //       "Ethics stubs",
      //       "Gentrification",
      //       "Short description matches Wikidata",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/commons/1/10/Socrates_BM_GR1973.03-27.16.jpg",
      //     ns: 0,
      //     webpage_url: "https://en.wikipedia.org/wiki/Artwashing",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/commons/1/10/Socrates_BM_GR1973.03-27.16.jpg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:53:28.735Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Practical joke device",
      //     summary:
      //       "A practical joke device is a prop or toy intended to confuse, frighten, or amuse individuals as a prank. Often, these objects are harmless facsimiles of disgusting or terrifying objects, such as vomit or spilled nail polish. In other instances, they are created as seemingly harmless items designed to humorously malfunction in such a way as to confuse or harm the target of a prank. The devices are frequently sold in magic or specialty shops, purchased over the Internet, or crafted for oneself. Perhaps the most notable such device is the whoopee cushion.",
      //     pageid: 7481219,
      //     main_category: "Jokes",
      //     categories: [
      //       "All articles needing additional references",
      //       "All articles with unsourced statements",
      //       "Articles needing additional references from December 2012",
      //       "Articles with unsourced statements from June 2021",
      //       "Articles with unsourced statements from November 2019",
      //       "Commons category link is on Wikidata",
      //       "Jokes",
      //       "Practical joke devices",
      //       "Wikipedia articles with GND identifiers",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Exploded_Whoopee_Cushion.jpg/3024px-Exploded_Whoopee_Cushion.jpg",
      //     ns: 0,
      //     webpage_url: "https://en.wikipedia.org/wiki/Practical_joke_device",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/en/4/4a/Commons-logo.svg",
      //       "https://upload.wikimedia.org/wikipedia/en/8/8a/OOjs_UI_icon_edit-ltr-progressive.svg",
      //       "https://upload.wikimedia.org/wikipedia/commons/e/e1/Exploded_Whoopee_Cushion.jpg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:53:35.137Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Threesome",
      //     summary:
      //       'In human sexuality, a threesome is commonly understood as "a sexual interaction between three people whereby at least one engages in physical sexual behaviour with both the other individuals". Though threesome most commonly refers to sexual activity involving three participants, it is also sometimes used to apply to a long-term domestic relationship, such as polyamory or a ménage à trois.',
      //     pageid: 223265,
      //     subheading:
      //       "Sexual activity that involves three people at the same time",
      //     main_category: "Sex positions",
      //     categories: [
      //       "3 (number)",
      //       "AC with 0 elements",
      //       "All articles needing additional references",
      //       "Articles needing additional references from February 2019",
      //       "Articles with short description",
      //       "Casual sex",
      //       "Commons category link is on Wikidata",
      //       "Group sex",
      //       "Pornography terminology",
      //       "Sex positions",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/commons/c/c5/Peter_Fendi_-_Der_Gemeinsame_Freund_%281910%29.jpg",
      //     ns: 0,
      //     webpage_url: "https://en.wikipedia.org/wiki/Threesome",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/en/9/99/Question_book-new.svg",
      //       "https://upload.wikimedia.org/wikipedia/en/4/4a/Commons-logo.svg",
      //       "https://upload.wikimedia.org/wikipedia/en/b/b7/Pending-protection-shackle.svg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:53:44.095Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Pussy torture",
      //     summary:
      //       'Pussy torture is a BDSM or sexual activity involving the application of pain or pressure to a vulva or vagina, typically in the context of sadomasochism. It is applied through activities such as:wax play\ncaning\nsqueezing vulva \nerotic electrostimulation\ngenital piercing \nfigging \nusing clamps\nusing a "pussy spreader" device with attached clothespins \nusing a speculum \nusing a crotch rope\nattaching weights to the labia\ninserting objects into vagina \ninserting a hand into the vagina (fisting)\nusing a sex machine\nshooting a water shower onto the genitals\nproducing a forced orgasm using devices such as a vibrator or Ben Wa balls\nprolonged seating on a wooden horse or on a sybian',
      //     pageid: 54287333,
      //     subheading: "BDSM activity",
      //     main_category: "Sexual acts",
      //     categories: [
      //       "All stub articles",
      //       "Articles with hAudio microformats",
      //       "Articles with short description",
      //       "BDSM stubs",
      //       "BDSM terminology",
      //       "Commons category link is on Wikidata",
      //       "Paraphilias",
      //       "Sexual acts",
      //       "Short description matches Wikidata",
      //       "Spoken articles",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/commons/d/dd/Franz_von_Bayros_Le_jardin_d%27Aphrodite.jpg",
      //     ns: 0,
      //     webpage_url: "https://en.wikipedia.org/wiki/Pussy_torture",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/en/8/84/CuffsLogo.png",
      //       "https://upload.wikimedia.org/wikipedia/en/4/4a/Commons-logo.svg",
      //       "https://upload.wikimedia.org/wikipedia/commons/5/59/2014_WGT_265_Umbra_Et_Imago.jpg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:53:47.835Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Ishwar Puri",
      //     summary:
      //       "Ishwar Kanwar Puri is an Indian-American and Canadian scientist, engineer, and academic.",
      //     pageid: 25896864,
      //     subheading: "Indian-American scientist and engineer",
      //     main_category: "21st-century Indian engineers",
      //     categories: [
      //       "1959 births",
      //       "20th-century Indian scientists",
      //       "21st-century American engineers",
      //       "21st-century American scientists",
      //       "21st-century Canadian engineers",
      //       "21st-century Canadian scientists",
      //       "21st-century Indian engineers",
      //       "American academics of Indian descent",
      //       "American emigrants to Canada",
      //       "American mechanical engineers",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/en/9/92/Ishwar_K._Puri_at_ICFD2011_in_Sendai%2C_Japan%2C_Nov_2011.jpg",
      //     ns: 0,
      //     webpage_url: "https://en.wikipedia.org/wiki/Ishwar_Puri",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/en/9/92/Ishwar_K._Puri_at_ICFD2011_in_Sendai%2C_Japan%2C_Nov_2011.jpg",
      //       "https://upload.wikimedia.org/wikipedia/en/8/8a/OOjs_UI_icon_edit-ltr-progressive.svg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:53:52.010Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Pécrot rail crash",
      //     summary:
      //       "The Pécrot rail crash was a rail accident in the village of Pécrot, Belgium, that occurred on 27 March 2001 when two passenger trains collided head-on. The crash left 8 dead and 12 injured and was Belgium's worst rail disaster in a quarter of a century.",
      //     pageid: 2380919,
      //     main_category: "Interpersonal communication",
      //     categories: [
      //       "2001 in Belgium",
      //       "Accidents and incidents involving SNCB",
      //       "Coordinates on Wikidata",
      //       "Failure",
      //       "Flemish Brabant",
      //       "Grez-Doiceau",
      //       "Interpersonal communication",
      //       "Linguistic controversies",
      //       "Linguistic error",
      //       "Railway accidents and incidents in Belgium",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/commons/e/e6/Site_Accident_de_P%C3%A9crot.jpg",
      //     ns: 0,
      //     webpage_url: "https://en.wikipedia.org/wiki/P%C3%A9crot_rail_crash",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/commons/2/27/Arrow_Blue_Left_001.svg",
      //       "https://upload.wikimedia.org/wikipedia/commons/4/45/Arrow_Blue_Right_001.svg",
      //       "https://upload.wikimedia.org/wikipedia/commons/e/e6/Site_Accident_de_P%C3%A9crot.jpg",
      //     ],
      //     coordinates: {
      //       lat: 50.78333333,
      //       lon: 4.65,
      //       primary: "",
      //       globe: "earth",
      //     },
      //     createdOn: "2021-07-21T12:53:58.852Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Venture capital",
      //     summary:
      //       "Venture capital (VC) is a form of private equity financing that is provided by venture capital firms or funds to startups, early-stage, and emerging companies that have been deemed to have high growth potential or which have demonstrated high growth. Venture capital firms or funds invest in these early-stage companies in exchange for equity, or an ownership stake. Venture capitalists take on the risk of financing risky start-ups in the hopes that some of the firms they support will become successful. Because startups face high uncertainty, VC investments have high rates of failure. The start-ups are usually based on an innovative technology or business model and they are usually from the high technology industries, such as information technology (IT), clean technology or biotechnology.",
      //     pageid: 257210,
      //     subheading: "Form of private-equity financing",
      //     main_category: "Entrepreneurship",
      //     categories: [
      //       "All articles needing additional references",
      //       "All articles with unsourced statements",
      //       "Articles needing additional references from January 2021",
      //       "Articles needing additional references from May 2019",
      //       "Articles with short description",
      //       "Articles with unsourced statements from January 2021",
      //       "Articles with unsourced statements from November 2010",
      //       "CS1 Spanish-language sources (es)",
      //       "CS1 errors",
      //       "CS1 errors",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/commons/8/85/Wall_Street_Sign_%285899884048%29.jpg",
      //     ns: 0,
      //     webpage_url: "https://en.wikipedia.org/wiki/Venture_capital",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/en/d/de/Nasdaq2.png",
      //       "https://upload.wikimedia.org/wikipedia/en/9/99/Question_book-new.svg",
      //       "https://upload.wikimedia.org/wikipedia/en/8/8a/OOjs_UI_icon_edit-ltr-progressive.svg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:54:01.906Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Social loafing",
      //     summary:
      //       "In social psychology, social loafing is the phenomenon of a person exerting less effort to achieve a goal when they work in a group than when working alone. It is seen as one of the main reasons groups are sometimes less productive than the combined performance of their members working as individuals. Research on social loafing began with rope pulling experiments by Ringelmann, who found that members of a group tended to exert less effort in pulling a rope than did individuals alone. In more recent research, studies involving modern technology, such as online and distributed groups, have also shown clear evidence of social loafing. Many of the causes of social loafing stem from individual members' feeling their individual effort will not matter to the group.",
      //     pageid: 1129572,
      //     subheading:
      //       "Person exerting less effort to achieve a goal when in a group than working alone",
      //     main_category: "Human behavior",
      //     categories: [
      //       "All articles to be merged",
      //       "All articles with dead external links",
      //       "Articles to be merged from April 2021",
      //       "Articles with dead external links from December 2017",
      //       "Articles with permanently dead external links",
      //       "Articles with short description",
      //       "CS1 maint",
      //       "Group processes",
      //       "Human behavior",
      //       "Short description is different from Wikidata",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/commons/0/0e/Closed_Access_logo_transparent.svg",
      //     ns: 0,
      //     webpage_url: "https://en.wikipedia.org/wiki/Social_loafing",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/commons/0/0e/Closed_Access_logo_transparent.svg",
      //       "https://upload.wikimedia.org/wikipedia/commons/0/0f/Mergefrom.svg",
      //       "https://upload.wikimedia.org/wikipedia/commons/6/6c/Psi2.svg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:54:05.018Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Law of holes",
      //     summary:
      //       'The first law of holes, or the law of holes, is an adage which states: "if you find yourself in a hole, stop digging". Digging a hole makes it deeper and therefore harder to get out of, which is used as a metaphor that when in an untenable position, it is best to stop carrying on and exacerbating the situation.',
      //     pageid: 35100700,
      //     subheading: "Adage",
      //     main_category: "Adages",
      //     categories: [
      //       "1910s neologisms",
      //       "20th-century philosophy",
      //       "Adages",
      //       "Articles with short description",
      //       "Short description matches Wikidata",
      //       "Use dmy dates from February 2021",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/commons/a/a7/Stop_Digging_%5E_-_geograph.org.uk_-_195319.jpg",
      //     ns: 0,
      //     webpage_url: "https://en.wikipedia.org/wiki/Law_of_holes",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/commons/a/a7/Stop_Digging_%5E_-_geograph.org.uk_-_195319.jpg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:54:08.717Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Mars 2020",
      //     summary:
      //       "Mars 2020 is a Mars rover mission forming part of NASA's Mars Exploration Program that includes the rover Perseverance and the small robotic, coaxial helicopter Ingenuity. Mars 2020 was launched from Earth on an Atlas V launch vehicle at 11:50:01 UTC on 30 July 2020, and confirmation of touch down in Jezero crater on Mars was received at 20:55 UTC on 18 February 2021. On 5 March 2021, NASA named the landing site of the rover Octavia E. Butler Landing. As of 13 July 2021, Perseverance and Ingenuity have been on Mars for 141 sols.",
      //     pageid: 37837437,
      //     subheading: "Astrobiology Mars rover mission by NASA",
      //     main_category: "Mars Exploration Program",
      //     categories: [
      //       "2020 in spaceflight",
      //       "All Wikipedia articles written in American English",
      //       "All articles containing potentially dated statements",
      //       "Articles containing potentially dated statements from July 2021",
      //       "Articles with short description",
      //       "Astrobiology space missions",
      //       "CS1 French-language sources (fr)",
      //       "CS1 Norwegian-language sources (no)",
      //       "Commons category link from Wikidata",
      //       "Coordinates on Wikidata",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/commons/c/c0/Mars_2020_selfie_containing_both_perseverance_rover_and_ingenuity.gif",
      //     ns: 0,
      //     webpage_url: "https://en.wikipedia.org/wiki/Mars_2020",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/commons/0/03/1st_aerial_image_on_mars_taken_by_Ingenuity.jpg",
      //       "https://upload.wikimedia.org/wikipedia/commons/c/c5/2001_mars_odyssey_wizja.jpg",
      //       "https://upload.wikimedia.org/wikipedia/commons/a/ad/260184-JezeroCrater-Delta-Full.jpg",
      //     ],
      //     coordinates: {
      //       lat: 18.4447,
      //       lon: 77.4508,
      //       primary: "",
      //       globe: "mars",
      //     },
      //     createdOn: "2021-07-21T12:54:15.117Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Phobos (moon)",
      //     summary:
      //       "Phobos is the innermost and larger of the two natural satellites of Mars, the other being Deimos. Both moons were discovered in 1877 by American astronomer Asaph Hall. Phobos is named after the Greek god Phobos, a son of Ares (Mars) and Aphrodite (Venus) and twin brother of Deimos. Phobos was the god and personification of fear and panic.",
      //     pageid: 52999,
      //     subheading: "The larger, inner, moon of Mars",
      //     main_category: "Discovery and exploration of the Solar System",
      //     categories: [
      //       "All articles containing potentially dated statements",
      //       "All articles with unsourced statements",
      //       "Articles containing potentially dated statements from 2017",
      //       "Articles containing video clips",
      //       "Articles with short description",
      //       "Articles with unsourced statements from August 2019",
      //       "Articles with unsourced statements from August 2020",
      //       "Astronomical objects discovered in 1877",
      //       "CS1",
      //       "CS1 French-language sources (fr)",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/commons/5/5c/Phobos_colour_2008.jpg",
      //     ns: 0,
      //     webpage_url: "https://en.wikipedia.org/wiki/Phobos_(moon)",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/commons/0/00/Crab_Nebula.jpg",
      //       "https://upload.wikimedia.org/wikipedia/en/4/4a/Commons-logo.svg",
      //       "https://upload.wikimedia.org/wikipedia/commons/8/89/243_ida_crop.jpg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:54:18.274Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "SpankChain",
      //     summary:
      //       'SpankChain is an adult entertainment website and cryptocurrency exchange mostly used for exchanges in the sex work industry. Users pay for services using SpankChain Ethereum-based coin "SPANK". The SpankChain\'s tokens are sometimes referred to as "SpankCoin".',
      //     pageid: 68198812,
      //     main_category: "Cryptocurrencies",
      //     categories: [
      //       "All articles needing additional references",
      //       "Articles needing additional references from July 2021",
      //       "CS1 Italian-language sources (it)",
      //       "Cryptocurrencies",
      //       "Pornography",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/en/9/99/Question_book-new.svg",
      //     ns: 0,
      //     webpage_url: "https://en.wikipedia.org/wiki/SpankChain",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/en/9/99/Question_book-new.svg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:54:21.364Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Iron law of processor performance",
      //     summary:
      //       "In computer architecture, the iron law of processor performance is a mathematical formula relating how the instructions processors use to perform tasks relate to performance, which can be used to find the time to execute a program. It was the result of research performed by Joel Emer and Douglas Clark in the 1980s. This insight spurred the development of the RISC architecture, which outperform CISC despite using a seemingly larger number of simpler operations for the same set of tasks.",
      //     pageid: 59843147,
      //     main_category: "Rules of thumb",
      //     categories: [
      //       "All articles with unsourced statements",
      //       "All stub articles",
      //       "Articles with unsourced statements from March 2021",
      //       "Computer engineering stubs",
      //       "Rules of thumb",
      //       "Technology",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/commons/9/91/LampFlowchart.svg",
      //     ns: 0,
      //     webpage_url:
      //       "https://en.wikipedia.org/wiki/Iron_law_of_processor_performance",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/commons/9/91/LampFlowchart.svg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:54:24.742Z",
      //     type: "normal",
      //   },
      //   {
      //     heading: "Village on Wheels",
      //     summary:
      //       "Village on Wheels refer to trains introduced by the Indian Railways to cater to budget tourists, especially villagers. The trains connect the selected tourist destinations, usually with a circular schedule. They are managed by Indian Railway Catering and Tourism Corporation (IRCTC), a public-sector undertaking of the Railways.",
      //     pageid: 5363096,
      //     main_category: "Luxury trains in India",
      //     categories: [
      //       "Luxury trains in India",
      //       "Rural development in India",
      //       "Tourism in India",
      //     ],
      //     mainImage:
      //       "https://upload.wikimedia.org/wikipedia/en/9/96/Symbol_category_class.svg",
      //     ns: 0,
      //     webpage_url: "https://en.wikipedia.org/wiki/Village_on_Wheels",
      //     reference: "From Wikipedia, the free encyclopedia",
      //     image_links: [
      //       "https://upload.wikimedia.org/wikipedia/en/9/96/Symbol_category_class.svg",
      //     ],
      //     coordinates: null,
      //     createdOn: "2021-07-21T12:54:28.101Z",
      //     type: "normal",
      //   },
      // ];
      let batch = db.batch();
      articles.forEach((doc) => {
        let docRef = db.collection("newcards").doc(`${doc.pageid}`);
        batch.set(docRef, doc);
      });
      batch.commit().then(() => res.status(200).send({ message: "done" }));
    } catch (err) {
      res.status(500).send(err.code);
    }
  });
