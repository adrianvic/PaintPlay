////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

/// <reference path="WinLib/Js/base.js" />
/// <reference path="WinLib/Js/controls.js" />
/// <reference path="WinLib/Js/ui.js" />
/// <reference path="Flyout.js" />

(function (WinNS) {
    var Utilities = WinNS.Utilities;
    var Animation = WinNS.UI.Animation;
    var Controls = WinNS.MediaApp.Controls;
    var Promise = WinNS.Promise;

    var elementIsInvalid = "Invalid argument: Control expects a valid DOM element as the first argument.";
    var missingParameter = "Required argument missing or wrong type: ";
    var tokenPattern = /{{(\w+)}}/g;
    var groupDescribedById = "groupDescribedBy_{0}_{1}";
    var commandDescribedById = "commandDescribedBy_{0}_{1}";
    var groupElementId = "commandGroup_{0}_{1}";
    var commandElementId = "command_{0}_{1}";
    var flyoutElementId = "flyout_{0}";

    var formatString = function (str, /*@type(Array)*/args) {
        if (!Array.isArray(args)) {
            throw new Error("Invalid argument: Expect 'args' to be an array");
        }

        return str.replace(/{(\d+)}/g, function (placeHolder, index) {
            var token = args[index];

            if (token === undefined) {
                token = placeHolder;
            } else if (token === null) {
                token = "";
            }

            return token;
        });
    };

    var classes = {
        commandBar: "win-commandBar",
        commandBarHoriz: "win-commandBar-horiz",
        commandBarVert: "win-commandBar-vert",
        commandStackHoriz: "win-commandBar-stack-horiz",
        commandStackVert: "win-commandBar-stack-vert",
        commandStackTest: "win-commandBar-stack-test",
        commandGroupHoriz: "win-commandBar-group-horiz",
        commandGroupVert: "win-commandBar-group-vert",
        commandHoriz: "win-commandBar-command-horiz",
        commandVert: "win-commandBar-command-vert",
        commandHostedHoriz: "win-commandBar-hostedCommand-horiz",
        commandHostedVert: "win-commandBar-hostedCommand-vert",
        separatorHoriz: "win-commandBar-rule-horiz",
        separatorVert: "win-commandBar-rule-vert"
    };

    var classSuffixHoriz = "Horiz";
    var classSuffixVert = "Vert";

    var WinUI = WinNS.Namespace.defineWithParent(WinNS, "UI", {
        CommandBarOrientation: {
            horizontal: "horizontal",
            vertical: "vertical"
        },

        CommandStack: {
            left: "left",
            right: "right",
            expansion: "expansion"
        },

        CommandBar: WinNS.Class.define(function CommandBar_ctor(element, options) {
            /// <summary>
            /// Creates an instance of the CommandBar control
            /// </summary>
            /// <param name='element'>
            /// The DOM element that will host the control
            /// </param>
            /// <param name='options'>
            /// An object literal that defines option values for the control
            /// </param>
            /// <returns type="WinJS.UI.CommandBar" />

            if (!element) {
                throw new Error(elementIsInvalid);
            }

            // Configure host element
            if (this === window || this === WinUI) {
                var commandBar = WinUI.getControl(element);

                if (commandBar) {
                    return commandBar;
                } else {
                    return new WinUI.CommandBar(element, options);
                }
            }

            // Attach the JS object to the host DOM element.
            WinUI.setControl(element, this);
            this._element = element;

            var that = this;

            if (options.uniqueId) {
                this._uniqueId = options.uniqueId;
            } else {
                var ms = new Date();
                ms = ms.valueOf().toString();
                this._uniqueId = ms.substr(ms.length - 5, 5);
            }

            var ariaLabel = options.ariaLabel || "Command bar";

            this.element.role = "menubar";
            this.element.setAttribute("aria-label", ariaLabel);
            this.element.setAttribute("uniqueId", this._uniqueId);
            Utilities.addClass(this.element, classes.commandBar);

            // If we are contained within an AppBar, store a reference
            if (this.element.parentNode) {
                if (Utilities.hasClass(this.element.parentNode, "win-appbar")) {
                    this._parentAppBarElement = this.element.parentNode;
                    this._parentAppBar = WinUI.getControl(this._parentAppBarElement);

                    if (this._parentAppBar && this._parentAppBar.transient) {

                        // Dismiss the expansion flyout when the AppBar hides
                        this._parentAppBar.addEventListener("beforehide", function () {
                            that.hideFlyout();
                        }, false);
                    }
                }
            }

            // Create the default horizontal command template
            var buttonHoriz = document.createElement("button");
            buttonHoriz.id = formatString(commandElementId, [this._uniqueId, "{{id}}"]);
            buttonHoriz.type = "button";
            buttonHoriz.title = "{{commandName}}";
            buttonHoriz.accessKey = "{{accessKey}}";
            buttonHoriz.setAttribute("role", "menuitem");
            buttonHoriz.setAttribute("aria-label", "{{commandName}}");
            buttonHoriz.setAttribute("aria-describedby", formatString(commandDescribedById, [this._uniqueId, "{{id}}"]));

            var image = document.createElement("img");
            image.setAttribute("aria-hidden", true);
            image.setAttribute("data-win-template", "{{imageUrl}}");
            Utilities.addClass(image, "commandIcon");

            var text = document.createElement("div");
            text.setAttribute("data-win-minimize", true);
            text.innerText = "{{commandName}}";
            Utilities.addClass(text, "commandLabel");
            Utilities.addClass(text, "typeEllipsis");

            buttonHoriz.appendChild(image);
            buttonHoriz.appendChild(text);

            // Create the default vertical command template
            var buttonVert = document.createElement("button");
            buttonVert.id = formatString(commandElementId, [this._uniqueId, "{{id}}"]);
            buttonVert.type = "button";
            buttonVert.title = "{{commandName}}";
            buttonVert.accessKey = "{{accessKey}}";
            buttonVert.innerText = "{{commandName}}";
            buttonVert.setAttribute("role", "listitem");
            buttonVert.setAttribute("aria-label", "{{commandName}}");
            buttonVert.setAttribute("aria-describedby", formatString(commandDescribedById, [this._uniqueId, "{{id}}"]));

            // Create the tooltip template
            var tooltip = document.createElement("div");
            tooltip.id = formatString(commandElementId, [this._uniqueId, "{{id}}_tooltip"]);
            tooltip.setAttribute("aria-label", "{{title}}");
            Utilities.addClass(tooltip, "win-commandBar-tooltip");
            Utilities.addClass(tooltip, "typeSizeSmall");
            Utilities.addClass(tooltip, "typeFaceNormal");

            var tooltipHeading = document.createElement("div");
            Utilities.addClass(tooltipHeading, "win-commandBar-tooltip-heading");

            var tooltipTitle = document.createElement("div");
            tooltipTitle.innerText = "{{title}}";
            Utilities.addClass(tooltipTitle, "win-commandBar-tooltip-title");
            Utilities.addClass(tooltipTitle, "colorPrimaryLightBG");
            Utilities.addClass(tooltipTitle, "typeEllipsis");

            var tooltipShortcut = document.createElement("div");
            tooltipShortcut.innerText = "{{shortcut}}";
            Utilities.addClass(tooltipShortcut, "win-commandBar-tooltip-shortcut");
            Utilities.addClass(tooltipShortcut, "colorPrimaryLightBG");

            var tooltipFlex = document.createElement("div");
            Utilities.addClass(tooltipFlex, "win-commandBar-tooltip-flex");

            var tooltipDesc = document.createElement("div");
            tooltipDesc.innerText = "{{description}}";
            Utilities.addClass(tooltipDesc, "win-commandBar-tooltip-description");
            Utilities.addClass(tooltipDesc, "colorSecondaryLightBG");

            tooltipHeading.appendChild(tooltipTitle);
            tooltipHeading.appendChild(tooltipShortcut);
            tooltipHeading.appendChild(tooltipFlex);
            tooltip.appendChild(tooltipHeading);
            tooltip.appendChild(tooltipDesc);

            this._tooltipTemplate = tooltip;

            // Set options
            this._orientation = options.orientation || WinUI.CommandBarOrientation.horizontal;
            this._commandTemplateHoriz = options.commandTemplateHoriz || buttonHoriz;
            this._commandTemplateVert = options.commandTemplateVert || buttonVert;
            this._tooltipShortcutFormat = options.tooltipShortcutFormat || "({0})";
            this._visible = options.visible || true;
            this._minimized = false;

            if (options.minimized) {
                this.minimized = options.minimized;
            }

            this._currentCommandSet = [];
            this._groupsCache = [];
            this._expandoCommand = null;

            // Create a div to hold custom elements
            var customElementsHost = document.createElement("div");
            customElementsHost.style.display = "none";
            this._customElementsHost = customElementsHost;
            this.element.appendChild(customElementsHost);

            // Create a div to hold the ARIA describedby elements
            var describedByHost = document.createElement("div");
            describedByHost.style.display = "none";
            this._describedByHost = describedByHost;
            this.element.appendChild(describedByHost);

            // Create stack data structures
            this._commandStacks = {};

            // Create the expansion stack
            this._commandStacks[WinUI.CommandStack.expansion] = {};
            this._commandStacks[WinUI.CommandStack.expansion].groups = [];

            var expansionStack = document.createElement("div");
            expansionStack.className = classes.commandStackVert;
            expansionStack.style.display = this.orientation === WinUI.CommandBarOrientation.vertical ? "block" : "none";
            expansionStack.setAttribute("stack", WinUI.CommandStack.expansion);
            this._commandStacks[WinUI.CommandStack.expansion].element = expansionStack;

            if (this.orientation === WinUI.CommandBarOrientation.horizontal) {
                Utilities.addClass(this.element, classes.commandBarHoriz);

                this._commandStacks[WinUI.CommandStack.left] = {};
                this._commandStacks[WinUI.CommandStack.right] = {};
                this._commandStacks["test"] = {};

                this._commandStacks[WinUI.CommandStack.left].groups = [];
                this._commandStacks[WinUI.CommandStack.right].groups = [];
                this._commandStacks["test"].groups = [];

                var leftStack = document.createElement("div");
                var rightStack = document.createElement("div");
                var testStack = document.createElement("div");
                leftStack.className = rightStack.className = classes.commandStackHoriz;
                testStack.className = classes.commandStackTest;
                leftStack.setAttribute("stack", WinUI.CommandStack.left);
                rightStack.setAttribute("stack", WinUI.CommandStack.right);
                testStack.setAttribute("stack", "test");

                this._commandStacks[WinUI.CommandStack.left].element = leftStack;
                this._commandStacks[WinUI.CommandStack.right].element = rightStack;
                this._commandStacks["test"].element = testStack;

                // The test stack is used to test for overflow as each item is added to the horizontal stacks
                this._testStack = testStack;

                this._overflowedCommands = [];

                this._expandoShowing = false;

                // Create the expansion flyout
                var flyoutHost = document.createElement("div");
                flyoutHost.id = formatString(flyoutElementId, [this._uniqueId]);
                Utilities.addClass(flyoutHost, "win-commandBar-flyout");
                document.body.appendChild(flyoutHost);
                this._flyoutHost = flyoutHost;
                this._flyout = new WinUI.Flyout(flyoutHost, null);

                this._flyout.addEventListener("aftershow", function () {
                    that._fireEvent("expansioninvoked", null);
                }, false);

                this._flyout.addEventListener("afterhide", function () {
                    var command = that._expandoCommand.msDataItem;

                    if (command && command.states.length > 1) {
                        that.setCommandState(command.id, 0);
                    } else {
                        that._expandoCommand.focus();
                    }

                    that._expandoShowing = false;
                    that._fireEvent("expansiondismissed", null);
                }, false);
            } else {
                Utilities.addClass(this.element, classes.commandBarVert);
            }

            // Put the stack elements in the host div
            Object.keys(this._commandStacks).forEach(function (stack) {
                that.element.appendChild(that._commandStacks[stack].element);
            });

            // This must be done after the stacks are ready
            this.commandGroups = options.commandGroups;
        },
        {
            // Public properties

            element: {
                /// <summary>
                /// Gets the DOM element that hosts this CommandBar instance
                /// </summary>

                get: function () {
                    return this._element;
                }
            },

            orientation: {
                /// <summary>
                /// Gets the orientation of this CommandBar instance
                /// </summary>

                get: function () {
                    return this._orientation;
                }
            },

            commandTemplateHoriz: {
                /// <summary>
                /// Gets or sets the horizontal command template of this CommandBar instance
                /// </summary>

                get: function () {
                    return this._commandTemplateHoriz;
                },
                set: function (value) {
                    if (typeof value === "object") {
                        this._commandTemplateHoriz = value;
                        this._commandTemplateHoriz.id = formatString(commandElementId, [this._uniqueId, "{{id}}"]);
                    }
                }
            },

            commandTemplateVert: {
                /// <summary>
                /// Gets or sets the vertical command template of this CommandBar instance
                /// </summary>

                get: function () {
                    return this._commandTemplateVert;
                },
                set: function (value) {
                    if (typeof value === "object") {
                        this._commandTemplateVert = value;
                        this._commandTemplateVert.id = formatString(commandElementId, [this._uniqueId, "{{id}}"]);
                    }
                }
            },

            commandGroups: {
                /// <summary>
                /// Gets or sets the CommandGroups hosted by this CommandBar instance. This resets the CommandBar's UI.
                /// </summary>

                get: function () {
                    return this._groupsCache;
                },
                set: function (value) {
                    if (Array.isArray(value) && value.length > 0) {
                        this._groupsCache = value;
                        var that = this;

                        Object.keys(this._commandStacks).forEach(function (stack) {
                            // Clear each stack's groups array
                            that._commandStacks[stack].groups.splice(0);
                        });

                        // Clear all DOM elements
                        this._clear();

                        value.forEach(function (group) {
                            // Insert each group into the appropriate stack
                            that._commandStacks[group.commandStack].groups.push(group);

                            // Create an ARIA describedBy element
                            var div = document.createElement("div");
                            div.id = formatString(groupDescribedById, [that._uniqueId, group.id]);
                            div.role = "note";
                            div.innerText = group.description;
                            that._describedByHost.appendChild(div);

                            group.commands.forEach(function (command) {

                                // Create an ARIA describedBy element
                                var div = document.createElement("div");
                                div.id = formatString(commandDescribedById, [that._uniqueId, command.id]);
                                div.role = "note";
                                div.innerText = command.description;
                                that._describedByHost.appendChild(div);
                            });
                        });
                    }
                }
            },

            visible: {
                /// <summary>
                /// Gets or sets the visibility of this CommandBar instance
                /// </summary>

                get: function () {
                    return this._visible;
                },
                set: function (value) {
                    if (typeof value === "boolean" && this._visible !== value) {
                        this._visible = value;
                        this.element.style.visibility = value ? "visible" : "hidden";
                        this._fireEvent("visibilitychanged", null);
                    }
                }
            },

            minimized: {
                /// <summary>
                /// Gets or sets the minimized state of this CommandBar instance
                /// </summary>

                get: function () {
                    return this._minimized;
                },
                set: function (value) {
                    if (typeof value === "boolean" && this._minimized !== value) {
                        this._minimized = value;
                        Utilities[this._minimized ? "addClass" : "removeClass"](this.element, "minimized");
                        this._fireEvent("minimizechanged", null);
                    }
                }
            },

            // Public methods

            addEventListener: function MediaQueue_addEventListener(eventName, eventCallback, capture) {
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

                this.element.addEventListener(eventName, eventCallback, capture);
            },

            removeEventListener: function MediaQueue_removeEventListener(eventName, eventCallback, capture) {
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

                this.element.removeEventListener(eventName, eventCallback, capture);
            },

            show: function CommandBar_show() {
                /// <summary>
                /// Shows the command bar, if it is hosted in an AppBar
                /// </summary>
                /// <returns>
                /// None
                /// </returns>

                if (this._parentAppBar && this._parentAppBar.transient) {
                    this._parentAppBar.show();
                    this._fireEvent("show", null);
                }
            },

            hide: function CommandBar_hide() {
                /// <summary>
                /// Hides the command bar, if it is hosted in an AppBar
                /// </summary>
                /// <returns>
                /// None
                /// </returns>

                if (this._parentAppBar && this._parentAppBar.transient) {
                    this.hideFlyout();
                    this._parentAppBar.hide();
                    this._fireEvent("hide", null);
                }
            },

            refresh: function CommandBar_refresh() {
                this._clear();
                return this.setCommands(this._currentCommandSet);
            },

            setCommands: function CommandBar_setCommands(commandNames) {
                /// <summary>
                /// Triggers rendering of the command bar with the specified commands
                /// </summary>
                /// <param name='commandNames'>
                /// A string array specifying the names of the commands to be rendered
                /// </param>
                /// <returns>
                /// A Promise that indicates completion of rendering
                /// </returns>

                return this._render(commandNames);
            },

            showCommands: function CommandBar_showCommands(commandNames) {
                /// <summary>
                /// Shows the specified commands in addition the currently visible set
                /// </summary>
                /// <param name='commandNames'>
                /// A string or array of strings specifying the names of the commands to be shown
                /// </param>
                /// <returns>
                /// A Promise that indicates completion of rendering
                /// </returns>

                var commands = null;

                if (Array.isArray(commandNames)) {
                    commands = commandNames;
                } else if (typeof commandNames === "string") {
                    commands = [commandNames];
                }

                if (commands) {
                    var newSet = this._currentCommandSet.slice(0);
                    var that = this;

                    commands.forEach(function (commandName) {
                        var index = newSet.indexOf(commandName);

                        if (index === -1) {
                            newSet.push(commandName);
                        }
                    });

                    return this._render(newSet);
                } else {
                    return Promise.wrap();
                }
            },

            hideCommands: function CommandBar_hideCommands(commandNames) {
                /// <summary>
                /// Hides the specified command
                /// </summary>
                /// <param name='commandNames'>
                /// A string or array of strings specifying the names of the commands to be hidden
                /// </param>
                /// <returns>
                /// A Promise that indicates completion of rendering
                /// </returns>

                var commands = null;

                if (Array.isArray(commandNames)) {
                    commands = commandNames;
                } else if (typeof commandNames === "string") {
                    commands = [commandNames];
                }

                if (commands) {
                    var newSet = this._currentCommandSet.slice(0);
                    var that = this;

                    commands.forEach(function (commandName) {
                        var index = newSet.indexOf(commandName);

                        if (index > -1) {
                            newSet.splice(index, 1);
                        }
                    });

                    return this._removeHiddenCommands(newSet)
                        .then(function () {
                            that._setAppBarTransparency();
                        });
                } else {
                    return Promise.wrap();
                }
            },

            invokeCommand: function CommandBar_invokeCommand(commandId) {
                /// <summary>
                /// Invokes the specified command
                /// </summary>
                /// <param name='commandId'>
                /// A string identifier of the command to be invoked
                /// </param>
                /// <returns>
                /// None
                /// </returns>

                var commandElement = this._findCommandElement(commandId);

                if (commandElement) {
                    commandElement.fireEvent("onclick");
                }
            },

            setCommandState: function CommandBar_setCommandState(commandId, state) {
                /// <summary>
                /// Sets the state of the specified command, which takes effect immediately
                /// </summary>
                /// <param name='commandId'>
                /// A string identifier of the command to be updated
                /// </param>
                /// <param name='state'>
                /// The new command state
                /// </param>
                /// <returns>
                /// None
                /// </returns>

                var commandElement = this._findCommandElement(commandId);

                if (commandElement) {
                    var command = commandElement.msDataItem;
                    this._changeCommandState(command, commandElement, state);
                }
            },

            setLayoutAttribute: function CommandBar_setLayoutAttribute(layout) {
                /// <summary>
                /// Sets the appLayout attribute value on the control element
                /// </summary>
                /// <param name='layout'>
                /// The value to be set in the appLayout attribute
                /// </param>
                /// <returns>
                /// None
                /// </returns>

                this.element.setAttribute("appLayout", layout);
            },

            hideFlyout: function CommandBar_hideFlyout() {
                /// <summary>
                /// Dismisses the expansion flyout
                /// </summary>
                /// <returns>
                /// None
                /// </returns>

                if (this._flyout && this._flyout.visible) {
                    this._flyout.hide();
                }
            },

            // Private methods            

            // Raises an event to external listeners with the specified name and properties
            _fireEvent: function CommandBar_fireEvent(eventName, properties) {
                if (document.createEvent) {
                    var eventObject = document.createEvent("Event");
                    eventObject.initEvent(eventName, true, false);

                    if (properties) {
                        Object.keys(properties).forEach(function (prop) {
                            eventObject[prop] = properties[prop];
                        });
                    }

                    this.element.dispatchEvent(eventObject);
                }
            },

            // Handles command invocation and state transition
            _commandInvoked: function CommandBar_commandInvoked(event) {
                var command = event.srcElement.msDataItem;
                var isExpando = event.srcElement.hasAttribute("isExpando");
                var stack = event.srcElement.parentNode.getAttribute("stack");
                var state = Number(event.srcElement.getAttribute("state"));

                this._fireEvent("commandinvoked", { payload: command.states[state].payload, cmdElement: event.srcElement });

                if (command.states.length > 1 && command.advanceState) {
                    var nextState = state === command.states.length - 1 ? 0 : state + 1;
                    command.initialState = nextState;
                    this._changeCommandState(command, event.srcElement, nextState);
                }

                if (isExpando) {
                    if (!this._expandoShowing) {
                        this._showExpando(event.srcElement, stack);
                    }
                } else if (command.hideOnInvoke) {
                    if (stack === WinUI.CommandStack.expansion) {
                        this.hideFlyout();
                    } else {
                        this.hide();
                    }
                }
            },

            // Handles command focus
            _commandFocused: function CommandBar_commandFocused(event) {
                var command = event.srcElement.msDataItem;
                var state = Number(event.srcElement.getAttribute("state"));
                this._fireEvent("commandfocused", { payload: state ? command.states[state].payload : null });
            },

            // Displays the expansion stack
            _showExpando: function CommandBar_showExpando(sourceCommand, stack) {
                var stackElement = this._commandStacks[WinUI.CommandStack.expansion].element;
                stackElement.style.display = "block";
                Utilities.empty(this._flyoutHost);
                this._flyoutHost.appendChild(stackElement);

                this._expandoCommand = sourceCommand;
                this._expandoShowing = true;
                this._flyout.show(this._expandoCommand, "top");
            },

            // Clears all DOM elements from the stacks
            _clear: function CommandBar_clear() {
                var that = this;

                Object.keys(this._commandStacks).forEach(function (stack) {
                    Utilities.empty(that._commandStacks[stack].element);
                });

                Utilities.empty(this._describedByHost);
            },

            // Changes the state of the specified command
            _changeCommandState: function CommandBar_changeCommandState(command, commandElement, nextState) {
                var stack = commandElement.parentNode.getAttribute("stack");
                var classSuffix = stack === WinUI.CommandStack.expansion ? classSuffixVert : classSuffixHoriz;
                var element = this._renderCommand(command, nextState, classSuffix);

                commandElement.insertAdjacentElement("beforeBegin", element);
                commandElement.removeNode(true);
                element.focus();
                this._fireEvent("commandstatechanged", { payload: command.states[nextState].payload, cmdElement: commandElement });
            },

            // Renders the specified set of commands
            _render: function CommandBar_render(commandNames) {
                // Create a priority-ranked mapping between commands and groups
                this._commandMap = this._buildCommandMap(commandNames);
                var promise = null;

                if (this.orientation === WinUI.CommandBarOrientation.horizontal) {
                    promise = this._renderHorizontal(commandNames);
                } else {
                    promise = this._renderVertical(commandNames);
                }

                this._currentCommandSet = commandNames;
                this._setAppBarTransparency();
                return promise;
            },

            // Renders the command bar horizontally
            _renderHorizontal: function CommandBar_renderHorizontal(commandNames) {
                var that = this;
                var testWidth = 0;

                return this._removeHiddenCommands(commandNames)
                    .then(function (count) {
                        var willElementOverflow = function (element, showSeparator) {
                            var leftWidth = that._commandStacks[WinUI.CommandStack.left].element.offsetWidth;
                            var rightWidth = that._commandStacks[WinUI.CommandStack.right].element.offsetWidth;

                            // If the element has a parent, it has been tested before
                            // This is needed for the overflow loop below.
                            if (!element.parentNode) {

                                // Create a group in the test stack
                                var groupHost = document.createElement("div");
                                groupHost.className = classes.commandGroupHoriz;
                                groupHost.setAttribute("stack", "test");
                                that._testStack.appendChild(groupHost);
                                groupHost.appendChild(element);

                                if (showSeparator) {
                                    that._renderSeparator(groupHost);
                                }
                            }

                            // Add the width of the new group + command to the total
                            testWidth += Utilities.getTotalWidth(element.parentNode);
                            return leftWidth + rightWidth + testWidth > Utilities.getContentWidth(that.element);
                        };

                        var clearTestStack = function () {
                            Utilities.empty(that._testStack);
                            testWidth = 0;
                        };

                        var deleteOverflowElements = function (priorityGroup) {
                            priorityGroup.forEach(function (mapping) {
                                that._removeFromOverflowList(mapping.command.id);
                                that._removeCommand(mapping.command.id);
                            });
                        };

                        // See if there are any overflowed commands we can bring back
                        if (count > 0) {
                            var keepGoing = true;

                            for (var i = 0, ilen = that._commandMap.indexes.length; i < ilen; i++) {
                                var priority = that._commandMap.indexes[i];

                                if (that._overflowedCommands.indexOf(that._commandMap[priority][0].command.id) > -1) {
                                    var commandElements = [];

                                    // This priority group is overflowed, see if it will fit on the horizontal bar
                                    for (var j = 0, jlen = that._commandMap[priority].length; j < jlen; j++) {
                                        var mapping = that._commandMap[priority][j];
                                        var state = Number(that._findCommandElement(mapping.command.id).getAttribute("state"));
                                        var element = that._renderCommand(mapping.command, state, classSuffixHoriz);

                                        if (willElementOverflow(element, mapping.group.showSeparator)) {
                                            keepGoing = false;
                                            break;
                                        } else {

                                            // Put the element and its CommandGroup in an object, push into array
                                            commandElements.push({ group: mapping.group, command: element });
                                        }
                                    }

                                    clearTestStack();

                                    if (!keepGoing) {
                                        break;
                                    } else {
                                        // The last priority group can be de-overflowed
                                        deleteOverflowElements(that._commandMap[priority]);

                                        commandElements.forEach(function (commandElement) {
                                            // Get the parent group, render and insert the command
                                            var groupElement = that._renderCommandGroup(commandElement.group, null);
                                            that._insertByIndex(groupElement, commandElement.command);
                                        });
                                    }
                                }
                            }
                        }

                        var findLowerPriCommands = function (priority) {
                            for (var i = that._commandMap.indexes.length - 1; i >= 0; i--) {
                                var index = that._commandMap.indexes[i];

                                if (index > priority) {
                                    var commands = getCommandSetByPriority(index, true);

                                    if (commands.length > 0) {
                                        return commands;
                                    }
                                } else {
                                    break;
                                }
                            }

                            return null;
                        };

                        var getCommandSetByPriority = function (priority, renderedOnly) {
                            var commands = [];

                            that._commandMap[priority].forEach(function (mapping) {
                                if (!renderedOnly || that._findCommandElement(mapping.command.id)) {
                                    commands.push({ group: mapping.group, command: mapping.command });
                                }
                            });

                            return commands;
                        };

                        var renderGroupCommandObject = function (command, group, targetStack) {
                            // Render the command using the vertical template
                            var commandElement = that._renderCommand(command, command.initialState, classSuffixVert);

                            if (targetStack !== group.commandStack) {
                                commandElement.setAttribute("isOverflow", true);
                            }

                            return { group: group, command: commandElement };
                        };

                        var overflow = false;

                        // Render the commands in priority order, and overflow to the expansion menu if needed
                        that._commandMap.indexes.forEach(function (priority) {
                            that._commandMap[priority].forEach(function (mapping) {

                                // If the command doesn't currently exist...
                                if (!that._findCommandElement(mapping.command.id)) {
                                    var targetStack = mapping.group.commandStack;
                                    var elements = [];

                                    // And we're not overflowed yet, and it lives in one of the horizontal stacks...
                                    if (!overflow && targetStack !== WinUI.CommandStack.expansion) {

                                        // Render the command
                                        var currentSet = { group: mapping.group, command: that._renderCommand(mapping.command, mapping.command.initialState, classSuffixHoriz) };

                                        // See if we will overflow the available space
                                        while (willElementOverflow(currentSet.command, mapping.group.showSeparator)) {

                                            // Overflow. See if there are any lower-priority commands to migrate
                                            var commandSets = findLowerPriCommands(priority);

                                            if (!commandSets) {

                                                // None found, so overflow everything from here forward
                                                commandSets = getCommandSetByPriority(priority, false);
                                                targetStack = WinUI.CommandStack.expansion;
                                                overflow = true;
                                            }

                                            commandSets.forEach(function (set) {
                                                that._removeCommand(set.command.id);
                                                that._overflowedCommands.push(set.command.id);
                                                elements.push(renderGroupCommandObject(set.command, set.group, targetStack));
                                            });

                                            if (overflow) {
                                                break;
                                            }
                                        }

                                        if (elements.length === 0) {
                                            elements.push(currentSet);
                                        }
                                    } else {
                                        targetStack = WinUI.CommandStack.expansion;

                                        // TODO: get the current state and render in that state
                                        elements.push(renderGroupCommandObject(mapping.command, mapping.group, targetStack));
                                    }

                                    elements.forEach(function (element) {
                                        // Get the parent group, then render and insert the command
                                        var groupElement = that._renderCommandGroup(element.group, targetStack);
                                        that._insertByIndex(groupElement, element.command);
                                    });

                                    clearTestStack();
                                }
                            });
                        });
                    });
            },

            // Renders the command bar vertically
            _renderVertical: function CommandBar_renderVertical(commandNames) {
                var count = 0;
                var stack = WinUI.CommandStack.expansion;
                var that = this;

                return this._removeHiddenCommands(commandNames)
                    .then(function () {
                        that._commandStacks[stack].groups.forEach(function (group) {
                            var elements = [];

                            group.commands.forEach(function (command) {
                                if (commandNames.indexOf(command.id) > -1) {
                                    var id = formatString(commandElementId, [that._uniqueId, command.id]);
                                    var element = document.getElementById(id);

                                    if (!element) {
                                        element = that._renderCommand(command, command.initialState, classSuffixVert);
                                        element.setAttribute("index", command.index);
                                        elements.push(element);
                                    }
                                }
                            });

                            if (elements.length > 0) {
                                var groupElement = that._renderCommandGroup(group, WinUI.CommandStack.expansion);

                                elements.forEach(function (commandElement) {
                                    that._insertByIndex(groupElement, commandElement);
                                });
                            }
                        });
                    });
            },

            _removeHiddenCommands: function CommandBar_removeHiddenCommands(commandSet) {
                var count = 0;
                var that = this;
                var promises = [];

                // Look for commands to hide
                this._currentCommandSet.forEach(function (commandName) {
                    if (commandSet.indexOf(commandName) === -1) {
                        promises.push(that._removeCommand(commandName)
                            .then(function (overflowCount) {
                                count += overflowCount;

                                if (that._overflowedCommands) {
                                    that._removeFromOverflowList(commandName);
                                }
                            })
                        );
                    }
                });

                if (promises.length > 0) {
                    return Promise.join(promises)
                        .then(function () {
                            return Promise.wrap(count);
                        });
                } else {
                    return Promise.wrap(0);
                }
            },

            _removeFromOverflowList: function CommandBar_removeFromOverflowList(commandName) {
                var index = this._overflowedCommands.indexOf(commandName);

                if (index > -1) {
                    this._overflowedCommands.splice(index, 1);
                }
            },

            // Inserts the specified element in the parent, based upon the element's index attribute and those of its peers
            _insertByIndex: function CommandBar_insertByIndex(parent, element) {
                var index = Number(element.getAttribute("index"));
                var isGroup = element.hasAttribute("stack");

                for (var i = 0, len = parent.children.length; i < len; i++) {
                    var node = parent.children[i];
                    var dex = Number(node.getAttribute("index"));

                    if (isNaN(dex) || dex > index) {
                        if (isGroup) {
                            this._checkAndRenderSeparator(element);
                        }

                        node.insertAdjacentElement("beforeBegin", element);
                        return;
                    }
                }

                if (isGroup && parent.lastElementChild) {
                    this._checkAndRenderSeparator(parent.lastElementChild);
                }

                parent.appendChild(element);
            },

            // Renders the specified Command
            _renderCommand: function CommandBar_renderCommand(command, stateIndex, classSuffix) {
                var element = null;

                if (command.hostedElement) {
                    element = document.createElement("div");
                    element.id = formatString(commandElementId, [this._uniqueId, command.id]);
                    element.setAttribute("hostedElement", "true");
                    Utilities.addClass(element, classes["commandHosted" + classSuffix]);
                    element.appendChild(command.hostedElement);
                } else {
                    element = this["commandTemplate" + classSuffix].cloneNode(true);
                    var data = command.states[stateIndex].templateValues;
                    var that = this;

                    var replaceTokens = function (element) {
                        if (element.hasChildNodes()) {
                            for (var c = 0, clen = element.childNodes.length; c < clen; c++) {
                                replaceTokens(element.childNodes[c]);
                            }
                        }

                        function insertValue(str, field) {
                            var value = data[field];
                            return value !== undefined ? value : str;
                        };

                        var property = null;

                        if (element.attributes) {
                            for (var a = 0, alen = element.attributes.length; a < alen; a++) {
                                var value = element.attributes[a].nodeValue;
                                element.setAttribute(element.attributes[a].nodeName, value.replace(tokenPattern, insertValue));
                            }
                        } else if (element.textContent) {
                            element.textContent = element.textContent.replace(tokenPattern, insertValue);
                        }
                    };

                    replaceTokens(element);
                    Utilities.addClass(element, classes["command" + classSuffix]);

                    if (classSuffix === classSuffixHoriz) {
                        this._setCommandImageEventState(element, "rest");

                        element.addEventListener("mouseenter", function () {
                            that._setCommandImageEventState(element, "hover");
                        }, false);

                        element.addEventListener("mousedown", function () {
                            that._setCommandImageEventState(element, "press");
                        }, false);

                        element.addEventListener("MSPointerDown", function () {
                            that._setCommandImageEventState(element, "press");
                        }, false);

                        element.addEventListener("mouseup", function () {
                            that._setCommandImageEventState(element, "hover");
                        }, false);

                        element.addEventListener("MSPointerUp", function () {
                            that._setCommandImageEventState(element, "rest");
                        }, false);

                        element.addEventListener("mouseleave", function () {
                            that._setCommandImageEventState(element, "rest");
                        }, false);
                    }

                    if (command.isExpansion) {
                        element.setAttribute("isExpando", true);
                    }

                    element.msDataItem = command;
                    element.setAttribute("state", stateIndex);
                    element.addEventListener("click", function (event) {
                        that._commandInvoked(event);
                    }, false);
                }

                if (command.tooltip) {
                    var placement;

                    if (classSuffix === classSuffixHoriz) {
                        if (this._parentAppBar) {
                            placement = this._parentAppBar.position === "bottom" ? "top" : "bottom";
                        } else {
                            placement = "top";
                        }
                    } else {
                        placement = "left";
                    }

                    var toolTip = new WinUI.Tooltip(element, {
                        placement: placement,
                        delay: true
                    });

                    toolTip.addEventListener("beforeopen", function () {
                        var content = that._tooltipTemplate.cloneNode(true);
                        data = {};
                        data.title = command.tooltip.title || command.states[stateIndex].templateValues.commandName;
                        data.shortcut = command.tooltip.shortcutKey ? formatString(that._tooltipShortcutFormat, [command.tooltip.shortcutKey]) : "";
                        data.description = command.tooltip.description;

                        replaceTokens(content);
                        toolTip.contentElement = content;
                    }, false);
                }

                element.setAttribute("index", command.index);

                element.addEventListener("focus", function (event) {
                    that._commandFocused(event);
                }, false);

                return element;
            },

            // Sets the specified command's image based on the specified state (rest, hover, press)
            _setCommandImageEventState: function CommandBar_setCommandImageEventState(element, state) {
                var image = element.getElementsByClassName("commandIcon")[0];
                image.src = image.getAttribute("data-win-template").replace("{{state}}", state);
            },

            // Removes the command element with the specified name
            _removeCommand: function CommandBar_removeCommand(commandName) {
                var that = this;

                return new Promise(function (complete) {
                    var element = that._findCommandElement(commandName);
                    var isOverflow = false;

                    if (element) {
                        isOverflow = element.hasAttribute("overflow");

                        if (element.hasAttribute("hostedElement")) {
                            that._customElementsHost.appendChild(element.firstElementChild);
                        }

                        var parent = element.parentNode;

                        Promise.timeout()
                            .then(function () {
                                element.removeNode(true);

                                if (parent) {
                                    that._checkAndRemoveEmptyGroup(parent);
                                }

                                complete(isOverflow ? 0 : 1);
                            });
                    }
                });
            },

            // Locates the Command object with the specified name
            _findCommand: function CommandBar_findCommand(commandName) {
                this._commandGroups.forEach(function (group) {
                    group.commands.forEach(function (command) {
                        if (command.id === commandName) {
                            return command;
                        }
                    });
                });

                return null;
            },

            // Locates the command element with the specified name
            _findCommandElement: function CommandBar_findCommandElement(commandName) {
                var id = formatString(commandElementId, [this._uniqueId, commandName]);
                return document.getElementById(id);
            },

            // Renders the specified command group
            _renderCommandGroup: function CommandBar_renderCommandGroup(commandGroup, commandStack) {
                var id = commandGroup.id;

                if (commandStack && commandStack !== commandGroup.commandStack) {
                    // This group is being overflowed, give it a special id
                    id += "_exp";
                }

                var groupHost = this._findCommandGroupElement(id);
                var classSuffix = commandStack === WinUI.CommandStack.expansion ? classSuffixVert : classSuffixHoriz;

                if (!groupHost) {
                    groupHost = document.createElement("div");
                    groupHost.id = formatString(groupElementId, [this._uniqueId, id]);
                    groupHost.role = commandStack === WinUI.CommandStack.expansion ? "list" : "menu";
                    groupHost.setAttribute("aria-label", commandGroup.name);
                    groupHost.setAttribute("aria-describedby", formatString(commandDescribedById, [this._uniqueId, commandGroup.id]));
                    groupHost.setAttribute("stack", commandStack);
                    groupHost.setAttribute("index", commandGroup.index);
                    groupHost.setAttribute("showSeparator", commandGroup.showSeparator);
                    Utilities.addClass(groupHost, classes["commandGroup" + classSuffix]);

                    if (!commandStack) {
                        commandStack = commandGroup.commandStack;
                    }

                    var parentStack = this._commandStacks[commandStack].element;
                    this._insertByIndex(parentStack, groupHost);
                }

                return groupHost;
            },

            // Locates the group element with the specified name
            _findCommandGroupElement: function CommandBar_findCommandGroupElement(groupName) {
                var id = formatString(groupElementId, [this._uniqueId, groupName]);
                return document.getElementById(id);
            },

            // Checks the specified group for commands, and removes it if it contains none
            _checkAndRemoveEmptyGroup: function CommandBar_checkAndRemoveEmptyGroup(groupElement) {
                var removeGroup = function () {
                    // TODO: add animation, return promise
                    groupElement.removeNode(true);
                    return Promise.wrap();
                };

                if (groupElement.children.length === 0) {
                    var stackElement = groupElement.parentNode;

                    removeGroup()
                        .then(function () {
                            // If the parent stack's last group has a separator, remove it
                            if (stackElement && stackElement.lastElementChild && stackElement.lastElementChild.lastElementChild) {
                                if (stackElement.lastElementChild.lastElementChild.hasAttribute("separator")) {
                                    stackElement.lastElementChild.lastElementChild.removeNode(true);
                                }
                            }
                        });
                } else if (groupElement.children[0].hasAttribute("separator")) {
                    removeGroup();
                }
            },

            // Checks the specified group for a separator and adds one if needed
            _checkAndRenderSeparator: function CommandBar_checkAndRenderSeparator(groupElement) {
                if (groupElement) {
                    var show = Boolean(groupElement.getAttribute("showSeparator"));

                    if (show && (!groupElement.hasChildNodes() || !groupElement.lastElementChild.hasAttribute("separator"))) {
                        this._renderSeparator(groupElement);
                    }
                }
            },

            // Renders a separator in the specified group
            _renderSeparator: function CommandBar_renderSeparator(groupElement) {
                var stack = groupElement.getAttribute("stack");
                var classSuffix = stack === WinUI.CommandStack.expansion ? classSuffixVert : classSuffixHoriz;
                var sep = document.createElement("div");
                sep.setAttribute("separator", "separator");
                Utilities.addClass(sep, classes["separator" + classSuffix]);

                if (stack !== WinUI.CommandStack.left) {
                    sep.setAttribute("index", "999");
                }

                groupElement.appendChild(sep);
            },

            // Builds a mapping between commands and groups, ranked by command priority
            _buildCommandMap: function CommandBar_createCommandMap(commandNames) {
                var map = {};
                map.indexes = [];
                map.groupIndex = [];
                var seen = [];
                var that = this;

                Object.keys(this._commandStacks).forEach(function (stack) {
                    that._commandStacks[stack].groups.forEach(function (group) {
                        group.commands.forEach(function (command) {
                            var index = commandNames.indexOf(command.id);

                            if (index > -1) {
                                if (!map[command.priority]) {
                                    map[command.priority] = [];
                                }

                                map[command.priority].push({ command: command, group: group, index: group.commands.indexOf(command) });

                                if (map.indexes.indexOf(command.priority) === -1) {
                                    // Add the priority value to the list, so we can sort them numerically
                                    map.indexes.push(command.priority);
                                }

                                if (map.groupIndex.indexOf(group.id) === -1) {
                                    // Add the group ID to the index
                                    map.groupIndex.push(group.id);
                                }

                                seen.push(index);
                            }
                        });
                    });
                });

                for (var i = commandNames.length - 1; i >= 0; i--) {
                    if (seen.indexOf(i) === -1) {
                        commandNames.splice(i, 1);
                    }
                }

                map.indexes.sort(function (a, b) { return a - b; });
                return map;
            },

            // Set an attribute on the AppBar to make it transparent if we aren't showing any commands
            _setAppBarTransparency: function CommandBar_setAppBarTransparency() {
                if (this._parentAppBarElement) {
                    this._parentAppBarElement.setAttribute("transparent", this._currentCommandSet.length === 0);
                }
            }
        }),

        CommandGroup: WinNS.Class.define(function (id, stack, index) {
            /// <summary>
            /// Creates an instance of the CommandGroup class
            /// </summary>
            /// <param name='id'>
            /// A unique string identifier
            /// </param>
            /// <param name='stack'>
            /// WinJS.UI.CommandStack indicating the parent stack for this group
            /// </param>
            /// <param name='index'>
            /// The index position of this group in the stack
            /// </param>
            /// <returns type="WinJS.UI.CommandGroup" />

            if (!id) {
                throw new Error(missingParameter + "id");
            }

            this._id = id;
            this._name = "";
            this._description = "";
            this._commands = [];
            this._commandStack = stack || WinUI.CommandStack.right;
            this._index = index || 0;
            this._showSeparator = true;
            this._templateFields = ["id", "accessKey"];
        },
        {
            id: {
                /// <summary>
                /// Gets the unique identifier of this command group
                /// </summary>

                get: function () {
                    return this._id;
                }
            },

            name: {
                /// <summary>
                /// Gets or sets the string name of this command group, used for accessibility
                /// </summary>

                get: function () {
                    return this._name;
                },
                set: function (value) {
                    if (typeof value === "string") {
                        this._name = value;
                    }
                }
            },

            description: {
                /// <summary>
                /// Gets or sets the string description of this command, used for accessibility
                /// </summary>

                get: function () {
                    return this._description;
                },
                set: function (value) {
                    if (typeof value === "string") {
                        this._description = value;
                    }
                }
            },

            commands: {
                /// <summary>
                /// Gets the array of WinJS.UI.Command objects contained in this group
                /// </summary>

                get: function () {
                    return this._commands;
                }
            },

            commandStack: {
                /// <summary>
                /// Gets the command stack to which this group belongs
                /// </summary>

                get: function () {
                    return this._commandStack;
                }
            },

            index: {
                /// <summary>
                /// Gets or sets an integer value indicating the display order of this group. This value must be zero or larger
                /// </summary>

                get: function () {
                    return this._index;
                },
                set: function (value) {
                    if (typeof value === "number" && value >= 0) {
                        this._index = value;
                    }
                }
            },

            showSeparator: {
                /// <summary>
                /// Gets or sets a Boolean value indicating whether a separator should be shown following this group
                /// </summary>

                get: function () {
                    return this._showSeparator;
                },
                set: function (value) {
                    if (typeof value === "boolean") {
                        this._showSeparator = value;
                    }
                }
            },

            // Appends the specified command to this group
            addCommand: function CommandGroup_addCommand(command) {
                /// <summary>
                /// Appends the specified command to this group
                /// </summary>
                /// <param name='command'>
                /// The WinJS.UI.Command object to be appended
                /// </param>
                /// <returns>
                /// None
                /// </returns>

                for (var i = 0, ilen = command.states.length; i < ilen; i++) {
                    for (var j = 0, jlen = this._templateFields.length; j < jlen; j++) {
                        if (!command.states[i].templateValues[this._templateFields[j]]) {
                            command.states[i].templateValues[this._templateFields[j]] = command[this._templateFields[j]];
                        }
                    }
                }

                command.index = this._commands.length;
                this._commands.push(command);
            }
        }),

        Command: WinNS.Class.define(function (id, states, priority) {
            /// <summary>
            /// Creates an instance of the Command class
            /// </summary>
            /// <param name='id'>
            /// A unique string identifier
            /// </param>
            /// <param name='states'>
            /// An array of object literals that describe one or more states of the command
            /// </param>
            /// <param name='priority'>
            /// A numeric value that dictates the order in which this command will be moved to the expansion stack, as needed when space is constrained
            /// </param>
            /// <returns type="WinJS.UI.Command" />

            if (!id) {
                throw new Error(missingParameter + "id");
            }

            this._id = id;
            this._description = "";
            this._shortcutKey = "";
            this._states = states || [];
            this._initialState = 0;
            this._isExpansion = false;
            this._priority = 1;
            this._previousPriority = this._priority;
            this._hostedElement = null;
            this._accessKey = "";
            this._hideOnInvoke = true;
            this._advanceState = true;

            this.priority = priority;
        },
        {
            id: {
                /// <summary>
                /// Gets the unique identifier of this command
                /// </summary>

                get: function () {
                    return this._id;
                }
            },

            description: {
                /// <summary>
                /// Gets or sets the string description of this command, used for accessibility
                /// </summary>

                get: function () {
                    return this._description;
                },
                set: function (value) {
                    if (typeof value === "string") {
                        this._description = value;
                    }
                }
            },

            tooltip: {
                /// <summary>
                /// Gets or sets the CommandTooltip to be displayed for this command
                /// </summary>

                get: function () {
                    return this._tooltip;
                },
                set: function (value) {
                    if (value instanceof WinUI.CommandTooltip) {
                        this._tooltip = value;
                    }
                }
            },

            states: {
                /// <summary>
                /// Gets the array of state objects for this command
                /// </summary>

                get: function () {
                    return this._states;
                }
            },

            initialState: {
                /// <summary>
                /// Gets or sets the index of the initial state for this command
                /// </summary>

                get: function () {
                    return this._initialState;
                },
                set: function (value) {
                    if (typeof value === "number") {
                        this._initialState = value;
                    }
                }
            },

            isExpansion: {
                /// <summary>
                /// Gets or sets a value indicating whether this command raises the expansion flyout
                /// </summary>

                get: function () {
                    return this._isExpansion;
                },
                set: function (value) {
                    if (typeof value === "boolean") {
                        this._isExpansion = value;

                        if (this._isExpansion) {
                            this._priority = 0;
                        } else {
                            this._priority = this._previousPriority;
                        }
                    }
                }
            },

            priority: {
                /// <summary>
                /// Gets or sets the numeric priority value of this command. Value must be greater than zero.
                /// </summary>

                get: function () {
                    return this._priority;
                },
                set: function (value) {
                    if (!this.isExpansion && typeof value === "number" && value > 0) {
                        this._priority = this._previousPriority = value;
                    }
                }
            },

            accessKey: {
                /// <summary>
                /// Gets or sets the access key for this command
                /// </summary>

                get: function () {
                    return this._accessKey;
                },
                set: function (value) {
                    this._accessKey = value;
                }
            },

            hideOnInvoke: {
                /// <summary>
                /// Gets or sets a value indicating whether invoking this command causes the command bar to hide
                /// </summary>

                get: function () {
                    return this._hideOnInvoke;
                },
                set: function (value) {
                    if (typeof value === "boolean") {
                        this._hideOnInvoke = value;
                    }
                }
            },

            advanceState: {
                /// <summary>
                /// Gets or sets a value indicating whether invoking this command automatically moves to its next state. This property has no effect on single-state commands
                /// </summary>

                get: function () {
                    return this._advanceState;
                },
                set: function (value) {
                    if (typeof value === "boolean") {
                        this._advanceState = value;
                    }
                }
            },

            hostedElement: {
                /// <summary>
                /// Gets or sets an external DOM element to be hosted by this command
                /// </summary>

                get: function () {
                    return this._hostedElement;
                },
                set: function (value) {
                    if (value.tagName) {
                        this._hostedElement = value;
                    }
                }
            }
        }),

        CommandTooltip: WinNS.Class.define(function (title, shortcutKey, description) {
            /// <summary>
            /// Creates an instance of the CommandTooltip class
            /// </summary>
            /// <param name='title'>
            /// The title that will be shown on the tooltip. Provide null or empty string to use the command's label.
            /// </param>
            /// <param name='shortcutKey'>
            /// A string describing the shortcut key or chord that invokes the command. Provide null or empty string if no shortcut key is supported.
            /// </param>
            /// <param name='description'>
            /// The body text to be displayed on the tooltip
            /// </param>
            /// <returns type="WinJS.UI.CommandTooltip" />

            this._title = title;
            this._shortcutKey = shortcutKey;
            this._description = description;
        },
        {
            title: {
                /// <summary>
                /// Gets or sets the command title
                /// </summary>

                get: function () {
                    return this._title;
                },
                set: function (value) {
                    if (typeof value === "string") {
                        this._title = value;
                    }
                }
            },

            shortcutKey: {
                /// <summary>
                /// Gets or sets the shortcut key, as defined by the application (e.g., "Ctrl+Shift+K")
                /// </summary>

                get: function () {
                    return this._shortcutKey;
                },
                set: function (value) {
                    if (typeof value === "string") {
                        this._shortcutKey = value;
                    }
                }
            },

            description: {
                /// <summary>
                /// Gets or sets the command description
                /// </summary>

                get: function () {
                    return this._description;
                },
                set: function (value) {
                    if (typeof value === "string") {
                        this._description = value;
                    }
                }
            }
        })
    });
})(WinJS);