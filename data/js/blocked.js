window.onload = function() {
	document.getElementById("report_button").onclick = function() {
		var story = document.getElementById("story").value;
		addon.port.emit("submit_blocked", story);
	}
}
