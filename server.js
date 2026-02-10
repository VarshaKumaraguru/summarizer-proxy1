import express from "express";
import fetch from "node-fetch";
import cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

const app = express();

app.get("/fetch", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing URL");

  try {
    const response = await fetch(url);
    const html = await response.text();

    // Use Readability.js to extract main content
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    let textContent = article?.textContent?.trim() || "";

    // Refined detection logic
    if (!textContent || textContent.length < 300) {
      if (html.includes("Access denied") || html.includes("Membership required")) {
        return res.send("Summary unavailable: content is behind a paywall.");
      }
      if (html.includes("You must log in") || html.includes("Login required")) {
        return res.send("Summary unavailable: login required to view this content.");
      }

      // Fallback: extract raw body text with Cheerio
      const $ = cheerio.load(html);
      const fallbackText = $("body").text().replace(/\s+/g, " ").trim();
      return res.send(fallbackText || "Summary unavailable: site did not return readable content.");
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(textContent);

  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Failed to fetch content");
  }
});

app.listen(3000, () => console.log("Proxy running on port 3000"));
