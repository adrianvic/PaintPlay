////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {
    'use strict';

    // The Color class represents a color in RGBA format.
    var Color = WinJS.Class.define(

        // Constructor
        function (r, g, b, a) {
            this.red = this.clip(r) || 0;           // Red value (0-255)
            this.green = this.clip(g) || 0;         // Green value (0-255)
            this.blue = this.clip(b) || 0;          // Blue value (0-255)
            this.alpha = this.clipAlpha(a) || 0;    // Alpha value (0.0-1.0)
            this.blendAmount = 0.8;                 // The speed of the Blending algorithm
        },

        // Variables and Functions
        {

            // Clips the value to between 255 and 0
            clip: function (value) {
                value = Math.round(value);
                if (value > 255) {
                    return 255;
                } else if (value < 0) {
                    return 0;
                } else {
                    return value;
                }
            },

            // Clips the alpha value to between 0 and 1.0
            clipAlpha: function (alpha) {
                if (alpha > 1.0) {
                    return this.clip(alpha) / 255;
                } else if (alpha < 0.0 || isNaN(alpha)) {
                    return 0.0;
                } else {
                    return alpha;
                }
            },

            // Scales this color by a constant
            scale: function (constant) {
                this.red = this.clip(Math.round(this.red * constant));
                this.green = this.clip(Math.round(this.green * constant));
                this.blue = this.clip(Math.round(this.blue * constant));
            },

            // Sets this color to the given rgba values
            fromRGBA: function (r, g, b, a) {
                this.red = this.clip(r);
                this.green = this.clip(g);
                this.blue = this.clip(b);
                this.alpha = this.clipAlpha(a);
            },

            // Sets this color to the pixel array info
            fromData: function (data) {
                this.fromRGBA(data[0], data[1], data[2], data[3]);
            },

            // Sets this color to the given color
            fromColor: function (color) {
                this.fromRGBA(color.red, color.green, color.blue, color.alpha);
            },

            /// <summary>Sets this color to be the color described by the formatted string.</summary>
            /// <param name="str" type="String">
            /// Str is a formatted string representation of a color. It must be one of the following formats:
            /// rgba: "rgba({r}, {g}, {b}, {a})"
            /// rgb (alpha auto set to 1.0): "rgb({r}, {g}, {b})"
            /// Hex (alpha auto set to 1.0): "#{rr}{gg}{bb}"
            /// </param>
            fromString: function (str) {
                if (str.indexOf("rgba") === 0) {
                    var strData = str.slice(5, -1);
                    var data = strData.split(",");
                    this.red = this.clip(parseInt(data[0]));
                    this.green = this.clip(parseInt(data[1]));
                    this.blue = this.clip(parseInt(data[2]));
                    this.alpha = this.clipAlpha(parseFloat(data[3]));
                } else if (str.indexOf("rgb") === 0) {
                    var strData = str.slice(4, -1);
                    var data = strData.split(",");
                    this.red = this.clip(parseInt(data[0]));
                    this.green = this.clip(parseInt(data[1]));
                    this.blue = this.clip(parseInt(data[2]));
                    this.alpha = 1.0;
                } else if (str.indexOf("#") === 0) {
                    this.red = this.clip(parseInt(str.slice(1, 3), 16));
                    this.green = this.clip(parseInt(str.slice(3, 5), 16));
                    this.blue = this.clip(parseInt(str.slice(5, 7), 16));
                    this.alpha = 1.0;
                }
            },

            // Returns a new copy of this color
            copy: function () {
                var r = this.red;
                var g = this.green;
                var b = this.blue;
                var a = this.alpha;
                return new AppNS.Painter.Graphics.Color(r, g, b, a);
            },

            // Sets this color to be a weighted average of this color and the given color.
            // A good weight is 80% this color, 20% new color.
            blendWith: function (color) {
                if (color.alpha > 0.01) { // Make sure the color we're blending with exists, don't want to blend with invisible ink!
                    this.red = Math.floor(this.red * this.blendAmount + color.red * (1 - this.blendAmount));
                    this.green = Math.floor(this.green * this.blendAmount + color.green * (1 - this.blendAmount));
                    this.blue = Math.floor(this.blue * this.blendAmount + color.blue * (1 - this.blendAmount));
                    this.alpha = this.alpha * this.blendAmount + color.alpha * (1 - this.blendAmount);
                }
            },

            // Lightens this color by the given amount
            lighten: function (amount) {
                this.red += this.clip((255 - this.red) * amount);
                this.green += this.clip((255 - this.green) * amount);
                this.blue += this.clip((255 - this.blue) * amount);
            },

            // Darkens this color by the given amount
            darken: function (amount) {
                this.red -= this.clip(this.red * amount);
                this.green -= this.clip(this.green * amount);
                this.blue -= this.clip(this.blue * amount);
            },

            // Returns the Color in a String representation of the form "rgba(<r>, <g>, <b>, <a>)"
            toString: function () {
                return "rgba(" + this.red + "," + this.green + "," + this.blue + "," + this.alpha + ")";
            }
        }
    );

    WinJS.Namespace.defineWithParent(AppNS, "Painter.Graphics", {
        Color: Color
    });

})(Microsoft.Paint);
