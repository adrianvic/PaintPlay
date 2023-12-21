////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {
    'use strict';

    // The Pipe tool has a 3D look to it
    var Pipe = WinJS.Class.define(

        // Constructor
        function () {
            this.autoWidth = false;     // Whether or not width is based on path touch-box data or manual width value
            this.width = 20;            // The default line manual width
            this.height = 6;            // The 'height' of the 3D pipe look, in pixels
            this.maxHeight = 6;
            this.numBristles = 0;       // Number of bristles on each side of the pipe
            this.bristles = [];         // All of the pipe bristles
            this.pxPerBristle = 1;      // The width of each bristle in pixels
            this.middleBristle = new AppNS.Painter.Tools.Bristle();
        },

        // Variables and Methods
        {

            // Begins rendering the beginning of the path
            renderStart: function (path, painter) {
                var color = new AppNS.Painter.Graphics.Color();
                color.fromColor(painter.color);

                // If the color is dark, we lighten it
                if (color.red + color.green + color.blue < 255 * 3 / 2) { 
                    color.lighten(0.2);
                } 
                        
                // Inner Bristles
                this.numBristles = Math.floor(0.25 * this.width / this.pxPerBristle);
                if (this.numBristles <= 0) {
                    this.numBristles = 1;
                }

                for (var i = 0; i < this.numBristles; i++) {
                    this.bristles[i] = new AppNS.Painter.Tools.Bristle();
                    this.bristles[i].color.fromColor(color);
                    this.bristles[i].color.scale(1 - ((i + 1) / this.numBristles) * (this.height / this.maxHeight));
                    this.bristles[i].width = this.pxPerBristle;
                }

                // Large inner bristle
                this.middleBristle.width = this.width - (this.numBristles * this.pxPerBristle * 2);
                this.middleBristle.color.fromColor(color);

                var ctx = painter.canvas.context;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.shadowBlur = 0;
                ctx.globalCompositeOperation = "source-over";
                ctx.globalAlpha = 1.0;
            },

            // Renders the given path using the current style
            render: function (path, painter) {
                var ctx = painter.canvas.context;

                // Get start and end widths for the stroke part
                var wStart = this.width;
                var wEnd = this.width;
                if (this.autoWidth) { 
                    path.calculateWidth();
                    wStart = path.wStart;
                    wEnd = path.wEnd;
                }
                    
                var outerStart = this.middleBristle.width / 2;
                var outerEnd = this.middleBristle.width / 2;

                if (path.starting) {

                    // Draw each simulated bristle as a bezier curve
                    for (var i = this.numBristles - 1; i >= 0; i--) {
                        var offsetStart = (i + 0.5) * this.pxPerBristle + this.middleBristle.width / 2;
                        var offsetEnd = (i + 0.5) * this.pxPerBristle + this.middleBristle.width / 2; 

                        ctx.strokeStyle = this.bristles[i].color.toString();
                        ctx.fillStyle = this.bristles[i].color.toString();
                        ctx.lineWidth = this.bristles[i].width;

                        // Draw the Bristle
                        path.calculateStartCurve(offsetStart, offsetEnd, 3, wEnd);
                        ctx.beginPath();
                        ctx.moveTo(path.pStart.x, path.pStart.y);
                        ctx.bezierCurveTo(path.cpStart.x, path.cpStart.y, path.cpEnd.x, path.cpEnd.y, path.pEnd.x, path.pEnd.y);
                        ctx.closePath();
                        ctx.fill();
                    }

                    // Draw middle
                    path.calculateStartCurve(this.middleBristle.width / 2, this.middleBristle.width / 2, 3, wEnd);
                    ctx.beginPath();
                    ctx.moveTo(path.pStart.x, path.pStart.y);
                    ctx.bezierCurveTo(path.cpStart.x, path.cpStart.y, path.cpEnd.x, path.cpEnd.y, path.pEnd.x, path.pEnd.y);
                    ctx.closePath();
                    ctx.fillStyle = this.middleBristle.color.toString();
                    ctx.fill();
                }

                if (path.drawable) {
                    ctx.lineWidth = this.pxPerBristle + 0.5;
                    
                    // Draw each simulated bristle as a bezier curve
                    for (var i = this.numBristles - 1; i >= 0; i--) {
                        var offsetStart = (i + 0.5) * this.pxPerBristle + outerStart;
                        var offsetEnd = (i + 0.5) * this.pxPerBristle + outerEnd;
                        var overlap = 1.5 * (1 - i / this.numBristles);

                        // Draw the middle bristle.
                        // Start at first point of shape, then bezier to second.
                        ctx.beginPath();
                        path.calculateBezier(offsetStart, offsetEnd, overlap);
                        ctx.moveTo(path.pStart.x, path.pStart.y);
                        ctx.bezierCurveTo(path.cpStart.x, path.cpStart.y, path.cpEnd.x, path.cpEnd.y, path.pEnd.x, path.pEnd.y);

                        // Line to third point of shape, then bezier to fourth, then close the path
                        path.calculateBezier(-offsetStart, -offsetEnd, overlap);
                        ctx.lineTo(path.pEnd.x, path.pEnd.y);
                        ctx.bezierCurveTo(path.cpEnd.x, path.cpEnd.y, path.cpStart.x, path.cpStart.y, path.pStart.x, path.pStart.y);
                        ctx.closePath();

                        // Set fill Style and fill shape
                        ctx.fillStyle = this.bristles[i].color.toString();
                        ctx.fill();
                    }

                    // Draw the middle bristle.
                    // Start at first point of shape, then bezier to second.
                    ctx.beginPath();
                    path.calculateBezier(outerStart, outerEnd, 2);
                    ctx.moveTo(path.pStart.x, path.pStart.y);
                    ctx.bezierCurveTo(path.cpStart.x, path.cpStart.y, path.cpEnd.x, path.cpEnd.y, path.pEnd.x, path.pEnd.y);

                    // Line to third point of shape, then bezier to fourth, then close the path
                    path.calculateBezier(-outerStart, -outerEnd, 2);
                    ctx.lineTo(path.pEnd.x, path.pEnd.y);
                    ctx.bezierCurveTo(path.cpEnd.x, path.cpEnd.y, path.cpStart.x, path.cpStart.y, path.pStart.x, path.pStart.y);
                    ctx.closePath();

                    // Set fill Style and fill shape
                    ctx.fillStyle = this.middleBristle.color.toString();
                    ctx.fill();
                }
            },

            // Renders the end of the path with the current style
            renderStop: function (path, painter) {
                var ctx = painter.canvas.context;
                
                // Get start and end widths for the stroke part
                var wStart = this.width;
                var wEnd = this.width;
                if (this.autoWidth){ 
                    path.calculateWidth();
                    wStart = path.wStart;
                    wEnd = path.wEnd;
                }
                
                // If haven't drawn starting effect yet
                if (path.created || path.starting) {            
                    var x = path.p3.x;
                    var y = path.p3.y;

                    // Draw bristles
                    for (var i = this.numBristles - 1; i >= 0; i--) {
                        var radius = (i + 0.5) * this.pxPerBristle + this.middleBristle.width / 2;
                        
                        // Draw the Bristle
                        ctx.fillStyle = this.bristles[i].color.toString();
                        painter.canvas.drawCircle(x, y, radius);
                    } 

                    // Draw middle
                    ctx.fillStyle = this.middleBristle.color.toString();
                    painter.canvas.drawCircle(x, y, this.middleBristle.width / 2);

                } else { // Otherwise, draw a curve to end the path

                    // Draw each simulated bristle as a bezier curve
                    for (var i = this.numBristles - 1; i >= 0; i--) {
                        var offsetStart = (i + 0.5) * this.pxPerBristle + this.middleBristle.width / 2;
                        var offsetEnd = (i + 0.5) * this.pxPerBristle + this.middleBristle.width / 2;
                        var overlap = 1.5 * (1 - i / this.numBristles);
                        
                        ctx.fillStyle = this.bristles[i].color.toString();
                        ctx.lineWidth = this.bristles[i].width;

                        // Draw the Bristle
                        path.calculateStopCurve(offsetStart, offsetEnd, 3, wEnd, overlap);
                        ctx.beginPath();
                        ctx.moveTo(path.pStart.x, path.pStart.y);
                        ctx.bezierCurveTo(path.cpStart.x, path.cpStart.y, path.cpEnd.x, path.cpEnd.y, path.pEnd.x, path.pEnd.y);
                        ctx.closePath();
                        ctx.fill();
                    }

                    // Draw middle
                    path.calculateStopCurve(this.middleBristle.width / 2, this.middleBristle.width / 2, 3, wEnd, 2);
                    ctx.beginPath();
                    ctx.moveTo(path.pStart.x, path.pStart.y);
                    ctx.bezierCurveTo(path.cpStart.x, path.cpStart.y, path.cpEnd.x, path.cpEnd.y, path.pEnd.x, path.pEnd.y);
                    ctx.closePath();
                    ctx.fillStyle = this.middleBristle.color.toString();
                    ctx.fill();
                }
            }
        }
    );

    WinJS.Namespace.defineWithParent(AppNS, "Painter.Tools", {
        Pipe: Pipe
    });

})(Microsoft.Paint);