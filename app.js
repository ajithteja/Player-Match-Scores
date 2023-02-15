const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

let dbPath = path.join(__dirname, "cricketMatchDetails.db");

let app = express();
app.use(express.json());
let db = null;

let funcDatabaseConnection = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at: http://localhost:3000/");
    });
  } catch (error) {
    console.log(`ERROR: ${error.message}`);
    process.exit(1);
  }
};

funcDatabaseConnection();

// API 1 GET Path: /players/ | Returns a list of all the players in the player table

app.get("/players/", async (request, response) => {
  const playerGetQuery = `SELECT *
    FROM player_details
    ORDER BY player_id;`;
  let playersArr = await db.all(playerGetQuery);
  let funcObjCamalCase = (eachObj) => {
    return {
      playerId: eachObj.player_id,
      playerName: eachObj.player_name,
    };
  };

  let newArr = [];
  for (let eachObj of playersArr) {
    let newObj = funcObjCamalCase(eachObj);
    newArr.push(newObj);
  }
  response.send(newArr);
});

// API 2 GET Path: /players/:playerId/  |  Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  let { playerId } = request.params;
  const playerQuery = `SELECT *
    FROM player_details
    WHERE player_id = ${playerId};`;
  let playerObj = await db.get(playerQuery);
  response.send({
    playerId: playerObj.player_id,
    playerName: playerObj.player_name,
  });
});

// API 3 PUT Path: /players/:playerId/   | response AS  Player Details Updated

app.put("/players/:playerId/", async (request, response) => {
  let { playerId } = request.params;
  let playerUpdatedobj = request.body;
  let { playerName } = playerUpdatedobj;
  let updateQuery = `UPDATE player_details
    SET player_name = '${playerName}'
    WHERE  player_id = ${playerId};`;
  let updatedPlayer = await db.run(updateQuery);
  response.send("Player Details Updated");
});

// API 4 GET  Path: /matches/:matchId/   |    Returns the match details of a specific match

app.get("/matches/:matchId/", async (request, response) => {
  let { matchId } = request.params;
  let matchGetQuery = `SELECT * FROM match_details
    WHERE match_id = ${matchId};`;
  let matchDetails = await db.get(matchGetQuery);
  response.send({
    matchId: matchDetails.match_id,
    match: matchDetails.match,
    year: matchDetails.year,
  });
});

// API 5  GET  Path: /players/:playerId/matches    |    Returns a list of all the matches of a player

app.get("/players/:playerId/matches/", async (request, response) => {
  let { playerId } = request.params;
  let matchByPlayerQuery = `SELECT match_id AS matchId, match AS match, year AS year
   FROM match_details
  NATURAL JOIN player_match_score
  WHERE player_id = ${playerId};`;
  let matchDetails = await db.all(matchByPlayerQuery);
  response.send(matchDetails);
});

// API 6   Path: /matches/:matchId/players    |    Returns a list of players of a specific match

app.get("/matches/:matchId/players/", async (request, response) => {
  let { matchId } = request.params;
  let getPlayersBymatchId = `SELECT player_id AS playerId, player_name AS playerName
  FROM player_details
    NATURAL JOIN player_match_score
    WHERE match_id = ${matchId};`;
  let players = await db.all(getPlayersBymatchId);
  response.send(players);
});

// API 7  Path: /players/:playerId/playerScores
//  Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores/", async (request, response) => {
  let { playerId } = request.params;
  let getPlayerScoreQuery = `SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes
    FROM player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  let playerScoreArr = await db.get(getPlayerScoreQuery);
  response.send(playerScoreArr);
});

module.exports = app;
