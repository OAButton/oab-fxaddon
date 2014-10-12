window.onload = function() {
	showLoading();

	document.getElementById("logout_button").onclick = function() {
		addon.port.emit("logout");
		return false;
	}

	document.getElementById("done_button").onclick = function() {
		showLoaded();
	}

	addon.port.emit("page_loaded");
}

addon.port.on("info_obtained", function(success, html, share_url) {
	showLoaded();

	document.getElementById("response").innerHTML = html;

	var twitter_link = "https://twitter.com/home?status=See%20what%20I%E2%80%99d%20do%20with%20access%20to%20this%20research%20paper%20at%20" + encodeURI(share_url) + "%20via%20@oa_button."
	$(".twitter").off("click");
	$(".twitter").on("click", function() {
		window.open(twitter_link,'_blank');
	});
	document.getElementById("twitter").setAttribute("href", twitter_link);

	var google_link = "https://plus.google.com/share?url=" + encodeURI(share_url);
	$(".google").off("click");
	$(".google").on("click", function() {
		window.open(google_link,'_blank');
	});
	document.getElementById("google").setAttribute("href", google_link);

	var facebook_link = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURI(share_url);
	$(".facebook").off("click");
	$(".facebook").on("click", function() {
		window.open(facebook_link,'_blank');
	});
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

addon.port.on("success", function() {
	showSuccess();
});

addon.port.on("failure", function() {
	showFailure();
});

addon.port.on("check_email", function() {
	// TODO: Why is this always null
	var all_emails = document.documentElement.innerHTML.toLowerCase().match(/([a-z0-9_\.\-\+]+@[a-z0-9_\-]+(\.[a-z0-9_\-]+)+)/g);
	var emails = [];

	for (var i=0; i<all_emails.length; i++) {
		var email = all_emails[i];
		if (!((email.indexOf("@elsevier.com") > -1) || (email.indexOf("@nature.com") > -1) || (email.indexOf("@sciencemag.com") > -1) || (email.indexOf("@springer.com") > -1))) {
			emails.push(email);
		}
	}

	addon.port.emit("got_emails", emails);
});

function showLoading() {
	$("#loading").show();
	$("#loaded").hide();
	$(".success").hide();
	$(".failure").hide();
	$(".social_share").hide();
}

function showLoaded() {
	$("#loading").hide();
	$("#loaded").show();
	$(".success").hide();
	$(".failure").hide();
	$(".social_share").hide();
}

function showSuccess() {
	$("#loading").hide();
	$("#loaded").hide();
	$(".success").show();
	$(".failure").hide();
	$(".social_share").show();
}

function showFailure() {
	$("#loading").hide();
	$("#loaded").hide();
	$(".success").hide();
	$(".failure").show();
	$(".social_share").show();
}
