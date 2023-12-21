////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

/// <reference path="WinLib/Js/animations.js" />
/// <reference path="WinLib/Js/base.js" />
/// <reference path="WinLib/Js/ui.js" />

(function (WinNS) {
    var Utilities = WinJS.Utilities;
    var WinUI = WinJS.UI;
    var Animation = WinJS.UI.Animation;

    var elementIsInvalid = "Invalid argument: Control expects a valid DOM element as the first argument.";
    var systemMargin = 20; // flyout cannot get closer than 45px to the edge of the screen

    var Controls = WinJS.Namespace.defineWithParent(WinNS, "MediaApp.Controls", {
        Anchor: {
            topLeft: "topLeft",
            topRight: "topRight",
            bottomRight: "bottomRight",
            bottomLeft: "bottomLeft"
        },

        Flyout: WinJS.Class.define(function (element, options) {
            if (!element) {
                throw new Error(elementIsInvalid);
            }

            // Configure host element

            if (this === window || this === Controls) {
                var flyout = WinUI.getControl(element);

                if (flyout) {
                    return flyout;
                } else {
                    return new Controls.Flyout(element, options);
                }
            }

            // Attach the JS object to the host DOM element.
            WinUI.setControl(element, this);

            this._anchor = "topLeft";
            this._content = null;
            this._position = { x: 0, y: 0 };

            this._element = element;
            Utilities.addClass(this.element, "win-mediaFlyout");

            // Process options

            this.anchor = options.anchor;
            this.position = options.position;

            // Create UI elements

            var that = this;

            this._backgroundDiv = document.createElement("div");
            this._backgroundDiv.className = "win-mediaFlyout-background";
            this._backgroundDiv.style.position = "absolute";
            this._backgroundDiv.addEventListener("click", function () {
                that.dismiss();
            }, false);

            this._contentDiv = document.createElement("div");
            this._contentDiv.className = "win-mediaFlyout-content";
            this._contentDiv.role = "dialog";
            this._contentDiv.setAttribute("aria-label", options.ariaLabel || "Dialog");
            this._contentDiv.style.position = "absolute";
            this._contentDiv.addEventListener("focus", function () {
                that._fireEvent("focus", null);
            }, false);

            this._escPressed = function (event) {
                if (event.key === "Esc") {
                    event.stopPropagation();
                    window.removeEventListener("keypress", arguments.callee, false);
                    that.dismiss();
                }
            };

            this.element.appendChild(this._contentDiv);
            this.element.appendChild(this._backgroundDiv);
        },
        {
            // Public properties

            element: {
                get: function () {
                    return this._element;
                }
            },

            content: {
                get: function () {
                    return this._content;
                },
                set: function (val) {
                    var oldSize = { height: this.height, width: this.width };

                    if (this._content) {
                        document.body.appendChild(this._content);
                    }

                    this._content = val;
                    var newSize = { height: this.height, width: this.width };
                    this._fireEvent("contentupdate", null);

                    if (oldSize.height !== newSize.height ||
                        oldSize.width !== newSize.width) {
                        this._fireEvent("resize", null);
                    }
                }
            },

            height: {
                get: function () {
                    return this._content ? this._content.offsetHeight : 0;
                }
            },

            width: {
                get: function () {
                    return this._content ? this._content.offsetWidth : 0;
                }
            },

            anchor: {
                get: function () {
                    return this._anchor;
                },
                set: function (val) {
                    if (Controls.Anchor[val]) {
                        this._anchor = val;
                    }
                }
            },

            position: {
                get: function () {
                    return this._position;
                },
                set: function (val) {
                    if (val && typeof val.x === "number") {
                        this._position.x = val.x;
                    }

                    if (val && typeof val.y === "number") {
                        this._position.y = val.y;
                    }
                }
            },


            // Public methods

            show: function MediaFlyout_show() {
                if (this._content) {
                    Utilities.empty(this._contentDiv);
                    this._contentDiv.appendChild(this._content);

                    var posX = 0,
                        posY = 0,
                        viewportWidth = window.innerWidth,
                        viewportHeight = window.innerHeight;

                    posX = this._position.x || 0;
                    posY = this._position.y || 0;

                    // Make sure the target position is within the margins

                    if (posX < systemMargin) {
                        posX = systemMargin;
                    } else if (posX > viewportWidth - systemMargin) {
                        posX = viewportWidth - systemMargin;
                    }

                    if (posY < systemMargin) {
                        posY = systemMargin;
                    } else if (posY > viewportHeight - systemMargin) {
                        posY = viewportHeight - systemMargin;
                    }

                    // Compute the upper left corner coords
                    switch (this._anchor) {
                        case Controls.Anchor.topRight:
                            posX -= this.width;
                            break;
                        case Controls.Anchor.bottomRight:
                            posX -= this.width;
                            posY -= this.height;
                            break;
                        case Controls.Anchor.bottomLeft:
                            posY -= this.height;
                            break;
                    }

                    // Ensure a good on-screen fit

                    if (this._anchor === Controls.Anchor.topLeft || this._anchor === Controls.Anchor.bottomLeft) {
                        if (posX + this.width > viewportWidth - systemMargin) {

                            // If it will fit, flip horizontally
                            if (posX - this.width > systemMargin) {
                                posX -= this.width;
                            } else {

                                // Otherwise, size the container and make it scroll
                                this._contentDiv.style.width = viewportWidth - posX - systemMargin + "px";
                                this._contentDiv.style.overflow = "auto";
                            }
                        }
                    }

                    if (this._anchor === Controls.Anchor.topLeft || this._anchor === Controls.Anchor.topRight) {
                        if (posY + this.height > viewportHeight - systemMargin) {

                            // If it will fit, flip vertically
                            if (posY - this.height > systemMargin) {
                                posY -= this.height;
                            } else {

                                // Otherwise, size the container and make it scroll                                
                                this._contentDiv.style.height = viewportHeight - posY - systemMargin + "px";
                                this._contentDiv.style.overflow = "auto";
                            }
                        }
                    }

                    if (this._anchor === Controls.Anchor.bottomLeft || this._anchor === Controls.Anchor.bottomRight) {
                        if (posY < systemMargin) {

                            // If it will fit, flip vertically
                            if (posY + this.height < viewportHeight - systemMargin) {
                                posY += this.height;
                            } else {

                                // Otherwise, size the container and make it scroll
                                this._contentDiv.style.height = posY - systemMargin + "px";
                                this._contentDiv.style.overflow = "auto";
                            }
                        }
                    }

                    if (this._anchor === Controls.Anchor.topRight || this._anchor === Controls.Anchor.bottomRight) {
                        if (posX < systemMargin) {

                            // If it will fit, flip horizontally
                            if (posX + this.width < viewportWidth - systemMargin) {
                                posX += this.width;
                            } else {

                                // Otherwise, size the container and make it scroll
                                this._contentDiv.style.width = posX - systemMargin + "px";
                                this._contentDiv.style.overflow = "auto";
                            }
                        }
                    }

                    this._contentDiv.style.left = posX + "px";
                    this._contentDiv.style.top = posY + "px";
                    this._contentDiv.style.opacity = 1;
                    this._contentDiv.style.visibility = "visible";
                    this._backgroundDiv.style.visibility = "visible";
                    var that = this;

                    window.addEventListener("keypress", that._escPressed, false);

                    Animation.showPopup(this._contentDiv, { top: "0px", left: "0px" })
                        .then(function () {
                            that._fireEvent("show", null);
                        });
                }
            },

            dismiss: function MediaFlyout_dismiss() {
                this._contentDiv.style.opacity = 0;
                this._contentDiv.style.visibility = "hidden";
                this._backgroundDiv.style.visibility = "hidden";
                var that = this;

                // TODO: restore once animations complete correctly
                /// Animation.hidePopup(this._contentDiv, { top: "0px", left: "0px" })
                ///     .then(function () {
                ///         that._fireEvent("dismiss", null);
                ///     });

                this._fireEvent("dismiss", null);
            },

            addEventListener: function MediaFlyout_addEventListener(type, listener, useCapture) {
                this.element.addEventListener(type, listener, useCapture);
            },

            removeEventListener: function MediaFlyout_removeEventListener(type, listener, useCapture) {
                this.element.removeEventListener(type, listener, useCapture);
            },

            // Private methods            

            // Raises an event to external listeners with the specified name and payload
            _fireEvent: function MediaFlyout_fireEvent(eventName, payload) {
                if (document.createEvent) {
                    var eventObject = document.createEvent("Event");
                    eventObject.initEvent(eventName, true, false);

                    if (payload !== undefined) {
                        eventObject.payload = payload;
                    }

                    this.element.dispatchEvent(eventObject);
                }
            }
        })
    });
})(WinJS);