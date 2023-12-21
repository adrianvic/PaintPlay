////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {
    'use strict';

    // The Marker tool is the simplest tool.
    // It simply connect users points smoothly with a solid color, usually slightly transparent.
    var Eraser = WinJS.Class.define(

        // Constructor
        function () {
            this.autoWidth = false;   // Whether or not width is based on path touch-box data or manual width value
            this.width = 20;          // The default line manual width
        },

        // Variables and Methods
        {
            
            // Begins rendering the beginning of the path
            renderStart: function (path, painter) {
                var ctx = painter.canvas.context;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.shadowBlur = 0;
                ctx.globalCompositeOperation = "destination-out";
                ctx.globalAlpha = 1;
                ctx.fillStyle = "rgba(0,0,0,1)";

                // Start effect
                var x = path.p3.x;
                var y = path.p3.y;
                painter.canvas.drawCircle(x, y, this.width / 2);
            },

            // Renders the given path using the current Marker style
            render: function (path, painter) {
                if (path.drawable) {
                    var ctx = painter.canvas.context;
                    
                    // Get start and end widths for the stroke part
                    var wStart = this.width;
                    var wEnd = this.width;
                    if (this.autoWidth) { 
                        path.calculateWidth();
                        wStart = path.wStart;
                        wEnd = path.wEnd;
                    }

                    // Start at first point of shape, then bezier to second
                    ctx.beginPath();
                    path.calculateBezier(wStart / 2, wEnd / 2, 0.5);
                    ctx.moveTo(path.pStart.x, path.pStart.y);
                    ctx.bezierCurveTo(path.cpStart.x, path.cpStart.y, path.cpEnd.x, path.cpEnd.y, path.pEnd.x, path.pEnd.y);

                    // Line to third point of shape, then bezier to fourth, then close the path
                    path.calculateBezier(-1 * wStart / 2, -1 * wEnd / 2, 0.5);
                    ctx.lineTo(path.pEnd.x, path.pEnd.y);
                    ctx.bezierCurveTo(path.cpEnd.x, path.cpEnd.y, path.cpStart.x, path.cpStart.y, path.pStart.x, path.pStart.y);
                    ctx.closePath();
                    ctx.fill();
                }
            },

            // Begins rendering the beginning of the path
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
                
                // Start at first point of shape, then bezier to second
                ctx.beginPath();
                path.calculateEndBezier(wStart / 2, wEnd / 2);
                ctx.moveTo(path.pStart.x, path.pStart.y);
                ctx.bezierCurveTo(path.cpStart.x, path.cpStart.y, path.cpEnd.x, path.cpEnd.y, path.pEnd.x, path.pEnd.y);

                // Line to third point of shape, then bezier to fourth, then close the path
                path.calculateEndBezier(-1 * wStart / 2, -1 * wEnd / 2);
                ctx.lineTo(path.pEnd.x, path.pEnd.y);
                ctx.bezierCurveTo(path.cpEnd.x, path.cpEnd.y, path.cpStart.x, path.cpStart.y, path.pStart.x, path.pStart.y);
                ctx.closePath();
                ctx.fill();

                painter.canvas.drawCircle(path.p3.x, path.p3.y, this.width / 2);
            },
        }
    );

    WinJS.Namespace.defineWithParent(AppNS, "Painter.Tools", {
        Eraser: Eraser
    });

})(Microsoft.Paint);