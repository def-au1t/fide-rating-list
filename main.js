require("dotenv-flow").config();

const DEFAULT_PORT = 5000;
const DEFAULT_REQUEST_TIMEOUT = 100000;

const path = require('path');
const fide_ratings = require("./fide_ratings");
const utils = require("./utils");
const express = require("express");
const timeout = require("express-timeout-handler");
const app = express();
const MongoClient = require("mongodb").MongoClient;
const fetch = require("node-fetch");
const basicAuth = require("express-basic-auth");
const cron = require("node-cron");

const port = process.env.PORT || DEFAULT_PORT;
const request_timeout = parseInt(process.env.RESPONSE_TIMEOUT_MS, 10) || DEFAULT_REQUEST_TIMEOUT;

app.use(express.static(path.join(__dirname, 'client/build')))

app.use(timeout.handler({
    timeout: request_timeout,
    onTimeout: (req, res) => res.status(408).send(),
}));

app.use((req, res, next) => {
    res.set("Content-Type", "application/json");
    res.set("Access-Control-Allow-Origin", "*");

    next();
});

app.get("/player/:fide_num/*", (req, res, next) => {
    const { fide_num } = req.params;

    if (isNaN(fide_num)) {
        res.status(400).json(
            utils.buildErrorResponse("The player's fide number must be a positive integer number",
            ));
    } else {
        next();
    }
});

app.get("/player/:fide_num/info", (req, res) => {
    const { fide_num } = req.params;

    fide_ratings.getPlayerFullInfo(fide_num)
        .then((data) => res.json(data))
        .catch((err) => playerEndpointsErrorHandler(err, res));
});

app.get("/player/:fide_num/personal-data", (req, res) => {
    const { fide_num } = req.params;

    fide_ratings.getPlayerPersonalData(fide_num)
        .then((data) => res.json(data))
        .catch((err) => playerEndpointsErrorHandler(err, res));
});

app.get("/player/:fide_num/rank", (req, res) => {
    const { fide_num } = req.params;

    fide_ratings.getPlayerRank(fide_num)
        .then((data) => res.json(data))
        .catch((err) => playerEndpointsErrorHandler(err, res));
});

app.get("/player/:fide_num/elo", (req, res) => {
    const { fide_num } = req.params;

    fide_ratings.getPlayerElo(fide_num)
        .then((data) => res.json(data))
        .catch((err) => playerEndpointsErrorHandler(err, res));
});

app.get("/player/:fide_num/history/", (req, res) => {
    const { fide_num } = req.params;

    fide_ratings.getPlayerHistory(fide_num)
        .then((data) => res.json(data))
        .catch((err) => playerEndpointsErrorHandler(err, res));
});

app.get("/rating-list", (req, res) => {
    MongoClient.connect(process.env.CONNECTION_STRING)
        .then((client) => {
            client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTION_NAME).find().toArray()
                .then((result) => {
                    res.json(result);
                })
                .catch((error) => console.error(error));

        });

});

app.get("/rating-list/update", basicAuth({
    users: { "admin": process.env.UPDATE_PASSWORD },
    challenge: true,
    realm: "Podaj haslo:",
}), async (req, res) => {
    let ids = [];
    let replacements = [];
    const result = [];
    await fetch(process.env.FIDE_IDS, { method: "Get" })
        .then((r) =>  r.json())
        .then((r) => { ids = r.ids; replacements = r.replace });

    for (let i = 0; i < ids.length; i++) {
        fide_ratings.getPlayerFullInfo(ids[i]).then((data) => {
            data.id = ids[i];
            for (let j = 0; j < replacements.length; j++) {
                data.name = data.name.replace(replacements[j][0], replacements[j][1]);
            }
            data.date = new Date().toLocaleString("pl-PL", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
            console.log(`${i + 1}: ${data.name}`);
            result.push(data);

        });
    }
    let counter = 0;
    while (result.length < ids.length || counter > 200) {
        await new Promise((r) => setTimeout(r, 100));
        counter++;
    }

    MongoClient.connect(process.env.CONNECTION_STRING)
        .then(async (client) => {
            await client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTION_NAME).deleteMany({ });
            client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTION_NAME).insertMany(result)
                .then((result) => {
                    console.log("Zaktualizowano pomyślnie");
                    res.send(result);
                })
                .catch((error) => res.send(error.toString()));

        });

});

app.get("*", (req, res) => res.status(400).send(""));

app.listen(port, () =>
    console.log(`Started listening on ${port} . . .`),
);

const playerEndpointsErrorHandler = (err, res) => {
    if (err === "Not found") {
        res.status(404).json(utils.buildErrorResponse(
            "Requested player does not exist",
        ));
    }
    res.status(500).json(utils.buildErrorResponse(
        "Failed to fetch player information",
    ));
};


cron.schedule("0 3 * * *", async() => {
    let authorization = Buffer.from("admin:"+ process.env.UPDATE_PASSWORD).toString('base64');
    console.log(authorization);
   await fetch('http://127.0.0.1:' + (process.env.PORT || 5000) + '/rating-list/update', {
       method: "Get",
       headers: {'Authorization': "Basic " + authorization,}
   })
});
