////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {
    'use strict';

    var Painter = WinJS.Class.define(

        // Constructor
        function (domCanvas) {
            this.paths = [];                // The set of paths being built from 
            this.pathCounted = [];          // Array of boolean flags to tell if a path has been counted or not
            this.pathCount = 0;             // Current count of active paths (number of fingers on the canvas)
            this.toolName = "marker";       // The currently selected tool's name
            this.tools = {};                // All of the tools used by this Painter
            this.canvas = new AppNS.Painter.Graphics.Canvas(domCanvas);     // The current canvas this Painter is attached to
            this._currentColor = new AppNS.Painter.Graphics.Color(0,0,0,1);     // The current color selected
            this.loadTool(new AppNS.Painter.Tools.Marker(), "marker");      // Every Painter has the Marker by default
        },
        
        // Variables and Functions
        {   
            
            // The currently selected tool
            tool: {
                get: function () { 
                    if (this.tools.hasOwnProperty(this.toolName)) {
                        return this.tools[this.toolName];
                    } else {
                        return null;
                    }
                },
                set: function (newTool) {
                    if (this.tools.hasOwnProperty(newTool)) {
                        this.toolName = newTool;
                    } else {
                        throw new Error("PaintPlay - Error: No such tool.");
                    }
                }
            },
            
            color: {
                get: function () { 
                    return this._currentColor;
                },
                set: function (newColor) {
                    this._currentColor.fromColor(newColor);
                    this.updateTools();
                }   
            },

            updateTools: function () {
                for (var tool in this.tools){
                    if (this.tools[tool].update) {
                        this.tools[tool].update(this);
                    }
                }
            },

            // Adds the given tool with the given string name to the Painter.
            // Default Painter has only a marker (simple line drawer).
            loadTool: function (tool, name) {
                this.tools[name] = tool;
                this.updateTools();
            },

            /// <summary>
            /// Begins drawing the path with the current tool.
            /// </summary>
            /// <param name="data" type="data">
            /// The data parameter is an object with the following properties:
            /// - x (required, number): the x position on the canvas
            /// - y (required, number): the y position on the canvas
            /// - w (optional, number from [0, inf)): the width of the touch input box
            /// - h (optional, number from [0, inf)): the height of the touch input box
            /// - id (optional, number): the ID of this path, usually taken from the touch input's pointerId
            /// </param>
            drawStart: function (data) {
                if (this.canvas) {
                    var id = data.id || 0;
                    this.paths[id] = new AppNS.Painter.Graphics.Path(data);
                    this.pathCounted[id] = false;
                    if (this.tool.renderStart) {
                        this.tool.renderStart(this.paths[id], this);
                    }
                }
            },
            
            /// <summary>
            /// Begins drawing the path with the current tool.
            /// </summary>
            /// <param name="data" type="data">
            /// The data parameter is an object with the following properties:
            /// - x (required, number): the x position on the canvas
            /// - y (required, number): the y position on the canvas
            /// - w (optional, number from [0, inf)): the width of the touch input box
            /// - h (optional, number from [0, inf)): the height of the touch input box
            /// - id (optional, number): the ID of this path, usually taken from the touch input's pointerId
            /// </param>
            draw: function (data) {
                var id = data.id || 0;
                var path = this.paths[id];
                if (!this.pathCounted[id]) {
                    this.pathCount++;
                    this.pathCounted[id] = true;
                }
                if (path && this.canvas) {
                    path.addPoint(data);
                    this.tool.render(path, this);
                }
            },
            
            /// <summary>
            /// Begins drawing the path with the current tool.
            /// </summary>
            /// <param name="data" type="data">
            /// The data parameter is an object with the following properties:
            /// - x (required, number): the x position on the canvas
            /// - y (required, number): the y position on the canvas
            /// - w (optional, number from [0, inf)): the width of the touch input box
            /// - h (optional, number from [0, inf)): the height of the touch input box
            /// - id (optional, number): the ID of this path, usually taken from the touch input's pointerId
            /// </param>
            drawStop: function (data) {
                var id = data.id || 0;
                var path = this.paths[id];
                if (path && this.canvas) {
                    path.addPoint(data);

                    if (this.pathCounted[id]) {
                        this.pathCount--;
                        this.pathCounted[id] = false;
                    }
                    this.tool.render(path, this);
                    if (this.tool.renderStop) {
                        this.tool.renderStop(path, this);
                    }
                
                    if (this.pathCount === 0) {
                        this.canvas.saveState();
                    }
                }
            }
        }
    );

    WinJS.Namespace.defineWithParent(AppNS, "Painter", {
       Painter: Painter
    });
})(Microsoft.Paint);
