////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (BaseNS) {
    WinJS.Namespace.defineWithParent(BaseNS, "Paint", {
        ViewNames: {
            PaintView: "PaintView",
            SnapView: "SnapView"
        },
    });

    WinJS.Namespace.defineWithParent(BaseNS, "Paint", {
        ViewCards: {
            PaintView: { uri: "/HTML/PaintView.html", setupFunction: "Microsoft.Paint.PaintView.fragmentLoad", namespace: "Microsoft.Paint.PaintView" },
            SnapView: { uri: "/HTML/SnapView.html", setupFunction: "Microsoft.Paint.SnapView.fragmentLoad", namespace: "Microsoft.Paint.PaintView" }
        }
    });
})(Microsoft);