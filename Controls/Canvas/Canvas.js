////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

/// <reference path="Paint.js" />
/// <reference path="Painter.js" />

(function (AppNS) {
    "use strict";
    var WinUtils = WinJS.Utilities;

    // Enum of pointer event information
    var pointerInfo = {

        // Pointer type
        touch: 2,
        pen: 3,
        mouse: 4,

        // Button pressed
        noButtons: 0,
        leftButton: 1,
        rightButton: 2,
        middleButton: 4,
    };

    var layoutState = Windows.UI.ViewManagement.ApplicationLayoutState;

    function fragmentLoad(root, state) {
        // Set up canvas dimensions
        var canvas = root.querySelector("#paintCanvas");
        canvas.height = state.canvasHeight - state.canvasBorder;
        canvas.style.height = canvas.height + "px";
        canvas.width = state.canvasWidth - state.canvasBorder * 2;
        canvas.style.width = canvas.width + "px";

        var eventHost = document.createElement("div");
        var pointerDown = [];
        var Painter = AppNS.Painter;
        var mainPainter = new Painter.Painter(canvas);
        var canvasBlocked = false;
        var classes = { pannable: "pannable" };
        var undoBlobPrefix = "undoBlob-";

        // Initialize canvas with saved blob
        if (state.canvasBlobName) {
            Windows.Storage.ApplicationData.current.localFolder.getFileAsync(state.canvasBlobName)
                .then(function (file) {
                    var url = URL.createObjectURL(file, false);
                    var img = document.createElement("img");
                    img.addEventListener("load", function () {
                        canvas.getContext("2d").drawImage(img, 0, 0);
                    });
                    img.src = url;
                });
        }

        // Initialize undo stack
        if (state.undoBlobNames) {
            for (var i = 0, len = state.undoBlobNames.length; i < len; i++) {
                var blobName = state.undoBlobNames[i];
                Windows.Storage.ApplicationData.current.localFolder.getFileAsync(blobName)
                    .then(function (file) {
                        var url = URL.createObjectURL(file, false);
                        var img = document.createElement("img");
                        var tempCanvas = document.createElement("canvas");
                        tempCanvas.height = canvas.height;
                        tempCanvas.width = canvas.width;
                        img.addEventListener("load", function () {
                            var context = tempCanvas.getContext("2d");
                            context.drawImage(img, 0, 0);
                            mainPainter.canvas.history.push(context.getImageData(0, 0, mainPainter.canvas.domCanvas.offsetWidth, mainPainter.canvas.domCanvas.offsetHeight));
                            mainPainter.canvas.maxIndex++;
                            mainPainter.canvas.index++;
                        });
                        img.src = url;
                    });
            }
        }

        AppNS.CanvasManager.loadAllTools(mainPainter);

        // Initialize canvas
        var toolName = state.toolName || AppNS.CanvasManager.ToolNames.Marker;
        var toolCard = AppNS.CanvasManager.ToolCards[toolName];
        mainPainter.toolName = toolName;
        mainPainter.tool.width = state.width || toolCard.supportedSizes[toolCard.defaultSizeIndex];

        if (state.toolOptionValueIndex || state.toolOptionValueIndex === 0) {
            mainPainter.tool[toolCard.optionKey] = toolCard.optionValues[state.toolOptionValueIndex];
        }

        function downListener(event) {
            if (!pointerDown[event.pointerId] && (leftClick(event) || notMouse(event)) && !canvasBlocked) {
                mainPainter.drawStart(dataFromEvent(event));
                pointerDown[event.pointerId] = true;
            }
        }

        function moveListener(event) {
            if (pointerDown[event.pointerId] && !canvasBlocked) {
                mainPainter.draw(dataFromEvent(event));
            }
        }

        function upListener(event) {
            if (pointerDown[event.pointerId] && !canvasBlocked) {
                mainPainter.drawStop(dataFromEvent(event));
                AppNS.ToolbarManager.showUndo();
                pointerDown[event.pointerId] = false;
            }
        }

        function dataFromEvent(event) {
            var data = {};
            data.x = event.offsetX;
            data.y = event.offsetY;
            data.id = event.pointerId;
            return data;
        }

        function notMouse(event) {
            return (event.pointerType !== pointerInfo.mouse);
        }

        function leftClick(event) {
            return (event.pointerType === pointerInfo.mouse && event.button === pointerInfo.leftButton);
        }

        // Event listeners for the canvas
        canvas.addEventListener("MSPointerDown", downListener);
        canvas.addEventListener("MSPointerOver", downListener);
        canvas.addEventListener("MSPointerMove", moveListener);
        canvas.addEventListener("MSPointerOut", upListener);
        canvas.addEventListener("MSPointerUp", upListener);

        WinJS.Namespace.defineWithParent(AppNS, "CanvasManager", {
            color: {
                get: function () {
                    /// <summary>
                    /// Gets the current color string value
                    /// </summary>
                    return mainPainter.color.toString();
                },

                set: function (newColor) {
                    /// <summary>
                    /// Sets the current color string value
                    /// </summary>
                    /// <param name='newColor'>
                    /// The string value for the color
                    /// </param>
                    var color = new Painter.Graphics.Color();
                    color.fromString(newColor);
                    mainPainter.color = color;
                }
            },

            clearCanvas: function () {
                /// <summary>
                /// Resets the canvas to a blank state
                /// </summary>
                mainPainter.canvas.clear();
                AppNS.ToolbarManager.showUndo();
            },

            undoCanvas: function () {
                /// <summary>
                /// Undoes the last stroke
                /// </summary>
                if (mainPainter.canvas.canUndo()) {
                    mainPainter.canvas.undo();
                }  
                AppNS.ToolbarManager.hideUndo();
            },

            canUndo: function () {
                /// <summary>
                /// Returns whether or not another undo action can be executed
                /// </summary>
                /// <return>
                /// Boolean representing whether or not another undo action can be executed
                /// </return>
                return mainPainter.canvas.canUndo();
            },

            redoCanvas: function () {
                /// <summary>
                /// Redoes the last stroke
                /// </summary>
                if (mainPainter.canvas.canRedo()) {
                    mainPainter.canvas.redo();
                }
                AppNS.ToolbarManager.showUndo();
            },

            toolWidth: {
                get: function () {
                    /// <summary>
                    /// Sets current tool
                    /// </summary>
                    /// <param name='newBrush'>
                    /// The string value for the tool
                    /// </param>
                    return mainPainter.tool.width;
                },

                set: function (newWidth) {
                    /// <summary>
                    /// Sets the current tool width
                    /// </summary>
                    /// <param name='newWidth'>
                    /// The width value in pixels
                    /// </param>
                    mainPainter.tool.width = newWidth;
                }
            },

            getToolProperty: function (optionKey) {
                /// <summary>
                /// Gets the tool specific property
                /// </summary>
                /// <param name='optionKey'>
                /// The property key to be returned
                /// </param>
                /// <return>
                /// The value currently assigned to the property. Can be any type.
                /// </return>
                return mainPainter.tool[optionKey];
            },

            setToolProperty: function (optionKey, optionValue) {
                /// <summary>
                /// Sets the tool specific property
                /// </summary>
                /// <param name='optionKey'>
                /// The property key to be set
                /// </param>
                /// <param name='optionValue'>
                /// The value to be set
                /// </param>
                mainPainter.tool[optionKey] = optionValue;
            },

            tool: {
                get: function () {
                    /// <summary>
                    /// Returns the current tool
                    /// </summary>
                    /// <returns>
                    /// Tool
                    /// </returns>
                    return mainPainter.tool;
                },

                set: function (newBrush) {
                    /// <summary>
                    /// Sets current tool
                    /// </summary>
                    /// <param name='newBrush'>
                    /// The string value for the tool
                    /// </param>
                    mainPainter.tool = newBrush;
                }
            },

            canvasBitmap: {
                get: function () {
                    /// <summary>
                    /// Returns the current image data on the canvas
                    /// </summary>
                    /// <returns>
                    /// ImageData
                    /// </returns>
                    return mainPainter.canvas.context.getImageData(0, 0, mainPainter.canvas.domCanvas.offsetWidth, mainPainter.canvas.domCanvas.offsetHeight);
                },

                set: function (imageData) {
                    /// <summary>
                    /// Sets the image data displayed on the canvas
                    /// </summary>
                    /// <param name='imageData'>
                    /// ImageData object to be displayed
                    /// </param>
                    mainPainter.canvas.context.putImageData(imageData, 0, 0);
                }
            },

            getScaledCanvasBlob: function (height, width) {
                /// <summary>
                /// Returns the a scaled canvas blob
                /// </summary>
                /// <param name='height'>
                /// Height of the new canvas blob
                /// </param>
                /// <param name='width'>
                /// Width of the new canvas blob
                /// </param>
                /// <returns>
                /// Blob
                /// </returns>
                var newCanvas = document.createElement("canvas");
                var context = newCanvas.getContext("2d");
                newCanvas.width = width;
                newCanvas.height = height;
                context.drawImage(mainPainter.canvas.domCanvas, 0, 0, width, height);
                return newCanvas.msToBlob();
            },

            canvasBlob: {
                get: function () {
                    /// <summary>
                    /// Returns the current image data on the canvas as a blob
                    /// </summary>
                    /// <returns>
                    /// Blob
                    /// </returns>
                    return mainPainter.canvas.domCanvas.msToBlob();
                }
            },

            undoBlobNames: {
                get: function () {
                    /// <summary>
                    /// Returns an array with the names identifying the undo blobs indexed chronologically
                    /// </summary>
                    /// <returns>
                    /// Array of strings
                    /// </returns>
                    var blobNames = [];
                    for (var i = mainPainter.canvas.minIndex; i < mainPainter.canvas.index; i++) {
                        blobNames.push(undoBlobPrefix + (i - mainPainter.canvas.minIndex));
                    }
                    return blobNames;
                }
            },

            undoBlobs: {
                get: function () {
                    /// <summary>
                    /// Returns an object with the undo stack blobs
                    /// </summary>
                    /// <returns>
                    /// Object in which keys are the blob names strings and values are blobs
                    /// </returns>
                    var blobs = {};
                    for (var i = mainPainter.canvas.minIndex; i < mainPainter.canvas.index; i++) {
                        var tempCanvas = document.createElement("canvas");
                        tempCanvas.height = mainPainter.canvas.domCanvas.height;
                        tempCanvas.width = mainPainter.canvas.domCanvas.width;
                        tempCanvas.getContext("2d").putImageData(mainPainter.canvas.history[i], 0, 0);
                        blobs[undoBlobPrefix + (i - mainPainter.canvas.minIndex)] = tempCanvas.msToBlob();
                    }
                    return blobs;
                }
            },

            // Saves the current canvas to a file in the pictures library.
            // File name will be 'Painting <date>'.
            saveCanvas: function () {
                var filename = "Painting.png";
                AppNS.Utils.writeBlobToPicturesFolderAsync(this.canvasBlob, filename);
            },

            canvasBlocked: {
                set: function (cBlocked) {
                    /// <summary>
                    /// Sets whether the drawing on canvas is disabled or enabled
                    /// </summary>
                    /// <param name='cBlocked'>
                    /// Boolean representing wether or not the canvas is blocked
                    /// </param>
                    if (typeof cBlocked === "boolean") {
                        canvasBlocked = cBlocked;
                    }
                },

                get: function () {
                    /// <summary>
                    /// Returns whether the drawing on canvas is disabled or enabled
                    /// </summary>
                    /// <returns>
                    /// Boolean
                    /// </returns>
                    return canvasBlocked;
                }
            },

            canvasPannable: {
                get: function () {
                    /// <summary>
                    /// Returns whether or not the canvas is pannable
                    /// </summary>
                    /// <returns>
                    /// Boolean
                    /// </returns>
                    return root.className.indexOf(classes.pannable) !== -1;
                },

                set: function (isPannable) {
                    /// <summary>
                    /// Enables or disables panning on the canvas
                    /// </summary>
                    /// <param name='isPannable'>
                    /// Boolean representing wether or not the canvas is pannable
                    /// </param>
                    if (isPannable) {
                        WinUtils.addClass(root, classes.pannable);
                    } else {
                        WinUtils.removeClass(root, classes.pannable);
                    }
                }
            },

            changeLayout: function (newLayout) {
                /// <summary>
                /// Changes the canvas layout to a specified layout such as snap or fill
                /// </summary>

                // Reposition scroll for snap and fill view
                if (newLayout !== layoutState.fullScreen) {
                    root.scrollLeft = (canvas.width - window.innerWidth) / 2;
                }
            },

            addEventListener: function (eventName, eventCallback, capture) {
                /// <summary>
                /// Registers an event handler for the specified event type
                /// </summary>
                /// <param name='eventName'>
                /// The type of event type to register
                /// </param>
                /// <param name='eventCallback'>
                /// The event handler function to associate with the event
                /// </param>
                /// <param name='capture'>
                /// A Boolean value that specifies the event phase to add the event handler for:
                /// true
                ///     Register the event handler for the capturing phase
                /// false
                ///     Register the event handler for the bubbling phase
                /// </param>
                /// <returns>
                /// None
                /// </returns>

                eventHost.addEventListener(eventName, eventCallback, capture);
            },

            removeEventListener: function (eventName, eventCallback, capture) {
                /// <summary>
                /// Removes an event handler that the addEventListener method registered
                /// </summary>
                /// <param name='eventName'>
                /// The event type that the event handler is registered for
                /// </param>
                /// <param name='eventCallback'>
                /// The event handler function to remove
                /// </param>
                /// <param name='capture'>
                /// A Boolean value that specifies the event phase to add the event handler for:
                /// true
                ///     Remove the capturing phase event handler
                /// false
                ///     Remove the bubbling phase event handler
                /// </param>
                /// <returns>
                /// None
                /// </returns>

                eventHost.removeEventListener(eventName, eventCallback, capture);
            },

            // Raises an event to listeners
            _fireEvent: function (eventName, payload) {
                if (document.createEvent) {
                    var eventObject = document.createEvent("Event");
                    eventObject.initEvent(eventName, true, false);

                    if (payload) {
                        eventObject.payload = payload;
                    }

                    eventHost.dispatchEvent(eventObject);
                }
            }
        });
    };

    WinJS.Namespace.defineWithParent(AppNS, "CanvasManager", {
        fragmentLoad: fragmentLoad,
    });
})(Microsoft.Paint);
