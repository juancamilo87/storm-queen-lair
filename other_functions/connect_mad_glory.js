var db_helper = require('./db_helper');

var api_key = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJjMjEzZmZiMC1kY2JmLTAxMzQtYTdiNC0wMjQyYWMxMTAwMDMiLCJpc3MiOiJnYW1lbG9ja2VyIiwib3JnIjoianVhbmNhbWlsbzg3LW91dGxvb2stY29tIiwiYXBwIjoiYzIxMjRiNDAtZGNiZi0wMTM0LWE3YjMtMDI0MmFjMTEwMDAzIiwicHViIjoic2VtYyIsInRpdGxlIjoidmFpbmdsb3J5Iiwic2NvcGUiOiJjb21tdW5pdHkiLCJsaW1pdCI6MTB9.PNxHPaAZsJWd6k_Q0Bkz9BZQyQsHltBKfaAHsQj_MKI";
var base_url = "https://api.dc01.gamelockerapp.com"; 

var getPlayer = function(ign, region, callback_function) {
		
		console.log("Calling mad glory");
		
		var request = require('request');    

   var options = {
		  baseUrl: base_url,
		  uri: '/shards/' + region + '/players',
		  method: 'GET',
		  headers: {
		    'Authorization': api_key,
		    'X-TITLE-ID': 'semc-vainglory',
		    'Accept': 'application/vnd.api+json'
		  },
		  qs: {
		  	'filter[playerName]': ign
		  }
		};
		
		function callback(error, response, body) {
		  if (!error && response.statusCode == 200) {
		    var info = JSON.parse(body);
                    var data_array = info.data;
                    if (data_array.length == 1 && data_array[0].type == "player") {
                      var only_info = data_array[0];
                      var attr = only_info.attributes;
                      var player_options = {
                        region: attr.shardId,
                        level: attr.stats.level,
  	      	        loss_streak: attr.stats.lossStreak,
                        win_streak: attr.stats.winStreak,
            	        total_games: attr.stats.played,
		        wins: attr.stats.wins,
  		        ranked_games: attr.stats.played_ranked
                      };

                      db_helper.updatePlayer(only_info.id, attr.name, player_options);
                      var rowInserted = player_options;
                      rowInserted.player_id = only_info.id;
                      rowInserted.ign = attr.name;
                      callback_function(rowInserted);
		    } else {
                      console.log("Player not found");
                    }
                  } else {
                    console.log("Error calling Mad Glory API");
                    console.log(error);
                  }
		}

		request(options, callback);
}

var getMatches = function(ign, region, timestamp, callback){
  
  //TODO: Get matches from mad glory
  //TODO: Update table latest_match_call
  //TODO: Update table player_last_matches
  //TODO: Update table matches
  //TODO: Update table player_matches_added
  //TODO: Update stats
  //TODO: Update table player_stats
  //TODO: Update table player_frenemies_heros
  //TODO: Update table player_frenemies_players


}

module.exports = {
  getPlayer,
  getMatches
};
