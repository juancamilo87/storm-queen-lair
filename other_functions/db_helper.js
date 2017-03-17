var mysql = require("mysql");
var moment = require('moment');

// First you need to create a connection to the db
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "vainglorious",
  database: "storm_queen_lair"
});

connect();

function connect(){
  con.connect(function(err){
    if(err){
      console.log('Error connecting to Db');
      return;
    }
    console.log('Connection established');
  });
}

function close(){
  con.end(function(err) {
    // The connection is terminated gracefully
    // Ensures all previously enqueued queries are still
    // before sending a COM_QUIT packet to the MySQL server.
  });
}

function opt(options, name, default_value){
  return options && options[name] !== undefined ? options[name] : default_value;
}

function optWithKey(options, name, default_value) {
  return options && options[name] !== undefined ? {'name': name, 'value': options[name]} : defaut_value;
}

function appendFilter(update_query, filter) {
  var query = update_query.query;
  var params = update_query.params;
  
  if(filter) {
    var filter_name = filter.name;
    var filter_value = filter.value;
    query = query + ' AND ' + filter_name + ' like ?';
    params[params.length] = filter_value;
  }
  return {'query': query, 'params': params};
  var filter_name = fiter.name;
  var filter_value = filter.value;

  
}

var getPlayerId = function(ign, success){
  var query = 'SELECT * FROM player_info '
            + 'WHERE ign like ?';
  
  con.query(query, [ign], function(err, rows){
    if(err) throw err;
    if(rows.length != 1){
      success("", "");
      return;
    }
    success(rows[0].player_id, rows[0]);
  });
}

var getPlayer = function(player_id, success){
  var query = 'SELECT * FROM player_info '
            + 'WHERE player_id like ?';

  con.query(query, [player_id], function(err, rows){
    if(err) throw err;
    if(rows.length == 1) success(rows[0]);
  });
}

var getPlayerStats = function(player_id, filters, success){
  
  var filter_hero = optWithKey(filters, "hero", undefined);
  var filter_position = optWithKey(filters, "position", undefined);
  var filter_side = optWithKey(filters, "side", undefined);
  var filter_game_type = optWithKey(filters, "game_type", undefined);
  var filter_patch = optWithKey(filters, "patch", undefined);
  var filter_season = optWithKey(filters, "season", undefined);
  
  var query = 'SELECT * FROM player_stats '
            + 'WHERE player_id like ?';
  var params_array = [player_id];
  var update_query = {'query': query, 'params': params_array};
  update_query = appendFilter(update_query, filter_hero);
  update_query = appendFilter(update_query, filter_position);
  update_query = appendFilter(update_query, filter_side);
  update_query = appendFilter(update_query, fiter_game_type);
  update_query = appendFilter(update_query, filter_patch);
  update_query = appendFilter(update_query, filter_season);

  query = update_query.query;
  params_array = update_query.params;
  
  con.query(query, params_array, function(err, rows){
    if(err) throw err;
    success(rows);
  });
}

var lastPlayerUpdate = function(player_id, success){
  var query = 'SELECT request_timestamp FROM latest_player_call '
            + 'WHERE player_id like ?';
  
  con.query(query, [player_id], function(err, rows){
              if(err) throw err;
              if(rows.length > 1) throw "Error in database definition";
              if(rows.length == 0){
                success(-1);
                return;
              };
              success(rows[0].request_timestamp);
            });
}

var lastMatchUpdate = function(player_id, success){
  var query = 'SELECT request_timestamp, newest_data_stamp FROM latest_match_call '
            + 'WHERE player_id like ?';

  con.query(query, [ign], function(err, rows){
    if(err) throw err;
    if(rows.length > 1) throw "Error in database definition";
    if(rows.length == 0){
      success(-1);
      return;
    }
    success(rows[0]);
  });
}

var updatePlayer = function(player_id, ign, options){

  var skill_tier = opt(options, "skill_tier", false);
  var region = opt(options, "region", false);
  var level = opt(options, "level", false);
  var loss_streak = opt(options, "loss_streak", false);
  var win_streak = opt(options, "win_streak", false);
  var total_games = opt(options, "total_games", false);
  var wins = opt(options, "wins", false);
  var ranked_games = opt(options, "ranked_games", false);

  //Verify I have information
  var query = 'INSERT INTO player_info '
            + 'SET player_id = ?, ign = ?, '
            + 'region = ?, level = ?, '
            + 'loss_streak = ?, win_streak = ?, ' 
            + 'total_games = ?, wins = ?, ranked_games = ? '
            + 'ON DUPLICATE KEY UPDATE '
            + 'ign = ?, region = ?, level = ?, '
            + 'loss_streak = ?, win_streak = ?, '
            + 'total_games = ?, wins = ?, '
            + 'ranked_games = ?';
  con.query(query, 
             [player_id, ign, 
             region, level, loss_streak, 
             win_streak, total_games, 
             wins, ranked_games,
             ign, region, level, loss_streak,
             win_streak, total_games, wins, ranked_games],
             function(err, rows){
               //Dont throw err because server crashes (I think).
               if(err) throw err;
    
               console.log("Table player_info updated");
               if(skill_tier) updatePlayerSkillTier(player_id, skill_tier);
             });
   query = 'INSERT INTO latest_player_call '
         + 'SET player_id = ?, request_timestamp = NOW() '
         + 'ON DUPLICATE KEY UPDATE '
         + 'request_timestamp = NOW()';
   var timestamp = moment().utc().format();
   con.query(query,[player_id],
             function(err, rows){
               if(err) throw err;
               
               console.log("Table latest_player_call updated");
             });
   
}

