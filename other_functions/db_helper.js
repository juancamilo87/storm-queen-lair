var mysql = require("mysql");

// First you need to create a connection to the db
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "vainglorious",
  database: "storm_queen_lair"
});

connect();
function opt(options, name, default_value){
  return options && options[name] !== undefined ? options[name] : default_value;
}

var updatePlayer = function(player_id, ign, options){

  var skill_tier = opt(options, "skill_tier", false);
  var region = opt(options, "region", false);
  var level = opt(options, "level", false);
  var loss_streak = opt(options, "loss_streak", false);
  var win_streak = opt(options, "win_streak", false);
  var total_games = opt(options, "total_games", false);
  var wins = opt(options, "wins", false);
  var ranked_games = opt(options, "ranked_games", false);

  //Verify I have information
  var query = 'INSERT INTO player_info'
            + ' SET player_id = ?, ign = ?, '
            + 'region = ?, level = ?, '
            + 'loss_streak = ?, win_streak = ?, ' 
            + 'total_games = ?, wins = ?, ranked_games = ? '
            + 'ON DUPLICATE KEY UPDATE '
            + 'ign = ?, region = ?, level = ?, '
            + 'loss_streak = ?, win_streak = ?, '
            + 'total_games = ?, wins = ?, '
            + 'ranked_games = ?';
  console.log(query);
  con.query(query, 
             [player_id, ign, 
             region, level, loss_streak, 
             win_streak, total_games, 
             wins, ranked_games,
             ign, region, level, loss_streak,
             win_streak, total_games, wins, ranked_games],
             function(err, rows){
               //Dont throw err because server crashes (I think).
               if(err) throw err;
    
               console.log("Player info updated");
               console.log(rows);
               if(skill_tier) updatePlayerSkillTier(player_id, skill_tier);
             });
}

var updatePlayerSkillTier = function(player_id, skill_tier){
  console.log("New skill tier: " + skill_tier);
}

function connect(){
  con.connect(function(err){
    if(err){
      console.log('Error connecting to Db');
      return;
    }
    console.log('Connection established');
  });
}

function close(){
  con.end(function(err) {
    // The connection is terminated gracefully
    // Ensures all previously enqueued queries are still
    // before sending a COM_QUIT packet to the MySQL server.
  });
}

module.exports = {
  updatePlayer
};
