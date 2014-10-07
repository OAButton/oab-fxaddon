window.storyid = "";
window.onload = function() {
	document.getElementById("done_button").onclick = function() {
		addon.port.emit("done");
	}
	updateSocialButtons();
}
addon.port.on("social", function(storyid) {
	window.storyid = storyid;
	updateSocialButtons();
});
function updateSocialButtons() {
	var url = "https://openaccessbutton.org/story/" + window.storyid;
	
	// Facebook
	var el = document.getElementById("social_buttons");
	if (el != undefined) {
		el.inenrHTML = "<fb:share-button href='" + url + "'></fb:share-button>";
		FB.XFBML.parse();

		// Twitter
		var twitter_button = document.createElement('a');
		twitter_button.setAttribute('href', 'https://twitter.com/share');
		twitter_button.setAttribute('class', 'twitter-share-button');
		twitter_button.setAttribute('style', 'margin-top:5px;');
		twitter_button.setAttribute("data-text" , "I just reported a blocked paywall article: " + url);
		twitter_button.setAttribute("data-via" ,"openaccessbutton") ;
		twitter_button.setAttribute("data-size" ,"large") ;
		document.getElementById("social_buttons").appendChild(twitter_button);
		twttr.widgets.load();  //very important
	}
}
