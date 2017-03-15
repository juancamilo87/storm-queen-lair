var express = require('express');
var router = express.Router();
var mad_glory = require('../other_functions/connect_mad_glory');
var db_helper = require('../other_functions/db_helper');
var logic_helper = require('../other_functions/logic_helper');

router.use(function(req, res, next) {
    // do logging
    res.setHeader('Access-Control-Allow-Origin',  "http://35.157.73.205");
    next(); // make sure we go to the next routes and don't stop here
});

router.get('/', function(req, res){
  res.json({ message: 'hooray! welcome to our api!' });   
});

router.route('/player_info')
    .get(function(req, res) {
        var ign = req.query.ign;
        var region = req.query.region;
        
        function callback(body) {
        			console.log("Received callback");
                                console.log(JSON.stringify(body));
        			res.json({message: body});
        }
        logic_helper.getPlayer(ign, region, callback);
        
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

router.route('/player_stats/ign')
  .get(function(req, res){
    var ign = req.query.ign;
    var region = req.query.region;

    function callback(body) {
    }
    logic_helper.getPlayerStats(ign, region, callback);
  });

router.route('/player_stats/player_id')
  .get(function(req, res){
    var player_id = req.query.player_id;
    var region = req.query.region;

    function callback(body) {
    }
    logic_helper.getPlayerStatsById(player_id, region, callback);
  });

module.exports = router;
