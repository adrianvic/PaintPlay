////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {
    "use strict";

    function keyHandler(event) {
        switch (event.keyCode) {
            case 14: // ctrl-n: Clear/New canvas
                AppNS.CanvasManager.clearCanvas();
                break;
            case 19: // ctrl-s: Save canvas
                AppNS.CanvasManager.saveCanvas();
                break;
            case 25: // ctrl-y: Redo
                AppNS.CanvasManager.redoCanvas();
                break;
            case 26: // ctrl-z: Undo
                AppNS.CanvasManager.undoCanvas();
                break;
        }
        console.log("Key Pressed: " + event.keyCode);
    }

    WinJS.Namespace.defineWithParent(AppNS, "KeyManager", {
        keyHandler: keyHandler,
    });
})(Microsoft.Paint);
