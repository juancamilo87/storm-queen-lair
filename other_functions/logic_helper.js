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

var updatePlayerStats = function(ign, region, callback) {
  function updateStats(matches, includes) {
    async.each(matches,function(match, callback) {
      function local_callback() {
        callback();
      }
      updateStatsForMatch(player_id, match, includes, local_callback);
    }, function(err) {
      if(err) {
        console.log("Error: " + err);
        callback("Error geting matches");
      } else {
        callback("Matches updated");
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
          callback("Matches already up to date.");
        }

      });
    }
  }
  getPlayer(ign, region, statsCallback);
}

var getPlayerStats = function(ign, region, callback, filters){
  
  function statsCallback(body) {
    var player_id = body.player_id;
    console.log("Got player_id: " + player_id);
    if(player_id) {
      console.log("Player id found");
      db_helper.getPlayerStats(player_id, filters, function(stats) {
            stats.last_update = timestamp;
            callback(stats);
          });
    }
  }
  getPlayer(ign, region, statsCallback);
}

var updateStatsForMatch = function(player_id, match, includes_array, success) {
  //TODO: Check if match is valid on this if
  if(db_helper.matchNotAnalized(player_id, match.id)) {
    var rosters = getFullRosters(match, includes_array);
    async.parallel([
        function(callback) {updateSkilltier(player_id, match, rosters, callback);},
        function(callback) {db_helper.updateStats(player_id, match, rosters, callback);},
        function(callback) {db_helper.updatePlayerLastMatches(player_id, match, rosters, callback);},
        function(callback) {db_helper.updateLatestMatchTimestamp(player_id, match_timestamp, callback);},
        function(callback) {db_helper.updatePlayerMatches(player_id, match.id, callback);}
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

var updateSkillTier = function(player_id, match, rosters, success) {
  //Check if match is newer
  var match_timestamp = match.attributes.createdAt;
  function callback(row) {
    if(moment.duration(match_timestamp.diff(row.newest_data_stamp)) > 0) {
      var skillTier;

      for(var roster in rosters) {
        for(var participant in roster.participants) {
          if(participant.player.id == player_id) {
          skillTier = participant.info.stats.skillTier;
          }
        }
      }
      if(skillTier) {
        db_helper.updateSkillTier(player_id, skillTier, success);
        return;
      } 
    }
    success();
  }
  lastMatchUpdate(player_id, callback);
}

function getFullRosters(match, includes) {
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
        rosters[0].participants = item.relationships.participants.data;
        rosters[0].info = item.attributes.stats;
      } else if(item.id == rosters[1].id) {
        rosters[1].participants = item.relationships.participants.data;
        rosters[1].info = item.attributes.stats;
      }
    } else if(item.type == "participant") {
      all_participants.append(item);
    } else if(item.type == "player") {
      all_players.append(item);
    }
  }
  //Get participants
  for(var roster in rosters) {
    var carryIndex;
    var captainIndex;
    var maxLaneCs = -1;
    var minCs = 1000;
    var index = 0;
    for(var participant in roster.participants) {
      for(var item in all_participants) {
        if(item.id == participant.id) {
          participant.info = item.attributes;
          participant.player = item.relationships.player.data;
          if(participant.info.stats.nonJungleMinionKills > maxLaneCs) {
            maxLaneCs = participant.info.stats.nonJungleMinionKills;
            carryIndex = index;
          }
          if(participant.info.stats.farm < minCs) {
            minCs = participant.info.stats.farm;
            captainIndex = index;
          }
          break;
        }
      }
      index = index + 1;
    }
    for(var i = 0; i < 3; i++) {
      if(i == carryIndex) {
        roster.participants[i].info.position = "carry";  
      } else if(i == captainIndex) {
        roster.participants[i].info.position = "captain"; 
      } else {
        roster.participants[i].info.position = "jungler"; 
      }
      
    }
  }

  //Get players
  for(var roster in rosters) {
    for(var participant in roster.participants) {
      for(var player in all_players) {
        if(participant.player.id == player.id) {
          participant.player.info = player.attributes;
          break;
        }
      }
    }
  }

  return rosters;
}

module.exports = {
  getPlayer,
  getPlayerStats,
  updateStatsForMatch,
  updateSkillTier,
  updatePlayerStats
};
