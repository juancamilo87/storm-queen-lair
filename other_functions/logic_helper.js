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
  function statsCallback(body) {
    var player_id = body.player_id;
    console.log("Got player_id: " + player_id);
    if(player_id) {
      console.log("Player id found");
      db_helper.lastMatchUpdate(ign, function(row){
        var timestamp = row.request_timestamp;
        var duration = moment.duration(moment().utc().diff(timestamp));
        var hours = duration.seconds();
        console.log(hours + " saconds");
        if(hours > 20) {
          console.log("Match data too old, getting newer matches");
          mad_glory.getMatches(ign, region, row.newest_data_stamp, function(){
            db_helper.getPlayerStats(player_id, filters, function(stats) {
              stats.last_update = moment().utc().format();
              callback(stats);
            });
          });
        } else {
          console.log("Match data new, returning local stats");
          db_helper.getPlayerStats(player_id, filters, function(stats) {
            stats.last_update = timestamp;
            callback(stats);
          });
        }

      });
    }
  }
  getPlayer(ign, region, statsCallback);
}

module.exports = {
  getPlayer,
  getPlayerStats
};
