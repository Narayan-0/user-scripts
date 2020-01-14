// ==UserScript==
// @name        ExtendProfilePages
// @namespace   waymarking.com
// @description Displays additional links for communication on profile pages
// @include     http*://*.waymarking.com/users/profile.aspx*
// @version     1.1
// @grant       none
// ==/UserScript==

var extender = {
	init: function() {
		var result = document.location.search.match(/guid=([a-z0-9\-]+)/);
		if (result) {
			var guid = result[1];
			var a = document.getElementById("ctl00_ContentBody_ProfilePanel1_lnkEmailUser");
			if (a) {
                var profileText = a.parentElement;
                profileText.removeChild(a);
				var label = document.getElementById("ctl00_ContentBody_ProfilePanel1_lblEmailUser");
				label.innerHTML = "Contact:";
				label.style.float = "left";
				label.style.marginRight = "5px";
                var span = document.createElement("span");
                span.setAttribute("style", "float: left;");
                span.innerHTML = " \
<a href='http://www.waymarking.com/users/email.aspx?f=1&guid=" + guid + "'>Send Email (on waymarking.com)</a> \
<br/> \
<a href='https://www.geocaching.com/email/?guid=" + guid + "' target='_blank'>Send Email (on geocaching.com)</a> \
<br/> \
<a href='https://www.geocaching.com/account/messagecenter?recipientId=" + guid + "' target='_blank'>Open Message Center</a>";
                profileText.appendChild(span);
                span = document.createElement("span");
                span.setAttribute("class", "profile_text");
                span.setAttribute("style", "display: block;");
                span.innerHTML = "<span style='font-weight: bold;'>Geocaching Profile:</span>&nbsp;<a href='https://www.geocaching.com/profile/?guid=" + guid + "' target='_blank'>Visit Profile on geocaching.com</a>";
                profileText.parentElement.appendChild(span);
			}
		}
	}
};

(function () {
	window.addEventListener("load", extender.init(), false);
})();