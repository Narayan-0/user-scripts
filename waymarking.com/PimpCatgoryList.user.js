// ==UserScript==
// @name        ExtendCategoryList
// @namespace   waymarking.com
// @description Extends the full category list by highlighting created and visited waymarks.
// @include     http*://*.waymarking.com/cat/categorydirectory.aspx*
// @version     1.0
// @grant       GM.xmlHttpRequest
// ==/UserScript==

var extender = {
	init: function() {
		var jq = unsafeWindow.jQuery;
		jq("#ctl00_ContentBody_btnSubmit").after("<span style='float: right'><input id='highlightCreated' class='smallcontrols' type='submit' onclick='return false;' value='Highlight Created Waymarks' /> <input id='highlightVisited' class='smallcontrols' type='submit' onclick='return false;' value='Highlight Visited Waymarks' /> &nbsp; <span id='highlightWait' style='display: none;'>Loading ...</span></span>");
		jq("#highlightCreated").click(function() {
			extender.resetHighlights();
			jq("#highlightCreated").css("font-weight", "normal");
			jq("#highlightVisited").css("font-weight", "normal");
			if (extender.highlight == "created") {
				extender.highlight = null;
			} else {
				jq("#highlightWait").css("display", "");
				extender.insertHighlights(2, function() {
					jq("#highlightCreated").css("font-weight", "bold");
					jq("#highlightWait").css("display", "none");
					extender.highlight = "created";
				});
			}
			return false;
		});
		jq("#highlightVisited").click(function() {
			extender.resetHighlights();
			jq("#highlightCreated").css("font-weight", "normal");
			jq("#highlightVisited").css("font-weight", "normal");
			if (extender.highlight == "visited") {
				extender.highlight = null;
			} else {
				jq("#highlightWait").css("display", "");
				extender.insertHighlights(1, function() {
					jq("#highlightVisited").css("font-weight", "bold");
					jq("#highlightWait").css("display", "none");
					extender.highlight = "visited";
				});
			}
			return false;
		});
	},
	
	insertHighlights: function(gt, callback) {
		GM.xmlHttpRequest({
			url: "http://www.waymarking.com/users/profile.aspx?f=1&mypage=2&gt=" + gt + "&dt1=1/1/2005&dt2=11/13/2050",
			method: "GET",
			onload: function(xhr) {
				var jq = unsafeWindow.jQuery;
				myCats = jq(xhr.responseText).find("td[align=left] a");
				globalCats = jq("#content p a");
				for (i = 0, cat = myCats[0]; i++, cat = myCats[i]; i < myCats.length) {
					guid = cat.getAttribute("href").match(/guid=([a-z0-9\-]+)/);
					if (guid) {
						for (j = 0, cat = globalCats[0]; j++, cat = globalCats[j]; j < globalCats.length) {
							globalGuid = cat.getAttribute("href").match(/guid=([a-z0-9\-]+)/);
							if (globalGuid && guid[1] == globalGuid[1]) {
								cat = jq(cat);
								cat.css("font-weight", "bold");
								cat.css("color", "#000000");
								num = myCats[i].parentNode.parentNode.childNodes[3].childNodes[0].innerHTML;
								cat.after("<span class='number'>&nbsp;(" + num + ")</apan>");
							}
						}
					}
				}
				if (callback) {
					callback();
				}
			}
		});
	},
	
	resetHighlights: function() {
		var jq = unsafeWindow.jQuery;
		globalCats = jq("#content p a");
		for (j = 0, cat = globalCats[0]; j++, cat = globalCats[j]; j < globalCats.length) {
			cat = jq(cat);
			cat.css("font-weight", "");
			cat.css("color", "");
			jq(".number", cat.parent()).remove();
		}
	}
};

(function () {
	window.addEventListener("load", extender.init(), false);
})();


/* https://gist.github.com/Narayan-0/865f7f2ae702f1bc56aebb366f47ecf4 */
/* https://gist.github.com/Narayan-0/865f7f2ae702f1bc56aebb366f47ecf4/raw/984762baba8087ecf2911ff9fc2d5def8652906e/PimpCatgoryList.user.js */