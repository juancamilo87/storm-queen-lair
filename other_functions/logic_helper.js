var db_helper = require('./db_helper');
var mad_glory = require('./connect_mad_glory');

var getPlayer = function(ign, region, callback){
  console.log("Mad-Ign: " + ign);
		console.log("Mad-Region: " + region);
		
		db_helper.getPlayerId(ign, function(player_id, row){
		  console.log("Got player_id: " + player_id);
		  if(player_id) {
      console.log("Player found");
		    db_helper.latestPlayerUpdate(player_id, function(timestamp){
		      if(timestamp < 0) {
		        console.log("Timestamp to old, refreshing data");
		        mad_glory.getPlayer(ign, region, callback);
		      } else {
		        console.log("Timestamp new, returning local data");
		        callback(JSON.stringify(row);
		      }
		    });
		  } else {
		    console.log("Player not found");
		    mad_glory.getPlayer(ign, region, callback);
		  }
		});
}