////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {
    'use strict';

    // The Point class represents a point in 2-Dimensional space using Cartesian Coordinates.
    var Point = WinJS.Class.define(

        // Constructor
        function (x, y) {
            // The position of the point in 2d space, cartesian coords
            this.x = x || 0;
            this.y = y || 0;
        },

        // Variables and Functions
        {
            // Returns the distance between this and another point
            distanceTo: function (point) {
                var dx = point.x - this.x;
                var dy = point.y - this.y;
                return Math.sqrt(dx * dx + dy * dy);
            },

            // Creates a Vector pointing from this point to point p
            createVectorTo: function (point) {
                return new AppNS.Painter.Math.Vector(point.x - this.x, point.y - this.y);
            },

            // Sets this point to the result of adding the Vector v to this point
            add: function (vector) {
                this.x = this.x + vector.x;
                this.y = this.y + vector.y;
            },

            // Sets this point to this point translated by the scaled vector
            scaleAdd: function (vector, constant) {
                this.x = this.x + (vector.x * constant);
                this.y = this.y + (vector.y * constant);
            },

            // Sets this point to the result of subtracting the Vector v from this point
            sub: function (vector) {
                this.x = this.x - vector.x;
                this.y = this.y - vector.y;
            },

            // Returns true if this point is the same as p
            equals: function (point) {
                return this.x === point.x && this.y === point.y;
            },

            // Sets this point to the given x and y coords
            fromXY: function (x, y) {
                this.x = x;
                this.y = y;
            },

            // Sets this point to the given point
            fromPoint: function (point) {
                this.x = point.x;
                this.y = point.y;
            },

            // Returns a copy of this point
            copy: function () {
                return new AppNS.Painter.Math.Point(this.x, this.y);
            }
    });

    WinJS.Namespace.defineWithParent(AppNS, "Painter.Math", {
        Point: Point
    });

})(Microsoft.Paint);
