/* 
  Copyright 2012 Samuel Bucheli and Thomas Klöti, University Library Berne.

  This file is part of the Ryhiner Bounding Box Tool.

  The Ryhiner Bounding Box Tool is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  The Ryhiner Bounding Box Tool is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with the Ryhiner Bounding Box Tool.  If not, see <http://www.gnu.org/licenses/>.
*/

/* all main functions called by boundingBoxTool.html */

var map,                   // google.maps.Map
    drawingManager,        // google.maps.drawing.DrawingManager
    boundingBox = null,    // google.maps.Rectangle
    bounds = null,         // Bounds from Bounds.js
    centerMarker,          // google.maps.Marker
    previewPicture = null, // Image
    overlayPicture = null; // PictureOverlay from PictureOverlay.js

// TODO: disentangle this function...
function initialize() {
    "use strict";
	// these options show roughly the "whole" world
	// a small overview map at the bottom right is enabled
    var mapOptions = {
        center: new google.maps.LatLng(0, 0),
        zoom: 2,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        overviewMapControl: true
    };

	// create new map, with the options above, the map is displayed in the map_canvas div
    map = new google.maps.Map(
	    document.getElementById('map_canvas'),
        mapOptions
    );

	// the drawing manager is used to draw the rectangle
    drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.RECTANGLE,
        drawingControl: false,
        rectangleOptions: {
            editable: true
        }
    });
	// initially disable the drawing manager
	drawingManager.setMap(null);

	// prepare the displayed rectangle
    boundingBox = new google.maps.Rectangle();

	// enable editing of the rectangle
    var boundingBoxOptions = {
        map : map,
        editable : true
    };
    boundingBox.setOptions(boundingBoxOptions);

	/* prepare "our own" Bounds (as opposed to the Google Maps LatLngBounds)
	 * this object is used to store and convert information about the bounds in a more convenient form for our purpose
	 * e.g. output as Aleph formatted strings
	 */
    bounds = new Bounds();

	// the center marker will enable us to drag and drop the rectangle in order to reposition it
    centerMarker = new google.maps.Marker();
    var markerOptions = {
        map: map,
        draggable: true
    };
    centerMarker.setOptions(markerOptions);

	// add drag and drop reposition functionality to the center marker
    google.maps.event.addListener(centerMarker, 'drag', function (event) {
        var oldBounds = boundingBox.getBounds();
        var oldCenter = oldBounds.getCenter();
        var newCenter = event.latLng;
        var latDiff = oldCenter.lat() - newCenter.lat();
        var lngDiff = oldCenter.lng() - newCenter.lng();
        var newSouthWest = new google.maps.LatLng(oldBounds.getSouthWest().lat() - latDiff, oldBounds.getSouthWest().lng() - lngDiff);
        var newNorthEast = new google.maps.LatLng(oldBounds.getNorthEast().lat() - latDiff, oldBounds.getNorthEast().lng() - lngDiff);
        var newBounds = new google.maps.LatLngBounds(newSouthWest, newNorthEast);
        boundingBox.setBounds(newBounds);
    });

	// we only allow one rectangle to be drawn, as soon as the rectangle is drawn, disable the drawing manager
    google.maps.event.addListener(drawingManager, 'rectanglecomplete', function (rectangle) {
        boundingBox.setOptions({
            bounds : rectangle.getBounds()
        });
        rectangle.setMap(null);
        drawingManager.setMap(null);
    });

	// handle changes of the rectangle (e.g. due to 
    google.maps.event.addListener(boundingBox, 'bounds_changed', function () {
        var statusDiv = document.getElementById("boundingBoxStatus");
        clearNode(statusDiv);
        var boundingBoxBounds = boundingBox.getBounds();
		// check if the rectangle was changed or cleared
        if (boundingBoxBounds) {
		    // set center marker at new position
            centerMarker.setPosition(boundingBoxBounds.getCenter());
			// update position of overlay picture, if necessary
            if (overlayPicture) {
                overlayPicture.setBounds(boundingBoxBounds);
            }
			// update "our" Bounds
            bounds.setFromLatLngBounds(boundingBoxBounds);
			// update information about the center of the bounding box (this is a good activity indicator)
            statusDiv.appendChild(document.createTextNode("Center: " + boundingBox.getBounds().getCenter().lat().toFixed(6) + ", " + boundingBox.getBounds().getCenter().lng().toFixed(6)));
			// update the bounding box information as Aleph formatted string
            document.getElementById("aleph255Coordinates").value = bounds.toAleph255String();
            document.getElementById("aleph341Coordinates").value = bounds.toAleph341String();
        } else {
            statusDiv.appendChild(document.createTextNode("Bounding box cleared"));
        }
    });
}

