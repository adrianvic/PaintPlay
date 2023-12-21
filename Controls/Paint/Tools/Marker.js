////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {
    'use strict';

    // The Marker tool is the simplest tool.
    // It simply connect users points smoothly with a solid color, usually slightly transparent.
    var Marker = WinJS.Class.define(

        // Constructor
        function () {
            this.opacity = 0.85;       // The default opacity is 85%
            this.autoWidth = false;   // Whether or not width is based on path touch-box data or manual width value
            this.width = 30;          // The default line manual width is 1px
        },

        // Variables and Methods
        {

            // Renders the beginning of the path
            renderStart: function (path, painter) {
                var ctx = painter.canvas.context;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.shadowBlur = 0;
                ctx.globalCompositeOperation = "source-over";
                ctx.globalAlpha = this.opacity;
                ctx.fillStyle = painter.color.toString();
            },

            // Renders the given path using the current Marker style
            render: function (path, painter) {
                var ctx = painter.canvas.context;

                // Get start and end widths for the stroke part
                var wStart = this.width;
                var wEnd = this.width;
                if (this.autoWidth){ 
                    path.calculateWidth();
                    wStart = path.wStart;
                    wEnd = path.wEnd;
                }
                
                // If just starting the path, draw semicircle
                if (path.starting) {
                    path.calculateStartCurve(wEnd / 2, wEnd / 2, 3, wEnd, Math.pow(this.opacity, 2) * 0.22);
                    ctx.beginPath();
                    ctx.moveTo(path.pStart.x, path.pStart.y);
                    ctx.bezierCurveTo(path.cpStart.x, path.cpStart.y, path.cpEnd.x, path.cpEnd.y, path.pEnd.x, path.pEnd.y);
                    ctx.closePath();
                    ctx.fill();
                }
                
                if (path.drawable) {    

                    // Start at first point of shape, then bezier to second
                    ctx.beginPath();
                    path.calculateBezier(wStart / 2, wEnd / 2, Math.pow(this.opacity, 2) * 0.22);
                    ctx.moveTo(path.pStart.x, path.pStart.y);
                    ctx.bezierCurveTo(path.cpStart.x, path.cpStart.y, path.cpEnd.x, path.cpEnd.y, path.pEnd.x, path.pEnd.y);

                    // Line to third point of shape, then bezier to fourth, then close the path
                    path.calculateBezier(-1 * wStart / 2, -1 * wEnd / 2, Math.pow(this.opacity, 2) * 0.22);
                    ctx.lineTo(path.pEnd.x, path.pEnd.y);
                    ctx.bezierCurveTo(path.cpEnd.x, path.cpEnd.y, path.cpStart.x, path.cpStart.y, path.pStart.x, path.pStart.y);
                    ctx.closePath();

                    // Set fill Style and fill shape
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
                    path.calculateStopCurve(wEnd / 2, wEnd / 2, 3, wEnd, Math.pow(this.opacity, 2) * 0.22);
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
        Marker: Marker
    });

})(Microsoft.Paint);