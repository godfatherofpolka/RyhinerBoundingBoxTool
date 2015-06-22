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

/* Some useful helper methods */

/* Adds zero padding to numbers */
Number.prototype.pad = function (size) {
    "use strict";
    if (typeof (size) !== "number") {
        size = 2;
    }
    var s = String(this);
    while (s.length < size) {
        s = "0" + s;
    }
    return s;
};

/* Clears a document node, like e.g. the status div */
function clearNode(node) {
    "use strict";
    while (node.hasChildNodes()) {
        node.removeChild(node.lastChild);
    }
}

/* Reads a value from the input with id elementId. If the input does not contain a number, the input is set to zero and the value zero is returned. */
function getValueOrZero(elementId) {
    "use strict";
    var element = document.getElementById(elementId),
        value = parseInt(element.value, 10);
    if (isNaN(value)) {
        alert("Value \"" + elementId + "\" is not a number, will be reset to zero");
        value = 0;
        element.value = 0;
    }
    return value;
}

function dsmToSeconds(degrees, minutes, seconds) {
   return (3600 * degrees + 60 * minutes + seconds);
}