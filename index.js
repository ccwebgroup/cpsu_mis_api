const express = require("express");
const cors = require("cors");

const PORT = process.env.PORT || 3000;
const api = require("./api");

const app = express();
app.use("/api", api);

app.get("/", (req, res) => {
  res.send("Welcome to mis.");
});

app.listen(PORT, () => console.log(`Listening to port ${PORT}`));