var updatePlayerSkillTier = function(player_id, skill_tier, success){
  //TODO: update player skill tier
  console.log("New skill tier: " + skill_tier);
}

var updateLatestMatchCall = function(player_id, success) {
  //TODO update LatestMatchCall with current time
  var timestamp = moment().utc().format();
}

var updateLatestMatchTimestamp = function(player_id, timestamp, success) {
  //TODO update LatestMatchCall latest match
}

var matchNotAnalized = function(player_id, match_id) {
  var matchAnalized = false;
  //TODO return false or true depending if the pair exists.

  return matchAnalized;
}

var updatePlayerMatches = function(player_id, match_id, success) {
  //TODO: update player matches
}

var updatePlayerLastMatches = function(player_id, match, rosters, success) {
  //TODO update player last matches
  //If it is part of the last matches then store the match in table of local matches.
}

var updateStats = function(player_id, match, rosters, success) {
  //TODO update player stats
  //Save stats for all filters
  var player_roster;
  var player_participant;
  for(var roster in rosters) {
    for(var participant in roster.participants) {
      if(participant.player.id == player_id) {
        player_roster = roster;
        player_participant = participant;
        break;
      }
    }
    if(player_participant) break;
  }

  var player_stats = {};
  player_stats.player_id = player_id;
  player_stats.hero = player_participant.info.actor;
  player_stats.position = player_participant.info.position;
  player_stats.side = player_roster.info.side;
  player_stats.game_type = match.attributes.gameMode;
  player_stats.patch = match.attributes.patchVersion;
  //TODO: season
  player_stats.season = undefined;
  player_stats.wins = player_participant.info.stats.winner;
  player_stats.kills = player_participant.info.stats.kills;
  player_stats.deaths = player_participant.info.stats.deaths;
  player_stats.assists = player_participant.info.stats.assists;
  player_stats.cs_min = player_participant.info.stats.farm / match.attributes.duration / 60;
  player_stats.gold_min = player_participant.info.stats.gold / match.attributes.duration / 60;
  player_stats.gold = player_participant.info.stats.gold;
  player_stats.kda = (player_stats.kills + player_stats.assists) / (player_stats.deaths + 1);
  player_stats.kill_part = (player_stats.kills + player_stats.assists) / player_roster.info.heroKills;
  player_stats.game_length = match.attributes.duration;
  


  async.parallel([
        function(callback) {updatePlayerStats(player_id, match, rosters, player_roster, player_stats, callback);},
        function(callback) {updatePlayerFrenemyHeroes(player_id, match, rosters, player_roster, player_stats, callback);},
        function(callback) {updatePlayerFrenemyPlayers(player_id, match, rosters, player_roster, player_stats, callback);}
      ], function(err) {
        if(err) {
          success(err);
        } else {
          success();
        }
    });
}

