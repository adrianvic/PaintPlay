////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {
    'use strict';

    // The Vector class represents a position-less vector in 2-Dimensional space.
    // A Vector has direction and length, both represented in the form of change in x and change in y.
    var Vector = WinJS.Class.define(

        // Constructor
        function (x, y) {
            this.x = x || 0; // The x-component of this vector
            this.y = y || 0; // The y-component of this vector
        },

        // Variables and Functions
        {
            // The length of this vector, as calculated by it's x and y components
            length: {
                get: function () {
                    return Math.sqrt(this.x * this.x + this.y * this.y);
                },
                set: function (length) {
                    this.normalize();
                    this.scale(length);
                }
            },

            // Return the dot product of this vector and v
            dot: function (vector) {
                return this.x * vector.x + this.y * vector.y;
            },

            // Sets this vector to the given x and y
            fromXY: function (x, y) {
                this.x = x;
                this.y = y;
            },

            // Set this vector to the given vector
            fromVector: function (vector) {
                this.x = vector.x;
                this.y = vector.y;
            },

            // Create a vector from point1 pointing towards point2
            fromPoints: function (point1, point2) {
                this.x = point2.x - point1.x;
                this.y = point2.y - point1.y;
            },

            // Rotates this vector by 90 degrees counter-clockwise, making it perpendicular to what it was
            toPerp: function () {
                var temp = this.x;
                this.x = -1 * this.y
                this.y = temp;
            },

            // Rotates this vector counter-clockwise by angle in radians
            rotate: function (angle) {
                var cos = Math.cos(angle);
                var sin = Math.sin(angle);
                var x = this.x;
                var y = this.y;
                this.x = x * cos - y * sin;
                this.y = x * sin + y * cos;
            },

            // Scales this vector by a constant
            scale: function (constant) {
                this.x = this.x * constant;
                this.y = this.y * constant;
            },

            // Returns the angle in radians between this vector and v
            angle: function (vector) {
                var l1 = this.length;
                var l2 = vector.length;
                if (l1 !== 0 && l2 !== 0) {
                    var val = this.dot(vector) / (l1 * l2);
                    val = val > 1.0 ? 1.0 : val;
                    val = val < -1.0 ? -1.0 : val;
                    return Math.acos(val);
                }
            },

            // Returns the slope (dy/dx) of this vector
            getSlope: function () {
                return this.y / this.x;
            },

            // Normalizes (sets to length 1) this vector
            normalize: function () {
                var length = this.length;
                if (length !== 0) {
                    this.scale(1 / length);
                }
            },

            // Sets this vector to the result of subtracting the given vector from this
            sub: function (vector) {
                this.x = this.x - vector.x;
                this.y = this.y - vector.y;
            },

            // Sets this vector to the result of adding the given vector to this
            add: function (vector) {
                this.x = this.x + vector.x;
                this.y = this.y + vector.y;
            },

            // Returns true if this vector is equal to another
            equals: function (vector) {
                return this.x === vector.x && this.y === vector.y;
            },

            // Returns a copy of this vector
            copy: function () {
                return new AppNS.Painter.Math.Vector(this.x, this.y);
            },

            // Projects this vector onto the given direction.
            // Note: the length of the direction vector is irrelevant.
            project: function (vector) {
                var direction = vector.copy();
                var length = this.componentIn(direction);
                direction.length = length;
                this.fromVector(direction);
            },

            // Returns the length of the component of this vector in the given vector's direction
            componentIn: function (vector) {
                return this.dot(vector) / vector.length;
            }
    });

    WinJS.Namespace.defineWithParent(AppNS, "Painter.Math", {
        Vector: Vector
    });

})(Microsoft.Paint);
