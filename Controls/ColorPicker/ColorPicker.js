////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (BaseNS) {
    var WinUtils = WinJS.Utilities;
    WinJS.Namespace.defineWithParent(BaseNS, "Paint", {

    // ColorPicker class

        ColorPicker: WinJS.Class.define(function (host, colors, options) {
            /// <summary>
            /// Initialize and render a ColorPicker
            /// </summary>
            /// <param name='host'>
            /// DOM element that will host the color picker
            /// </param>
            /// <param name='colors'>
            /// Array of css-style colors represented as strings
            /// </param>
            /// <param name='options' optional='true'>
            /// Object of options
            /// </param>

            this._host = host;
            this._colors = colors;
            this._options = options || {};
            this._colorDomElements = [];
            this._colorBlockClassName = "colorpicker-color";
            this._previousMouseMoveX = false;

            // Set up options
            this._options.height = this._options.height || 50;
            this._options.width = this._options.width || 600;
            this._options.separation = this._options.separation || 0;
            this._options.selectedHeight = (this._options.selectedHeightGrowth * this._options.height) || this._options.height;
            this._colorBlockWidth = this._options.width / this._colors.length;
            this._options.selectedWidth = (this._options.selectedWidthGrowth * this._colorBlockWidth) || this._options.colorBlockWidth;
            this._options.hoverWidth = (this._options.hoverWidthGrowth * this._colorBlockWidth) || this._options.colorBlockWidth;
            this._options.hoverHeight = (this._options.hoverHeightGrowth * this._options.height) || this._options.height;
            this._options.bottomPosition = this._options.bottomPosition || 0;
            this._options.affectedNeighbors = this._options.affectedNeighbors || 0;
            this._direction = { left: 0, right: 1 };

            // Create container
            this._colorPickerContainer = document.createElement("div");
            this._colorPickerContainer.className = "colorpicker";

            // Create color block for each color
            for (var i = 0, len = this._colors.length; i < len; i++) {
                var colorBlock = document.createElement("button");
                colorBlock.className = this._colorBlockClassName;
                colorBlock.style.height = this._options.height + "px";
                colorBlock.style.width = this._colorBlockWidth + "px";
                colorBlock.style.left = i * this._colorBlockWidth + "px";
                colorBlock.style.bottom = this._options.bottomPosition + "px";
                colorBlock.style.minWidth = colorBlock.style.width;
                colorBlock.id = i;
                if (i !== len - 1) {
                    colorBlock.style.marginRight = this._options.separation;
                }
                colorBlock.style.background = this._colors[i];

                this._down = false;
                var that = this;

                // Set up color block event listeners
                colorBlock.addEventListener("MSPointerDown", function (event) {
                    that._pointerDown = true;
                    if (that._currentSelection) {
                        that._unselectColorBlock(that._currentSelection);
                    }
                    that._expandColorBlock(event.currentTarget, false, true);
                    that._currentHover = event.currentTarget;
                });

                colorBlock.addEventListener("MSPointerUp", function (event) {
                    if (that._pointerDown) {
                        that._pointerDown = false;
                        that._unselectColorBlock(that._currentSelection);
                        that._contractColorBlock(that._currentHover, false, true);
                        that._selectColorBlock(that._currentHover);
                        that._currentSelection = that._currentHover;
                        that._currentHover = null;
                        that._colorSelected = true;
                    }
                });

                colorBlock.addEventListener("mouseover", function (event) {
                    that._unselectColorBlock(that._currentSelection);
                    that._selectColorBlock(event.currentTarget);
                    that._expandColorBlock(event.currentTarget, false, true);
                    that._currentHover = event.currentTarget;
                });

                colorBlock.addEventListener("mousemove", function (event) {
                    var currentId = parseInt(event.currentTarget.id);
                    if (that._currentHover) {
                        if (that._currentHover !== event.currentTarget) {
                            that._unselectColorBlock(that._currentSelection);
                            if (that._currentHover) {
                                that._contractColorBlock(that._currentHover, false, true);
                            }
                            that._expandColorBlock(event.currentTarget, false, true);
                            that._currentHover = event.currentTarget;
                        } else if ((event.offsetX > that._options.hoverWidth - (that._options.hoverWidth / 6) && currentId < that._colors.length - 1) &&
                                    that._previousMouseMoveX && (that._previousMouseMoveX < event.offsetX)) {
                            that._contractColorBlock(that._currentHover, false, true);
                            that._expandColorBlock(that._colorDomElements[currentId + 1], false, true);
                            that._currentHover = that._colorDomElements[currentId + 1];
                            that._previousMouseMoveX = 0;
                        } else if ((event.offsetX < that._options.hoverWidth / 6 && currentId > 0) &&
                                that._previousMouseMoveX && (that._previousMouseMoveX > event.offsetX)) {
                            that._contractColorBlock(that._currentHover, false, true);
                            that._expandColorBlock(that._colorDomElements[currentId - 1], false, true);
                            that._currentHover = that._colorDomElements[currentId - 1];
                            that._previousMouseMoveX = 0;
                        } else {
                            that._previousMouseMoveX = event.offsetX;
                        }
                    }
                });

                colorBlock.addEventListener("MSTransitionEnd", function (event) {
                    if (parseInt(event.currentTarget.style.height) === that._options.height) { // If it is a contraction transition
                        if (!this._pointerDown && that._colorSelected) {
                            that._fireEvent("colorselected", { color: that._currentSelection.style.background, colorId: parseInt(that._currentSelection.id) });
                            that._colorSelected = false;
                        }
                        event.currentTarget.style.zIndex = 1;
                    }
                    WinUtils.removeClass(event.currentTarget, "colorpicker-animatedColor");
                });

                colorBlock.addEventListener("mouseout", function (event) {
                    if (event.relatedTarget.className.indexOf(that._colorBlockClassName) === -1) {
                        that._contractColorBlock(event.currentTarget, false, true);
                        if (that._currentHover) {
                            that._contractColorBlock(that._currentHover, false, true);
                        }
                        if (that._pointerDown) {
                            that._pointerDown = false;
                            that._unselectColorBlock(that._currentSelection);
                            that._unselectColorBlock(that._currentHover);
                            that._currentSelection = event.currentTarget;
                            that._fireEvent("colorselected", { color: that._currentSelection.style.background, colorId: parseInt(that._currentSelection.id) });
                        }
                        that._selectColorBlock(that._currentSelection);
                        that._currentHover = null;
                    }
                });

                this._colorPickerContainer.appendChild(colorBlock);
                this._colorDomElements[i] = colorBlock;
            }
            host.appendChild(this._colorPickerContainer);
        },
        {
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

                this._host.addEventListener(eventName, eventCallback, capture);
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

                this._host.removeEventListener(eventName, eventCallback, capture);
            },

            selectColor: function (color) {
                this._currentSelection = this._colorDomElements[color];
                this._selectColorBlock(this._currentSelection);
                this._fireEvent("colorselected", { color: this._colorDomElements[color].style.background, colorId: color });
            },

            width: {
                set: function (newWidth) {
                    this._colorBlockWidth = newWidth / this._colors.length;
                    for (var i = 0, len = this._colors.length; i < len; i++) {
                        var colorBlock = this._colorDomElements[i];
                        colorBlock.style.width = this._colorBlockWidth + "px";
                        colorBlock.style.left = i * this._colorBlockWidth + "px";
                        colorBlock.style.minWidth = colorBlock.style.width;
                        if (this._selectedColor) {
                            this._selectColorBlock(this._selectedColor);
                        }
                    }
                }
            },

            // Raises an event to listeners
            _fireEvent: function (eventName, payload) {
                if (document.createEvent) {
                    var eventObject = document.createEvent("Event");
                    eventObject.initEvent(eventName, true, false);

                    if (payload) {
                        eventObject.payload = payload;
                    }

                    this._host.dispatchEvent(eventObject);
                }
            },

            // Expands a specified color block element
            _expandColorBlock: function (colorBlockElement, animated, animateNeighbors) {
                var currentId = parseInt(colorBlockElement.id);
                var newLeft = (currentId * this._colorBlockWidth) - (this._options.hoverWidth - this._colorBlockWidth) / 2;
                if (animated) {
                    WinUtils.addClass(colorBlockElement, "colorpicker-animatedColor");
                }

                colorBlockElement.style.zIndex = 999;
                colorBlockElement.style.width = this._options.hoverWidth + "px";
                colorBlockElement.style.height = this._options.hoverHeight + "px";
                colorBlockElement.style.bottom = this._options.bottomPosition - (this._options.hoverHeight - this._options.height) / 2 + "px";
                colorBlockElement.style.left = newLeft + "px";
                WinUtils.addClass(colorBlockElement, "colorpicker-selectedColor");

                if (animated) {
                    WinUtils.removeClass(colorBlockElement, "colorpicker-animatedColor");
                }

                for (var i = 0, widthCount = 0; i < this._options.affectedNeighbors; i++) {
                    var newHeight = this._options.hoverHeight - (((this._options.hoverHeight - this._options.height) / (this._options.affectedNeighbors + 1)) * (i + 1));
                    var newWidth = this._options.hoverWidth - (((this._options.hoverWidth - this._colorBlockWidth) / (this._options.affectedNeighbors + 1)) * (i + 1));

                    if (this._colorDomElements[currentId + i + 1]) {
                        this._colorDomElements[currentId + i + 1].zIndex = 1;
                        this._colorDomElements[currentId + i + 1].style.height = newHeight + "px";
                        this._colorDomElements[currentId + i + 1].style.bottom = this._options.bottomPosition - (newHeight - this._options.height) / 2 + "px";
                        if (animateNeighbors && this._colorDomElements[currentId + i + 1] !== this._lastExpansion) {
                            WinUtils.addClass(this._colorDomElements[currentId + i + 1], "colorpicker-animatedColor");
                        }
                    }
                    if (this._colorDomElements[currentId - i - 1]) {
                        this._colorDomElements[currentId - i - 1].style.height = newHeight + "px";
                        this._colorDomElements[currentId - i - 1].style.bottom = this._options.bottomPosition - (newHeight - this._options.height) / 2 + "px";
                        if (animateNeighbors && this._colorDomElements[currentId - i - 1] !== this._lastExpansion) {
                            WinUtils.addClass(this._colorDomElements[currentId - i - 1], "colorpicker-animatedColor");
                        }
                    }
                    widthCount += newWidth;
                }
            },

            // Contracts a specified color block element
            _contractColorBlock: function (colorBlockElement, animated, animateNeighbors) {
                var currentId = parseInt(colorBlockElement.id);
                if (animated) {
                    WinUtils.addClass(colorBlockElement, "colorpicker-animatedColor");
                }

                colorBlockElement.style.width = this._colorBlockWidth + "px";
                colorBlockElement.style.height = this._options.height + "px";
                colorBlockElement.style.bottom = this._options.bottomPosition + "px";
                colorBlockElement.style.left = (currentId * this._colorBlockWidth) + "px";

                WinUtils.removeClass(colorBlockElement, "colorpicker-selectedColor");

                if (animated) {
                    WinUtils.removeClass(colorBlockElement, "colorpicker-animatedColor");
                }

                for (var i = 0; i < this._options.affectedNeighbors; i++) {
                    if (this._colorDomElements[currentId + i + 1]) {
                        if (animateNeighbors) {
                            WinUtils.addClass(this._colorDomElements[currentId + i + 1], "colorpicker-animatedColor");
                        }
                        this._colorDomElements[currentId + i + 1].style.height = this._options.height + "px";
                        this._colorDomElements[currentId + i + 1].style.bottom = this._options.bottomPosition + "px";
                    }
                    if (this._colorDomElements[currentId - i - 1]) {
                        if (animateNeighbors) {
                            WinUtils.addClass(this._colorDomElements[currentId - i - 1], "colorpicker-animatedColor");
                        }
                        this._colorDomElements[currentId - i - 1].style.height = this._options.height + "px";
                        this._colorDomElements[currentId - i - 1].style.bottom = this._options.bottomPosition + "px";
                    }
                }

                if (!animated) {
                    colorBlockElement.style.zIndex = 1;
                }

                this._lastExpansion = colorBlockElement;
            },

            // Applies selection style to a specified color block
            _selectColorBlock: function (colorBlockElement) {
                var currentId = parseInt(colorBlockElement.id);
                WinUtils.addClass(colorBlockElement, "colorpicker-selectedColor");
                colorBlockElement.style.height = this._options.selectedHeight + "px";
                colorBlockElement.style.width = this._options.selectedWidth + "px";
                colorBlockElement.style.bottom = this._options.bottomPosition - (this._options.selectedHeight - this._options.height) / 2 + "px";
                colorBlockElement.style.left = (currentId * this._colorBlockWidth) - (this._options.selectedWidth - this._colorBlockWidth) / 2 + "px";
                colorBlockElement.style.zIndex = 999;
            },

            // Applies selection style to a specified color block
            _unselectColorBlock: function (colorBlockElement) {
                var currentId = parseInt(colorBlockElement.id);
                WinUtils.removeClass(colorBlockElement, "colorpicker-selectedColor");
                colorBlockElement.style.height = this._options.height + "px";
                colorBlockElement.style.width = this._colorBlockWidth + "px";
                colorBlockElement.style.bottom = this._options.bottomPosition + "px";
                colorBlockElement.style.left = (currentId * this._colorBlockWidth) + "px";
                colorBlockElement.style.zIndex = 1;
            }
        })
    });
})(Microsoft);