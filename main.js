require("dotenv").config();

const DEFAULT_PORT = 80;
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
                    client.close();
                    res.json(result);
                })
                .catch((error) => {
                    client.close();
				            console.error(error)});

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

    const date = new Date();
    const dateStr = date.toLocaleDateString("pl-PL", {day: "2-digit"})
        +'.'+date.toLocaleDateString("pl-PL", {month: "2-digit"})
        +'.'+date.toLocaleDateString("pl-PL", {year: "numeric"});

    for (let i = 0; i < ids.length; i++) {
        fide_ratings.getPlayerFullInfo(ids[i]).then((data) => {
            data.id = ids[i];
            // Name correction
            for (let j = 0; j < replacements.length; j++) {
                data.name = data.name.replace(replacements[j][0], replacements[j][1]);
            }
            data.name = data.name.replace(',', '');
            // Checking rating changes.

            let changes = [0,0,0];
            if(data.player_history && data.player_history[0] && data.player_history[1]){
                let current = [-1, -1, -1]
                let previous = [-1, -1, -1]
                current[0] = parseInt(data.player_history[0].standard)
                current[1] = parseInt(data.player_history[0].rapid)
                current[2] = parseInt(data.player_history[0].blitz)

                previous[0] = parseInt(data.player_history[1].standard)
                previous[1] = parseInt(data.player_history[1].rapid)
                previous[2] = parseInt(data.player_history[1].blitz)
                for(let k=0; k<3; k++){
                    if(isNaN(current[k]) || isNaN(previous[k])) changes[k] = undefined
                    if(current[k] > previous[k]) changes[k] = 1
                    else if(current[k] < previous[k]) changes[k] = -1
                }
            }
            data.changes = changes

            if(data.rapid_elo === "Notrated") data.rapid_elo = ""
            if(data.standard_elo === "Notrated") data.standard_elo = ""
            if(data.blitz_elo === "Notrated") data.blitz_elo = ""

            //Adding date
            data.date = dateStr;
            console.log(`${i + 1}: ${data.name}`);
            result.push(data);

        });
    }
    let counter = 0;
    while (result.length < ids.length || counter > 1000) {
        await new Promise((r) => setTimeout(r, 100));
        counter++;
    }

    MongoClient.connect(process.env.CONNECTION_STRING)
        .then(async (client) => {
            await client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTION_NAME).deleteMany({ });
            client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTION_NAME).insertMany(result)
                .then((result) => {
                    console.log("Zaktualizowano pomyślnie");
                    client.close();
                    res.send(result.result.ok.toString());
                })
                .catch((error) => {
                    client.close();
				        res.send(error.toString())
				});

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
