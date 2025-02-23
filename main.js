require("dotenv").config();
const fs = require("fs").promises;

const DEFAULT_PORT = 80;
const DEFAULT_REQUEST_TIMEOUT = 100000;

const path = require("path");
const fide_ratings = require("./fide_ratings");
const utils = require("./utils");
const express = require("express");
const timeout = require("express-timeout-handler");
const app = express();
const fetch = require("node-fetch");
const basicAuth = require("express-basic-auth");

const port = process.env.PORT || DEFAULT_PORT;
const request_timeout =
  parseInt(process.env.RESPONSE_TIMEOUT_MS, 10) || DEFAULT_REQUEST_TIMEOUT;

var cron = require("node-cron");

async function refreshData() {
  let ids = [];
  let replacements = [];
  const result = [];
  await fetch(process.env.FIDE_IDS, { method: "Get" })
    .then((r) => r.json())
    .then((r) => {
      ids = r.ids;
      replacements = r.replace;
    });

  const date = new Date();
  const dateStr =
    date.toLocaleDateString("pl-PL", { day: "2-digit" }) +
    "." +
    date.toLocaleDateString("pl-PL", { month: "2-digit" }) +
    "." +
    date.toLocaleDateString("pl-PL", { year: "numeric" });

  for (let i = 0; i < ids.length; i++) {
    fide_ratings
      .getPlayerFullInfo(ids[i])
      .then((data) => {
        data.id = ids[i];
        // Name correction
        for (let j = 0; j < replacements.length; j++) {
          data.name = data.name.replace(replacements[j][0], replacements[j][1]);
        }
        data.name = data.name.replace(",", "");
        // Checking rating changes.

        let changes = [0, 0, 0];
        if (
          data.player_history &&
          data.player_history[0] &&
          data.player_history[1]
        ) {
          let current = [-1, -1, -1];
          let previous = [-1, -1, -1];
          current[0] = parseInt(data.player_history[0].standard);
          current[1] = parseInt(data.player_history[0].rapid);
          current[2] = parseInt(data.player_history[0].blitz);

          previous[0] = parseInt(data.player_history[1].standard);
          previous[1] = parseInt(data.player_history[1].rapid);
          previous[2] = parseInt(data.player_history[1].blitz);
          for (let k = 0; k < 3; k++) {
            if (isNaN(current[k]) || isNaN(previous[k])) changes[k] = undefined;
            if (current[k] > previous[k]) changes[k] = 1;
            else if (current[k] < previous[k]) changes[k] = -1;
          }
        }
        data.changes = changes;

        if (data.rapid_elo === "Notrated") data.rapid_elo = "";
        if (data.standard_elo === "Notrated") data.standard_elo = "";
        if (data.blitz_elo === "Notrated") data.blitz_elo = "";

        if (data.rapid_elo === "" && data.player_history?.[0]?.rapid) {
          data.rapid_elo = data.player_history[0].rapid;
        }
        if (data.standard_elo === "" && data.player_history?.[0]?.standard) {
          data.standard_elo = data.player_history[0].standard;
        }
        if (data.blitz_elo === "" && data.player_history?.[0]?.blitz) {
          data.blitz_elo = data.player_history[0].blitz;
        }

        //Adding date
        data.date = dateStr;
        result.push(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }
  let counter = 0;
  while (result.length < ids.length || counter > 1000) {
    await new Promise((r) => setTimeout(r, 100));
    counter++;
  }

  try {
    await fs.writeFile("ratings.json", JSON.stringify(result));
  } catch (err) {
    console.error(err);
    return err.toString();
  }
  return "OK";
}

cron.schedule(
  "0 0 2 * * *",
  async () => {
    await refreshData();
  },
  {
    runOnInit: true,
  }
);

app.use(express.static(path.join(__dirname, "client/build")));

app.use(
  timeout.handler({
    timeout: request_timeout,
    onTimeout: (req, res) => res.status(408).send(),
  })
);

app.use((req, res, next) => {
  res.set("Content-Type", "application/json");
  res.set("Access-Control-Allow-Origin", "*");

  next();
});

app.get("/player/:fide_num/*", (req, res, next) => {
  const { fide_num } = req.params;

  if (isNaN(fide_num)) {
    res
      .status(400)
      .json(
        utils.buildErrorResponse(
          "The player's fide number must be a positive integer number"
        )
      );
  } else {
    next();
  }
});

app.get("/player/:fide_num/info", (req, res) => {
  const { fide_num } = req.params;

  fide_ratings
    .getPlayerFullInfo(fide_num)
    .then((data) => res.json(data))
    .catch((err) => playerEndpointsErrorHandler(err, res));
});

app.get("/player/:fide_num/personal-data", (req, res) => {
  const { fide_num } = req.params;

  fide_ratings
    .getPlayerPersonalData(fide_num)
    .then((data) => res.json(data))
    .catch((err) => playerEndpointsErrorHandler(err, res));
});

app.get("/player/:fide_num/rank", (req, res) => {
  const { fide_num } = req.params;

  fide_ratings
    .getPlayerRank(fide_num)
    .then((data) => res.json(data))
    .catch((err) => playerEndpointsErrorHandler(err, res));
});

app.get("/player/:fide_num/elo", (req, res) => {
  const { fide_num } = req.params;

  fide_ratings
    .getPlayerElo(fide_num)
    .then((data) => res.json(data))
    .catch((err) => playerEndpointsErrorHandler(err, res));
});

app.get("/player/:fide_num/history/", (req, res) => {
  const { fide_num } = req.params;

  fide_ratings
    .getPlayerHistory(fide_num)
    .then((data) => res.json(data))
    .catch((err) => playerEndpointsErrorHandler(err, res));
});

app.get("/rating-list", async (req, res) => {
  try {
    const jsonString = await fs.readFile("ratings.json", "utf8");
    res.json(JSON.parse(jsonString));
  } catch (err) {
    console.log("File read failed:", err);
    res.status(404).send();
  }
});

app.get(
  "/rating-list/update",
  basicAuth({
    users: { admin: process.env.UPDATE_PASSWORD ?? "admin" },
    challenge: true,
    realm: "Podaj haslo:",
  }),
  async (req, res) => {
    const result = await refreshData();
    res.send(result);
  }
);

app.get("*", (req, res) => res.status(400).send(""));

app.listen(port, () => console.log(`Started listening on ${port} . . .`));

const playerEndpointsErrorHandler = (err, res) => {
  if (err === "Not found") {
    res
      .status(404)
      .json(utils.buildErrorResponse("Requested player does not exist"));
  }
  res
    .status(500)
    .json(utils.buildErrorResponse("Failed to fetch player information"));
};

// PARTS OF CODE FROM https://github.com/xRuiAlves/fide-ratings-scraper
// Copyright (c) 2020 Rui Alves

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
