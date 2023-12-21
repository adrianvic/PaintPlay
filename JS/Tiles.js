////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {
    var Notifications = Windows.UI.Notifications;

    WinJS.Namespace.defineWithParent(AppNS, "Tiles", {
        setCurrentCanvasAsTile: function () {
            /// <summary>
            /// Sets the tile to the current content of the canvas
            /// </summary>

            var fileName = "canvasImage.png";
            var altText = "canvas image";  // TODO: Win8Apps WORK 92: Add localization support

            // Get wide image template
            var tileXml = Notifications.TileUpdateManager.getTemplateContent(Notifications.TileTemplateType.tileWideImage);

            function configureTileImage(tileXml, fileName) {
                var tileImageAttributes = tileXml.getElementsByTagName("image");
                tileImageAttributes[0].setAttribute("src", "localfolder://" + fileName);
                tileImageAttributes[0].setAttribute("alt", altText);
            }

            // Get scaled canvas blob with 20% height and width
            var scaledCanvasBlob = AppNS.CanvasManager.getScaledCanvasBlob(document.getElementById("paintCanvas").height * 0.2, document.getElementById("paintCanvas").width * 0.2);

            // Write canvas blob to local folder
            AppNS.Utils.writeBlobToLocalFolderAsync(scaledCanvasBlob, fileName).then(function (file) {
                // Set image attribute
                configureTileImage(tileXml, file.fileName);

                // Get square template
                var squareTileXml = Notifications.TileUpdateManager.getTemplateContent(Notifications.TileTemplateType.tileSquareImage);

                // Set square image attribute
                configureTileImage(squareTileXml, file.fileName);

                // Include the square template into the notification
                var node = tileXml.importNode(squareTileXml.getElementsByTagName("binding").item(0), true);
                tileXml.getElementsByTagName("visual").item(0).appendChild(node);

                // Create the notification from the XML
                var tileNotification = new Notifications.TileNotification(tileXml);

                // Send the notification to the app's default tile
                Notifications.TileUpdateManager.createTileUpdaterForApplication().update(tileNotification);
            }, function () { });
        },

        clearTile: function () {
            /// <summary>
            /// Returns tile to the default
            /// </summary>
            Notifications.TileUpdateManager.createTileUpdaterForApplication().clear();
        }
    });
})(Microsoft.Paint);