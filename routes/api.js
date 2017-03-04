var express = require('express');
var router = express.Router();
var mad_glory = require('../external_calls/connect_mad_glory');


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
        
        function callback(body) {
        			console.log("Received callback");
        			res.json({message: body});
        }
        
        mad_glory.getPlayer(ign, region, callback);
        
      
    });

router.route('/users/register')
  .post(function(req, res){
    //TODO: Register a user
  });

router.route('/users/player_info')
  .get(function(req, res){
    //TODO: Return info of the player associated with this user
  });

router.route('/users/player_stats')
  .get(function(req, res){
    //TODO: Return stats of the player associated with this user
  });

router.route('/player_info')
  .get(function(req, res){
    //TODO: Return info of the ign sent
  });

router.route('/player_stats')
  .get(function(req, res){
    //TODO: Return stats of the ign sent
  });

module.exports = router;
