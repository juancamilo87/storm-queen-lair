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
    .get(function(req, res) {
			    	var ign = req.query.ign;
        var region = req.query.region;
        
        console.log("Ign: " + ign);
        console.log("Region: " + region);
        
        mad_glory.getPlayer(ign, region, function(body) {
        			res.json(res.json(body)); 
        });
        
      
    });

router.route('/matches')
    .get(function(req, res) {
			    	var ign = req.query.ign;
        var region = req.query.region;
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
		    res.json({ message: info});
		  }
		}

		request(options, callback);
    });

module.exports = router;