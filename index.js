const express = require("express");
const cors = require("cors");

const PORT = process.env.PORT || 3000;
const api = require("./api");

const app = express();
app.use("/api", api);
// Firebase setup
// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
// });

app.get("/", (req, res) => {
  res.send("Welcome to mis.");
});

app.listen(PORT, () => console.log(`Listening to port ${PORT}`));
