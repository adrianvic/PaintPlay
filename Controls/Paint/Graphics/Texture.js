////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {
    'use strict';

    // A Texture has an image that is processed and given to a canvas object
    var Texture = WinJS.Class.define(

        // Constructor
        function (image) {
            onload = onload || function () {};

            // The canvas containing the colored texture
            this.size = 40;                                     
            this.colorCanvas = document.createElement("canvas"); 
            this.colorCanvas.height = this.size;
            this.colorCanvas.width = this.size;
            this.ctx = this.colorCanvas.getContext("2d");

            // The ImageData object used to draw pixels on colored texture
            this.copyCanvas = document.createElement("canvas");
            this.copyCanvas.height = this.size;
            this.copyCanvas.width = this.size;
            this.copyCtx = this.copyCanvas.getContext("2d");
            this.copy = this.copyCtx.createImageData(this.size, this.size);

            // The canvas containing the scaled texture
            this.textureCanvas = document.createElement("canvas");
            this.textureCtx = this.textureCanvas.getContext("2d");
            this.textureColor = new AppNS.Painter.Graphics.Color();
            this.textureCanvas.width = this.size;
            this.textureCanvas.height = this.size;
            this.texturePattern = null;

            // The original image of the texture
            this.ctx.drawImage(image, 0, 0);
            this.imageData = this.ctx.getImageData(0, 0, this.size, this.size);
        },

        // Variables and Methods
        {

            /// <summary>
            /// Updates the canvas with the given zoom and color
            /// </summary>
            /// <param type="Microsoft.Paint.Painter.Graphics.Color" name="color">
            /// The color of the pixels in the texture.
            /// </param>
            /// <param type="number" name="zoom">
            /// How much the texture is zoomed in. Zoom = 1 means normal size,
            /// Zoom = 2 means zoomed in 2x, etc.
            /// </param>
            update: function (color, zoom) {
                this.textureColor.fromColor(color);
                this.textureCanvas.width = zoom * this.size;
                this.textureCanvas.height = zoom * this.size;
                this.replacePixels(this.textureColor);
                this.texturePattern = this.ctx.createPattern(this.textureCanvas, "repeat");
            },
            
            // Replaces all pixels with pixels of the given color.
            // Opacity is taken from the texture though.
            replacePixels: function (color) {
                for (var x = 0; x < this.size; x++) {
                    for (var y = 0; y < this.size; y++) {
                        var k = (y * this.size + x) * 4;
                        var alpha = this.imageData.data[k + 3];
                        this.copy.data[k + 0] = color.red;
                        this.copy.data[k + 1] = color.green;
                        this.copy.data[k + 2] = color.blue;
                        this.copy.data[k + 3] = alpha;
                    }
                }
                this.ctx.putImageData(this.copy, 0, 0);
                this.textureCtx.globalCompositeOperation = "copy";
                this.textureCtx.drawImage(this.colorCanvas, 0, 0, this.size, this.size, 0, 0, this.textureCanvas.width, this.textureCanvas.height);
            },
        }
    );

    WinJS.Namespace.defineWithParent(AppNS, "Painter.Graphics", {
        Texture: Texture
    });

})(Microsoft.Paint);