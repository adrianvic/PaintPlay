////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

// <reference path="../WinJS/js/ui.js" />

(function (AppNS) {
    "use strict";
    var canvasBlobName = "canvasBlob";
    function fragmentLoad(root, state) {
        if (!state) {
            state = {};
        }
        var canvasHost = root.querySelector(".canvas"), toolbarHost = root.querySelector(".toolbar");
        canvasHost.innerHTML = "";
        toolbarHost.innerHTML = "";
            
        state.toolbarHeight = toolbarHost.offsetHeight;
        state.canvasHeight = canvasHost.offsetHeight;
        if (Windows.Graphics.Display.DisplayProperties.currentOrientation === Windows.Graphics.Display.DisplayOrientations.landscape ||
            Windows.Graphics.Display.DisplayProperties.currentOrientation === Windows.Graphics.Display.DisplayOrientations.landscapeFlipped) {
            state.canvasWidth = window.screen.width;
            state.toolbarWidth = window.screen.width;
        } else {
            state.canvasWidth = window.screen.height;
            state.toolbarWidth = window.screen.height;
        }
        state.canvasBorder = 20;

        WinJS.UI.Fragments.clone("/Controls/Canvas/Canvas.html")
            .then(function (frag) {
                canvasHost.appendChild(frag);
                AppNS.CanvasManager.fragmentLoad(canvasHost, state);
                document.body.focus();      
            })
            .then(function () {
                return WinJS.UI.Fragments.clone("/Controls/Toolbar/Toolbar.html");
            })
            .then(function (frag) {
                toolbarHost.appendChild(frag);
                AppNS.ToolbarManager.fragmentLoad(toolbarHost, state);
                document.body.focus();
            });
    };

    function getViewData() {
        var ToolbarManager = AppNS.ToolbarManager;
        var CanvasManager = AppNS.CanvasManager;
        var viewData = {
            colorId: ToolbarManager.colorId,
            toolName: ToolbarManager.toolName,
            width: CanvasManager.toolWidth,
            toolOptionValueIndex: ToolbarManager.optionValueIndex,
            currentSizePreviewIndexes: ToolbarManager.currentSizePreviewIndexes,
            currentOptionPreviewIndexes: ToolbarManager.currentOptionPreviewIndexes,
            undoBlobNames: CanvasManager.undoBlobNames,
            canvasBlobName: canvasBlobName
        };

        return viewData;
    };

    function getViewBlobs() {
        var viewBlobs = AppNS.CanvasManager.undoBlobs;
        viewBlobs[canvasBlobName] = AppNS.CanvasManager.canvasBlob;
        return viewBlobs;
    }

    function changeLayout(newLayout) {
        AppNS.ToolbarManager.changeLayout(newLayout);
        AppNS.CanvasManager.changeLayout(newLayout);
    };

    WinJS.Namespace.defineWithParent(AppNS, "PaintView", {
        fragmentLoad: fragmentLoad,
        getViewData: getViewData,
        getViewBlobs: getViewBlobs,
        changeLayout: changeLayout
    });
})(Microsoft.Paint);
