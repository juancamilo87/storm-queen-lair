var db_helper = require('./db_helper');
var mad_glory = require('./connect_mad_glory');
var moment = require('moment');
var async = require('async');

var getPlayer = function(ign, region, callback){
		db_helper.getPlayerId(ign, function(player_id, row){
		  console.log("Got player_id: " + player_id);
		  if(player_id) {
                    console.log("Player found");
		    db_helper.lastPlayerUpdate(player_id, function(timestamp){
                      var duration = moment.duration(moment().utc().diff(timestamp));

                      var hours = duration.hours();
		      console.log(hours + " hours");
                      if(hours > 5 ) {
		        console.log("Timestamp to old, refreshing data");
		        mad_glory.getPlayer(ign, region, function(newRow){
                          newRow.last_update = moment().utc().format();
                          callback(newRow);
                        });
		      } else {
		        console.log("Timestamp new, returning local data");
                        row.last_update = timestamp;
		        callback(row);
		      }
		    });
		  } else {
		    console.log("Player not found");
		    mad_glory.getPlayer(ign, region, function(newRow){
                      newRow.last_update = moment().utc().format();
                      callback(newRow);
                    });
		  }
		});
}

var getPlayerStats = function(ign, region, callback, filters, options){
  var device_id = opt(options, "device_id", undefined);
  function updateStats(matches, includes) {
    var newestMatchTimestamp = row.newest_data_stamp;
      var newestMatch;
      async.each(matches,function(match, callback) {
        function local_callback() {
          callback();
        }
        updateStatsForMatch(player_id, match, includes, local_callback);
      }, function(err) {
        if(err) {
          console.log("Error: " + err);
        } else {
          if(device_id) {
            //TODO: Send notification to device
          }
        }
      });
  }

  function statsCallback(body) {
    var player_id = body.player_id;
    console.log("Got player_id: " + player_id);
    if(player_id) {
      console.log("Player id found");
      db_helper.lastMatchUpdate(player_id, function(row){
        var timestamp = row.request_timestamp;
        var duration = moment.duration(moment().utc().diff(timestamp));
        var hours = duration.seconds();
        console.log(hours + " seconds");
        if(hours > 20) {
          console.log("Match data too old, getting newer matches but returning old data.");
          mad_glory.getMatches(player_id, region, row.newest_data_stamp, updateStats);
        } else {
          console.log("Match data new, no need to update.");
        }
        db_helper.getPlayerStats(player_id, filters, function(stats) {
            stats.last_update = timestamp;
            callback(stats);
          });

      });
    }
  }
  getPlayer(ign, region, statsCallback);
}

var updateStatsForMatch = function(player_id, match, includes_array, sucess) {
  if(db_helper.matchNotAnalized(player_id, match.id)) {
    var match_includes;
    async.parallel([
      function(callback) {updateSkilltier(player_id, match, includes_array, callback);},
      function(callback) {db_helper.updateLatestMatchTimestamp(player_id, match_timestamp, callback);},
      function(callback) {db_helper.updatePlayerStates(player_id, match, match_includes, callback);},
      function(callback) {db_helper.updatePlayerFrenemyHeroes(player_id, match, match_includes, callback);},
      function(callback) {db_helper.updatePlayerFrenemyPlayers(player_id, match, match_includes, callback);},
      function(callback) {db_helper.updatePlayerMatches(player_id, match.id, callback);},
      function(callback) {db_helper.updatePlayerLastMatches(player_id, match, match_includes, callback);}
      ], function(err) {
        if(err) {
          success(err);
        } else {
          success();
        }
    });
  } else {
    success();
  } 
}

var updateSkillTier = function(player_id, match, includes_array) {
  
  //TODO: make generic function
  var rosters = match.relationships.rosters.data;
  //Get rosters
  var all_rosters = [];
  var all_participants = [];
  var all_players = [];
  for(var item in includes_array) {
    if(item.type == "roster") {
      all_rosters.append(item);
      if(item.id == rosters[0].id) {
        rosters[0].roster = item;
      } else if(item.id == rosters[1].id) {
        rosters[1].roster = item;
      }
    } else if(item.type == "participant") {
      all_participants.append(item);
    } else if(item.type == "player") {
      all_players.append(item);
    }
  }
  //Get participants
  for(var roster in rosters) {
    for(var participant in roster.roster) {
      for(var item in all_participants) {
        if(item.id == participant.id) {
          participant.data = item;
          break;
        }
      }
    }
  }

  //Get players
  for(var roster in rosters) {
    for(var participant in roster.roster) {
      for(var player in all_players) {
        if(participant.data.relationships.player.data.id == player.id) {
          participant.player = player;
          break;
        }
      }
    }
  }
  
  var skillTier;

  for(var roster in rosters) {
    for(var participant in roster.roster) {
      if(participant.player.id == player_id) {
      skillTier = participant.attributes.stats.skillTier;
      }
    }
  }
  if(skillTier) db_helper.updateSkillTier(player_id, skillTier);
}

module.exports = {
  getPlayer,
  getPlayerStats,
  updateStatsForMatch,
  updateSkillTier
};
