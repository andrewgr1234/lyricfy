const express = require("express");

const app = express();
const port = process.env.PORT || 3001;

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile("./public/index.html");
});

app.get("/proxy", async (req, res) => {
  const url = req.query.url;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching URL:", error);
    res.status(500).send("Error fetching URL");
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
