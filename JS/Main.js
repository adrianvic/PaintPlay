////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

/// <reference path="ViewManager.js" />

(function (AppNS) {
    "use strict";
    var appLayout = Windows.UI.ViewManagement.ApplicationLayout.getForCurrentView();
    var viewManager = null;

    function activated(e) {
        var Display = Windows.Graphics.Display;
        Display.DisplayProperties.autoRotationPreferences = Display.DisplayOrientations.landscape | Display.DisplayOrientations.landscapeFlipped;
        if (!AppNS.Utils.isLaunched) {
            window.addEventListener("keypress", Microsoft.Paint.KeyManager.keyHandler);
            viewManager = new AppNS.ViewManager(document.querySelector(".main-content"), AppNS.ViewCards);
            viewManager.load(AppNS.ViewNames.PaintView);
            WinJS.Namespace.defineWithParent(AppNS, "Utils", {
                isLaunched: true
            });
        }
    };

    appLayout.addEventListener("layoutchanged", function (event) {
        // Adding this to the end of the thread queue to give the window manager a chance to reset the window data.
        msSetImmediate(function () {
            viewManager.changeViewsLayout(event.layout);
        });
    });

    Windows.UI.WebUI.WebUIApplication.addEventListener("suspending", function () {
        viewManager.persistViewStates();
    });

    document.addEventListener("DOMContentLoaded", function () {
        WinJS.UI.processAll();
    });
    Windows.UI.WebUI.WebUIApplication.addEventListener("activated", activated);   
    WinJS.Application.start();
})(Microsoft.Paint);