var mysql = require("mysql");
var moment = require('moment');
var async = require('async');

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
  return options && options[name] !== undefined ? {'name': name, 'value': options[name]} : default_value;
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
  console.log(JSON.stringify(filters)); 
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
  update_query = appendFilter(update_query, filter_game_type);
  update_query = appendFilter(update_query, filter_patch);
  update_query = appendFilter(update_query, filter_season);

  query = update_query.query;
  params_array = update_query.params;
  console.log(query);
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

  con.query(query, [player_id], function(err, rows){
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
  var query = 'UPDATE player_info '
            + 'SET skill_tier = ? '
            + 'WHERE player_id like ?';
  con.query(query, 
             [skill_tier, player_id],
             function(err, rows){
              //Dont throw err because server crashes (I think).
              if(err) {
                console.log("Error updating skill tier");
                success(err);
                return;
              }
    
               console.log("Table player_info updated");
               success();
               if(skill_tier) updatePlayerSkillTier(player_id, skill_tier);
             });
}

var updateLatestMatchCall = function(player_id, success) {
  var query = 'INSERT INTO latest_match_call '
            + 'SET player_id = ?, request_timestamp = ? '
            + 'ON DUPLICATE KEY UPDATE '
            + 'request_timestamp = ?';
  var timestamp = moment().utc().format();
  con.query(query, [player_id, timestamp, timestamp],
    function(err, rows){
      if(err) {
        console.log("Error updating updateLatestMatchCall");
        if(success) success(err);
        return;
      }
      console.log("LatestMatchCall updated");
      if(success) success();
    });
}

var updateLatestMatchTimestamp = function(player_id, timestamp, success) {
  var query = 'SELECT * FROM latest_match_call '
            + 'WHERE player_id = ??';
  con.query(query, [player_id],
    function(err, rows){
      if(err) {
        console.log("Error updating updateLatestMatchTimestamp");
        success(err);
        return;
      }
      if(rows.length != 1) {
        console.log("Error updating updateLatestMatchTimestamp");
        success(err);
        return;
      }
      var old_timestamp = rows[0].newest_data_stamp;
      if(old_timestamp) {
        if(moment(timestamp).isAfter(old_timestamp)) {
          query = 'UPDATE latest_match_call '
            + 'SET newest_data_stamp = ? '
            + 'WHERE player_id like ?';
          con.query(query, [timestamp, player_id],
            function(err, rows) {
              if(err) {
                console.log("Error updating updateLatestMatchTimestamp");
                success(err);
                return
              }
              console.log("Updated latestMatchTimestamp");
              success();
            });
        } else {
          console.log("Didn't need to update, old value is newer.");
          success();
        }
      } else {
        query = 'UPDATE latest_match_call '
            + 'SET newest_data_stamp = ? '
            + 'WHERE player_id like ?';
        con.query(query, [timestamp, player_id],
          function(err, rows) {
            if(err) {
              console.log("Error updating updateLatestMatchTimestamp");
              success(err);
              return
            }
            console.log("Updated latestMatchTimestamp (First time)");
            success();
          });
      }
    });
}

var matchNotAnalized = function(player_id, match_id, success) {
  var query = 'SELECT * FROM player_matches_added '
            + 'WHERE player_id like ? AND match_id like ?';
  con.query(query,[player_id, match_id],
    function(err, rows) {
      if(err) {
        throw err;
      }
      if(rows.length == 0) {
        success(false);
      } else {
        success(true);
      }
    });
}

var updatePlayerMatches = function(player_id, match_id, success) {
  var query = 'INSERT INTO player_matches_added '
            + 'SET player_id = ?, match_id = ?';
  con.query(query,[player_id, match_id],
    function(err, rows) {
      if(err) {
        console.log("Couldn't update player matches.");
        success(err);
        return;
      }
      console.log("Updated player matches.");
      success();
    });
}

var updatePlayerLastMatches = function(player_id, match, rosters, success) {
  //TODO update player last matches
  //If it is part of the last matches then store the match in table of local matches.
}

var updateStats = function(player_id, match, rosters, success) {
  console.log("Updating stats");
  var player_roster;
  var player_participant;
  for(var i in rosters) {
    var roster = rosters[i];
    console.log("Roster");
    for(var j in roster.participants) {
      var participant = roster.participants[j];
      console.log("Participant: "+participant.player.id);
      console.log("player: "+player_id);
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
  player_stats.cs_min = player_participant.info.stats.farm / (match.attributes.duration / 60);
  player_stats.gold_min = player_participant.info.stats.gold / (match.attributes.duration / 60);
  player_stats.gold = player_participant.info.stats.gold;
  player_stats.kda = (player_stats.kills + player_stats.assists) / (player_stats.deaths + 1);
  player_stats.kill_part = (player_stats.kills + player_stats.assists) / player_roster.info.heroKills;
  player_stats.game_length = match.attributes.duration;
  
  if(!player_stats.gold_min) player_stats.gold_min = 0;
  if(!player_stats.gold) player_stats.gold = 0;
  
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
      heroes.push(player_stats.hero);
    }
    if(player_stats.position) {
      positions.push(player_stats.position);
    }
    if(player_stats.side) {
      sides.push(player_stats.side);
    }
    if(player_stats.game_type) {
      game_types.push(player_stats.game_type);
    }
    if(player_stats.patch) {
      patches.push(player_stats.patch);
    }
    if(player_stats.season) {
      seasons.push(player_stats.season);
    }
    
    var test_query = 'SELECT * FROM player_stats';
    con.query(test_query,function(err, rows) {
      if(err) throw err;
      console.log('Before: ' + rows.length);
    });
    async.forEach(heroes, function (hero, callback) {
          async.forEach(positions, function (position, callback) {
            async.forEach(sides, function (side, callback){
              async.forEach(game_types, function (game_type, callback){
                async.forEach(patches, function (patch, callback){
                  async.forEach(seasons, function (season, callback){
                    var query = 'INSERT INTO player_stats '
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
                    var params = [player_id, hero,
                                  position, side,
                                  game_type, patch,
                                  season, wins,
                                  total_games, player_stats.kills,
                                  player_stats.deaths, player_stats.assists,
                                  player_stats.cs_min, player_stats.gold_min,
                                  player_stats.gold, player_stats.kda,
                                  player_stats.kill_part, player_stats.game_length];
                    con.query(query, params,
                      function (err, rows) {
                        if(err) {
                          console.log("Stat exists. Updating stat.");
                          
                          var wins = 0;
                          if(player_stats.wins) {
                            wins = 1;
                          }
                          
                          query = 'UPDATE player_stats '
                                + 'SET wins = wins + ?, '
                                + 'kills = (kills * total_games + ?) / (total_games + 1), '
                                + 'deaths = (deaths * total_games + ?) / (total_games + 1), '
                                + 'assists = (assists * total_games + ?) / (total_games + 1), '
                                + 'cs_min = (cs_min * total_games + ?) / (total_games + 1), '
                                + 'gold_min = (gold_min * total_games + ?) / (total_games + 1), '
                                + 'gold = (gold * total_games + ?) / (total_games + 1), '
                                + 'kda = (kda * total_games + ?) / (total_games + 1), '
                                + 'kill_part = (kill_part * total_games + ?) / (total_games + 1), '
                                + 'game_length = (game_length * total_games + ?) / (total_games + 1), '
                                + 'total_games = total_games + 1 '
                                + 'WHERE player_id like ? AND '
                                + 'hero like ? AND position like ? AND '
                                + 'side like ? AND game_type like ? AND '
                                + 'patch like ? AND season like ?';

                          con.query(query,
                            [wins, 
                            player_stats.kills, player_stats.deaths,
                            player_stats.assists, player_stats.cs_min,
                            player_stats.gold_min, player_stats.gold,
                            player_stats.kda, player_stats.kill_part, player_stats.game_length,
                            player_id, hero,
                            position, side, 
                            game_type, patch, season],
                            function (err, rows) {
                              if(err) {
                               console.log("Error updating row: " + err);
                                callback(err);
                              } else {
                                callback();
                              }
                            });
                      } else {
                          console.log("Inserted new stat.");
                          callback();
                        }
                      });
                    
                  }, function (err) {
                    if(err) {
                      //console.log("Error in seasons: "+err);
                      callback(err);
                    } else {
                      callback();
                    }
                  });
                }, function (err) {
                  if(err) {
                   // console.log("Error in patches: "+err);
                    callback(err);
                  } else {
                    callback();
                  }
                });
              }, function (err) {
                if(err) {
                 // console.log("Error in game_types: "+ err);
                  callback(err);
                } else {
                  callback();
                }
              });
            }, function (err) {
              if(err) {
               // console.log("Error in sides: "+err);
                callback(err);
              } else {
                callback();
              }
            });
          }, function (err) {
              if(err) {
               // console.log("Error in positions: "+err);
                callback(err);
              } else {
                callback();
              }
          });
        
    }, function (err) {
        if(err) {
         // console.log("Error in heroes: "+err);
        } else {
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
