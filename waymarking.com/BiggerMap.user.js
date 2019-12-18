// ==UserScript==
// @name        BiggerMap
// @namespace   waymarking.com
// @description Displays a larger map in search results and waymark details
// @include     http*://*.waymarking.com/*
// @version     1.3
// @grant       none
// ==/UserScript==

window.biggerMap = {
	version: "1.3",
	
	VIEW_MODE_SMALL: 0,
	VIEW_MODE_RELATIVE: 1,
	VIEW_MODE_FIXED: 2,
	
	COLOR_MODE_NONE: 0,
	COLOR_MODE_LARGE: 1,
	COLOR_MODE_ALL: 2,
	
	waymarks: [],
	settings: {},
	
	init: function() {
		window.biggerMap.addCss();
		window.biggerMap.addLinks();
		
		window.biggerMap.login = jQuery("#ctl00_HeaderControl1_lnkLoginName").html();
		
		window.biggerMap.mapItems();
		window.setTimeout(function () {
			map.fitBounds(bounds, {maxZoom: 15});
		}, 1000);

		window.biggerMap.loadSettings();
		window.biggerMap.loadMapSize();
		window.biggerMap.changeMapMode();
	},
	
	addCss: function() {
		var head = jQuery("head");
		head.append("<link rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css' />");
		head.append("<style>" + window.biggerMap.CSS + "</style>");
	},
	
	addLinks: function() {
		var header = jQuery("#ctl00_ContentRightColumn_CategoryFilterControl1_uxGoogleMap .box");
		header.css("position", "relative");
		var links = jQuery("<h3 class='biggermap_links' />");
		
		var enlarge = jQuery("<a href='#'>Enlarge</a>");
		links.append(enlarge);
		links.append("&nbsp;&nbsp;")

		var settings = jQuery("<a href='#'>Settings</a>");
		links.append(settings);
		links.append("&nbsp;");
		var settingsToggle = jQuery("<i class='fa fa-caret-down'/>");
		links.append(settingsToggle);
		
		enlarge.click(function() {
			window.biggerMap.viewMode = window.biggerMap.VIEW_MODE_RELATIVE;
			window.biggerMap.changeMapMode();
			return false;
		});

		settings.click(function() {
			window.biggerMap.openSettings(settings, settingsToggle);
			return false;
		});

		header.prepend(links);
	},
	
	changeMapMode: function() {
		if (!map) {
			return;
		}
		
		window.biggerMap.viewMode = window.biggerMap.viewMode || window.biggerMap.VIEW_MODE_SMALL;
		var mapContainer = jQuery("#map_canvas");
		
		mapContainer.removeClass("biggermap_view_small");
		mapContainer.removeClass("biggermap_view_relative");
		mapContainer.removeClass("biggermap_view_fixed");
		
		if (window.biggerMap.viewMode == window.biggerMap.VIEW_MODE_SMALL) {
			mapContainer.addClass("biggermap_view_small");
			window.biggerMap.showAdditionalMapButtons(false);
			window.biggerMap.showResizer(false);
			window.biggerMap.showColors(window.biggerMap.settings.colorMode == window.biggerMap.COLOR_MODE_ALL);
			mapContainer.css("height", "");
			mapContainer.insertBefore("#mapinfo");
			window.biggerMap.showFixed(false);
			window.biggerMap.enablePopup(false);
			window.biggerMap.showSmallMapContainer(true);
			
		} else if (window.biggerMap.viewMode == window.biggerMap.VIEW_MODE_RELATIVE || window.biggerMap.viewMode == window.biggerMap.VIEW_MODE_FIXED) {
			window.biggerMap.showSmallMapContainer(false);
			window.biggerMap.showAdditionalMapButtons(true);
			window.biggerMap.enablePopup(true);
			window.biggerMap.showColors(window.biggerMap.settings.colorMode != window.biggerMap.COLOR_MODE_NONE);
			
			if (window.biggerMap.viewMode == window.biggerMap.VIEW_MODE_RELATIVE) {
				mapContainer.addClass("biggermap_view_relative");
				mapContainer.appendTo("#header");
				window.biggerMap.showFixed(false);
				window.biggerMap.showResizer(true);
			} else {
				mapContainer.addClass("biggermap_view_fixed");
				jQuery("#biggerMapBtnFixed").css("background-color", "#DDDDDD");
				var fixed = window.biggerMap.showFixed(true);
				mapContainer.appendTo(fixed);
				window.biggerMap.showResizer(true);
				jQuery("#biggerMapResizer").appendTo(fixed);
			}
			
			if (window.biggerMap.height > 0) {
				mapContainer.css("height", "" + window.biggerMap.height + "px");
			}
		}
		
		window.biggerMap.onResize();
	},
	
	searchFromHere: function() {
		if (map && searchUrl) {
			var latLng = map.getCenter();
			var newSearchUrl = new URI(searchUrl);
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
			jQuery("#ctl00_ContentRightColumn_CategoryFilterControl1_uxGoogleMap").show();
		} else {
			jQuery("#ctl00_ContentRightColumn_CategoryFilterControl1_uxGoogleMap").hide();
		}
	},
	
	showAdditionalMapButtons: function(show) {
		var mapContainer = jQuery("#map_canvas");
		jQuery(".leaflet-top.leaflet-right", mapContainer).children().remove();
		jQuery(".leaflet-bottom.leaflet-left", mapContainer).children().remove();
		if (show) {
			var topRight = jQuery(".leaflet-top.leaflet-right", mapContainer);
			var bottomLeft = jQuery(".leaflet-bottom.leaflet-left", mapContainer);
			jQuery("<div class='leaflet-control-zoom leaflet-bar leaflet-control' />").appendTo(topRight);
			jQuery("<div class='leaflet-control-zoom leaflet-bar leaflet-control' />").appendTo(bottomLeft);
			jQuery("<a title='Close map' href='#' id='biggerMapClose'><i class='fa fa-close fa-lg' style='line-height: 26px; color: #444444;' /></a><a title='Pin map to window' href='#' id='biggerMapBtnFixed'><i class='fa fa-map-pin fa-lg' style='line-height: 26px; color: #444444;' /></a>").appendTo(topRight.children().first());
			jQuery("<a href='#' id='biggerMapSearchFromHere' style='width: auto; padding: 0 5px;'><i class='fa fa-search fa-lg' style='color: #444444; margin-right: 4px;' />Search from Here</a>").appendTo(bottomLeft.children().first());
			jQuery("#biggerMapClose").click(function() {
				window.biggerMap.viewMode = window.biggerMap.VIEW_MODE_SMALL;
				window.biggerMap.changeMapMode();
				return false;
			});
			jQuery("#biggerMapBtnFixed").click(function() {
				window.biggerMap.viewMode = window.biggerMap.viewMode == window.biggerMap.VIEW_MODE_FIXED ? window.biggerMap.VIEW_MODE_RELATIVE : window.biggerMap.VIEW_MODE_FIXED;
				window.biggerMap.changeMapMode();
				return false;
			});
			jQuery("#biggerMapSearchFromHere").click(window.biggerMap.searchFromHere);
		}
	},
	
	showFixed: function(show) {
		jQuery("#biggerMapFixed").remove();
		jQuery("#biggerMapSpacer").remove();
		if (show) {
			var height = window.biggerMap.height > 0 ? window.biggerMap.height : 235;
			var spacer = jQuery("<div id='biggerMapSpacer' style='height: " + height + "px;' />");
			jQuery("body").prepend(spacer);
			var fixed = jQuery("<div id='biggerMapFixed' />");
			jQuery("body").prepend(fixed);
			return fixed;
		}
	},

	showResizer: function(show) {
		jQuery("#biggerMapResizer").remove();
		if (show) {
			var resizer = jQuery("<div id='biggerMapResizer' />");
			resizer.mousedown(window.biggerMap.resizeStart);
			jQuery("body").mousemove(window.biggerMap.resizeMove);
			resizer.mouseup(window.biggerMap.resizeEnd);
			resizer.appendTo("#header");
		}
	},
	
	showColors: function(show) {
		var mapContainer = jQuery("#map_canvas");
		if (show) {
			mapContainer.addClass("biggermap_color");
		} else {
			mapContainer.removeClass("biggermap_color");
		}
	},

	createMarker: function(item) {
		var waymark = window.biggerMap.insertWaymark(item);
		var marker = L.marker([waymark.lat, waymark.lng], {
			title: waymark.title,
			icon: L.icon({
				iconUrl: 'http://www.waymarking.com/dyn_img/bubble.aspx?path=' + waymark.icon,
				iconSize: [37, 33],
				iconAnchor: [37, 33],
				popupAnchor: [-19, -33],
				className: waymark.unpublished ? "biggermap_marker_unpublished" : waymark.owner ? "biggermap_marker_owner" : waymark.visited ? "biggermap_marker_visited" : ""
			})
		}).addTo(map);
		marker.on("click", function () {
			window.biggerMap.onMarkerClick(waymark);
		});
		waymark.marker = marker;
		bounds.extend(L.latLng([waymark.lat, waymark.lng]));
	},
	
	onMarkerClick: function(waymark) {
		window.showInfoPanel(waymark.icon, waymark.title, waymark.code, waymark.cat, waymark.desc);
	},
	
	insertWaymark: function(item) {
		var tr = jQuery("input[name='wmchk" + item.code + "'").closest("tr");
		if (tr.length > 0) {
			item.owner = window.biggerMap.login && jQuery(".wmd_submitter a", tr).html() == window.biggerMap.login;
			item.visited = jQuery(".wmd_visited", tr).length > 0;
			item.unpublished = jQuery(".wmd_namebold", tr).length == 0;
		}
		window.biggerMap.waymarks.push(item);
		return item;
	},

	enablePopup: function(enable) {
		if (!map) {
			return;
		}
		if (!enable) {
			map.closePopup();
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
			initialMapHeight: jQuery("#map_canvas").height(),
			initialY: e.pageY
		};
		return false;
	},

	resizeMove: function(e) {
		if (!window.biggerMap.resizing) {
			return true;
		}
		var newHeight = window.biggerMap.resizing.initialMapHeight - window.biggerMap.resizing.initialY + e.pageY;
		jQuery("#map_canvas").css("height", newHeight + "px");
		if (window.biggerMap.viewMode == window.biggerMap.VIEW_MODE_FIXED) {
			jQuery("#biggerMapSpacer").css("height", newHeight + "px");
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
		if (!map) {
			return;
		}
		map.invalidateSize();
		window.biggerMap.saveMapSize();
	},
	
	openSettings: function(link, toggle) {
		toggle.toggleClass("fa-caret-up");
		toggle.toggleClass("fa-caret-down");
			
		if (window.biggerMap.settingsOpen) {
			jQuery("#biggerMapSettings").remove();
			window.biggerMap.settingsOpen = false;
			return;
		}
		window.biggerMap.settingsOpen = true;
			
		var div = jQuery("<div id='biggerMapSettings' />");
		
		div.append(jQuery("<label>Save map size:</label>"));
		var size = jQuery("<select />");
		size.append("<option value='false'>only for current session</option>");
		size.append("<option value='true'>permanent</option>");
		size.val(window.biggerMap.settings.saveSizePermanent ? "true" : "false");
		div.append(size);

		div.append(jQuery("<label>Show colored markers:</label>"));
		var color = jQuery("<select />");
		color.append("<option value='" + window.biggerMap.COLOR_MODE_NONE + "'>never</option>");
		color.append("<option value='" + window.biggerMap.COLOR_MODE_LARGE + "'>only on large map</option>");
		color.append("<option value='" + window.biggerMap.COLOR_MODE_ALL + "'>on small and large map</option>");
		color.val(window.biggerMap.settings.colorMode);
		div.append(color);
		
		var legendToggle = jQuery("<div class='biggermap_settings_toggle'><a href='#'>Color legend</a>&nbsp;<i class='fa fa-caret-down'/></div>");
		div.append(legendToggle);
		var legend = jQuery("<table style='display: none;'><tr><td><i style='color: purple;'>purple:</i></td><td>created by you</td></tr><tr><td><i style='color: green;'>green:</i></td><td>visited by you</td></tr><tr><td><i style='color: grey;'>grey:</i></td><td>unpublished (pending review / declined)</td></tr></table>");
		div.append(legend);
		
		var infoToggle = jQuery("<div class='biggermap_settings_toggle'><a href='#'>Info</a>&nbsp;<i class='fa fa-caret-down'/></div>");
		div.append(infoToggle);
		var info = jQuery("<div style='display: none;'><i>BiggerMap User Script (aka. Greasemonkey script)</i><br/>Version: " + window.biggerMap.version + "<br/>Created by <a href='http://www.waymarking.com/users/profile.aspx?f=1&guid=9394e8bb-cb86-4d60-8867-1c74955fe4e2' target='_blank'>Narayan,</a>&nbsp;<a href='http://www.waymarking.com/users/email.aspx?f=1&guid=9394e8bb-cb86-4d60-8867-1c74955fe4e2' target='_blank'><i class='fa fa-envelope'/></a></div>");
		div.append(info);
		
		link.parent().append(div);
		
		size.change(function() {
			window.biggerMap.settings.saveSizePermanent = (size.val() == "true");
			window.biggerMap.saveSettings();
			window.biggerMap.saveMapSize();
		});
		
		color.change(function() {
			window.biggerMap.settings.colorMode = color.val();
			window.biggerMap.saveSettings();
			window.biggerMap.changeMapMode();
		});
		
		legendToggle.click(function() {
			jQuery(".fa", legendToggle).toggleClass("fa-caret-up");
			jQuery(".fa", legendToggle).toggleClass("fa-caret-down");
			legend.toggle();
			return false;
		});

		infoToggle.click(function() {
			jQuery(".fa", infoToggle).toggleClass("fa-caret-up");
			jQuery(".fa", infoToggle).toggleClass("fa-caret-down");
			info.toggle();
			return false;
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
		#biggerMapSettings {\
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
		#biggerMapSettings select, #biggerMapSettings .biggermap_settings_toggle, #biggerMapSettings table {\
			margin-bottom: 3px;\
		}\
		#biggerMapSettings select {\
			font-size: 10px;\
			font-family: Verdana,sans-serif;\
		}\
		#biggerMapSettings .biggermap_settings_toggle a {\
			color: black;\
		}\
		#biggerMapSettings td {\
			padding: 0;\
			vertical-align: top;\
		}\
	"
};

var func = function() {
	window.biggerMap.mapItems = window.mapItems;
	window.mapItems = function() {};
	window.createMarker = window.biggerMap.createMarker;
	jQuery(document).ready(function() {
        window.setTimeout(function() {
            window.biggerMap.init();
        }, 1000);
	});
};

var script = document.createElement('script');
script.type = "text/javascript";
script.textContent = '(' + func.toString() + ')();';
document.body.appendChild(script);
