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
		    console.log(JSON.stringify(info));
                    var attr = info.data.attributes;
                    var player_options = {
                      region: attr.shardId,
                      level: attr.stats.level,
		      loss_streak: attr.stats.lossStreak,
                      win_streak: attr.stats.winStreak,
          	      total_games: attr.stats.played,
		      wins: attr.stats.wins,
  		      ranked_games: attr.stats.played_ranked
                    };
                    db_helper.updatePlayer(info.data.id, attr.name, player_options); 
		    callback_function(info);
		  }
		}

		request(options, callback);
}

var test = "1";

module.exports = {
  getPlayer

};
