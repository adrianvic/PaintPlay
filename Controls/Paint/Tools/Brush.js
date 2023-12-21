////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {
    'use strict';

    // The Brush tool simulates a PaintBrush, with color blending and paint loss over distance.
    var Brush = WinJS.Class.define(

        // Constructor
        function () {
            this.blends = false;        // Sets whether or not this brush blends with underlying color
            this.fade = 1000;           // How quickly the brush fades, in pixels (0 = no fade)
            this.numBristles = 0;       // Number of bristles on each side of the brush.
            this.bristles = [];         // All of the Brush Bristles
            this.pxPerBristle = 3;      // The width of each bristle  
            this.maxA = 1.0;            // Maximum beginning opacity
            this.minA = 0.8;            // Minimum beginning opacity
            this.autoWidth = false;     // Whether or not width is based on path touch-box data or manual width value
            this._width = 0;
            this.width = 20;
        },

        // Variables and Methods
        {

            // The width of the brush, to be approximated using bristles
            width: {
                get: function () {
                    return this._width;
                },
                set: function (w) {
                    this.numBristles = Math.floor(0.3 * w / this.pxPerBristle);
                    if (this.numBristles <= 0) {
                        this.numBristles = 0;
                    }
                    this._width = (2 * this.numBristles + 1) * this.pxPerBristle;
                }
            },

            // Begins rendering the beginning of the path
            renderStart: function (path, painter) {
                var ctx = painter.canvas.context;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.shadowBlur = 0;
                ctx.globalCompositeOperation = "source-over";
                ctx.globalAlpha = 1.0;

                var startColor = painter.color.copy();
                startColor.alpha = this.maxA;
                ctx.fillStyle = startColor.toString();

                for (var i = -this.numBristles; i <= this.numBristles; i++) {
                    this.bristles[i] = new AppNS.Painter.Tools.Bristle();
                    this.bristles[i].color.fromColor(startColor);
                    this.bristles[i].width = this.pxPerBristle + 0.5;
                }
            },

            // Renders the given path using the current Marker style
            render: function (path, painter) {
                var ctx = painter.canvas.context;

                // If just starting the path, draw semicircle
                if (path.starting) {
                    path.calculateStartCurve(this.width / 2, this.width / 2, 3, this.width);
                    ctx.beginPath();
                    ctx.moveTo(path.pStart.x, path.pStart.y);
                    ctx.bezierCurveTo(path.cpStart.x, path.cpStart.y, path.cpEnd.x, path.cpEnd.y, path.pEnd.x, path.pEnd.y);
                    ctx.closePath();
                    ctx.fill();
                }

                if (path.drawable) {
                    
                    // Colors
                    var blendColor = new AppNS.Painter.Graphics.Color();
                    var oldColor = new AppNS.Painter.Graphics.Color();

                    // Draw each simulated bristle as a bezier curve
                    for (var i = -this.numBristles; i <= this.numBristles; i++) {
                        // The color at the beginning of the stroke segment
                        oldColor.fromColor(this.bristles[i].color);

                        var offsetStart = i * this.pxPerBristle;
                        var offsetEnd = i * this.pxPerBristle; 
                        path.calculateBezier(offsetStart, offsetEnd, Math.pow(oldColor.alpha, 2) * 0.25);

                        // Blend bristle's color with canvas color
                        if (this.blends) {
                            painter.canvas.getColorAt(blendColor, path.cpStart.x, path.cpStart.y);
                            this.bristles[i].color.blendWith(blendColor);
                        }

                        // Update opacity
                        var currA = this.bristles[i].color.alpha;
                        var perturb = 0;
                        if (this.fade) { // Cause the brush to lose ink over distance
                            perturb = Math.random() * -(Math.pow(0.2 * i / (this.numBristles + 1), 4) + path.dist / this.fade);
                            currA = currA + perturb;
                        } else { // Cause the brush to randomly gain or lose ink per bristle, within minA and maxA
                            currA = Math.random() * (this.maxA - this.minA) + this.minA;
                        }
                        this.bristles[i].color.alpha = this.bristles[i].color.clipAlpha(currA);
                        this.bristles[i].width = this.pxPerBristle + Math.pow(oldColor.alpha, 2) * 0.5;

                        // Create a linear gradient from the start of the stoke segment to the end,
                        // giving a smooth transition of color.
                        var gradient = ctx.createLinearGradient(path.pStart.x, path.pStart.y, path.pEnd.x, path.pEnd.y);
                        gradient.addColorStop(0, oldColor.toString());
                        gradient.addColorStop(1, this.bristles[i].color.toString());

                        ctx.beginPath();
                        ctx.moveTo(path.pStart.x, path.pStart.y);
                        ctx.bezierCurveTo(path.cpStart.x, path.cpStart.y, path.cpEnd.x, path.cpEnd.y, path.pEnd.x, path.pEnd.y);
                        ctx.lineWidth = this.bristles[i].width;
                        ctx.strokeStyle = gradient;
                        ctx.stroke();
                    }
                }
            },
            
            // Stops the path with the current style
            renderStop: function (path, painter) {
                var ctx = painter.canvas.context;
                    
                if (path.created || path.starting) {
                    painter.canvas.drawCircle(path.p3.x, path.p3.y, this.width / 2);
                } else {
                    // Colors
                    var blendColor = new AppNS.Painter.Graphics.Color();
                    var oldColor = new AppNS.Painter.Graphics.Color();

                    // Draw each simulated bristle as a bezier curve
                    for (var i = -this.numBristles; i <= this.numBristles; i++) {
                        var offsetStart = i * this.pxPerBristle;
                        var offsetEnd = i * this.pxPerBristle;
                        path.calculateEndBezier(offsetStart, offsetEnd, 20);

                        // The color at the beginning of the stroke segment
                        oldColor.fromColor(this.bristles[i].color);

                        // Blend bristle's color with canvas color
                        if (this.blends) {
                            painter.canvas.getColorAt(blendColor, path.cpStart.x, path.cpStart.y);
                            this.bristles[i].color.blendWith(blendColor);
                        }

                        // Update opacity
                        this.bristles[i].color.alpha = 0;

                        // Create a linear gradient from the start of the stoke segment to the end,
                        // giving a smooth transition of color.
                        var gradient = ctx.createLinearGradient(path.pStart.x, path.pStart.y, path.pEnd.x, path.pEnd.y);
                        gradient.addColorStop(0, oldColor.toString());
                        gradient.addColorStop(1, this.bristles[i].color.toString());

                        ctx.beginPath();
                        ctx.moveTo(path.pStart.x, path.pStart.y);
                        ctx.bezierCurveTo(path.cpStart.x, path.cpStart.y, path.cpEnd.x, path.cpEnd.y, path.pEnd.x, path.pEnd.y);
                        ctx.lineWidth = this.bristles[i].width;
                        ctx.strokeStyle = gradient;
                        ctx.stroke();
                    }
                }
            }
        }
    );

    WinJS.Namespace.defineWithParent(AppNS, "Painter.Tools", {
        Brush: Brush
    });

})(Microsoft.Paint);