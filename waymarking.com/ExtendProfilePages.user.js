// ==UserScript==
// @name        ExtendProfilePages
// @namespace   waymarking.com
// @description Displays additional links for communication on profile pages
// @include     http*://*.waymarking.com/users/profile.aspx*
// @version     1.0
// @grant       none
// ==/UserScript==

window.extender = {
	init: function() {
		var result = document.location.search.match(/guid=([a-z0-9\-]+)/);
		if (result) {
			window.extender.guid = result[1];
			var a = jQuery("#ctl00_ContentBody_ProfilePanel1_lnkEmailUser");
			if (a.length > 0) {
				var label = jQuery("#ctl00_ContentBody_ProfilePanel1_lblEmailUser");
				label.html("Contact:");
				label.css("float", "left");
				label.css("margin-right", "5px");
				a.html("Send Email (on waymarking.com)");
				a.wrap("<span style='float: left;' />")
				a.closest("span").append("<br/>");
				a.closest("span").append("<a href='https://www.geocaching.com/email/?guid=" + window.extender.guid + "' target='_blank'>Send Email (on geocaching.com)</a>");
				a.closest("span").append("<br/>");
				a.closest("span").append("<a href='https://www.geocaching.com/account/messagecenter?recipientId=" + window.extender.guid + "' target='_blank'>Open Message Center</a>");
				a.closest("td").append("<span class='profile_text' style='display: block;'><span style='font-weight: bold;'>Geocaching Profile:</span>&nbsp;<a href='https://www.geocaching.com/profile/?guid=" + window.extender.guid + "' target='_blank'>Visit Profile on geocaching.com</a></span>");
			}
		}
	}
};

var func = function() {
	window.setTimeout(function() {
		jQuery(document).ready(function() {
			window.extender.init();
		});
	}, 100);
};

var script = document.createElement('script');
script.type = "text/javascript";
script.textContent = '(' + func.toString() + ')();';
document.body.appendChild(script);

/* https://gist.github.com/anonymous/214b4bdceb84de2ed41ac6d69771c91e/raw/79a3892794b82ec4f2d83659a0aaeaa675ff57f1/ExtendProfilePages.user.js */
