////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {
    WinJS.Namespace.defineWithParent(AppNS, "Utils", {
        writeBlobToLocalFolderAsync: function (blob, filename) {
            /// <summary>
            /// Writes a blob to the local applicaton folder
            /// </summary>
            /// <param name='blob'>
            /// Blob object to be saved
            /// </param>
            /// <param name='filename'>
            /// String representing the name of the output file
            /// </param>

            return new WinJS.Promise(function (complete, error) {
                // Create file
                Windows.Storage.ApplicationData.current.localFolder.createFileAsync(filename, Windows.Storage.CreationCollisionOption.replaceExisting)
                    .then(function (file) {
                        // Open the returned file in order to copy the data
                        file.openAsync(Windows.Storage.FileAccessMode.readWrite).then(function (stream) {
                            var output = stream.getOutputStreamAt(0);

                            // Get the IInputStream stream from the blob object
                            var input = blob.msRandomAccessStream.getInputStreamAt(0);

                            // Copy the stream from the blob to the File stream
                            Windows.Storage.Streams.RandomAccessStream.copy(input, output);
                            output.flushAsync().then(function () {
                                complete(file);
                            }, error);
                        }, error);
                    }, error);
            });
        }
    });
})(Microsoft.Paint);