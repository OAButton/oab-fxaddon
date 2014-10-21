window.onload = function() {
	document.getElementById("signup_button").onclick = function() {
		var email = document.getElementById("email").value;
		var password = document.getElementById("password").value;
		addon.port.emit("signup_click", email, password);
	}
	document.getElementById("login_button").onclick = function() {
		var email = document.getElementById("email").value;
		var password = document.getElementById("password").value;
		addon.port.emit("login_click", email, password);
	}
	// Just redirect to a page on the website for now
	document.getElementById("forgot_password").onclick = function() {
		var email = document.getElementById("email").value;
		window.open("http://openaccessbutton.org/firefox/forgot_password?email=" + encodeURI(email));
	}
}

addon.port.on("show_sidebar_drag_message", function() {
	$("#sidebar_drag_message").show();
});
