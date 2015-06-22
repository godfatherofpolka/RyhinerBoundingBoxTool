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

/* a class representing the bounds of a rectangle more suitable to our needs, this includes methods necessary to convert them into
 * Aleph formatted strings and Google Maps LatLngBounds 
 */

function Bounds(westLongitude, eastLongitude, northLatitude, southLatitude) {
    "use strict";
	this.westLongitude = westLongitude || new Coordinate();
    this.eastLongitude = eastLongitude || new Coordinate();
    this.northLatitude = northLatitude || new Coordinate();
    this.southLatitude = southLatitude || new Coordinate();
}

Bounds.prototype.setFromLatLngBounds = function (bounds) {
    "use strict";
    function getLatitudePrefix(latitude) {
        return (latitude < 0 ? "S" : "N");
    }
	function getLongitudePrefix(longitude) {
        return (longitude < 0 ? "W" : "E");
    }
    var westLongitude = bounds.getSouthWest().lng(),
        eastLongitude = bounds.getNorthEast().lng(),
        northLatitude = bounds.getNorthEast().lat(),
        southLatitude = bounds.getSouthWest().lat(),
        westLongitudePrefix = getLongitudePrefix(westLongitude),
        eastLongitudePrefix = getLongitudePrefix(eastLongitude),
        northLatitudePrefix = getLatitudePrefix(northLatitude),
        southLatitudePrefix = getLatitudePrefix(southLatitude);
    // prevent rounding problems
    if (this.westLongitude.isDifferentFrom(westLongitude)) {
        this.westLongitude.setFromAbsoluteDecimal(westLongitudePrefix, Math.abs(westLongitude));
    }
    if (this.eastLongitude.isDifferentFrom(eastLongitude)) {
        this.eastLongitude.setFromAbsoluteDecimal(eastLongitudePrefix, Math.abs(eastLongitude));
    }
    if (this.northLatitude.isDifferentFrom(northLatitude)) {
        this.northLatitude.setFromAbsoluteDecimal(northLatitudePrefix, Math.abs(northLatitude));
    }
    if (this.southLatitude.isDifferentFrom(southLatitude)) {
        this.southLatitude.setFromAbsoluteDecimal(southLatitudePrefix, Math.abs(southLatitude));
    }
};

Bounds.prototype.toLatLngBounds = function () {
    "use strict";
    var northEast = new google.maps.LatLng(this.northLatitude.toDecimal(), this.eastLongitude.toDecimal()),
        southWest = new google.maps.LatLng(this.southLatitude.toDecimal(), this.westLongitude.toDecimal());
    return (new google.maps.LatLngBounds(southWest, northEast));
};

Bounds.prototype.toAleph255String = function () {
    "use strict";
    var aleph255String = "$$c";
    aleph255String    += this.westLongitude.toAleph255String() + "-";
    aleph255String    += this.eastLongitude.toAleph255String() + "/";
    aleph255String    += this.northLatitude.toAleph255String() + "-";
    aleph255String    += this.southLatitude.toAleph255String();
    return aleph255String;
};

Bounds.prototype.toAleph341String = function () {
    "use strict";
    var aleph341String = "";
    aleph341String += "$$d" + this.westLongitude.toAleph341String();
    aleph341String += "$$e" + this.eastLongitude.toAleph341String();
    aleph341String += "$$f" + this.northLatitude.toAleph341String();
    aleph341String += "$$g" + this.southLatitude.toAleph341String();
    return aleph341String;
};

Bounds.prototype.setFromAleph255String = function (aleph255String) {
    "use strict";
    var parts = aleph255String.split(/[WENS]+/),
        prefixes = aleph255String.split(/[^WENS]+/);
    this.westLongitude.setFromAleph255String(prefixes[1], parts[1]);
    this.eastLongitude.setFromAleph255String(prefixes[2], parts[2]);
    this.northLatitude.setFromAleph255String(prefixes[3], parts[3]);
    this.southLatitude.setFromAleph255String(prefixes[4], parts[4]);
};

Bounds.prototype.setFromAleph341String = function (aleph341String) {
    "use strict";
    var parts = aleph341String.split("$$");
    this.westLongitude.setFromAleph341String(parts[1]);
    this.eastLongitude.setFromAleph341String(parts[2]);
    this.northLatitude.setFromAleph341String(parts[3]);
    this.southLatitude.setFromAleph341String(parts[4]);
};

Bounds.prototype.getCoordinate = function (which) {
    "use strict";
    var coordinate;
    switch (which) {
    case 'W':
	    coordinate = this.westLongitude;
	    break;
    case 'E':
	    coordinate = this.eastLongitude;
	    break;
    case 'N':
	    coordinate = this.northLatitude;
	    break;
    case 'S':
	    coordinate = this.southLatitude;
	    break;
    }
    return coordinate;
};

Bounds.prototype.extend = function (which, direction, degrees, minutes, seconds) {
    "use strict";
	this.extendSecondsTotal(which, direction, dsmToSeconds(degrees, minutes, seconds));
};

Bounds.prototype.extendSecondsTotal = function (which, direction, seconds) {
    "use strict";
    var coordinate = this.getCoordinate(which);
    if (coordinate.prefix === direction) {
        coordinate.addSecondsTotal(seconds);
    } else {
        coordinate.subSecondsTotal(seconds);
    }
}

Bounds.prototype.roundTo = function (precision) {
    "use strict";
    var directions = ['W', 'E', 'N', 'S'],
	    index,
        direction,
        coordinate;
    for (index = 0; index < directions.length; index += 1) {
        direction = directions[index];
        coordinate = this.getCoordinate(direction);
        if (coordinate.prefix === direction) {
            coordinate.roundUpTo(precision);
        } else {
            coordinate.roundDownTo(precision);
        }
    }
};

Bounds.prototype.clone = function () {
  var bounds = new Bounds(this.getCoordinate('W').clone(), this.getCoordinate('E').clone(), this.getCoordinate('N').clone(), this.getCoordinate('S').clone());
  return bounds;
}

Bounds.prototype.split = function (rows, columns) {
    var width = (this.getCoordinate('E').secondsTotal - this.getCoordinate('W').getSign() * this.getCoordinate('W').secondsTotal) / columns;
	var height = (this.getCoordinate('N').secondsTotal - this.getCoordinate('S').getSign() * this.getCoordinate('S').secondsTotal) / rows;
	
	var splitBounds = new Bounds();
	
	splitBounds.northLatitude = this.getCoordinate('N').clone();
	splitBounds.southLatitude = this.getCoordinate('N').clone();
	splitBounds.extendSecondsTotal('S', 'S', height);
	
	var newBounds = [];
	
	var i, j;
	
	for (i = 0; i < rows; i++) {
	    splitBounds.westLongitude = this.getCoordinate('W').clone();
		splitBounds.eastLongitude = this.getCoordinate('W').clone();
		splitBounds.extendSecondsTotal('E', 'E', width);
	    for (j = 0; j < columns; j++) {
		  newBounds.push(splitBounds.clone());
		  splitBounds.extendSecondsTotal('E', 'E', width);
		  splitBounds.extendSecondsTotal('W', 'E', width);
		}
		splitBounds.extendSecondsTotal('S', 'S', height);
		splitBounds.extendSecondsTotal('N', 'S', height);
	}
	
	return newBounds;
}