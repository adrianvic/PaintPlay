////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {
    'use strict';

    var Canvas = WinJS.Class.define(

        // Constructor
        function (domCanvas) {
            this.domCanvas = domCanvas;
            this.context = domCanvas.getContext("2d");
            this.depth = 10;
            this.history = [];
            this.index = 0;
            this.minIndex = 0;
            this.maxIndex = 0;
            this.history[this.index] = this.context.getImageData(0, 0, this.domCanvas.width, this.domCanvas.height);
        },

        // Variables and Methods
        {
            // Returns the color of the pixel at the given position
            getColorAt: function (color, x, y) {
                var imgData = this.context.getImageData(x, y, 1, 1);
                color.fromData(imgData.data);
            },

            // Draws a circle using the current fill style at the given position with
            // the given radius.
            drawCircle: function (x, y, r) {
                this.context.beginPath();
                this.context.arc(x, y, r, 0, Math.PI * 2, true);
                this.context.closePath();
                this.context.fill();
            },

            // Saves the current state of the canvas, deleting all previously undone (future or forward) state.
            saveState: function () {
                this.index++;
                this.maxIndex = this.index;
                if (this.maxIndex - this.minIndex > this.depth) {
                    this.history[this.minIndex] = null;
                    this.minIndex = this.maxIndex - this.depth;
                }
                this.history[this.index] = this.context.getImageData(0, 0, this.domCanvas.width, this.domCanvas.height);
            },

            // Loads the state stored at the given index into the canvas
            loadState: function (i) {
                if (i >= this.minIndex && i <= this.maxIndex) {
                    this.index = i;
                    this.context.putImageData(this.history[this.index], 0, 0);
                } else {
                    throw new Error("PaintPlay - Error: Index out of bounds");
                }
            },

            // Returns true if able to undo (still some past actions)
            canUndo: function () { 
                return this.index > this.minIndex; 
            },

            // Returns true if able to redo (still some future actions)
            canRedo: function () { 
                return this.index < this.maxIndex; 
            },

            // Undoes the last action (goes back one step in state history)
            undo: function () {
                if (this.canUndo()) {
                    this.loadState(this.index - 1);
                }
            },

            // Redoes the next action (goes forward one step in state history)
            redo: function () {
                if (this.canRedo()) {
                    this.loadState(this.index + 1);
                }
            },

            // Clears the canvas.
            clear: function () {
                this.context.clearRect(0, 0, this.domCanvas.width, this.domCanvas.height);
                this.saveState();
            },

            // Returns an image object containing the current state of the canvas.
            getImage: function () {
                var img = new Image();
                var imgSrc = this.domCanvas.toDataURL("image/png");
                img.src = imgSrc;
                return img;
            },
        }
    );

    WinJS.Namespace.defineWithParent(AppNS, "Painter.Graphics", {
        Canvas: Canvas
    });

})(Microsoft.Paint);
