var express = require('express');

var api_key = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJjMjEzZmZiMC1kY2JmLTAxMzQtYTdiNC0wMjQyYWMxMTAwMDMiLCJpc3MiOiJnYW1lbG9ja2VyIiwib3JnIjoianVhbmNhbWlsbzg3LW91dGxvb2stY29tIiwiYXBwIjoiYzIxMjRiNDAtZGNiZi0wMTM0LWE3YjMtMDI0MmFjMTEwMDAzIiwicHViIjoic2VtYyIsInRpdGxlIjoidmFpbmdsb3J5Iiwic2NvcGUiOiJjb21tdW5pdHkiLCJsaW1pdCI6MTB9.PNxHPaAZsJWd6k_Q0Bkz9BZQyQsHltBKfaAHsQj_MKI";
var base_url = "https://api.dc01.gamelockerapp.com"; 


function getPlayer(ign, region, callback_function) {
		console.log("Mad-Ign: " + ign);
		console.log("Mad-Region: " + region);
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
		    callback_function(info);
		  }
		}

		request(options, callback);

}

module.exports = {
  getPlayer
};