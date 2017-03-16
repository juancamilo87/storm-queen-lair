var db_helper = require('./db_helper');
var mad_glory = require('./connect_mad_glory');
var moment = require('moment');

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

var getPlayerStats = function(ign, region, callback, filters){
  function updateStats(matches, includes) {
    var newestMatchTimestamp = row.newest_data_stamp;
      var newestMatch;
      for(var match in matches) {
        if(match.type = "match") {
          logic_helper.updateStatsForMatch(player_id, match, includes);
          if(moment.duration(newestMatchTimestamp.diff(match.attributes.createdAt)) < 0) {
            newestMatchTimestamp = match.attributes.createdAt;
            newestMatch = match;
          }
        }
      }
      db_helper.updateLatestMatchTimestamp(player_id, newestMatchTimestamp);
      logic_helper.updateSkillTier(player_id, match, includes);
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

var updateStatsForMatch = function(player_id, match, includes_array) {
  if(db_helper.matchNotAnalized(player_id, match.id)) {
    var match_includes;
    //TODO: Refactor includes_array into match_includes.
    function callback() {
      db_helper.updatePlayerMatches(player_id, match.id);
      db_helper.updatePlayerLastMatches(player_id, match, match_includes);
    }
    db_helper.updatePlayerStats(player_id, match, match_includes, callback);
    db_helper.updatePlayerFrenemyHeroes(player_id, match, match_includes);
    db_helper.updatePlayerFrenemyPlayers(player_id, match, match_includes);
  }  
}

var updateSkillTier = function(player_id, match, includes_array) {
  //TODO: get skilltier
  var skillTier;
  db_helper.updateSkillTier(player_id, skillTier);
}

module.exports = {
  getPlayer,
  getPlayerStats,
  updateStatsForMatch,
  updateSkillTier
};