// center the viewport on the bounding box and use maximal zoom level that still shows the whole bounding box
function setViewportToBoundingBox() {
    "use strict";
    if (boundingBox.getBounds()) {
        map.fitBounds(boundingBox.getBounds());
    } else {
        var statusDiv = document.getElementById("boundingBoxStatus");
        clearNode(statusDiv);
        statusDiv.appendChild(document.createTextNode("No bounding box defined"));
    }
}

// create a bounding box that is given by the current viewport
function setBoundingBoxToViewport() {
    "use strict";
    drawingManager.setMap(null);
    bounds.setFromLatLngBounds(map.getBounds());
    boundingBox.setOptions({
        bounds : bounds.toLatLngBounds()
    });
    setViewportToBoundingBox();
}

// clear the current bounding box
function clearBoundingBox() {
    "use strict";
    boundingBox.setOptions({
        bounds : null
    });
    centerMarker.setPosition(null);
}

// search an address and display the resulting bounding box
function searchAddress() {
    "use strict";
    var addressField = document.getElementById("search_address");
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({
	    address: addressField.value},
        function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                drawingManager.setMap(null);
                var newBounds = results[0].geometry.bounds;
                boundingBox.setOptions({bounds: newBounds});
                setViewportToBoundingBox();
            } else {
                var statusDiv = document.getElementById("boundingBoxStatus");
                clearNode(statusDiv);
                statusDiv.appendChild(document.createTextNode("Location not found: " + status));
            }
        }
    );
}
     
/* change one side of the bounds (given by "which") into the given direction
 * the amount of change is given by the values "changeDegrees", "changeMinutes", "changeSeconds"
 * which can be entered into the "Adjust Bounding Box" text inputs
 */
function changeBounds(which, direction) {
    "use strict";
    var degrees = getValueOrZero("changeDegrees");
    var minutes = getValueOrZero("changeMinutes");
    var seconds = getValueOrZero("changeSeconds");
    if (boundingBox.getBounds()) {        
        bounds.extend(which, direction, degrees, minutes, seconds);
        boundingBox.setOptions({bounds: bounds.toLatLngBounds()});
    } else {
        var statusDiv = document.getElementById("boundingBoxStatus");
        clearNode(statusDiv);
        statusDiv.appendChild(document.createTextNode("No bounding box defined"));
    }
}

