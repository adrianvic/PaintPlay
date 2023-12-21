////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {
    'use strict';

    // The Neon tool has a glow effect
    var Neon = WinJS.Class.define(

        // Constructor
        function () {
            this.autoWidth = false;     // Whether or not width is based on path touch-box data or manual width value
            this.width = 20;            // The default line manual width
            this.glow = 20;             // The amount of shadow blur used to generate the glow
        },

        // Variables and Methods
        {
            // Begins rendering the beginning of the path
            renderStart: function (path, painter) {
                var ctx = painter.canvas.context;
                ctx.fillStyle = painter.color.toString();
                ctx.shadowColor = painter.color.toString();
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.shadowBlur = this.glow;
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
                    
                
                // If just starting the path, draw semicircle
                if (path.starting) {
                    path.calculateStartCurve(wEnd / 2, wEnd / 2, 3, wEnd);
                    ctx.beginPath();
                    ctx.moveTo(path.pStart.x, path.pStart.y);
                    ctx.bezierCurveTo(path.cpStart.x, path.cpStart.y, path.cpEnd.x, path.cpEnd.y, path.pEnd.x, path.pEnd.y);
                    ctx.closePath();
                    ctx.fill();
                }

                if (path.drawable) {   
                    // Start at first point of shape, then bezier to second
                    ctx.beginPath();
                    path.calculateBezier(wStart / 2, wEnd / 2, 0.5);
                    ctx.moveTo(path.pStart.x, path.pStart.y);
                    ctx.bezierCurveTo(path.cpStart.x, path.cpStart.y, path.cpEnd.x, path.cpEnd.y, path.pEnd.x, path.pEnd.y);

                    // Line to third point of shape, then bezier to fourth, then close the path
                    path.calculateBezier(-wStart / 2, -wEnd / 2, 0.5);
                    ctx.lineTo(path.pEnd.x, path.pEnd.y);
                    ctx.bezierCurveTo(path.cpEnd.x, path.cpEnd.y, path.cpStart.x, path.cpStart.y, path.pStart.x, path.pStart.y);
                    ctx.closePath();
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
                    painter.canvas.drawCircle(path.p3.x, path.p3.y, wEnd / 2);
                } else {
                    // Otherwise, draw a curve to end the path
                    path.calculateStopCurve(wEnd / 2, wEnd / 2, 3, wEnd);
                    ctx.beginPath();
                    ctx.moveTo(path.pStart.x, path.pStart.y);
                    ctx.bezierCurveTo(path.cpStart.x, path.cpStart.y, path.cpEnd.x, path.cpEnd.y, path.pEnd.x, path.pEnd.y);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }
    );

    WinJS.Namespace.defineWithParent(AppNS, "Painter.Tools", {
        Neon: Neon
    });

})(Microsoft.Paint);