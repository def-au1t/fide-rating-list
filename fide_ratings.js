/* eslint-disable */
const axios = require("axios");
const cheerio = require("cheerio");
const utils = require("./utils");

// Pages fetching
const fetchProfilePage = async (fide_num) => {
  const res = await axios.get(`https://ratings.fide.com/profile/${fide_num}`);
  const $ = cheerio.load(res.data);

  if ($(".profile-container").length === 0) {
    throw "Not found";
  } else {
    return $;
  }
};

const fetchHistoryPage = async (fide_num) => {
  const res = await axios.get(
    `https://ratings.fide.com/profile/${fide_num}/chart`
  );
  const $ = cheerio.load(res.data);

  if ($(".profile-container").length === 0) {
    throw "Not found";
  } else {
    return $;
  }
};

// Pages Parsing
const parseRankFromProfilePage = ($) => {
  const world_rank_all_players = parseInt(
    $("div.profile-ranks > div:nth-child(1) > div:nth-child(3) > p").text(),
    10
  );
  const world_rank_active_players = parseInt(
    $("div.profile-ranks > div:nth-child(1) > div:nth-child(2) > p").text(),
    10
  );
  const national_rank_all_players = parseInt(
    $("div.profile-ranks > div:nth-child(2) > div:nth-child(3) > p").text(),
    10
  );
  const national_rank_active_players = parseInt(
    $("div.profile-ranks > div:nth-child(2) > div:nth-child(2) > p").text(),
    10
  );
  const continental_rank_all_players = parseInt(
    $("div.profile-ranks > div:nth-child(3) > div:nth-child(3) > p").text(),
    10
  );
  const continental_rank_active_players = parseInt(
    $("div.profile-ranks > div:nth-child(3) > div:nth-child(2) > p").text(),
    10
  );

  return {
    world_rank_all_players,
    world_rank_active_players,
    national_rank_all_players,
    national_rank_active_players,
    continental_rank_all_players,
    continental_rank_active_players,
  };
};

const parsePersonalDataFromProfilePage = ($) => {
  const name = $(".player-title").text();
  const federation = $(".profile-info-country").text().replace(/\s/g, "");
  const birth_year = parseInt(
    $(".profile-info-byear").text().replace(/\s/g, ""),
    10
  );
  const sex = $(".profile-info-sex").text().replace(/\s/g, "");
  const title = $(".profile-info-title").text().replace(/\s/g, "");

  return {
    name,
    federation,
    birth_year,
    sex,
    title,
  };
};

const parseEloFromProfilePage = ($) => {
  const standard_elo = parseInt($(".profile-standart").text());
  const rapid_elo = parseInt($(".profile-rapid").text());
  const blitz_elo = parseInt($(".profile-blitz").text());

  return {
    standard_elo,
    rapid_elo,
    blitz_elo,
  };
};

// Data methods
const getPlayerRank = async (fide_num) => {
  const $ = await fetchProfilePage(fide_num);
  return parseRankFromProfilePage($);
};

const getPlayerPersonalData = async (fide_num) => {
  const $ = await fetchProfilePage(fide_num);
  return parsePersonalDataFromProfilePage($);
};

const getPlayerElo = async (fide_num) => {
  const $ = await fetchProfilePage(fide_num);
  return parseEloFromProfilePage($);
};

const getPlayerFullInfo = async (fide_num) => {
  const $ = await fetchProfilePage(fide_num);
  const player_history = await getPlayerHistory(fide_num);
  return {
    ...parsePersonalDataFromProfilePage($),
    ...parseEloFromProfilePage($),
    ...parseRankFromProfilePage($),
    player_history,
  };
};

const getPlayerHistory = async (fide_num, csv_output) => {
  const $ = await fetchHistoryPage(fide_num);
  const table_entries = $("#tabs-3 .profile-tableCont > table > tbody > tr");

  const history = [];
  table_entries.map((i) => {
    const row = cheerio.load(table_entries[i])("td");
    history.push({
      date: row[0].children[0].data.replace(/\s/g, ""),
      numeric_date: utils.parseDate(row[0].children[0].data.replace(/\s/g, "")),
      standard: row[1].children[0].data.replace(/\s/g, ""),
      num_standard_games: row[2].children[0].data.replace(/\s/g, ""),
      rapid: row[3].children[0].data.replace(/\s/g, ""),
      num_rapid_games: row[4].children[0].data.replace(/\s/g, ""),
      blitz: row[5].children[0].data.replace(/\s/g, ""),
      num_blitz_games: row[6].children[0].data.replace(/\s/g, ""),
    });
  });
  return csv_output
    ? history
        .sort((e1, e2) => e2.numeric_date - e1.numeric_date)
        .map((entry) => utils.ratingJSONToCSV(entry))
    : history;
};

module.exports = {
  getPlayerFullInfo,
  getPlayerElo,
  getPlayerHistory,
  getPlayerRank,
  getPlayerPersonalData,
};
