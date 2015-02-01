window.onload = function() {
	showLoading();

	document.getElementById("logout_button").onclick = function() {
		addon.port.emit("logout");
		return false;
	}

	document.getElementById("done_button").onclick = function() {
		showLoaded();
		addon.port.emit("close_sidebar");
	}

	document.getElementById("scholar_notitle").onclick = function() {
		var title = document.getElementById("user_title").value;
		window.open("http://scholar.google.com/scholar?hl=en&q=" + encodeURI(title));
		return false;
	}

	document.getElementById("info_obtained").style.display = 'none';
	document.getElementById("info_not_obtained").style.display = 'none';

	addon.port.emit("page_loaded");
}

addon.port.on("update_privacy_link", function(username) {
	document.getElementById("privacy_link").setAttribute("href", "http://openaccessbutton.org/account/" + encodeURI(username));
});

// When info about a page has been obtained, generate the HTML markup
addon.port.on("info_obtained", function(success, data, share_url) {
	showLoaded();

	if (success) {
		document.getElementById("info_obtained").style.display = 'block';
		document.getElementById("info_not_obtained").style.display = 'none';
	
		var metadata = data.contentmine.metadata;
		document.getElementById("title").textContent = metadata.title;

		var author = ""
		// Produce string of format author1, author2, author3 & author4
		if (metadata.author.length > 1) {
			for (var i=0; i<metadata.author.length-2; i++) {
				author += metadata.author[i] + ", ";
			}
		}
		author += metadata.author[metadata.author.length-2] + " & ";
		author += metadata.author[metadata.author.length-1];
		document.getElementById("author").textContent = author;

		document.getElementById("full_text").setAttribute("href", metadata.fulltext_html);
		document.getElementById("pdf").setAttribute("href", metadata.fulltext_pdf);

		document.getElementById("scholar").setAttribute("href", "http://scholar.google.com/scholar?hl=en&q=" + encodeURI(metadata.title));
	} else {
		document.getElementById("info_obtained").style.display = 'none';
		
		document.getElementById("info_not_obtained").style.display = 'block';
	}

	// Twitter sharing button
	var twitter_link = "https://twitter.com/home?status=See%20what%20I%E2%80%99d%20do%20with%20access%20to%20this%20research%20paper%20at%20" + encodeURI(share_url) + "%20via%20@oa_button."
	$(".twitter").off("click");
	$(".twitter").on("click", function() {
		window.open(twitter_link,'_blank');
	});
	document.getElementById("twitter").setAttribute("href", twitter_link);

	// Google plus sharing button
	var google_link = "https://plus.google.com/share?url=" + encodeURI(share_url);
	$(".google").off("click");
	$(".google").on("click", function() {
		window.open(google_link,'_blank');
	});
	document.getElementById("google").setAttribute("href", google_link);

	// Facebook sharing button
	var facebook_link = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURI(share_url);
	$(".facebook").off("click");
	$(".facebook").on("click", function() {
		window.open(facebook_link,'_blank');
	});
	document.getElementById("facebook").setAttribute("href", facebook_link);

	if (success) {
		document.getElementById("access_button").onclick = function() {
			// Get the story the user's entered
			var story = document.getElementById("story").value;	
			// Submit all this back to the API and take the story off our watchlist
			addon.port.emit("got_access", story, null);
		}

		document.getElementById("no_access_button").onclick = function() {
			var story = document.getElementById("story").value;	
			// Submit all this back to the API and put the story on our watchlist
			addon.port.emit("didnt_get_access", story, null);
		}
	} else {
		document.getElementById("access_button").onclick = function() {
			// Get the story the user's entered
			var story = document.getElementById("story").value;	
			var title = document.getElementById("user_title").value;
			// Submit all this back to the API and take the story off our watchlist
			addon.port.emit("got_access", story, title);
		}

		document.getElementById("no_access_button").onclick = function() {
			var story = document.getElementById("story").value;	
			var title = document.getElementById("user_title").value;
			// Submit all this back to the API and put the story on our watchlist
			addon.port.emit("didnt_get_access", story, title);
		}
	}
});


// Switch between the various view states of the sidebar
addon.port.on("success", function() { showSuccess(); });
addon.port.on("failure", function() { showFailure(); });

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

$(document).ready(function() {
	$("#no_access_button").prop("disabled", $("#story").val().length===0);
	$("#story").on('keyup', function() {
		var field_length = $("#story").val().length;
		var limit = 85;
		
		// If value is too long, trim it
		if (field_length > limit) {
			$("#story").val($("#story").val().substring(0, limit));
		} else {
			// Otherwise update characters counter
			$("#storylength").val(limit - field_length);
		}

		// If length is 0, disable wishlist submit button
		$("#no_access_button").prop("disabled", field_length===0);
	});
});

// Styling of links
$(document).ready(function() {
	$(".left").css("margin-right", ($(".underlined").width() - $(".left").width() - $(".rightt").width() - $(".centralright").width() - $(".centralleft").width() - 1)/3);
	$(".centralleft").css("margin-right", (($(".underlined").width() - $(".left").width() - $(".rightt").width() - $(".centralright").width() - $(".centralleft").width() - 1)/3));
	$(".centralright").css("margin-right", (($(".underlined").width() - $(".left").width() - $(".rightt").width() - $(".centralright").width() - $(".centralleft").width() - 1)/3));
});
$(window).resize(function() {
	$(".left").css("margin-right", ($(".underlined").width() - $(".left").width() - $(".rightt").width() - $(".centralright").width() - $(".centralleft").width() - 1)/3);
	$(".centralleft").css("margin-right", (($(".underlined").width() - $(".left").width() - $(".rightt").width() - $(".centralright").width() - $(".centralleft").width() - 1)/3));
	$(".centralright").css("margin-right", (($(".underlined").width() - $(".left").width() - $(".rightt").width() - $(".centralright").width() - $(".centralleft").width() - 1)/3));
});
