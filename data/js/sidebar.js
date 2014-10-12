window.onload = function() {
	document.getElementById("loading").style.display = 'block';
	document.getElementById("loaded").style.display = 'none';

	document.getElementById("logout_button").onclick = function() {
		addon.port.emit("logout");
		return false;
	}
}

addon.port.on("info_obtained", function(success, html, share_url) {
	document.getElementById("loading").style.display = 'none';
	document.getElementById("loaded").style.display = 'block';

	document.getElementById("response").innerHTML = html;

	var twitter_link = "https://twitter.com/home?status=See%20what%20I%E2%80%99d%20do%20with%20access%20to%20this%20research%20paper%20at%20" + encodeURI(share_url) + "%20via%20@oa_button."
	document.getElementById("twitter").setAttribute("href", twitter_link);

	var google_link = "https://plus.google.com/share?url=" + encodeURI(share_url);
	document.getElementById("google").setAttribute("href", google_link);

	var facebook_link = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURI(share_url);
	document.getElementById("facebook").setAttribute("href", facebook_link);

	document.getElementById("access_button").onclick = function() {
		var story = document.getElementById("story").value;	
		var title;
		if (document.getElementById("title") == null) {
			title = null;
		} else {
			title = document.getElementById("title").value;
		}
		addon.port.emit("got_access", story, title);
	}

	document.getElementById("no_access_button").onclick = function() {
		addon.port.emit("didnt_get_access");
	}
});
