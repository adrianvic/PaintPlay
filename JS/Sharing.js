////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {

    var _onDeferredBitmapRequested = function SharingHandler_onDeferredFileItemsRequested(sender, event) {
        /// <summary>
        /// Delayed handling provider for the bitmap.
        /// </summary>
        /// <param name='sender'>
        /// Windows.ApplicationModel.DataTransfer.DataPackage object.
        /// </param>
        /// <param name='event'>
        /// Windows.ApplicationModel.DataTransfer.DataProviderArgs object.
        /// </param>

        var stream = AppNS.CanvasManager.canvasBlob.msRandomAccessStream;
        var deferral = event.deferral;
        var dataPackage = deferral.dataPackage;
        dataPackage.setBitmap(stream);
        deferral.complete();
    };

    var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
    dataTransferManager.addEventListener("datarequested", function (event) {
        // Set sharing properties
        var data = event.request.data;
        data.properties.title = "My PaintPlay Drawing"; // TODO: Win8Apps WORK 92: Add localization support
        data.properties.description = "Check out what I drew with PaintPlay!"; // TODO: Win8Apps WORK 92: Add localization support
        data.setDataProvider(Windows.ApplicationModel.DataTransfer.StandardDataFormats.bitmap, function (sender, event) {
            _onDeferredBitmapRequested(sender, event);
        });
    });
})(Microsoft.Paint);