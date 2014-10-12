var {ToggleButton} = require("sdk/ui/button/toggle");
var panels = require("sdk/panel");
var self = require("sdk/self");
var tabs = require('sdk/tabs');
var ss = require("sdk/simple-storage");
var Request = require("sdk/request").Request;
var pageMod = require("sdk/page-mod");

// Base API URL
var API_URL = "http://oabutton.cottagelabs.com/api";
var OAMIRROR_URL = "http://oamirror.herokuapp.com";
var STORY_BASE_URL = "https://openaccessbutton.org/story/";

// Number of open tabs
var num_open = 0;

// Signup/signing sidebar
var signup_sidebar = require("sdk/ui/sidebar").Sidebar({
      id: 'oabutton-signup-sidebar',
      title: " ",
			onHide: sidebarHidden,
			onShow: sidebarShown,
      url: require("sdk/self").data.url("signup_sidebar.html"),
			onReady: function(worker) {
				// First run
				if (!(ss.storage.first_run === false)) {
					worker.port.emit("show_sidebar_drag_message");
					ss.storage.first_run = false;
				}

				// User signup
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

				// User login
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
						url: OAMIRROR_URL + "/status",
						content: {url: url, api_key: ss.storage.api_key},
						onComplete: function(response) {
							if (response.status == 200) {
								var data = response.json;
								var success = data.success;
								var html = data.html;
								worker.port.emit("info_obtained", success, html, STORY_BASE_URL + ss.storage.storyid);
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
									url: OAMIRROR_URL + "/status",
									content: {url: url, api_key: ss.storage.api_key},
									onComplete: function(response) {
										if (response.status == 200) {
											var data = response.json;
											var success = data.success;
											var html = data.html;
											worker.port.emit("info_obtained", success, html, STORY_BASE_URL + ss.storage.storyid);
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
    id: "my-button",
    label: "my button",
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
		if (typeof ss.storage.api_key === "undefined" || ss.storage.api_key === "") {
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
