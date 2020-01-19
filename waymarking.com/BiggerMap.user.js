// ==UserScript==
// @name        BiggerMap
// @namespace   waymarking.com
// @description Displays a larger map in search results and waymark details
// @include     http*://*.waymarking.com/*
// @version     1.4
// @grant       none
// ==/UserScript==

window.biggerMap = {
	version: "1.4",

	VIEW_MODE_SMALL: 0,
	VIEW_MODE_RELATIVE: 1,
	VIEW_MODE_FIXED: 2,

	COLOR_MODE_NONE: 0,
	COLOR_MODE_LARGE: 1,
	COLOR_MODE_ALL: 2,

	waymarks: [],
	settings: {},

    hooks: async function() {
        while(!window.mapItems) {
            await new Promise(r => setTimeout(r, 200));
        }

        window.biggerMap.mapItems = window.mapItems;
        window.mapItems = function() {};
        window.createMarker = window.biggerMap.createMarker;

        window.biggerMap.hooks = true;
    },

	init: async function() {
        while(!window.biggerMap.hooks || !window.map || !window.mapItems || !window.L || !window.bounds) {
            await new Promise(r => setTimeout(r, 200));
        }

		window.biggerMap.addCss();
		window.biggerMap.addLinks();

		window.biggerMap.login = document.getElementById("ctl00_HeaderControl1_lnkLoginName").innerHTML;

		window.biggerMap.mapItems();
        window.map.fitBounds(window.bounds, {maxZoom: 15});

		window.biggerMap.loadSettings();
		window.biggerMap.loadMapSize();
		window.biggerMap.changeMapMode();
	},

	addCss: function() {
		var head = document.querySelector("head");
        var link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("href", "https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css");
		head.appendChild(link);
        var style = document.createElement("style");
        style.innerHTML = window.biggerMap.CSS;
		head.appendChild(style);
	},

	addLinks: function() {
		var links = document.createElement("h3");
        links.setAttribute ("class", "biggermap_links");
        links.innerHTML = " \
<a href='#' onclick='window.biggerMap.viewMode = window.biggerMap.VIEW_MODE_RELATIVE; window.biggerMap.changeMapMode(); return false;'>Enlarge</a>&nbsp;&nbsp; \
<a href='#' onclick='window.biggerMap.openSettings(); return false;'>Settings</a>&nbsp;<i class='biggermap_links_toggle fa fa-caret-down'/>";

		var header = document.querySelector("#ctl00_ContentRightColumn_CategoryFilterControl1_uxGoogleMap .box");
		header.style.position = "relative";
		header.insertBefore(links, header.childNodes[0]);
	},

	changeMapMode: function() {
		window.biggerMap.viewMode = window.biggerMap.viewMode || window.biggerMap.VIEW_MODE_SMALL;
		var mapContainer = document.getElementById("map_canvas");

		mapContainer.classList.remove("biggermap_view_small");
		mapContainer.classList.remove("biggermap_view_relative");
		mapContainer.classList.remove("biggermap_view_fixed");

		if (window.biggerMap.viewMode == window.biggerMap.VIEW_MODE_SMALL) {
			mapContainer.classList.add("biggermap_view_small");
			window.biggerMap.showAdditionalMapButtons(false);
			window.biggerMap.showResizer(false);
			window.biggerMap.showColors(window.biggerMap.settings.colorMode == window.biggerMap.COLOR_MODE_ALL);
			mapContainer.style.height = "";
			document.getElementById("mapinfo").parentNode.insertBefore(mapContainer, document.getElementById("mapinfo"));
			window.biggerMap.showFixed(false);
			window.biggerMap.enablePopup(false);
			window.biggerMap.showSmallMapContainer(true);

		} else if (window.biggerMap.viewMode == window.biggerMap.VIEW_MODE_RELATIVE || window.biggerMap.viewMode == window.biggerMap.VIEW_MODE_FIXED) {
			window.biggerMap.showSmallMapContainer(false);
			window.biggerMap.showAdditionalMapButtons(true);
			window.biggerMap.enablePopup(true);
			window.biggerMap.showColors(window.biggerMap.settings.colorMode != window.biggerMap.COLOR_MODE_NONE);

			if (window.biggerMap.viewMode == window.biggerMap.VIEW_MODE_RELATIVE) {
				mapContainer.classList.add("biggermap_view_relative");
                document.getElementById("header").appendChild(mapContainer);
				window.biggerMap.showFixed(false);
				window.biggerMap.showResizer(true);
			} else {
				mapContainer.classList.add("biggermap_view_fixed");
				document.getElementById("biggerMapBtnFixed").style.backgroundColor = "#DDDDDD";
				var fixed = window.biggerMap.showFixed(true);
                fixed.appendChild(mapContainer);
				window.biggerMap.showResizer(true);
                fixed.appendChild(document.getElementById("biggerMapResizer"));
			}

			if (window.biggerMap.height > 0) {
				mapContainer.style.height = "" + window.biggerMap.height + "px";
			}
		}

		window.biggerMap.onResize();
	},

	searchFromHere: function() {
		if (window.map && window.searchUrl) {
			var latLng = window.map.getCenter();
			var newSearchUrl = new URI(window.searchUrl);
			newSearchUrl
				.removeSearch('sg')
				.setSearch('lat', latLng.lat)
				.setSearch('lon', latLng.lng);
			window.document.location.href = newSearchUrl.toString();
		}
		return false;
	},

	showSmallMapContainer: function(show) {
		if (show) {
			document.getElementById("ctl00_ContentRightColumn_CategoryFilterControl1_uxGoogleMap").style.display = "";
		} else {
			document.getElementById("ctl00_ContentRightColumn_CategoryFilterControl1_uxGoogleMap").style.display = "none";
		}
	},

	showAdditionalMapButtons: function(show) {
		var topRight = document.querySelector("#map_canvas .leaflet-top.leaflet-right");
		var bottomLeft = document.querySelector("#map_canvas .leaflet-bottom.leaflet-left");
        topRight.innerHTML = "";
        bottomLeft.innerHTML = "";

		if (show) {
            topRight.innerHTML = " \
<div class='leaflet-control-zoom leaflet-bar leaflet-control'> \
    <a title='Close map' href='#' id='biggerMapClose'><i class='fa fa-close fa-lg' style='line-height: 26px; color: #444444;'></i></a> \
    <a title='Pin map to window' href='#' id='biggerMapBtnFixed'><i class='fa fa-map-pin fa-lg' style='line-height: 26px; color: #444444;'></i></a> \
</div>";
            bottomLeft.innerHTML = " \
<div class='leaflet-control-zoom leaflet-bar leaflet-control'> \
    <a href='#' id='biggerMapSearchFromHere' style='width: auto; padding: 0 5px;'><i class='fa fa-search fa-lg' style='color: #444444; margin-right: 4px;'></i>Search from Here</a> \
</div>";

			document.getElementById("biggerMapClose").addEventListener("click", function() {
				window.biggerMap.viewMode = window.biggerMap.VIEW_MODE_SMALL;
				window.biggerMap.changeMapMode();
				return false;
			});
			document.getElementById("biggerMapBtnFixed").addEventListener("click", function() {
				window.biggerMap.viewMode = window.biggerMap.viewMode == window.biggerMap.VIEW_MODE_FIXED ? window.biggerMap.VIEW_MODE_RELATIVE : window.biggerMap.VIEW_MODE_FIXED;
				window.biggerMap.changeMapMode();
				return false;
			});
			document.getElementById("biggerMapSearchFromHere").addEventListener("click", window.biggerMap.searchFromHere);
		}
	},

	showFixed: function(show) {
		if (document.getElementById("biggerMapFixed")) {
            document.getElementById("biggerMapFixed").parentNode.removeChild(document.getElementById("biggerMapFixed"));
        }
		if (document.getElementById("biggerMapSpacer")) {
            document.getElementById("biggerMapSpacer").parentNode.removeChild(document.getElementById("biggerMapSpacer"));
        }

		if (show) {
            var body = document.querySelector("body");
			var height = window.biggerMap.height > 0 ? window.biggerMap.height : 235;
			var spacer = document.createElement("div");
            spacer.setAttribute("id", "biggerMapSpacer");
            spacer.setAttribute("style", "height: " + height + "px;");
            body.insertBefore(spacer, body.childNodes[0]);
			var fixed = document.createElement("div");
            fixed.setAttribute("id", "biggerMapFixed");
            body.insertBefore(fixed, body.childNodes[0]);
			return fixed;
		}
	},

	showResizer: function(show) {
        var resizer = document.getElementById("biggerMapResizer");
        if (resizer) {
            resizer.parentNode.removeChild(resizer);
        }

		if (show) {
			resizer = document.createElement("div");
            resizer.setAttribute("id", "biggerMapResizer");
            document.getElementById("header").appendChild(resizer);

			resizer.addEventListener("mousedown", window.biggerMap.resizeStart);
			document.querySelector("body").addEventListener("mousemove", window.biggerMap.resizeMove);
			resizer.addEventListener("mouseup", window.biggerMap.resizeEnd);
		}
	},

	showColors: function(show) {
		var mapContainer = document.getElementById("map_canvas");
		if (show) {
			mapContainer.classList.add("biggermap_color");
		} else {
			mapContainer.classList.remove("biggermap_color");
		}
	},

	createMarker: function(item) {
		var waymark = window.biggerMap.insertWaymark(item);
		var marker = window.L.marker([waymark.lat, waymark.lng], {
			title: waymark.title,
			icon: window.L.icon({
				iconUrl: 'http://www.waymarking.com/dyn_img/bubble.aspx?path=' + waymark.icon,
				iconSize: [37, 33],
				iconAnchor: [37, 33],
				popupAnchor: [-19, -33],
				className: waymark.unpublished ? "biggermap_marker_unpublished" : waymark.owner ? "biggermap_marker_owner" : waymark.visited ? "biggermap_marker_visited" : ""
			})
		}).addTo(window.map);
		marker.on("click", function () {
			window.biggerMap.onMarkerClick(waymark);
		});
		waymark.marker = marker;
		window.bounds.extend(window.L.latLng([waymark.lat, waymark.lng]));
	},

	onMarkerClick: function(waymark) {
		window.showInfoPanel(waymark.icon, waymark.title, waymark.code, waymark.cat, waymark.desc);
	},

	insertWaymark: function(item) {
        var checkbox = document.querySelector("input[name='wmchk" + item.code + "'");
        if (checkbox) {
            var tr = checkbox.parentNode.parentNode.parentNode;
			item.owner = window.biggerMap.login && tr.querySelector(".wmd_submitter a").innerHTML == window.biggerMap.login;
			item.visited = tr.querySelector(".wmd_visited");
			item.unpublished = !tr.querySelector(".wmd_namebold");
		}
		window.biggerMap.waymarks.push(item);
		return item;
	},

	enablePopup: function(enable) {
		if (!enable) {
			window.map.closePopup();
		}

		for (var i = 0; i < window.biggerMap.waymarks.length; i++) {
			var waymark = window.biggerMap.waymarks[i];
			if (waymark.marker) {
				if (enable) {
					waymark.marker.bindPopup(window.biggerMap.createPopup(waymark));
				} else {
					waymark.marker.unbindPopup();
				}
			}
		}
	},

	createPopup: function(waymark) {
		return "<div class='biggermap_popup'><table class='googlemap_wmtable'><tr><td class='googlemap_wmtd'><a href='/cat/details.aspx?f=1&guid=" + waymark.cat + "'><img src='/images/cat_icons/" + waymark.icon + ".gif' width='24' border='0' valign='absmiddle'></a></td><td class='googlemap_wmtd'><a href='/waymarks/" + waymark.code + "'>" + waymark.title + "</a></td></tr><tr><td class='googlemap_wmtd2'></td><td class='googlemap_wmtd2'>" + waymark.desc + "</td></tr></table></div>";
	},

	resizeStart: function(e) {
		window.biggerMap.resizing = {
			initialMapHeight: document.getElementById("map_canvas").clientHeight,
			initialY: e.pageY
		};
		return false;
	},

	resizeMove: function(e) {
		if (!window.biggerMap.resizing) {
			return true;
		}
		var newHeight = window.biggerMap.resizing.initialMapHeight - window.biggerMap.resizing.initialY + e.pageY;
		document.getElementById("map_canvas").style.height = newHeight + "px";
		if (window.biggerMap.viewMode == window.biggerMap.VIEW_MODE_FIXED) {
			document.getElementById("biggerMapSpacer").style.height = newHeight + "px";
		}
		window.biggerMap.height = newHeight;
		window.biggerMap.onResize();
		return false;
	},

	resizeEnd: function(e) {
		window.biggerMap.resizing = null;
		return false;
	},

	onResize: function() {
		window.map.invalidateSize();
		window.biggerMap.saveMapSize();
	},

	openSettings: function(link) {
        var toggle = document.querySelector(".biggermap_links_toggle");
		toggle.classList.toggle("fa-caret-up");
		toggle.classList.toggle("fa-caret-down");

		if (window.biggerMap.settingsOpen) {
            var settings = document.querySelector(".biggermap_settings");
            settings.parentNode.removeChild(settings);
			window.biggerMap.settingsOpen = false;
			return;
		}
		window.biggerMap.settingsOpen = true;

		var div = document.createElement("div");
        div.setAttribute("class", "biggermap_settings");

        div.innerHTML = " \
<label>Save map size:</label> \
<select class='biggermap_settings_size'> \
    <option value='false'>only for current session</option> \
    <option value='true'>permanent</option> \
</select> \
<label>Show colored markers:</label> \
<select class='biggermap_settings_color'> \
    <option value='" + window.biggerMap.COLOR_MODE_NONE + "'>never</option> \
    <option value='" + window.biggerMap.COLOR_MODE_LARGE + "'>only on large map</option> \
    <option value='" + window.biggerMap.COLOR_MODE_ALL + "'>on small and large map</option> \
</select> \
<div class='biggermap_settings_toggle biggermap_settings_legend_link'><a href='#'>Color legend</a>&nbsp;<i class='fa fa-caret-down'></i></div> \
<table class='biggermap_settings_legend closed'> \
    <tr><td><i style='color: purple;'>purple:</i></td><td>created by you</td></tr> \
    <tr><td><i style='color: green;'>green:</i></td><td>visited by you</td></tr> \
    <tr><td><i style='color: grey;'>grey:</i></td><td>unpublished (pending review / declined)</td></tr> \
</table> \
<div class='biggermap_settings_toggle biggermap_settings_info_link'><a href='#'>Info</a>&nbsp;<i class='fa fa-caret-down'></i></div> \
<div class='biggermap_settings_info closed'> \
    <i>BiggerMap User Script (aka. Greasemonkey script)</i><br/> \
    Version: " + window.biggerMap.version + "<br/> \
    Created by <a href='http://www.waymarking.com/users/profile.aspx?f=1&guid=9394e8bb-cb86-4d60-8867-1c74955fe4e2' target='_blank'>Narayan,</a>&nbsp; \
    <a href='http://www.waymarking.com/users/email.aspx?f=1&guid=9394e8bb-cb86-4d60-8867-1c74955fe4e2' target='_blank'><i class='fa fa-envelope'></i></a> \
</div>";

        document.querySelector(".biggermap_links").appendChild(div);

        document.querySelector(".biggermap_settings_size").value = window.biggerMap.settings.saveSizePermanent ? "true" : "false";
        document.querySelector(".biggermap_settings_color").value = window.biggerMap.settings.colorMode;

        document.querySelector(".biggermap_settings_size").addEventListener("change", function(e) {
            window.biggerMap.settings.saveSizePermanent = (e.target.value == "true");
			window.biggerMap.saveSettings();
			window.biggerMap.saveMapSize();
        });

        document.querySelector(".biggermap_settings_color").addEventListener("change", function(e) {
			window.biggerMap.settings.colorMode = e.target.value;
			window.biggerMap.saveSettings();
			window.biggerMap.changeMapMode();
        });

        document.querySelector(".biggermap_settings_legend_link a").addEventListener("click", function() {
			document.querySelector(".biggermap_settings_legend_link .fa").classList.toggle("fa-caret-up");
			document.querySelector(".biggermap_settings_legend_link .fa").classList.toggle("fa-caret-down");
			document.querySelector(".biggermap_settings_legend").classList.toggle("closed");
        });

        document.querySelector(".biggermap_settings_info_link a").addEventListener("click", function() {
			document.querySelector(".biggermap_settings_info_link .fa").classList.toggle("fa-caret-up");
			document.querySelector(".biggermap_settings_info_link .fa").classList.toggle("fa-caret-down");
			document.querySelector(".biggermap_settings_info").classList.toggle("closed");
        });
	},

	loadSettings: function() {
		window.biggerMap.settings.saveSizePermanent = window.biggerMap.getCookie("waymarking.biggermap.savesizepermenent") == "true";
		window.biggerMap.settings.colorMode = window.biggerMap.getCookie("waymarking.biggermap.color") || window.biggerMap.COLOR_MODE_LARGE;
	},

	saveSettings: function() {
		window.biggerMap.setCookie("waymarking.biggermap.savesizepermenent", "" + window.biggerMap.settings.saveSizePermanent, true);
		window.biggerMap.setCookie("waymarking.biggermap.color", "" + window.biggerMap.settings.colorMode, true);
	},

	loadMapSize: function() {
		window.biggerMap.viewMode = window.biggerMap.getCookie("waymarking.biggermap.view") || window.biggerMap.VIEW_MODE_SMALL;
		window.biggerMap.height = 0;
		window.biggerMap.height = window.biggerMap.getCookie("waymarking.biggermap.height") || 0;
	},

	saveMapSize: function() {
		var view = window.biggerMap.viewMode || window.biggerMap.VIEW_MODE_SMALL;
		window.biggerMap.setCookie("waymarking.biggermap.view", view, window.biggerMap.settings.saveSizePermanent);
		if (view != window.biggerMap.VIEW_MODE_SMALL) {
			window.biggerMap.setCookie("waymarking.biggermap.height", window.biggerMap.height, window.biggerMap.settings.saveSizePermanent);
		}
	},

	getCookie: function(cname) {
		var name = cname + "=";
		var ca = document.cookie.split(';');
		for (var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	},

	setCookie: function(cname, value, permanent) {
		document.cookie = cname + "=" + value + "; path=/" + (permanent ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "");
	},

	CSS: "\
		/* *** links *** */\
		h3.biggermap_links {\
			position: absolute;\
			right: 5px;\
			background: none;\
			font-weight: unset;\
		}\
		h3.biggermap_links > a {\
			color: #FFF;\
		}\
		\
		/* *** map *** */\
		#map_canvas.biggermap_view_small {\
		}\
		#map_canvas.biggermap_view_relative {\
		}\
		#map_canvas.biggermap_view_fixed {\
			margin: 0;\
		}\
		#biggerMapFixed {\
			position: fixed;\
			width: 100%;\
			margin: 0 -30px 0 -32px;\
			padding-bottom: 10px;\
			background-color: #56849b;\
			z-index: 1;\
		}\
		#biggerMapSpacer {\
			padding-bottom: 20px;\
		}\
		#biggerMapResizer {\
			width: 50%;\
			height: 6px;\
			margin: 10px auto 0px;\
			background-image: linear-gradient(transparent 50%, rgb(200, 200, 200) 50%);\
			background-size: 2px 2px;\
			cursor: ns-resize;\
		}\
		\
		/* *** map marker *** */\
		.biggermap_color .biggermap_marker_owner {\
			filter: brightness(50%) sepia(100%) hue-rotate(210deg) brightness(140%);\
		}\
		.biggermap_color .biggermap_marker_visited {\
			filter: brightness(50%) sepia(100%) hue-rotate(50deg) brightness(150%);\
		}\
		.biggermap_color .biggermap_marker_unpublished {\
			filter: brightness(70%) grayscale(100%);\
		}\
		\
		/* *** map popup *** */\
		.biggermap_popup {\
			width: 300px;\
			font-family: Verdana,sans-serif;\
			font-size: 80%;\
		}\
		.leaflet-popup-content {\
			margin: 5px !important;\
		}\
		\
		/* *** settings *** */\
		.biggermap_settings {\
			position: absolute;\
			right: 0;\
			margin-top: 5px;\
			padding: 5px;\
			border: 1px solid black;\
			box-shadow: 5px 5px 5px grey;\
			background-color: rgba(220,220,220,0.9);\
			color: black;\
			z-index: 1001;\
		}\
		.biggermap_settings select, .biggermap_settings .biggermap_settings_toggle, .biggermap_settings table {\
			margin-bottom: 3px;\
		}\
		.biggermap_settings select {\
			font-size: 10px;\
			font-family: Verdana,sans-serif;\
		}\
		.biggermap_settings .biggermap_settings_toggle a {\
			color: black;\
		}\
		.biggermap_settings td {\
			padding: 0;\
			vertical-align: top;\
		}\
        .biggermap_settings .closed {\
			display: none; \
		}\
    "
};

(function () {
	window.addEventListener("load", function() {
        window.biggerMap.hooks();
        window.biggerMap.init();
    }, false);
})();
