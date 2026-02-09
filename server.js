// server.js
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

// Route: GET /fetch?url=<targetURL>
app.get("/fetch", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send("Missing URL");
  }

  try {
    // Use native fetch (available in Node 20+)
    const response = await fetch(targetUrl);

    // Optional: check content type
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return res.status(415).send("Unsupported content type");
    }

    const html = await response.text();
    res.send(html);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).send("Error fetching page");
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});