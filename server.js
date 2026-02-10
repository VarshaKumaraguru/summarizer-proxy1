import express from "express";
import fetch from "node-fetch";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import * as cheerio from "cheerio";

const app = express();

app.get("/fetch", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing URL");

  try {
    const response = await fetch(url);
    const html = await response.text();

    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    let textContent = article?.textContent?.trim() || "";

    if (!textContent || textContent.length < 300) {
      if (html.includes("Access denied") || html.includes("Membership required")) {
        return res.send("Summary unavailable: content is behind a paywall.");
      }
      if (html.includes("You must log in") || html.includes("Login required")) {
        return res.send("Summary unavailable: login required to view this content.");
      }

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
