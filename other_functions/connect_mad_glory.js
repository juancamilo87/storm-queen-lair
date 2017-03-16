var db_helper = require('./db_helper');
var logic_helper = require('/.logic_helper');
var moment = require('moment');

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

var getMatches = function(player_id, region, timestamp){
  console.log("Calling mad glory");
  console.log("Timestamp: " + timestamp + " Iso format: " + new Date(timestamp).toIsoString());
  var request = require('request');    

  var options = {
    baseUrl: base_url,
    uri: '/shards/' + region + '/matches',
    method: 'GET',
    headers: {
      'Authorization': api_key,
      'X-TITLE-ID': 'semc-vainglory',
      'Accept': 'application/vnd.api+json'
    },
    qs: {
      'filter[playerIds]': player_id,
      'filter[createdAt-start]': moment().utc().format(),
      'sort': '-createdAt'
    }
  };

  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var info = JSON.parse(body);
      var data_array = info.data;
      var includes_array = info.includes;
      db_helper.updateLatestMatchCall(player_id);
      var newestMatchTimestamp = timestamp;
      var newestMatch;
      for(var match in data_array) {
        if(match.type = "match") {
          logic_helper.updateStatsForMatch(player_id, match, includes_array);
          if(moment.duration(newestMatchTimestamp.diff(match.attributes.createdAt)) < 0) {
            newestMatchTimestamp = match.attributes.createdAt;
            newestMatch = match;
          }
        }
      }
      db_helper.updateLatestMatchTimestamp(player_id, newestMatchTimestamp);
      logic_helper.updateSkillTier(player_id, match, includes_array);
    } else {
      console.log("Error calling Mad Glory API");
      console.log(error);
    }
  }
  request(options, callback);
}

module.exports = {
  getPlayer,
  getMatches
};
