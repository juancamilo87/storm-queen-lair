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
	var name = json.ign;
	var region = json.region;
	var level = json.level;
	var loss_streak = json.loss_streak;
	var win_streak = json.win_streak;
	var total_games = json.total_games;
	var ranked_games = json.ranked_games;
	var wins = json.wins;
        var last_update = json.last_update;

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
	  "  <span >Last Update: " + last_update + "</span><br>",
          "</div>"
	].join("\n"));

	$('#response').append(html_to_inject);

	

}
