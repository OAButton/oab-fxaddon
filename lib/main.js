var {ToggleButton} = require("sdk/ui/button/toggle");
var panels = require("sdk/panel");
var self = require("sdk/self");
var tabs = require('sdk/tabs');
var ss = require("sdk/simple-storage");
var Request = require("sdk/request").Request;

var API_URL = "http://oabutton.cottagelabs.com/api";

var signup_sidebar = require("sdk/ui/sidebar").Sidebar({
      id: 'oabutton-signup-sidebar',
      title: 'Open Access Button',
      url: require("sdk/self").data.url("signup_sidebar.html"),
			onReady: function(worker) {
				worker.port.on("signup_click", function(email, password) {
					Request({
						url: API_URL + "/register",
						content: {email: email, password: password},
						onComplete: function(response) {
							if (response.status == 200) {
								var data = response.json;
								ss.storage.username = data.username;
								ss.storage.api_key = data.api_key;
								handleNavigation();
							} else {
								showApiError("Signup Error", response);
							}
						}
					}).post();
				});
				worker.port.on("login_click", function(email, password) {
					Request({
						url: API_URL + "/retrieve",
						content: {email: email, password: password},
						onComplete: function(response) {
							if (response.status == 200 && response.json["api_key"] != undefined && response.json["api_key"].length > 0) {
								var data = response.json;
								ss.storage.username = email;
								ss.storage.api_key = data.api_key;
								handleNavigation();
							} else {
								showError("Login Error", "Username or password incorrect");
							}
						}
					}).post();
				});
			}
});

function showApiError(title, response) {
	var errors = response.json.errors;

	for(var i=0; i<errors.length; i++) {
		showNotification(title, errors[i]);
	}
}

function showError(title, body) {
	var notifications = require("sdk/notifications");
	notifications.notify({
		title: title,
		text: body
	});
}
showNotification = showError;

var share_sidebar = require("sdk/ui/sidebar").Sidebar({
      id: 'oabutton-share-sidebar',
      title: 'Open Access Button',
      url: require("sdk/self").data.url("share_sidebar.html"),
			onReady: function(worker) {
				worker.port.on("done", function(story) {
					handleNavigation();
				});
			},
			onAttach: function(worker) {
				worker.port.emit("social", ss.storage.storyid);
			}
});

var sidebar = require("sdk/ui/sidebar").Sidebar({
      id: 'oabutton-sidebar',
      title: 'Open Access Button',
      url: require("sdk/self").data.url("sidebar.html"),
			onAttach: function(worker) {
				var url = tabs.activeTab.url;
				Request({
					url: API_URL + "/status",
					content: {url: url, api_key: ss.storage.api_key},
					onComplete: function(response) {
						var data = response.json;
						// TODO: Get real data
						var links = [
							{
								source: "Google Scholar",
								url: "http://scholar.google.com/scholar?hl=en&q=medical&btnG=&as_sdt=1%2C22&as_sdtp="
							},
							{
								source: "arxiv",
								url: "http://arxiv.org/abs/astro-ph/9905053"
							}
						];
						var related_papers = [
							{
								title: "On Evolution of the Pair-Electromagnetic Pulse of a Charge Black Hole",
								url: "http://arxiv.org/abs/astro-ph/9905021"
							},
							{
								title: "Hard X-ray emission from elliptical galaxies",
								url: "http://arxiv.org/abs/astro-ph/9905052"
							}
						];
						var author_email = "rickards@mit.edu";
						worker.port.emit("info_obtained", links, related_papers, author_email);
					}
				}).post();
			},
			onReady: function(worker) {
				worker.port.on("logout", function() {
					ss.storage.username = undefined;
					ss.storage.api_key = undefined;
					handleNavigation();
				});
				worker.port.on("submit_blocked", function(story, redirect) {
					var url = tabs.activeTab.url;
					Request({
						url: API_URL + "/blocked",
						content: {url: url, api_key: ss.storage.api_key, story: story},
						onComplete: function(response) {
							if (response.status == 200) {
								ss.storage.storyid = response.json.id;
								if (redirect) {
									share_sidebar.show();
								}
								showNotification("Open Access Button", "Paywall recorded successfully");
							} else {
								showApiError("Error", response);
							}
						}
					}).post();
				});
			}
});

var button = ToggleButton({
    id: "my-button",
    label: "my button",
    icon: {
        "16": "./images/oabutton-16.png",
        "32": "./images/oabutton-32.png",
        "64": "./images/oabutton-64.png"
    },
		onChange: handleChange
});

function handleChange (state) {
    if (state.checked) {
				handleNavigation();
    } else {
        signup_sidebar.hide();
        sidebar.hide();
				button.state("window", {checked: false});
    }
}

function handleNavigation() {
		if (typeof ss.storage.api_key === "undefined" || ss.storage.api_key === "") {
			signup_sidebar.show();
		} else {
			sidebar.show();
		}
}
