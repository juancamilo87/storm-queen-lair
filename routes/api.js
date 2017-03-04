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
        
        function callback(body) {
        			console.log("Received callback");
        			res.json({message: body});
        }
        
        mad_glory.getPlayer(ign, region, callback);
        
      
    });

module.exports = router;