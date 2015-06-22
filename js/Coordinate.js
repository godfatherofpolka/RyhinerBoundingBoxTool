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

/* a class representing a latitude or a longitude (bearing the ill-chosen name Coordinate) 
 * a Coordinate is represented by a string called prefix, which is either "N", "S", "E" or "W" and indicates the hemisphere, 
 * and an integer value, namely the latitude or longitude, given in seconds.
 */

function Coordinate(prefix, secondsTotal) {
    "use strict";
    this.prefix = prefix || "";
	this.secondsTotal = secondsTotal || 0;
}

Coordinate.prototype.setSecondsTotal = function (degrees, minutes, seconds) {
    "use strict";
	this.secondsTotal = dsmToSeconds(degrees, minutes, seconds);
};

Coordinate.prototype.getDegreesSecondsMinutes = function () {
    "use strict";
    var seconds = this.secondsTotal % 60,
        minutes = ((this.secondsTotal - seconds) / 60) % 60,
        degrees = (this.secondsTotal - (seconds + 60 * minutes)) / 3600,
        dsm = {};
    dsm.seconds = seconds;
    dsm.minutes = minutes;
    dsm.degrees = degrees;
    return dsm;
};

Coordinate.prototype.getSeconds = function () {
    "use strict";
    return this.getDegreesSecondsMinutes().seconds;
};

Coordinate.prototype.getMinutes = function () {
    "use strict";
    return this.getDegreesSecondsMinutes().minutes;
};

Coordinate.prototype.getDegrees = function () {
    "use strict";
    return this.getDegreesSecondsMinutes().degrees;
};

Coordinate.prototype.getSign = function () {
    "use strict";
    return (this.prefix === "N" || this.prefix === "E") ? 1 : -1;
};

// requires inputs of the form ("W", 14.358) or ("E", 12.586) and so on, i.e. decimal is not negative
Coordinate.prototype.setFromAbsoluteDecimal = function (prefix, decimal) {
    "use strict";
    this.prefix = prefix;
    var degrees = Math.floor(decimal),
        rest = (decimal - degrees) * 60,
        minutes = Math.floor(rest),
        seconds = Math.floor((rest - minutes) * 60);
    this.setSecondsTotal(degrees, minutes, seconds);
};

Coordinate.prototype.toDecimal = function () {
    "use strict";
    return (this.getSign() * (this.getDegrees() + (this.getMinutes() / 60) + (this.getSeconds() / 3600))).toFixed(6);
};

Coordinate.prototype.setFromAleph255String = function (prefix, aleph255String) {
    "use strict";
    this.prefix = prefix;
	// set base explictly, else parseInt considers leading zeros to indicate octal base
    var parts = aleph255String.replace(" ", "").split(/[^\d]+/),
        degrees = parseInt(parts[0], 10),
        minutes = (parts.length > 2 && !isNaN(parts[1])) ? parseInt(parts[1], 10) : 0,
        seconds = (parts.length > 3 && !isNaN(parts[2])) ? parseInt(parts[2], 10) : 0;
    this.setSecondsTotal(degrees, minutes, seconds);
};

Coordinate.prototype.setFromAleph341String = function (aleph341String) {
    "use strict";
    this.prefix = aleph341String.substring(1, 2);
    // set base explictly, else parseInt considers leading zeros to indicate octal base
    var degrees = parseInt(aleph341String.substring(2, 5), 10),
        minutes = parseInt(aleph341String.substring(5, 7), 10),
        seconds = parseInt(aleph341String.substring(7, 9), 10);
    this.setSecondsTotal(degrees, minutes, seconds);
};

Coordinate.prototype.toAleph255String = function () {
    "use strict";
    var alephString = this.prefix + " ";
    alephString += this.getDegrees() + "°";
    alephString += (this.getMinutes() !== 0 || this.getSeconds() !== 0) ? this.getMinutes().pad(2) + "\'" : "";
    alephString += (this.getSeconds() !== 0) ? this.getSeconds().pad(2) + "\"" : "";
    return alephString;
};

Coordinate.prototype.toAleph341String = function () {
    "use strict";
    var alephString = this.prefix;
    alephString += this.getDegrees().pad(3);
    alephString += this.getMinutes().pad(2);
    alephString += this.getSeconds().pad(2);
    return alephString;
};

Coordinate.prototype.isDifferentFrom = function (decimal) {
    "use strict";
    return (this.toDecimal() !== decimal.toFixed(6));
};

Coordinate.prototype.invertPrefix = function () {
    "use strict";
    switch (this.prefix) {
    case 'W':
		this.prefix = 'E';
		break;
    case 'E':
	    this.prefix = 'W';
		break;
    case 'N':
	    this.prefix = 'S';
		break;
    case 'S':
	    this.prefix = 'N';
		break;
    }
};

/*Coordinate.prototype.isLongitude = function () {
    return (this.prefix == 'W' || this.prefix == 'E');
}

Coordinate.prototype.isLatitude = function () {
    return (this.prefix == 'N' || this.prefix == 'S');
}*/

// TODO: Handle overflows properly
Coordinate.prototype.add = function (degrees, minutes, seconds) {
    "use strict";
	this.addSecondsTotal(dsmToSeconds(degrees, minutes, seconds));
};

Coordinate.prototype.addSecondsTotal = function (seconds) {
   "use strict";
   this.secondsTotal += seconds;
}


// TODO: Handle overflows properly
Coordinate.prototype.sub = function (degrees, minutes, seconds) {
    "use strict";
	this.subSecondsTotal(dsmToSeconds(degrees, minutes, seconds));
};

Coordinate.prototype.subSecondsTotal = function(seconds) {
    this.secondsTotal -= seconds;
	if (this.secondsTotal <= 0) {
        this.secondsTotal = Math.abs(this.secondsTotal);
        this.invertPrefix();
    }
}

Coordinate.prototype.roundUpTo = function (precision) {
    "use strict";
    if ((this.secondsTotal % precision) !== 0) {
        this.roundDownTo(precision);
		this.secondsTotal += precision;
	}
};

Coordinate.prototype.roundDownTo = function (precision) {
    "use strict";
    this.secondsTotal = Math.floor(this.secondsTotal / precision) * precision;
};

Coordinate.prototype.clone = function () {
  var coordinate = new Coordinate(this.prefix, this.secondsTotal);
  return coordinate;
}