////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {
    'use strict';

    var Path = WinJS.Class.define(

        // Constructor
        function (data) {
            
            // Params
            this.minDist = 3;     // Minumum distance before a point is added to the path
            this.weight = 0.3;    // Bezier weight of control points

            this.p1 = null;       // The first point
            this.p2 = null;       // The second point
            this.p3 = null;       // The third point (most recent)
            this.box1 = null;     // Touch bounding box data for the first point
            this.box2 = null;     // Touch bounding box data for the second point
            this.box3 = null;     // Touch bounding box data for the third point
            this.dist = 0;        // Current distance between the start and end points of the bezier curve

            this.wStart = 0;  // The width of the line at the beginning of the curve
            this.wEnd = 0;    // The width of the line at the end of the curve

            this.dirStart = new AppNS.Painter.Math.Vector(0, 0);    // Direction at beginning of curve
            this.dirEnd = new AppNS.Painter.Math.Vector(0, 0);      // Direction at the end of curve
            this.perpStart = new AppNS.Painter.Math.Vector(0, 0);   // Perpendicular at beginning of curve
            this.perpEnd = new AppNS.Painter.Math.Vector(0, 0);     // Perpendicular at end of curve

            this.pStart = new AppNS.Painter.Math.Point(0, 0);       // Point at beginning of curve
            this.cpStart = new AppNS.Painter.Math.Point(0, 0);      // Bezier control point at beginning of curve
            this.cpEnd = new AppNS.Painter.Math.Point(0, 0);        // Bezier control point at end of curve
            this.pEnd = new AppNS.Painter.Math.Point(0, 0);         // Point at end of curve

            this.newPoint = false;      // True if the there is a new point added to the path

            if (data.x || data.y) {
                this.p3 = new AppNS.Painter.Math.Point(data.x, data.y); // The third point (most recent)
            } else {
                throw new Error("PaintPlay - Error: Path object requires x and y data info.");
            }
            if (data.w && data.h) {
                this.box3 = new AppNS.Painter.Math.Vector(data.w, data.h);
            }
        },

        // Variables and Methods
        {
            
            // True if there is information necessary to draw the start of a curve (2 points)
            starting: {
                get: function () {
                    return (this.newPoint && this.numPoints() === 2);
                }
            },
            
            // True if this path is new (1 point)
            created: {
                get: function () {
                    return (this.numPoints() === 1);
                }
            },

            // True if this path is drawable (3 points)
            drawable: {
                get: function () {
                    return (this.newPoint && this.numPoints() === 3);
                }
            },

            numPoints: function () {
                if (this.p1) {
                    return 3;
                } else if (this.p2) {
                    return 2;
                } else if (this.p3) {
                    return 1;
                } else {
                    return 0;
                }
            },

            // Adds the given point to the path
            addPoint: function (data) {
                // Add the new point if mouse moved far enough
                if (data.x || data.y) {
                    var p = new AppNS.Painter.Math.Point(data.x, data.y);
                } else {
                    throw new Error("PaintPlay - Error: Path object requires x and y data info.");
                }
                if (data.w && data.h) {
                    var box = new AppNS.Painter.Math.Vector(data.w, data.h);
                }
                
                if (this.p3.distanceTo(p) > this.minDist) {
                    this.newPoint = true;
                    
                    // Reset the points of the curve
                    this.p1 = this.p2;
                    this.p2 = this.p3;
                    this.p3 = p;
                    this.box1 = this.box2;
                    this.box2 = this.box3;
                    this.box3 = box;

                    // If only have two points, initialize first direction vector
                    if (!this.p1) {

                        // Find the current distance
                        this.dist = this.p2.distanceTo(this.p3);

                        // Initialize tangent info
                        this.dirEnd.fromPoints(this.p2, this.p3);
                        this.dirEnd.normalize();
                        this.perpEnd.fromVector(this.dirEnd);
                        this.perpEnd.toPerp();
                        this.perpEnd.normalize();

                    } else {
                        // otherwise, we have all three points

                        // Find the current distance
                        this.dist = this.p1.distanceTo(this.p2);

                        // Set start and end tangent info
                        this.dirStart.fromVector(this.dirEnd);
                        this.dirEnd.fromPoints(this.p1, this.p3);
                        this.dirEnd.normalize();

                        // Set perpendicular vectors from start and end tangents
                        this.perpStart.fromVector(this.perpEnd);
                        this.perpEnd.fromVector(this.dirEnd);
                        this.perpEnd.toPerp();
                        this.perpEnd.normalize();
                    }
                } else {
                    this.newPoint = false;
                }
            },

            // Calculates the end Bezier curve info
            calculateEndBezier: function (offsetStart, offsetEnd, inertia) {
                if (this.p2 && this.p3) {
                    // If offset given, use it
                    var c2 = offsetStart || 0;
                    var c3 = offsetEnd || 0;
                    inertia = inertia || 0;

                    var dir3 = new AppNS.Painter.Math.Vector();
                    dir3.fromPoints(this.p2, this.p3);
                    dir3.normalize();

                    var perp3 = new AppNS.Painter.Math.Vector();
                    perp3.fromVector(dir3);
                    perp3.toPerp();
                    perp3.normalize();

                    // First bezier point
                    this.pStart.fromPoint(this.p2);
                    this.pStart.scaleAdd(this.perpEnd, c2);

                    // Last bezier point
                    this.pEnd.fromPoint(this.p3);
                    this.pEnd.scaleAdd(perp3, c3);
                    this.pEnd.scaleAdd(dir3, inertia);

                    var dist = this.pStart.distanceTo(this.pEnd);

                    // First control point
                    this.cpStart.fromPoint(this.pStart);
                    this.cpStart.scaleAdd(this.dirEnd, dist * this.weight);

                    // Second control point
                    this.cpEnd.fromPoint(this.pEnd);
                    this.cpEnd.scaleAdd(dir3, -1 * dist * this.weight);
                }
            },

            calculateInertia: function (inertia, dist, min, max) {
                var cInertia = dist * inertia;
                if (cInertia < min) {
                    cInertia = min;
                } else if (cInertia > max) {
                    cInertia = max;
                }
                return cInertia;
            },

            calculateStartCurve: function (offsetTop, offsetBottom, inertia, minInertia, overlap) {
                if (this.p2 && this.p3) {
                    // If offset given, use it
                    var cTop = offsetTop || 0;
                    var cBottom = offsetBottom || 0;
                    var cOverlap = overlap || 0;
                    var cInertia = -this.calculateInertia(inertia, this.dist, minInertia, 4 * minInertia);

                    // First bezier point
                    this.pStart.fromPoint(this.p2);
                    this.pStart.scaleAdd(this.dirEnd, cOverlap);
                    this.pStart.scaleAdd(this.perpEnd, -1 * cBottom);

                    // Last bezier point
                    this.pEnd.fromPoint(this.p2);
                    this.pEnd.scaleAdd(this.dirEnd, cOverlap);
                    this.pEnd.scaleAdd(this.perpEnd, cTop);

                    // First control point
                    this.cpStart.fromPoint(this.pStart);
                    this.cpStart.scaleAdd(this.dirEnd, cInertia);

                    // Second control point
                    this.cpEnd.fromPoint(this.pEnd);
                    this.cpEnd.scaleAdd(this.dirEnd, cInertia);
                }
            },

            calculateStopCurve: function (offsetTop, offsetBottom, inertia, minInertia, overlap) {
                if (this.p2 && this.p3) {
                    // If offset given, use it
                    var cTop = offsetTop || 0;
                    var cBottom = offsetBottom || 0;
                    var cOverlap = overlap || 0;
                    var cInertia = this.calculateInertia(inertia, this.dist, minInertia, 4 * minInertia);

                    // First bezier point
                    this.pStart.fromPoint(this.p2);
                    this.pStart.scaleAdd(this.dirEnd, -cOverlap);
                    this.pStart.scaleAdd(this.perpEnd, -1 * cBottom);

                    // Last bezier point
                    this.pEnd.fromPoint(this.p2);
                    this.pEnd.scaleAdd(this.dirEnd, -cOverlap);
                    this.pEnd.scaleAdd(this.perpEnd, cTop);

                    // First control point
                    this.cpStart.fromPoint(this.pStart);
                    this.cpStart.scaleAdd(this.dirEnd, cInertia);

                    // Second control point
                    this.cpEnd.fromPoint(this.pEnd);
                    this.cpEnd.scaleAdd(this.dirEnd, cInertia);
                }
            },

            // Calculates the Bezier curve info.
            // Offsets are the number of pixels perpendicular to main points (shifts curve up or down).
            calculateBezier: function (offsetStart, offsetEnd, overlap) {

                // If offset given, use it
                var c1 = offsetStart || 0;
                var c2 = offsetEnd || 0;
                var c3 = overlap || 0;

                // First bezier point
                this.pStart.fromPoint(this.p1);
                this.pStart.scaleAdd(this.dirStart, -c3);
                this.pStart.scaleAdd(this.perpStart, c1);

                // Last bezier point
                this.pEnd.fromPoint(this.p2);
                this.pEnd.scaleAdd(this.dirEnd, c3);
                this.pEnd.scaleAdd(this.perpEnd, c2);

                var dist = this.pStart.distanceTo(this.pEnd);

                // First control point
                this.cpStart.fromPoint(this.pStart);
                this.cpStart.scaleAdd(this.dirStart, dist * this.weight);

                // Second control point
                this.cpEnd.fromPoint(this.pEnd);
                this.cpEnd.scaleAdd(this.dirEnd, -1 * dist * this.weight);
            },

            // Calculates the line width based on touch-box data
            calculateWidth: function () {
                if (this.box1 && this.box2) {
                    this.wStart = this.box1.componentIn(this.perpStart);
                    this.wEnd = this.box2.componentIn(this.perpEnd);
                } else {
                    this.wStart = 10;
                    this.wEnd = 30;
                }
            }
    });

    WinJS.Namespace.defineWithParent(AppNS, "Painter.Graphics", {
        Path: Path
    });

})(Microsoft.Paint);
