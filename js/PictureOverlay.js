/* 
  Copyright 2012 Samuel Bucheli, Thomas Klöti

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

/* Loads a custom picture given by the src URL and displays it within bounds on map
 * See also https://developers.google.com/maps/documentation/javascript/overlays#CustomOverlays */

function PictureOverlay(bounds, src, map) {
    "use strict";
    this.bounds_ = bounds;
    this.src_ = src;
    this.map_ = map;
    this.div_ = null;
    this.canvas_ = null;
    this.setMap(map);
}

PictureOverlay.prototype = new google.maps.OverlayView();

PictureOverlay.prototype.onAdd = function () {
    "use strict";
    var div = document.createElement('div'),
	    canvas = document.createElement("canvas"),
	    panes = this.getPanes();
    div.style.border = "none";
    div.style.borderWidth = "0px";
    div.style.position = "absolute";
    div.style.opacity = "0.5";
	div.style.visibility = "hidden";
    div.appendChild(canvas);
    this.canvas_ = canvas;
    this.div_ = div;
    panes.overlayLayer.appendChild(div);
};

PictureOverlay.prototype.setBounds  = function (bounds) {
    "use strict";
    this.bounds_ = bounds;
};

PictureOverlay.prototype.draw = function () {
    "use strict";
    var overlayProjection = this.getProjection(),
        southWest = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest()),
        northEast = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast()),
        width = (northEast.x - southWest.x),
        height = (southWest.y - northEast.y),
        div = this.div_,
		canvas = this.canvas_,
		context = canvas.getContext('2d'),
        img = new Image();
    div.style.left = southWest.x + 'px';
    div.style.top = northEast.y + 'px';
    div.style.width = width + 'px';
    div.style.height = height + 'px';
    canvas.width = width;
    canvas.height = height;
    img.src = this.src_;
    img.onload = function () {
	    /* Calculate scaling necessary for rotated picture to fit into the bounding box */
        var angle = getValueOrZero("angle") * Math.PI / 180,
            scaleX = Math.abs(width / (Math.sin(Math.abs(angle)) * height + Math.cos(Math.abs(angle)) * width)),
            scaleY = Math.abs(height / (Math.cos(Math.abs(angle)) * height + Math.sin(Math.abs(angle)) * width));
        context.translate(width / 2, height / 2);
        context.scale(scaleX, scaleY);
        context.rotate(angle);
        context.translate(-width / 2, -height / 2);
        context.drawImage(img, 0, 0, width, height);
    };
};

PictureOverlay.prototype.onRemove = function () {
    "use strict";
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
};

PictureOverlay.prototype.hide = function () {
    "use strict";
    if (this.div_) {
        this.div_.style.visibility = "hidden";
    }
};

PictureOverlay.prototype.show = function () {
    "use strict";
    if (this.div_) {
        this.div_.style.visibility = "visible";
    }
};