////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

/// <reference path="../../WinJS/js/base.js" />
/// <reference path="../../WinJS/js/ui.js" />
/// <reference path="../../WinJS/js/controls.js" />
/// <reference path="../../JS/CommandBar/CommandBar.js" />
/// <reference path="../../JS/CommandBar/Flyout.js" />
/// <reference path="../ColorPicker/ColorPicker.js" />
/// <reference path="../Canvas/Painter.js" />

(function (AppNS) {
    "use strict";
    var CanvasManager = AppNS.CanvasManager;
    var WinUtils = WinJS.Utilities;
    var WinUI = WinJS.UI;
    var pointerDown;
    var ToolbarManager = WinJS.Namespace.defineWithParent(AppNS, "ToolbarManager", {

        showUndo: function () { },

        hideUndo: function () { },

        fragmentLoad: function (root, state) {
            WinUI.processAll();
            var currentBrush = state.toolName || CanvasManager.ToolNames.Marker;
            var currentWidth = state.width || 10;
            var currentColorId = state.colorId || 0; // Middle color
            var currentColorString;
            var commmandBarHost = root.querySelector(".commandBar");
            var ViewManagement = Windows.UI.ViewManagement;
            var appLayout = ViewManagement.ApplicationLayout.getForCurrentView();
            var layoutState = ViewManagement.ApplicationLayoutState;
            var currentLayoutState = ViewManagement.ApplicationLayout.value;
            var redrawBrushPreviews = true;
            var redrawSizePreviews = true;
            var redrawOptionPreviews = true;
            var currentCommandName;
            var toolStateId = {};

            var commandNames = {
                brush: "brush",
                size: "size",
                option: "option",
                more: "more",
                undo: "undo",
                clear: "clear",
                brushSnapped: "brush-snapped",
                sizeSnapped: "size-snapped",
                colorpicker: "colorpicker"
            };

            // Set color picker full and fill widths to the remaining toolbar width, the numbers represent the space occupied in the toolbar by other elements, such as commands and margins.
            var colorPickerFullWidth = state.toolbarWidth - 613;
            var colorPickerFillWidth = state.toolbarWidth - 913;
            var unSnappedLeftMargin = 30;
            var spaceForLeftCommands = unSnappedLeftMargin + 300;
            var tool;
            
            // Style classes enum
            var classes = {
                colorPickerContainer: "colorpickerContainer",
                toolbarFlyout: "toolbar-flyout",
                brushPreview: "brush-preview",
                selectedPreview: "selectedPreview",
                brushWidthThick: "brush-width-thick",
                brushWidthThin: "brush-width-thin",
                panModeToggle: "pan-mode-toggle",
                commandToolbarUndo: "command_toolbar_undo",
                commandToolbarOption: "command_toolbar_option",
                commandToolbarSize: "command_toolbar_size",
                commandToolbarBrush: "command_toolbar_brush",
                commandToolbarMore: "command_toolbar_more",
                brushPreviewPrefix: "brush-preview-",
                sizePreviewPrefix: "size-preview-",
                optionPreviewPrefix: "option-preview-",
                winCommandBarHoriz: "win-commandBar-horiz",
                winMediaFlyoutBackground: "win-mediaFlyout-background",
                toolbarFlyoutBackground: "toolbar-flyout-background",
                canvasFlyoutBackground: "canvas-flyout-background",
                brushFlyout: "brush-flyout",
                sizeFlyout: "size-flyout",
                optionFlyout: "option-flyout",
                commandLabel: "commandLabel",
                moreFlyout: "more-flyout",
                undoButton: "undo-button",
                clearButton: "clear-button",
                appBar: "appBar"
            };

            var appBar = document.getElementById(classes.appBar);

            var styles = {
                hidden: "hidden",
                visible: "visible"
            };

            // Helper functions to hide and show elements
            var hideElement = function (e) {
                e.style.visibility = styles.hidden;
            };

            var showElement = function (e) {
                e.style.visibility = styles.visible;
            };

            var previewIndexTypes = {
                size: 0,
                option: 1
            };

            // Helper functions to hide and show dismiss targets
            var closeFlyouts = function () {
                dismissAllFlyouts();
                restoreCommand(currentCommandName);
                currentCommandName = null;
                hideElement(toolbarFlyoutDismissArea);
            };

            var hideToolbarDismissArea = function () {
                hideElement(toolbarFlyoutDismissArea);
            };

            var showDismissAreas = function () {
                showElement(toolbarFlyoutDismissArea);
            };

            var restoreCommand = function (commandName) {
                // If this is an option or brush command, restore it accordingly; otherwise restore it to original
                if (commandName === commandNames.option || commandName === commandNames.brush) {
                    commandBar.setCommandState(commandName, toolStateId[currentBrush]);
                } else {
                    commandBar.setCommandState(commandName, 0);
                }
            };

            // Create and initialize dismiss area over toolbar
            var toolbarFlyoutDismissArea = document.createElement("div");
            toolbarFlyoutDismissArea.className = classes.toolbarFlyoutBackground;
            toolbarFlyoutDismissArea.style.left = spaceForLeftCommands + "px";
            toolbarFlyoutDismissArea.style.minHeight = appBar.offsetHeight + "px";
            toolbarFlyoutDismissArea.style.minWidth = state.toolbarWidth - spaceForLeftCommands + "px";
            hideElement(toolbarFlyoutDismissArea);
            toolbarFlyoutDismissArea.addEventListener("click", closeFlyouts);
            root.appendChild(toolbarFlyoutDismissArea);

            // Helper function to get persisted preview indexes
            var getPersistedPreviewIndex = function (indexType, toolName) {
                var index = null;
                switch (indexType) {
                    case previewIndexTypes.size:
                        if (state.currentSizePreviewIndexes) {
                            index = state.currentSizePreviewIndexes[toolName];
                        }
                        break;

                    case previewIndexTypes.option:
                        if (state.currentOptionPreviewIndexes) {
                            index = state.currentOptionPreviewIndexes[toolName];
                        }
                        break;
                }
                return index;
            }

            // Command groups
            var leftGroup = new WinUI.CommandGroup("leftGroup", WinUI.CommandStack.left);
            var rightGroup = new WinUI.CommandGroup("rightGroup", WinUI.CommandStack.right);
            var colorGroup = new WinUI.CommandGroup("colorGroup", WinUI.CommandStack.left);

            // Commands
            var moreCommand = new WinUI.Command(commandNames.more, [{
                payload: {
                    name: commandNames.more
                },
                templateValues: {
                    commandName: "More", // TODO: Win8Apps WORK 92: Add localization support
                    imageUrl: "/Res/moreIcon40px.{{state}}.png"
                }
            },
            {
                payload: {
                    name: commandNames.more
                },
                templateValues: {
                    commandName: "More", // TODO: Win8Apps WORK 92: Add localization support
                    imageUrl: "/Res/moreIcon40px.{{state}}.png"
                }
            }], 1);

            var toolName;
            var brushCommandStates = [];

            for (toolName in CanvasManager.ToolCards) {
                brushCommandStates.push({
                    payload: {
                        name: commandNames.brush
                    },
                    templateValues: {
                        commandName: CanvasManager.ToolCards[toolName].label,
                        imageUrl: "/Res/brushIcon40px.{{state}}.png"
                    }
                },
                {
                    payload: {
                        name: commandNames.brush
                    },
                    templateValues: {
                        commandName: CanvasManager.ToolCards[toolName].label,
                        imageUrl: "/Res/brushIcon40px.press.png"
                    }
                });
            }

            brushCommandStates.push({
                payload: {
                    name: commandNames.brush
                },
                templateValues: {
                    commandName: "Pan mode", // TODO: Win8Apps WORK 92: Add localization support
                    imageUrl: "/Res/panmodeOptionIcon40px.{{state}}.png"
                }
            },
            {
                payload: {
                    name: commandNames.brush
                },
                templateValues: {
                    commandName: "Pan mode", // TODO: Win8Apps WORK 92: Add localization support
                    imageUrl: "/Res/panmodeOptionIcon40px.press.png"
                }
            });

            var panModeStateId = brushCommandStates.length - 1;
            var brushCommand = new WinUI.Command(commandNames.brush, brushCommandStates, 1);

            var sizeCommand = new WinUI.Command(commandNames.size, [{
                payload: {
                    name: commandNames.size
                },
                templateValues: {
                    commandName: "Size", // TODO: Win8Apps WORK 92: Add localization support
                    imageUrl: "/Res/sizeIcon40px.{{state}}.png"
                }
            },
            {
                payload: {
                    name: commandNames.size
                },
                templateValues: {
                    commandName: "Size", // TODO: Win8Apps WORK 92: Add localization support
                    imageUrl: "/Res/sizeIcon40px.press.png"
                }
            }], 1);

            var brushCommandSnapped = new WinUI.Command(commandNames.brushSnapped, [{
                payload: {
                    name: commandNames.brush
                },
                templateValues: {
                    commandName: "Brush", // TODO: Win8Apps WORK 92: Add localization support
                    imageUrl: "/Res/brushIcon40px.{{state}}.png"
                }
            },
            {
                payload: {
                    name: commandNames.brush
                },
                templateValues: {
                    commandName: "Brush", // TODO: Win8Apps WORK 92: Add localization support
                    imageUrl: "/Res/brushIcon40px.press.png"
                }
            }], 1);

            var sizeCommandSnapped = new WinUI.Command(commandNames.sizeSnapped, [{
                payload: {
                    name: commandNames.size
                },
                templateValues: {
                    commandName: "Size", // TODO: Win8Apps WORK 92: Add localization support
                    imageUrl: "/Res/sizeIcon40px.{{state}}.png"
                }
            },
            {
                payload: {
                    name: commandNames.size
                },
                templateValues: {
                    commandName: "Size", // TODO: Win8Apps WORK 92: Add localization support
                    imageUrl: "/Res/sizeIcon40px.press.png"
                }
            }], 1);

            var optionCommandStates = [];

            for (toolName in CanvasManager.ToolCards) {
                optionCommandStates.push({
                    payload: {
                        name: commandNames.option
                    },
                    templateValues: {
                        commandName: CanvasManager.ToolCards[toolName].optionLabel,
                        imageUrl: "/Res/" + CanvasManager.ToolCards[toolName].optionKey + "OptionIcon40px.{{state}}.png"
                    }
                },
                {
                    payload: {
                        name: commandNames.option,
                        toolName: toolName
                    },
                    templateValues: {
                        commandName: CanvasManager.ToolCards[toolName].optionLabel,
                        imageUrl: "/Res/" + CanvasManager.ToolCards[toolName].optionKey + "OptionIcon40px.press.png"
                    }
                });
            }

            var optionCommand = new WinUI.Command(commandNames.option, optionCommandStates, 1);

            var undoCommand = new WinUI.Command(commandNames.undo, [{
                payload: {
                    name: commandNames.undo
                },
                templateValues: {
                    commandName: "Undo", // TODO: Win8Apps WORK 92: Add localization support
                    imageUrl: "/Res/undoIcon40px.{{state}}.png"
                }
            },
            {
                payload: {
                    name: commandNames.undo
                },
                templateValues: {
                    commandName: "Undo", // TODO: Win8Apps WORK 92: Add localization support
                    imageUrl: "/Res/undoIcon40px.press.png"
                }
            }], 1);

            var clearCommand = new WinUI.Command(commandNames.clear, [{
                payload: {
                    name: commandNames.clear
                },
                templateValues: {
                    commandName: "Clear", // TODO: Win8Apps WORK 92: Add localization support
                    imageUrl: "/Res/newIcon40px.{{state}}.png"
                }
            },
            {
                payload: {
                    name: commandNames.clear
                },
                templateValues: {
                    commandName: "Clear", // TODO: Win8Apps WORK 92: Add localization support
                    imageUrl: "/Res/newIcon40px.press.png"
                }
            }], 1);

            // Color picker
            var colorPickerCommand = new WinUI.Command(commandNames.colorpicker, [{
                payload: {
                    name: commandNames.colorpicker
                },
                templateValues: {
                    commandName: "Color picker"
                }
            }], 1);

            colorPickerCommand.hostedElement = document.createElement("span");
            colorPickerCommand.hostedElement.className = classes.colorPickerContainer;

            var colorPicker = new Microsoft.Paint.ColorPicker(colorPickerCommand.hostedElement,
                ToolbarManager.ToolbarColors, { height: 40, width: colorPickerFullWidth, hoverHeightGrowth: 2, hoverWidthGrowth: 1.75, bottomPosition: 20, selectedWidthGrowth: 1.25, selectedHeightGrowth: 1.25, affectedNeighbors: 3 });

            // Disable automatic state change
            brushCommand.advanceState = false;
            sizeCommand.advanceState = false;
            brushCommandSnapped.advanceState = false;
            sizeCommandSnapped.advanceState = false;
            optionCommand.advanceState = false;
            undoCommand.advanceState = false;
            clearCommand.advanceState = false;
            colorPickerCommand.advanceState = false;
            moreCommand.advanceState = false;

            // Disable hiding the appbar on invoke
            brushCommand.hideOnInvoke = false;
            sizeCommand.hideOnInvoke = false;
            brushCommandSnapped.hideOnInvoke = false;
            sizeCommandSnapped.hideOnInvoke = false;
            optionCommand.hideOnInvoke = false;
            undoCommand.hideOnInvoke = false;
            clearCommand.hideOnInvoke = false;
            colorPickerCommand.hideOnInvoke = false;
            moreCommand.hideOnInvoke = false;

            // Add commands to groups
            leftGroup.addCommand(brushCommand);
            leftGroup.addCommand(sizeCommand);
            leftGroup.addCommand(optionCommand);

            rightGroup.addCommand(moreCommand);
            rightGroup.addCommand(undoCommand);
            rightGroup.addCommand(clearCommand);
            rightGroup.addCommand(brushCommandSnapped);
            rightGroup.addCommand(sizeCommandSnapped);

            colorGroup.addCommand(colorPickerCommand);

            var getCommandNamesForLayout = function (layout) {
                var commandNamesForLayout = null;
                if (layout === layoutState.fullScreen) {
                    commandNamesForLayout = [commandNames.brush, commandNames.size, commandNames.option, commandNames.undo, commandNames.clear, commandNames.colorpicker];
                } else if (layout === layoutState.filled) {
                    commandNamesForLayout = [commandNames.brush, commandNames.size, commandNames.option, commandNames.colorpicker, commandNames.more];
                } else if (layout === layoutState.snapped) {
                    commandNamesForLayout = [commandNames.brush, commandNames.size];
                }
                return commandNamesForLayout;
            };

            // Instantiate command bar
            var commandBar = new WinUI.CommandBar(commmandBarHost, {
                orientation: "horizontal",
                commandGroups: [leftGroup, rightGroup, colorGroup],
                ariaLabel: "Toolbar",
                uniqueId: "toolbar"
            });

            // Helper function to draw previews
            var drawPreview = function (preview, newColor, width, tool, optionKey, optionValue, offsetY) {
                preview.canvas.clear();
                if (newColor) {
                    var color = new AppNS.Painter.Graphics.Color();
                    color.fromString(newColor);
                    preview.color = color;
                }

                if (tool) {
                    preview.tool = tool;
                }

                if (width) {
                    preview.tool.width = width;
                }

                if (optionKey && optionValue) {
                    if (tool === CanvasManager.ToolNames.Brush) {
                        preview.tool[optionKey] = (optionValue || preview.tool[optionKey]) / 5;
                    } else {
                        preview.tool[optionKey] = (optionValue || preview.tool[optionKey]);
                    }
                }

                if (!offsetY) {
                    offsetY = 25;
                }

                var startX = 50;
                var endX = 200;

                // Draw eraser preview on top of marker stroke
                if (tool === CanvasManager.ToolNames.Eraser) {

                    // Draw the background
                    var width = 20;
                    var height = 2;
                    var ctx = preview.canvas.context;
                    ctx.globalCompositeOperation = "source-over";
                    ctx.fillStyle = preview.color.toString();
                    ctx.fillRect(width, height, preview.canvas.domCanvas.width - 2 * width, preview.canvas.domCanvas.height - 2 * height);

                    // Draw the eraser stroke
                    preview.drawStart({ x: startX + 10, y: offsetY - 3 });
                    preview.draw({ x: 130, y: offsetY + 3 });
                    preview.draw({ x: 170, y: offsetY - 3 });
                    preview.drawStop({ x: endX, y: offsetY + 3 });

                } else {
                    preview.drawStart({ x: startX, y: offsetY });
                    preview.draw({ x: startX + 5, y: offsetY });
                    preview.draw({ x: startX + 50, y: offsetY });
                    preview.draw({ x: startX + 75, y: offsetY });
                    preview.draw({ x: startX + 100, y: offsetY });
                    preview.draw({ x: startX + 110, y: offsetY });
                    preview.draw({ x: startX + 115, y: offsetY });
                    preview.draw({ x: startX + 120, y: offsetY });
                    preview.draw({ x: startX + 125, y: offsetY });
                    preview.draw({ x: endX, y: offsetY });
                    preview.draw({ x: endX + 5, y: offsetY });
                    preview.drawStop({ x: endX + 10, y: offsetY });
                }
            };

            // Flyouts
            var brushFlyout = document.getElementById(classes.brushFlyout);
            var sizeFlyout = document.getElementById(classes.sizeFlyout);
            var optionFlyout = document.getElementById(classes.optionFlyout);
            var moreFlyout = document.getElementById(classes.moreFlyout);

            brushFlyout.addEventListener("afterhide", hideToolbarDismissArea);
            sizeFlyout.addEventListener("afterhide", hideToolbarDismissArea);
            optionFlyout.addEventListener("afterhide", hideToolbarDismissArea);

            // Brush flyout
            var brushFlyoutPreviews = [];
            var brushFlyoutDomElements = {};

            // Create canvases for brush previews
            var i = 0;
            var len = 0;

            // Add pan mode toggle
            var panModeDiv = document.createElement("div");
            panModeDiv.className = classes.panModeToggle;
            panModeDiv.innerHTML = "Pan mode";
            panModeDiv.addEventListener("MSPointerOut", function (event) {
                if (pointerDown) {
                    WinUtils.removeClass(event.currentTarget, classes.selectedPreview);
                    WinUtils.addClass(currentBrushPreview, classes.selectedPreview);
                    pointerDown = false;
                }
            });

            panModeDiv.addEventListener("MSPointerDown", function (event) {
                pointerDown = true;
                WinUtils.removeClass(currentBrushPreview, classes.selectedPreview);
                WinUtils.addClass(event.currentTarget, classes.selectedPreview);
            });

            panModeDiv.addEventListener("MSPointerUp", function (event) {
                if (pointerDown) {
                    AppNS.CanvasManager.canvasBlocked = true;
                    AppNS.CanvasManager.canvasPannable = true;
                    hideFlyout(brushFlyout);
                    currentBrushPreview = event.currentTarget;
                    commandBar.setCommandState(commandNames.brush, panModeStateId);
                    pointerDown = false;
                    closeFlyouts();
                }
            });

            brushFlyout.appendChild(panModeDiv);

            for (toolName in CanvasManager.ToolCards) {
                var brushPreviewCanvas = document.createElement("canvas");
                brushFlyoutDomElements[toolName] = brushPreviewCanvas;
                brushFlyoutPreviews[i] = new AppNS.Painter.Painter(brushPreviewCanvas);
                toolStateId[toolName] = 2 * i;

                if (toolName === AppNS.CanvasManager.ToolNames.Crayon) {
                    // Create texture image for crayon
                    var textureImage = new Image(40, 40);
                    var crayonPainter = brushFlyoutPreviews[i];
                    textureImage.addEventListener("load", function () {
                        var card = CanvasManager.ToolCards[CanvasManager.ToolNames.Crayon];
                        var tool = new card.toolClass();
                        tool.setTexture(textureImage);
                        tool.size = card.supportedSizes[card.defaultSizeIndex];
                        tool[card.optionKey] = card.optionValues[card.defaultOptionIndex];
                        crayonPainter.loadTool(tool, CanvasManager.ToolNames.Crayon);
                        drawPreview(crayonPainter, AppNS.ToolbarManager.ToolbarColors[currentColorId], 30, CanvasManager.ToolNames.Crayon);
                    });
                    textureImage.src = "../Controls/Paint/Res/crayon_texture.png";
                } else {
                    var card = CanvasManager.ToolCards[toolName];
                    var tool = new card.toolClass();
                    tool.size = card.supportedSizes[card.defaultSizeIndex];
                    if (toolName !== CanvasManager.ToolNames.Eraser) {
                        tool[card.optionKey] = card.optionValues[card.defaultOptionIndex];
                    }
                    brushFlyoutPreviews[i].loadTool(tool, toolName);
                }

                brushFlyoutPreviews[i].loadTool(tool, toolName);

                // Set default option value in tool
                if (toolName !== CanvasManager.ToolNames.Eraser) {
                    tool[CanvasManager.ToolCards[toolName].optionKey] = CanvasManager.ToolCards[toolName].optionValues[CanvasManager.ToolCards[toolName].defaultOptionIndex];
                }

                brushPreviewCanvas.id = classes.brushPreviewPrefix + toolName;
                brushPreviewCanvas.className = classes.brushPreview;

                brushPreviewCanvas.addEventListener("MSPointerOut", function (event) {
                    if (pointerDown) {
                        WinUtils.removeClass(event.currentTarget, classes.selectedPreview);
                        WinUtils.addClass(currentBrushPreview, classes.selectedPreview);
                        pointerDown = false;
                    }
                });

                brushPreviewCanvas.addEventListener("MSPointerDown", function (event) {
                    pointerDown = true;
                    WinUtils.removeClass(currentBrushPreview, classes.selectedPreview);
                    WinUtils.addClass(event.currentTarget, classes.selectedPreview);
                });

                brushPreviewCanvas.addEventListener("MSPointerUp", function (event) {
                    if (pointerDown) {
                        if (CanvasManager.canvasPannable) {
                            AppNS.CanvasManager.canvasBlocked = false;
                            AppNS.CanvasManager.canvasPannable = false;
                        }

                        var selectedTool = event.currentTarget.id.substr(14);
                        if (currentBrush === CanvasManager.ToolNames.Eraser && selectedTool !== CanvasManager.ToolNames.Eraser) {
                            showElement(document.getElementById(classes.commandToolbarOption));
                        }

                        if (selectedTool === CanvasManager.ToolNames.Eraser) {
                            hideElement(document.getElementById(classes.commandToolbarOption));
                        } else {
                            commandBar.setCommandState(commandNames.option, toolStateId[selectedTool]);
                        }

                        // Set tool to be drawn with to the selected tool
                        CanvasManager.tool = selectedTool;

                        // Set the option command label if the selected tool is not the eraser and we are not in snap view
                        if (selectedTool !== CanvasManager.ToolNames.Eraser && currentLayoutState !== layoutState.snapped) {
                            document.querySelector("#" + classes.commandToolbarOption + " ." + classes.commandLabel).innerText = CanvasManager.ToolCards[selectedTool].optionLabel; // TODO: Win8Bugs 423768 CommandBar - Provide API to change command text
                            redrawOptionPreviews = true;
                        }

                        // Remove previous highlights
                        WinUtils.removeClass(currentSizePreview[currentBrush], classes.selectedPreview);
                        if (currentBrush !== CanvasManager.ToolNames.Eraser) {
                            WinUtils.removeClass(currentOptionPreview[currentBrush], classes.selectedPreview);
                        }

                        // If there's no previous selection for size, set the default
                        if (!currentSizePreview[selectedTool]) {
                            currentSizePreview[selectedTool] = sizeFlyoutDomElements[CanvasManager.ToolCards[selectedTool].defaultSizeIndex];
                        }

                        // If there's no previous selection for option, set the default
                        if (!currentOptionPreview[selectedTool] && selectedTool !== CanvasManager.ToolNames.Eraser) {
                            currentOptionPreview[selectedTool] = optionFlyoutDomElements[CanvasManager.ToolCards[selectedTool].defaultOptionIndex];
                        }

                        // Apply size and option selections
                        WinUtils.addClass(currentSizePreview[selectedTool], classes.selectedPreview);
                        if (selectedTool !== CanvasManager.ToolNames.Eraser) {
                            WinUtils.addClass(currentOptionPreview[selectedTool], classes.selectedPreview);
                        }

                        // Apply brush selection
                        currentBrushPreview = event.currentTarget;
                        lastBrushPreview = event.currentTarget;
                        redrawSizePreviews = true;
                        commandBar.setCommandState(commandNames.brush, toolStateId[selectedTool]);
                        currentBrush = selectedTool;
                        closeFlyouts();
                        pointerDown = false;
                    }
                });
                brushFlyout.appendChild(brushPreviewCanvas);
                brushPreviewCanvas.height = brushPreviewCanvas.offsetHeight;
                brushPreviewCanvas.width = brushPreviewCanvas.offsetWidth;
                i++;
            }

            var currentBrushPreview;
            if (state.toolName) {
                currentBrushPreview = brushFlyoutDomElements[state.toolName];
            } else {
                currentBrushPreview = brushFlyoutDomElements[currentBrush];
            }

            WinUtils.addClass(currentBrushPreview, classes.selectedPreview);
			var lastBrushPreview = currentBrushPreview;

            // Size flyout
            var sizeFlyoutPreviews = [];
            var sizeFlyoutDomElements = [];

            // Create canvases for size previews
            for (i = 0, len = CanvasManager.ToolCards[currentBrush].supportedSizes.length; i < len; i++) {
                var sizePreviewCanvas = document.createElement("canvas");
                sizeFlyoutDomElements[i] = sizePreviewCanvas;

                if (i < 3) {
                    sizePreviewCanvas.className = classes.brushWidthThick;
                } else {
                    sizePreviewCanvas.className = classes.brushWidthThin;
                }

                sizePreviewCanvas.id = classes.sizePreviewPrefix + i;
                sizeFlyoutPreviews[i] = new AppNS.Painter.Painter(sizePreviewCanvas);
                CanvasManager.loadAllTools(sizeFlyoutPreviews[i]);
                sizeFlyout.appendChild(sizePreviewCanvas);

                sizePreviewCanvas.addEventListener("MSPointerOut", function (event) {
                    if (pointerDown) {
                        WinUtils.removeClass(event.currentTarget, classes.selectedPreview);
                        WinUtils.addClass(currentSizePreview[currentBrush], classes.selectedPreview);
                        pointerDown = false;
                    }
                });

                sizePreviewCanvas.addEventListener("MSPointerDown", function (event) {
                    pointerDown = true;
                    WinUtils.removeClass(currentSizePreview[currentBrush], classes.selectedPreview);
                    WinUtils.addClass(event.currentTarget, classes.selectedPreview);
                });

                sizePreviewCanvas.addEventListener("MSPointerUp", function (event) {
                    if (pointerDown) {
                        var selectedSize = event.currentTarget.id.substr(13);
                        CanvasManager.toolWidth = CanvasManager.ToolCards[currentBrush].supportedSizes[selectedSize];
                        currentWidth = CanvasManager.ToolCards[currentBrush].supportedSizes[selectedSize];
                        currentSizePreview[currentBrush] = event.currentTarget;
                        closeFlyouts();
                        pointerDown = false;
                    }
                });

                sizePreviewCanvas.height = sizePreviewCanvas.offsetHeight;
                sizePreviewCanvas.width = sizePreviewCanvas.offsetWidth;
            }

            var currentSizePreview = {};

            // Set default size preview
            if (state.currentSizePreviewIndexes) {
                for (toolName in state.currentSizePreviewIndexes) {
                    currentSizePreview[toolName] = sizeFlyoutDomElements[getPersistedPreviewIndex(previewIndexTypes.size, toolName)];
                }
            } else {
                currentSizePreview[currentBrush] = sizeFlyoutDomElements[CanvasManager.ToolCards[currentBrush].defaultSizeIndex];
            }

            WinUtils.addClass(currentSizePreview[currentBrush], classes.selectedPreview);

            // Option flyout
            var optionFlyoutPreviews = [];
            var optionFlyoutDomElements = [];

            // Create canvases for option previews
            for (i = 0, len = CanvasManager.ToolCards[currentBrush].optionValues.length; i < len; i++) {
                var optionPreviewCanvas = document.createElement("canvas");
                optionPreviewCanvas.id = classes.optionPreviewPrefix + i;
                optionFlyoutPreviews[i] = new AppNS.Painter.Painter(optionPreviewCanvas);
                optionFlyoutDomElements[i] = optionPreviewCanvas;
                CanvasManager.loadAllTools(optionFlyoutPreviews[i]);
                optionFlyout.appendChild(optionPreviewCanvas);
                optionPreviewCanvas.className = classes.brushWidthThin;

                optionPreviewCanvas.addEventListener("MSPointerOut", function (event) {
                    if (pointerDown) {
                        WinUtils.removeClass(event.currentTarget, classes.selectedPreview);
                        WinUtils.addClass(currentOptionPreview[currentBrush], classes.selectedPreview);
                        pointerDown = false;
                    }
                });

                optionPreviewCanvas.addEventListener("MSPointerDown", function (event) {
                    pointerDown = true;
                    WinUtils.removeClass(currentOptionPreview[currentBrush], classes.selectedPreview);
                    WinUtils.addClass(event.currentTarget, classes.selectedPreview);
                });

                optionPreviewCanvas.addEventListener("MSPointerUp", function (event) {
                    if (pointerDown) {
                        var selectedOption = event.currentTarget.id.substr(15);

                        // Set new option
                        if (CanvasManager.ToolCards[currentBrush].optionKey) {
                            CanvasManager.setToolProperty(CanvasManager.ToolCards[currentBrush].optionKey, CanvasManager.ToolCards[currentBrush].optionValues[selectedOption]);
                        }
                        currentOptionPreview[currentBrush] = event.currentTarget;
                        closeFlyouts();
                        pointerDown = false;
                    }
                });

                optionPreviewCanvas.height = optionPreviewCanvas.offsetHeight;
                optionPreviewCanvas.width = optionPreviewCanvas.offsetWidth;
            }

            var currentOptionPreview = {};

            // Set default option preview
            if (state.currentOptionPreviewIndexes) {
                for (toolName in state.currentOptionPreviewIndexes) {
                    currentOptionPreview[toolName] = optionFlyoutDomElements[getPersistedPreviewIndex(previewIndexTypes.option, toolName)];
                }
            } else {
                currentOptionPreview[currentBrush] = optionFlyoutDomElements[CanvasManager.ToolCards[currentBrush].defaultOptionIndex];
            }

            WinUtils.addClass(currentOptionPreview[currentBrush], classes.selectedPreview);

            // Helper function to render brush options on canvases
            var renderBrushOptions = function (previews, brush) {
                for (i = 0, len = previews.length; i < len; i++) {
                    drawPreview(previews[i], null, null, brush, CanvasManager.ToolCards[brush].optionKey, CanvasManager.ToolCards[brush].optionValues[i]);
                }
            };

            function hideUndo() {
                if (!CanvasManager.canUndo() && currentLayoutState === layoutState.fullScreen) {
                    hideElement(document.getElementById(classes.commandToolbarUndo));
                }
            }

            // Shows the undo button if in the fullscreen state and the canvas can undo
            function showUndo() {
                if (currentLayoutState === layoutState.fullScreen && CanvasManager.canUndo() && appBar.style.visibility === styles.visible) {
                    showElement(document.getElementById(classes.commandToolbarUndo));
                }
            }

            WinUI.getControl(appBar).addEventListener("beforeshow", function () {
                if (CanvasManager.canUndo() && currentLayoutState === layoutState.fullScreen) {
                    showElement(document.getElementById(classes.commandToolbarUndo));
                }
            });

            AppNS.ToolbarManager.hideUndo = hideUndo;
            AppNS.ToolbarManager.showUndo = showUndo;

            // Command event listeners
            commandBar.addEventListener("commandinvoked", function (event) {
                // Set command state to clicked
                if (event.payload.name === commandNames.brush || event.payload.name === commandNames.option) {
                    commandBar.setCommandState(event.payload.name, toolStateId[currentBrush] + 1);
                } else if (event.payload.name !== commandNames.undo && event.payload.name !== commandNames.clear) {
                    commandBar.setCommandState(event.payload.name, 1);
                }
                if (currentCommandName) {
                    restoreCommand(currentCommandName);
                }
                currentCommandName = event.payload.name;
                switch (currentCommandName) {
                    case commandNames.brush:
                        if (brushFlyout.style.visibility !== styles.visible) {
                            dismissAllFlyouts();
                            showDismissAreas();
                            if (redrawBrushPreviews) {
                                var i = 0;
                                for (toolName in CanvasManager.ToolCards) {
                                    drawPreview(brushFlyoutPreviews[i], currentColorString, 30, toolName);
                                    i++;
                                }
                                redrawBrushPreviews = false;
                            }
                            showFlyout(brushFlyout, document.getElementById(classes.commandToolbarBrush), "top");
                        } else {
                            closeFlyouts();
                        }
                        break;

                    case commandNames.size:
                        if (sizeFlyout.style.visibility !== styles.visible) {
                            dismissAllFlyouts();
                            showDismissAreas();
                            if (redrawSizePreviews) {
                                for (var i = 0, len = CanvasManager.ToolCards[currentBrush].supportedSizes.length; i < len; i++) {
                                    if (i < 3) {
                                        drawPreview(sizeFlyoutPreviews[i], currentColorString, CanvasManager.ToolCards[currentBrush].supportedSizes[i], currentBrush, null, null, 50);
                                    } else {
                                        drawPreview(sizeFlyoutPreviews[i], currentColorString, CanvasManager.ToolCards[currentBrush].supportedSizes[i], currentBrush);
                                    }
                                }
                                redrawSizePreviews = false;
                            }
                            showFlyout(sizeFlyout, document.getElementById(classes.commandToolbarSize), "top");
                        } else {
                            closeFlyouts();
                        }
                        break;

                    case commandNames.option:
                        if (optionFlyout.style.visibility !== styles.visible) {
                            dismissAllFlyouts();
                            showDismissAreas();
                            if (redrawOptionPreviews) {
                                if (CanvasManager.ToolCards[currentBrush].optionKey) {
                                    for (var i = 0, len = CanvasManager.ToolCards[currentBrush].optionValues.length; i < len; i++) {
                                        drawPreview(optionFlyoutPreviews[i], currentColorString, 30, currentBrush, CanvasManager.ToolCards[currentBrush].optionKey, CanvasManager.ToolCards[currentBrush].optionValues[i]);
                                    }
                                }
                                redrawOptionPreviews = false;
                            }
                            showFlyout(optionFlyout, document.getElementById(classes.commandToolbarOption), "top");
                        } else {
                            closeFlyouts();
                        }
                        break;

                    case commandNames.undo:
                        CanvasManager.undoCanvas()
                        break;

                    case commandNames.clear:
                        CanvasManager.clearCanvas();
                        break;

                    case commandNames.more:
                        if (moreFlyout.style.visibility !== styles.visible) {
                            dismissAllFlyouts();
                            showDismissAreas();
                            showFlyout(moreFlyout, document.getElementById(classes.commandToolbarMore), "top");
                        } else {
                            closeFlyouts();
                        }
                        break;
                }
            });

            document.getElementById(classes.undoButton).addEventListener("click", function () {
                CanvasManager.undoCanvas();
                closeFlyouts();
            });

            document.getElementById(classes.clearButton).addEventListener("click", function () {
                CanvasManager.clearCanvas();
                closeFlyouts();
            });

            colorPicker.addEventListener("colorselected", function (event) {
                CanvasManager.color = event.payload.color;
                currentColorId = event.payload.colorId;
                currentColorString = event.payload.color;
                redrawBrushPreviews = true;
                redrawSizePreviews = true;
                redrawOptionPreviews = true;
            });

            // Preselect color
            colorPicker.selectColor(currentColorId);

            // Helper functions for showing and hiding flyouts
            var showFlyout = function (flyout, anchor, position) {
                WinUI.getControl(flyout).show(anchor, position);
            };

            var hideFlyout = function (flyout) {
                WinUI.getControl(flyout).hide();
            };

            // Helper function to dismiss all flyouts
            var dismissAllFlyouts = function () {
                hideFlyout(brushFlyout);
                hideFlyout(sizeFlyout);
                hideFlyout(optionFlyout);
            };

            // Helper function to restore brush and option commands to the selected state
            var restoreBrushCommands = function () {
                commandBar.setCommandState(commandNames.brush, toolStateId[currentBrush]);
                commandBar.setCommandState(commandNames.option, toolStateId[currentBrush]);
            };

            var changeLayout = function (newLayout) {
                /// <summary>
                /// Changes the toolbar layout to a specified layout such as snap or fill
                /// </summary>
                /// <param name='newLayout'>
                /// layoutState to be changed to
                /// </param>
                if (newLayout === layoutState.fullScreen) {
                    panModeDiv.style.display = "none";
                    CanvasManager.canvasBlocked = false;
                    CanvasManager.canvasPannable = false;
                    WinUtils.removeClass(currentBrushPreview, classes.selectedPreview);
                    WinUtils.addClass(lastBrushPreview, classes.selectedPreview);
                    currentBrushPreview = lastBrushPreview;
                    colorPicker.width = colorPickerFullWidth;
                    commandBar.setCommands(getCommandNamesForLayout(layoutState.fullScreen))
                        .then(restoreBrushCommands);
                } else {
                    panModeDiv.style.display = "block";
                    if (newLayout === layoutState.snapped) {
                        if (currentLayoutState !== layoutState.snapped) {
                            // Center command icons
                            document.querySelector(".win-commandBar-horiz").style.marginLeft = (window.innerWidth - 200) / 2 + "px";
                        }
                        commandBar.setCommands(getCommandNamesForLayout(layoutState.snapped))
                            .then(restoreBrushCommands);
                    } else if (newLayout === layoutState.filled) {
                        colorPicker.width = colorPickerFillWidth;
                        commandBar.setCommands(getCommandNamesForLayout(layoutState.filled))
                            .then(restoreBrushCommands);
                    }
                }
                if (currentLayoutState === layoutState.snapped && newLayout !== currentLayoutState) {
                    document.querySelector("." + classes.winCommandBarHoriz).style.marginLeft = unSnappedLeftMargin + "px";
                }
                currentLayoutState = newLayout;
            };

            // Set commands
            if (currentLayoutState === layoutState.fullScreen) {
                commandBar.setCommands(getCommandNamesForLayout(layoutState.fullScreen));
            } else {
                changeLayout(currentLayoutState);
            }

            // Hide undo if no undo data was persisted
            if (!state.undoBlobNames && currentLayoutState === layoutState.fullScreen) {
                hideElement(document.getElementById(classes.commandToolbarUndo));
            }

            // Initialize commands with persisted state
            if (state.toolName) {
                var commandStateId = toolStateId[state.toolName];
                commandBar.setCommandState(commandNames.brush, commandStateId);
                if (state.toolName !== CanvasManager.ToolNames.Eraser) {
                    commandBar.setCommandState(commandNames.option, commandStateId);
                }
            }

            // Show appbar
            commandBar.show();

            WinJS.Namespace.defineWithParent(AppNS, "ToolbarManager", {
                toolName: {
                    get: function () {
                        /// <summary>
                        /// Gets the current tool name
                        /// </summary>
                        /// <returns>
                        /// String
                        /// </returns>
                        return currentBrush;
                    }
                },

                colorId: {
                    get: function () {
                        /// <summary>
                        /// Gets the current color id
                        /// </summary>
                        /// <returns>
                        /// Number
                        /// </returns>
                        return currentColorId;
                    }
                },

                optionValueIndex: {
                    get: function () {
                        /// <summary>
                        /// Gets the current option value index for the current tool
                        /// </summary>
                        /// <returns>
                        /// Number
                        /// </returns>
                        return parseInt(currentOptionPreview[currentBrush].id.substr(15));
                    }
                },

                currentSizePreviewIndexes: {
                    get: function () {
                        /// <summary>
                        /// Gets the an object with the current size index for all the tools
                        /// </summary>
                        /// <returns>
                        /// Object. Keys are tool names, values are the size index for that tool
                        /// </returns>
                        var sizePreviewIndexes = {};
                        for (toolName in currentSizePreview) {
                            sizePreviewIndexes[toolName] = parseInt(currentSizePreview[toolName].id.substr(13));
                        }
                        return sizePreviewIndexes;
                    }
                },

                currentOptionPreviewIndexes: {
                    get: function () {
                        /// <summary>
                        /// Gets the an object with the current size index for all the tools
                        /// </summary>
                        /// <returns>
                        /// An object in which keys are tool names and values are the size index for that tool
                        /// </returns>
                        var optionPreviewIndexes = {};
                        for (toolName in currentOptionPreview) {
                            optionPreviewIndexes[toolName] = parseInt(currentOptionPreview[toolName].id.substr(15));
                        }
                        return optionPreviewIndexes;
                    }
                },

                changeLayout: changeLayout
            });
        }
    });
})(Microsoft.Paint);