window.onload = function() {
	document.getElementById("signup_button").onclick = function() {
		var email = document.getElementById("email").value;
		var password = document.getElementById("email").value;
		addon.port.emit("signup_click", email, password);
	}
	document.getElementById("login_button").onclick = function() {
		var email = document.getElementById("email").value;
		var password = document.getElementById("email").value;
		addon.port.emit("login_click", email, password);
	}
}
