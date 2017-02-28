var express = require('express');
var router = express.Router();


router.use(function(req, res, next) {
    // do logging
    res.setHeader('Access-Control-Allow-Origin',  "http://35.157.73.205");
    next(); // make sure we go to the next routes and don't stop here
});

router.get('/', function(req, res){
  res.json({ message: 'hooray! welcome to our api!' });   
});

router.route('/player')

	// get all the bears (accessed at GET http://localhost:8080/api/player)
    .get(function(req, res) {
    	var ign = req.query.ign;
        var region = req.query.region;
        var request = require('request');

        var api_key = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJjMjEzZmZiMC1kY2JmLTAxMzQtYTdiNC0wMjQyYWMxMTAwMDMiLCJpc3MiOiJnYW1lbG9ja2VyIiwib3JnIjoianVhbmNhbWlsbzg3LW91dGxvb2stY29tIiwiYXBwIjoiYzIxMjRiNDAtZGNiZi0wMTM0LWE3YjMtMDI0MmFjMTEwMDAzIiwicHViIjoic2VtYyIsInRpdGxlIjoidmFpbmdsb3J5Iiwic2NvcGUiOiJjb21tdW5pdHkiLCJsaW1pdCI6MTB9.PNxHPaAZsJWd6k_Q0Bkz9BZQyQsHltBKfaAHsQj_MKI";

        var options = {
		  baseUrl: 'https://api.dc01.gamelockerapp.com',
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
		    res.json({ message: info});
		  }
		}

		request(options, callback);
    });

module.exports = router;