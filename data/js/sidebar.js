window.onload = function() {
	document.getElementById("loading").style.display = 'block';
	document.getElementById("loaded").style.display = 'none';

	document.getElementById("report_button").onclick = function() {
		addon.port.emit("report_paywall");
	}

	document.getElementById("logout_button").onclick = function() {
		addon.port.emit("logout");
	}

	document.getElementById("report_button").onclick = function() {
		var story = document.getElementById("story").value;
		addon.port.emit("submit_blocked", story, true);
	}
}

addon.port.on("info_obtained", function(links, related_papers, author_email) {
	document.getElementById("loading").style.display = 'none';
	document.getElementById("loaded").style.display = 'block';

	var links_html = "";
	for(var i=0; i<links.length; i++) {
		links_html += "<li>" + "<a href='" + links[i].url + "'>" + links[i].source + "</a>" + "</li>";
	}
	document.getElementById("links").innerHTML = links_html;

	var related_papers_html = "";
	for(var i=0; i<related_papers.length; i++) {
		related_papers_html += "<li>" + "<a href='" + related_papers[i].url + "'>" + related_papers[i].title + "</a>" + "</li>";
	}
	document.getElementById("related_papers").innerHTML = related_papers_html;

	document.getElementById("author_button").onclick = function() {
		var story = document.getElementById("story").value;
		addon.port.emit("submit_blocked", story, false);

		window.location.href = "mailto:" + author_email + "?body=" + encodeURIComponent(story);
	}
});