// use the Aleph 255 formatted input string in order to set the bounding box
function setCoordinatesFromAleph255() {
    "use strict";
    drawingManager.setMap(null);
    var coordinates = document.getElementById("aleph255Coordinates").value;
	// a not completely thorough check whether the string is well-formatted
    var pattern = /^\$\$c(W|E)\s\d{1,3}(°|º)((\d{1,2}')(\d{1,2}")?)?-(W|E)\s\d{1,3}(°|º)((\d{1,2}')(\d{1,2}")?)?\/(N|S)\s\d{1,3}(°|º)((\d{1,2}')(\d{1,2}")?)?-(N|S)\s\d{1,3}(°|º)((\d{1,2}')(\d{1,2}")?)?$/;
    if (coordinates.match(pattern)) {
        bounds.setFromAleph255String(coordinates.replace(" ", ""));
        boundingBox.setOptions({bounds: bounds.toLatLngBounds()});
        setViewportToBoundingBox();
	} else {
	    alert("Format of Aleph 255 Coordinates not valid. Example: $$cW 25°00'00\"-E 60°17'/N 70°00'03\"-N 30°");
	}
}

// as above but with Aleph 341 formatted strings
function setCoordinatesFromAleph341() {
    "use strict";
    drawingManager.setMap(null);
    var coordinates = document.getElementById("aleph341Coordinates").value;
    var pattern = /^\$\$d(W|E)[0-1][0-9][0-9][0-5][0-9][0-5][0-9]\$\$e(W|E)[0-1][0-9][0-9][0-5][0-9][0-5][0-9]\$\$f(N|S)[0-1][0-9][0-9][0-5][0-9][0-5][0-9]\$\$g(N|S)[0-1][0-9][0-9][0-5][0-9][0-5][0-9]$/;
    if (coordinates.match(pattern)) {
        bounds.setFromAleph341String(coordinates.replace(" ", ""));
        boundingBox.setOptions({bounds: bounds.toLatLngBounds()});
        setViewportToBoundingBox();
	} else {
	    alert("Format of Aleph 341 Coordinates not valid. Example: $$dW0250000$$eE0600000$$fN0700000$$gN0300000");
	}
}

// special case of setPrecisionTo
function setPrecisionToDegrees() {
    "use strict";
    setPrecisionTo(dsmToSeconds(1, 0, 0));
}

// special case of setPrecisionTo
function setPrecisionToMinutes() {
    "use strict";
    setPrecisionTo(dsmToSeconds(0, 1, 0));
}

// rounds the current bounding box "up" (i.e. extends it), so all the coordinates are a multiple of the given precision
function setPrecisionTo(precision) {
    "use strict";
	if (boundingBox.getBounds()) {
        bounds.roundTo(precision);
	    boundingBox.setOptions({bounds: bounds.toLatLngBounds()});
	    setViewportToBoundingBox();
	} else {
	    var statusDiv = document.getElementById("boundingBoxStatus");
        clearNode(statusDiv);
        statusDiv.appendChild(document.createTextNode("No bounding box defined"));
	}
}
	  
// see above
function setPrecision() {
    "use strict";
    var degrees = getValueOrZero("changeDegrees");
    var minutes = getValueOrZero("changeMinutes");
    var seconds = getValueOrZero("changeSeconds");
	var precision = dsmToSeconds(degrees, minutes, seconds);
	if (!precision) {
	    alert("Please enter a precision bigger than zero");
	    return false;
	}
    setPrecisionTo(precision);	    
}

// enables the drawing manager	  
function drawRectangle() {
    "use strict";
    clearBoundingBox();
	drawingManager.setMap(map);
}

/* loads a picture in order to be displayed within the bounding box
 * the picture can either be given as a Ryhiner Signatur like Ryh_1402_4
 * or an arbitrary URL. While the picture is preloaded after pressing the
 * "Load Image & Rotate" button, it will only be displayed whilst the mouse
 * is over the preview picture on the bottom right side
 */
function loadPicture() {
    "use strict";
    if (boundingBox.getBounds()) {
	    // clear preview picture if necessary
        if (previewPicture) {
			clearNode(document.getElementById("picture"));
        }
        var signatur = document.getElementById("signatur").value;
		// RegEx for Ryhiner Signatur
	    var patternRyhiner = /^Ryh_\d{4}_[\da-zA-Z_]+$/;
		// RegEx for URL
	    var patternUrl = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
		// URL of the picture to be loaded
	    var imgUrl = null;
		// check for Ryhiner Signatur
	    if (signatur.match(patternRyhiner)) {
            var gruppe = signatur.split("_")[1];
	        imgUrl = "http://biblio.unibe.ch/adam/ryhiner/" + gruppe + "/" + signatur + ".jpg";
	    }
		// check for URL
	    if (signatur.match(patternUrl)) {
            imgUrl = signatur;
	    }
		// show preview picture and create PictureOverlay to displayed within bounding box
	    if (imgUrl) {
            previewPicture = document.createElement('img');
            previewPicture.src = imgUrl;
            previewPicture.style.width='20%';
			previewPicture.style.height='auto';
            document.getElementById("picture").appendChild(previewPicture);
	        overlayPicture = new PictureOverlay(boundingBox.getBounds(), previewPicture.src, map);
	    } else {
	        alert("Can not load Image, please enter either a Ryhiner Signatur, e.g., Ryh_1402_4, or a valid URL");
	    }
    } else {
	    var statusDiv = document.getElementById("boundingBoxStatus");
        clearNode(statusDiv);
        statusDiv.appendChild(document.createTextNode("No bounding box defined"));
	}
}

// for onMouseOver preview picture
function showOverlay() {
    "use strict";
    if (previewPicture && boundingBox.getBounds()) {
		/* call draw() again in case the rotation was changed */
		overlayPicture.draw();
        overlayPicture.show();
    }
}

// for onMouseOut preview picture
function hideOverlay() {
    "use strict";
    if (overlayPicture) {
        overlayPicture.hide();
    }
}