// ==UserScript==
// @name        ExtendCategoryList
// @namespace   waymarking.com
// @description Extends the full category list by highlighting created and visited waymarks.
// @include     http*://*.waymarking.com/cat/categorydirectory.aspx*
// @version     1.1
// @grant       GM.xmlHttpRequest
// ==/UserScript==

var extender = {
	init: function() {
        var html = document.createElement('span');
        html.style.float = "right";
        html.innerHTML = "<input id='highlightCreated' class='smallcontrols' type='submit' onclick='return false;' value='Highlight Created Waymarks' /> <input id='highlightVisited' class='smallcontrols' type='submit' onclick='return false;' value='Highlight Visited Waymarks' /> &nbsp; <span id='highlightWait' style='display: none;'>Loading ...</span>";
        document.querySelector(".cat_ddl").appendChild(html);
		document.getElementById("highlightCreated").addEventListener("click", function() {
			extender.resetHighlights();
			document.getElementById("highlightCreated").style.fontWeight = "normal";
			document.getElementById("highlightVisited").style.fontWeight = "normal";
			if (extender.highlight == "created") {
				extender.highlight = null;
			} else {
				document.getElementById("highlightWait").style.display = "";
				extender.insertHighlights(2, function() {
					document.getElementById("highlightCreated").style.fontWeight = "bold";
					document.getElementById("highlightWait").style.display = "none";
					extender.highlight = "created";
				});
			}
			return false;
		}, false);
		document.getElementById("highlightVisited").addEventListener("click", function() {
			extender.resetHighlights();
			document.getElementById("highlightCreated").style.fontWeight = "normal";
			document.getElementById("highlightVisited").style.fontWeight = "normal";
			if (extender.highlight == "visited") {
				extender.highlight = null;
			} else {
				document.getElementById("highlightWait").style.display = "";
				extender.insertHighlights(1, function() {
					document.getElementById("highlightVisited").style.fontWeight = "bold";
					document.getElementById("highlightWait").style.display = "none";
					extender.highlight = "visited";
				});
			}
			return false;
		}, false);
	},
	
	insertHighlights: function(gt, callback) {
		GM.xmlHttpRequest({
			url: "https://www.waymarking.com/users/profile.aspx?f=1&mypage=2&gt=" + gt + "&dt1=1/1/2005&dt2=11/13/2050",
			method: "GET",
			onload: function(xhr) {
				var myHtml = new DOMParser().parseFromString(xhr.responseText,"text/html");
                var myCats = myHtml.querySelectorAll("td[align=left] a");
				var globalCats = document.querySelectorAll("#content p a");
				for (var i = 0, cat = myCats[0]; i++, cat = myCats[i]; i < myCats.length) {
					var guid = cat.getAttribute("href").match(/guid=([a-z0-9\-]+)/);
					if (guid) {
						for (var j = 0, cat = globalCats[0]; j++, cat = globalCats[j]; j < globalCats.length) {
							var globalGuid = cat.getAttribute("href").match(/guid=([a-z0-9\-]+)/);
							if (globalGuid && guid[1] == globalGuid[1]) {
								cat.style.fontWeight = "bold";
								cat.style.color = "#000000";
								var num = myCats[i].parentNode.parentNode.childNodes[3].childNodes[0].innerHTML;
                                var span = document.createElement("span");
                                span.setAttribute("class", "number");
                                span.innerHTML = "&nbsp;(" + num + ")";
								cat.parentElement.appendChild(span);
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
		var globalCats = document.querySelectorAll("#content p a");
		for (var j = 0, cat = globalCats[0]; j++, cat = globalCats[j]; j < globalCats.length) {
			cat.style.fontWeight = "";
			cat.style.color = "";
            document.querySelectorAll(".number").forEach(function(span) {
                span.parentElement.removeChild(span);
            });
		}
	}
};

(function () {
	window.addEventListener("load", extender.init(), false);
})();