var updatePlayerStats = function(player_id, match, rosters, player_roster, player_stats, success) {
    var heroes = ["ALL"];
    var positions = ["ALL"];
    var sides = ["ALL"];
    var game_types = ["ALL"];
    var patches = ["ALL"];
    var seasons = ["ALL"];

    if(player_stats.hero) {
      heroes.append(player_stats.hero);
    }
    if(player_stats.position) {
      positions.append(player_stats.position);
    }
    if(player_stats.side) {
      sides.append(player_stats.side);
    }
    if(player_stats.game_type) {
      game_types.append(player_stats.game_type);
    }
    if(player_stats.patch) {
      patches.append(player_stats.patch);
    }
    if(player_stats.season) {
      seasons.append(player_stats.season);
    }
    async.forEach(heroes, function (hero, callback) {
          async.forEach(positions, function (position, callback) {
            async.forEach(sides, function (side, callback){
              async.forEach(game_types, function (game_type, callback){
                async.forEach(patches, function (patch, callback){
                  async.forEach(seasons, function (season, callback){

                    var query = 'SELECT * FROM player_stats WHERE '
                              + 'player_id like ? AND '
                              + 'hero like ? AND '
                              + 'position like ? AND '
                              + 'side like ? AND '
                              + 'game_type like ? AND '
                              + 'patch like ? AND '
                              + 'season like ?';

                    con.query(query,
                      [player_id, hero, 
                      position, side, 
                      game_type, patch, 
                      season],
                      function (err, rows) {
                        if(err) {
                          console.log("Error querying database.");
                          callback(err);
                        }
                        if(rows.length == 0) {
                          query = 'INSERT INTO player_stats '
                              + 'SET player_id = ?, hero = ?, '
                              + 'position = ?, side = ?, '
                              + 'game_type = ?, patch = ?, ' 
                              + 'season = ?, wins = ?, total_games = ?, '
                              + 'kills = ?, deaths = ?, '
                              + 'assists = ?, cs_min = ?, '
                              + 'gold_min = ?, gold = ?, '
                              + 'kda = ?, kill_part = ?, '
                              + 'game_length = ?';

                          var wins = 0;
                          if(player_stats.wins) {
                            wins = 1;
                          }
                          var total_games = 1;

                          conn.query(query,
                            [player_id, hero, 
                            position, side, 
                            game_type, patch, 
                            season, wins,
                            total_games, player_stats.kills,
                            player_stats.deaths, player_stats.assists,
                            player_stats.cs_min, player_stats.gold_min,
                            player_stats.gold, player_stats.kda,
                            player_stats.kill_part, player_stats.game_length],
                            function (err, rows) {
                              if(err) {
                                console.log("Error inserting row");
                                callback(err);
                              } else {
                                console.log("Inserted new stat to player_stats");
                                callback();
                              }
                            });
                        } else if(rows.length == 1) {
                          var old_stats = rows[0];
                          var wins = old_stats.wins;
                          if(player_stats.wins) {
                            wins = wins + 1;
                          }
                          var total_games = old_stats.total_games + 1;
                          var kills = (old_stats.kills * old_stats.total_games + player_stats.kills) / total_games;
                          var deaths = (old_stats.deaths * old_stats.total_games + player_stats.deaths) / total_games;
                          var assists = (old_stats.assists * old_stats.total_games + player_stats.assists) / total_games;
                          var cs_min = (old_stats.cs_min * old_stats.total_games + player_stats.cs_min) / total_games;
                          var gold_min = (old_stats.gold_min * old_stats.total_games + player_stats.gold_min) / total_games;
                          var gold = (old_stats.gold * old_stats.total_games + player_stats.gold) / total_games;
                          var kda = (old_stats.kda * old_stats.total_games + player_stats.kda) / total_games;
                          var kill_part = (old_stats.kill_part * old_stats.total_games + player_stats.kill_part) / total_games;
                          var game_length = (old_stats.game_length * old_stats.total_games + player_stats.game_length) / total_games;
                          
                          query = 'UPDATE player_stats '
                                + 'SET wins = ?, total_games = ?, '
                                + 'kills = ?, deaths = ?, '
                                + 'assists = ?, cs_min = ? '
                                + 'gold_min = ?, gold = ?, '
                                + 'kda = ?, kill_part = ?, game_length = ? '
                                + 'WHERE player_id like ? AND '
                                + 'hero like ? AND position like ? AND '
                                + 'side like ? AND game_type like ? AND '
                                + 'patch like ? AND season like ?';

                          conn.query(query,
                            [wins, total_games,
                            kills, deaths,
                            assists, cs_min,
                            gold_min, gold,
                            kda, kill_part, game_length,
                            player_id, hero,
                            position, side, 
                            game_type, patch, season],
                            function (err, rows) {
                              if(err) {
                                console.log("Error updating row");
                                callback(err);
                              } else {
                                console.log("Updated stat to player_stats");
                                callback();
                              }
                            });
                        } else {
                          console.log("Error in the database. Duplicate keys.");
                          callback(err);
                        }
                      });
                    
                  }, function (err) {
                    if(err) {
                      console.log("Error in seasons");
                      callback(err);
                    } else {
                      console.log("All seasons done");
                      callback();
                    }
                  });
                }, function (err) {
                  if(err) {
                    console.log("Error in patches");
                    callback(err);
                  } else {
                    console.log("All patches done");
                    callback();
                  }
                });
              }, function (err) {
                if(err) {
                  console.log("Error in game_types");
                  callback(err);
                } else {
                  console.log("All game_tyes done");
                  callback();
                }
              });
            }, function (err) {
              if(err) {
                console.log("Error in sides");
                callback(err);
              } else {
                console.log("All sides done");
                callback();
              }
            });
          }, function (err) {
              if(err) {
                console.log("Error in positions");
                callback(err);
              } else {
                console.log("All positions done");
                callback();
              }
          });
        
    }, function (err) {
        if(err) {
          console.log("Error in heroes");
        } else {
          console.log("All heroes done");
        }
    });
}

var updatePlayerFrenemyHeroes = function(player_id, match, rosters, player_roster, player_stats, success) {
  //TODO update player frenemies heroes stats
  console.log("TODO: Update playerFrenemyHeroes");
  success();
}

var updatePlayerFrenemyPlayers = function(player_id, match, rosters, player_roster, player_stats, success) {
  //TODO update player frenemies players
  console.log("TODO: Update playerFrenemyPlayers");
  success();
}

module.exports = {
  updatePlayer,
  lastPlayerUpdate,
  getPlayerId,
  lastMatchUpdate,
  getPlayerStats,
  updateLatestMatchCall,
  updateLatestMatchTimestamp,
  matchNotAnalized,
  updatePlayerMatches,
  updatePlayerLastMatches,
  updateStats
};
