////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {
    'use strict';

    // The crayon tool uses textures to generate a crayon/pencil/chalk like effect
    var Crayon = WinJS.Class.define(

        // Constructor
        function () {
            this._density = 0.5;                     // The default density is 50% color
            this._color = new AppNS.Painter.Graphics.Color(0,0,0,255);
            this.autoWidth = false;                 // Whether or not width is based on path touch-box data or manual width value
            this.width = 30;                        // The default line manual width
            this.texture = null;
        },

        // Variables and Methods
        {

            density: {
                get: function () {
                    return this._density;
                },
                set: function (d) {
                    this._density = d;
                    if (this.texture) {
                        this.texture.update(this._color, this._density);
                    }
                }
            },        

            // Starts rendering the given path using the current style
            renderStart: function (path, painter) {
                var ctx = painter.canvas.context;
                ctx.fillStyle = this.texture.texturePattern;
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
                if (this.autoWidth){ 
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
                    this.fillCrayon(ctx);
                }

                if (path.drawable) {

                    // Start at first point of shape, then bezier to second
                    ctx.beginPath();
                    path.calculateBezier(wStart / 2, wEnd / 2);
                    ctx.moveTo(path.pStart.x, path.pStart.y);
                    ctx.bezierCurveTo(path.cpStart.x, path.cpStart.y, path.cpEnd.x, path.cpEnd.y, path.pEnd.x, path.pEnd.y);

                    // Line to third point of shape, then bezier to fourth, then close the path
                    path.calculateBezier(-1 * wStart / 2, -1 * wEnd / 2);
                    ctx.lineTo(path.pEnd.x, path.pEnd.y);
                    ctx.bezierCurveTo(path.cpEnd.x, path.cpEnd.y, path.cpStart.x, path.cpStart.y, path.pStart.x, path.pStart.y);
                    ctx.closePath();

                    // Set fill Style and fill shape
                    this.fillCrayon(ctx);
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
                    ctx.beginPath();
                    ctx.arc(path.p3.x, path.p3.y, wEnd / 2, 0, Math.PI * 2, true);
                    ctx.closePath();
                    this.fillCrayon(ctx);
                } else { // Otherwise, draw a curve to end the path
                    path.calculateStopCurve(wEnd / 2, wEnd / 2, 3, wEnd);
                    ctx.beginPath();
                    ctx.moveTo(path.pStart.x, path.pStart.y);
                    ctx.bezierCurveTo(path.cpStart.x, path.cpStart.y, path.cpEnd.x, path.cpEnd.y, path.pEnd.x, path.pEnd.y);
                    ctx.closePath();
                    this.fillCrayon(ctx);
                }
            },

            fillCrayon: function (ctx) {
                // Set fill Style and fill shape
                ctx.fillStyle = this.texturePattern;
                ctx.save();
                var rand = Math.random();
                ctx.rotate(rand * 2 * Math.PI);
                ctx.translate(rand * 10, rand * 10);
                ctx.fill();
                ctx.restore();
            },

            update: function (painter) {
                this._color = painter.color.copy();
                if (this.texture) {
                    this.texture.update(this._color, this._density);
                }
            },

            setTexture: function (textureImage) {
                this.texture = new AppNS.Painter.Graphics.Texture(textureImage);
                this.texture.update(this._color, this._density);
            }
        }
    );

    WinJS.Namespace.defineWithParent(AppNS, "Painter.Tools", {
        Crayon: Crayon
    });

})(Microsoft.Paint);