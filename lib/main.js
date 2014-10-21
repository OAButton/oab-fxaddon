var {ToggleButton} = require("sdk/ui/button/toggle");
var panels = require("sdk/panel");
var self = require("sdk/self");
var tabs = require('sdk/tabs');
var ss = require("sdk/simple-storage");
var Request = require("sdk/request").Request;
var pageMod = require("sdk/page-mod");

// Base API URL
var API_URL = "https://openaccessbutton.org/api";
var STORY_BASE_URL = "https://openaccessbutton.org/story/";

// Number of open sidebars
// Used to keep track of when we should toggle the icon
var num_open = 0;

// Introduction sidebar
var intro_sidebar = require("sdk/ui/sidebar").Sidebar({
			id: 'oabutton-intro-sidebar',
			title: " ",
			onHide: sidebarHidden,
			onShow: sidebarShown,
			url: require("sdk/self").data.url("intro_sidebar.html"),
			onReady: function(worker) {
				worker.port.on("done_click", function() {
					ss.storage.first_run = false;
					handleNavigation();
				});
			}
});

// Signup/signing sidebar
var signup_sidebar = require("sdk/ui/sidebar").Sidebar({
      id: 'oabutton-signup-sidebar',
      title: "Open Access Button",
			onHide: sidebarHidden,
			onShow: sidebarShown,
      url: require("sdk/self").data.url("signup_sidebar.html"),
			onReady: function(worker) {
				// User signup
				worker.port.on("signup_click", function(username, email, password, profession) {
					if (email === "") {
						showNotification("Signup Error", "Email address is blank");
					} else {
						Request({
							url: API_URL + "/register",
							content: {username: username, email: email, password: password, profession: profession},
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
					}
				});

				// User login
				worker.port.on("login_click", function(username, password) {
					if (username === "") {
						showNotification("Login Error", "Username is blank");
					} else {
						Request({
							url: API_URL + "/retrieve",
							content: {username: username, password: password},
							onComplete: function(response) {
								if (response.status == 200 && response.json["api_key"] != undefined && response.json["api_key"].length > 0) {
									var data = response.json;
									ss.storage.username = username;
									ss.storage.api_key = data.api_key;
									handleNavigation();
								} else {
									showError("Login Error", "Username or password incorrect");
								}
							}
						}).post();
					}
				});
			}
});

// The main sidebar showing everything else
var sidebar = require("sdk/ui/sidebar").Sidebar({
      id: 'oabutton-sidebar',
      title: " ",
      url: require("sdk/self").data.url("sidebar.html"),
			onHide: sidebarHidden,
			onShow: sidebarShown,
			onReady: function(worker) {
				worker.port.emit("update_privacy_link", ss.storage.username);
			worker.port.on("page_loaded", function() {
				var url = tabs.activeTab.url;

				// If we've just submitted a paywall request, don't submit another one
				if (ss.storage.current_url == url) {
					Request({
						url: API_URL + "/status",
						content: {url: url, api_key: ss.storage.api_key},
						onComplete: function(response) {
							if (response.status == 200) {
								var data = response.json;
								var success = !(data.contentmine === undefined || data.contentmine.metadata === undefined || data.contentmine.metadata.title === undefined);
								worker.port.emit("info_obtained", success, data, STORY_BASE_URL + ss.storage.storyid);
							} else {
								showApiError("API Error", response);
							}
						}
					}).post();
				} else {
					ss.storage.current_url = url;

					// Submit a blocked paywall API request
					Request({
						url: API_URL + "/blocked",
						content: {url: url, api_key: ss.storage.api_key},
						onComplete: function(response) {
							if (response.status == 200) {
								ss.storage.storyid = response.json.id;
								showNotification("Open Access Button", "Paywall recorded successfully");

								ss.storage.emails = [];
															
								// Get the paywall status of the page, and show the HTML content we get back from that
								Request({
									url: API_URL + "/status",
									content: {url: url, api_key: ss.storage.api_key},
									onComplete: function(response) {
										if (response.status == 200) {
											var data = response.json;
											var success = !(data.contentmine === undefined || data.contentmine.metadata === undefined || data.contentmine.metadata.title === undefined);
											worker.port.emit("info_obtained", success, data, STORY_BASE_URL + ss.storage.storyid);
										} else {
											showApiError("API Error", response);
										}
									}
								}).post();
							} else {
								showApiError("Error", response);
							}
						}
					}).post();
				}
				});

				// Logout
				worker.port.on("logout", function() {
					ss.storage.username = undefined;
					ss.storage.api_key = undefined;
					handleNavigation();
				});

				// Show success page
				worker.port.on("got_access", function(story, title) {
					var params = {wishlist: 0, api_key: ss.storage.api_key, story: story, emails: ss.storage.emails};
					if (title != null) { params.title = title; }
					Request({
						url: API_URL + "/blocked/" + ss.storage.storyid,
						content: params,
						onComplete: function(response) {
							if (response.status == 200) {
								worker.port.emit("success");
							} else {
								showApiError("API Error", response);
							}
						}
					}).post();
				});


				// Show failure page
				worker.port.on("didnt_get_access", function(story, title) {
					if (story != undefined && story != null && story.length > 0) {
						var params = {wishlist: 1, api_key: ss.storage.api_key, story: story, emails: ss.storage.emails};
						if (title != null) { params.title = title; }
						Request({
							url: API_URL + "/blocked/" + ss.storage.storyid,
							content: params,
							onComplete: function(response) {
								if (response.status == 200) {
									showNotification("Open Access Button", "Added to wishlist");
									worker.port.emit("failure");
								} else {
									showApiError("API Error", response);
								}
							}
						}).post();
					} else {
						showNotification("Open Access Button", "You need to enter a story to submit to your wishlist!");	
					}
				});

				// Close sidebar
				worker.port.on("close_sidebar", function() {
					sidebar.hide();
					signup_sidebar.hide();
					intro_sidebar.hide();
				});
			}
});

// Show notifications to user
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


// Button used to toggle sidebar open/closed
var button = ToggleButton({
    id: "open-access-button",
    label: "Open Access Button",
    icon: {
        "16": "./images/oabutton-16.png",
        "32": "./images/oabutton-32.png",
        "64": "./images/oabutton-64.png"
    },
		onChange: handleChange
});


// Keep sidebar and button in track
function handleChange (state) {
    if (state.checked) {
				handleNavigation();
    } else {
        signup_sidebar.hide();
				intro_sidebar.hide();
        sidebar.hide();
				button.state("window", {checked: false});
    }
}

function sidebarHidden() {
	num_open -= 1;
	if (num_open < 1) {
		button.state("window", {checked: false});
	} else {
		button.state("window", {checked: true});
	}
}

function sidebarShown() {
	num_open += 1;
	if (num_open < 1) {
		button.state("window", {checked: false});
	} else {
		button.state("window", {checked: true});
	}
}

// Only show the signup sidebar if we're logged out
function handleNavigation() {
		// On first run show the introduction sidebar
		if (!(ss.storage.first_run === false)) {
			intro_sidebar.show();
		} else if (typeof ss.storage.api_key === "undefined" || ss.storage.api_key === "") {
			signup_sidebar.show();
		} else {
			sidebar.show();
		}
}

// Keep track of email addresses in the page
pageMod.PageMod({
  include: "*",
  contentScriptFile: self.data.url("js/emails.js"),
  onAttach: function(worker) {
    worker.port.on("emails", function(emails) {
			ss.storage.emails = emails;
		});
  }
});
