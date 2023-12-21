////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {
    'use strict';

    // A Bristle simulates the bristle on a brush.
    var Bristle = WinJS.Class.define(

        // Constructor
        function () {
            this.color = new AppNS.Painter.Graphics.Color();    // The color of the bristle
            this.width = 2;                                     // The bristle width is 2px
        },

        // Variables and Methods
        {}
    );

    WinJS.Namespace.defineWithParent(AppNS, "Painter.Tools", {
        Bristle: Bristle
    });

})(Microsoft.Paint);