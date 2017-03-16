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

var getPlayerId = function(ign, callback){
  var query = 'SELECT * FROM player_info '
            + 'WHERE ign like ?';
  
  con.query(query, [ign], function(err, rows){
    if(err) throw err;
    if(rows.length != 1){
      callback("", "");
      return;
    }
    callback(rows[0].player_id, rows[0]);
  });
}

var getPlayer = function(player_id, callback){
  var query = 'SELECT * FROM player_info '
            + 'WHERE player_id like ?';

  con.query(query, [player_id], function(err, rows){
    if(err) throw err;
    if(rows.length == 1) callback(rows[0]);
  });
}

var getPlayerStats = function(player_id, filters, callback){
  
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
    callback(rows);
  });
}

var lastPlayerUpdate = function(player_id, callback){
  var query = 'SELECT request_timestamp FROM latest_player_call '
            + 'WHERE player_id like ?';
  
  con.query(query, [player_id], function(err, rows){
              if(err) throw err;
              if(rows.length > 1) throw "Error in database definition";
              if(rows.length == 0){
                callback(-1);
                return;
              };
              callback(rows[0].request_timestamp);
            });
}

var lastMatchUpdate = function(player_id, callback){
  var query = 'SELECT request_timestamp, newest_data_stamp FROM latest_match_call '
            + 'WHERE player_id like ?';

  con.query(query, [ign], function(err, rows){
    if(err) throw err;
    if(rows.length > 1) throw "Error in database definition";
    if(rows.length == 0){
      callback(-1);
      return;
    }
    callback(rows[0]);
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

var updatePlayerSkillTier = function(player_id, skill_tier){
  //TODO: update player skill tier
  console.log("New skill tier: " + skill_tier);
}

var updateLatestMatchCall = function(player_id) {
  //TODO update LatestMatchCall with current time
  var timestamp = moment().utc().format();
}

var updateLatestMatchTimestamp = function(player_id, timestamp) {
  //TODO update LatestMatchCall latest match
}

var matchNotAnalized = function(player_id, match_id) {
  var matchAnalized = false;
  //TODO return false or true depending if the pair exists.

  return matchAnalized;
}

var updatePlayerMatches = function(player_id, match_id) {
  //TODO: update player matches
}

var updatePlayerLastMatches = function(player_id, match, match_includes) {
  //TODO update player last matches
  //If it is part of the last matches then store the match in table of local matches.
}

var updatePlayerStats = function(player_id, match, match_includes) {
  //TODO update player stats
}

var updatePlayerFrenemyHeroes = function(player_id, match, match_includes) {
  //TODO update player frenemies heroes stats
}

var updatePlayerFrenemyPlayers = function(player_id, match, match_includes) {
  //TODO update player frenemies players
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
  updatePlayerStats,
  updatePlayerFrenemyHeroes,
  updatePlayerFrenemyPlayers
};
