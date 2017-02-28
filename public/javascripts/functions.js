function myFunction() {
	var ign = $('#ign_text').val();
  var region = $('input[name="region"]:checked').val();

  console.log("The ign is: " + ign);
  console.log("The region is: " + region);

  var url = "http://" + document.location.hostname + ":8080/api/player";
  console.log(url);

  $('#response').empty();
  
	$.ajax({
          url: url,
          type: 'GET',
          dataType: 'json',
          data: { 
				    ign: ign, 
				    region: region
				  },
          success: processPlayer,
          error: function() { console.log("Error"); }
        });
}

function processPlayer(data) {
	var json = data.message;
	var attributes = json.data.attributes;
	var name = attributes.name;
	var region = attributes.shardId;
	var stats = attributes.stats;
	var level = stats.level;
	var loss_streak = stats.lossStreak;
	var win_streak = stats.winStreak;
	var total_games = stats.played;
	var ranked_games = stats.played_ranked;
	var wins = stats.wins;

	var html_to_inject = $([
	  "<div>",
	  "  <span >Name: " + name + "</span><br>",
	  "  <span >Region: " + region + "</span><br>",
	  "  <span >Level: " + level + "</span><br>",
	  "  <span >Loss Streak: " + loss_streak + "</span><br>",
	  "  <span >Win Streak: " + win_streak + "</span><br>",
	  "  <span >Total Games: " + total_games + "</span><br>",
	  "  <span >Wins: " + wins + "</span><br>",
	  "  <span >Ranked Games: " + ranked_games + "</span><br>",
	  "</div>"
	].join("\n"));

	$('#response').append(html_to_inject);

	

}