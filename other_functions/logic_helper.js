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

module.exports = {
  getPlayer
};
