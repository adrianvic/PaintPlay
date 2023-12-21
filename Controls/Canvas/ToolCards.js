////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

(function (AppNS) {
    var supportedSizes = [60, 40, 30, 20, 10, 3];
    
    // Create texture image for crayon
    var textureImage = document.createElement("img");
    textureImage.src = "../Controls/Paint/Res/crayon_texture.png";

    WinJS.Namespace.defineWithParent(AppNS, "CanvasManager", {
        ToolNames: {
            Eraser: "eraser",
            Marker: "marker",
            Brush: "brush",
            Neon: "neon",
            Pipe: "pipe",
            Crayon: "crayon"
        },

        ToolCards: {
            marker: {
                toolClass: AppNS.Painter.Tools.Marker,
                label: "Marker", // TODO: Win8Apps WORK 92: Add localization support
                optionKey: "opacity",
                optionValues: [1, 0.85, 0.7, 0.5, 0.35, 0.2],
                defaultOptionIndex: 1,
                defaultSizeIndex: 4,
                optionLabel: "Transparency", // TODO: Win8Apps WORK 92: Add localization support
                supportedSizes: supportedSizes
            },
            brush: {
                toolClass: AppNS.Painter.Tools.Brush,
                label: "Brush", // TODO: Win8Apps WORK 92: Add localization support
                optionKey: "fade",
                optionValues: [0, 1000, 700, 400, 200, 100],
                defaultOptionIndex: 0,
                defaultSizeIndex: 3,
                optionLabel: "Fade", // TODO: Win8Apps WORK 92: Add localization support
                supportedSizes: supportedSizes
                },
            neon: {
                toolClass: AppNS.Painter.Tools.Neon,
                label: "Neon", // TODO: Win8Apps WORK 92: Add localization support
                optionKey: "glow",
                optionValues: [70, 55, 40, 25, 10, 0],
                defaultOptionIndex: 4,
                defaultSizeIndex: 3,
                optionLabel: "Glow", // TODO: Win8Apps WORK 92: Add localization support
                supportedSizes: supportedSizes
            },
            pipe: {
                toolClass: AppNS.Painter.Tools.Pipe,
                label: "3D", // TODO: Win8Apps WORK 92: Add localization support
                optionKey: "height",
                optionValues: [6, 5, 4, 3, 2, 1],
                defaultOptionIndex: 4,
                defaultSizeIndex: 3,
                optionLabel: "Depth", // TODO: Win8Apps WORK 92: Add localization support
                supportedSizes: supportedSizes
            },
            crayon: {
                toolClass: AppNS.Painter.Tools.Crayon,
                label: "Crayon", // TODO: Win8Apps WORK 92: Add localization support
                optionKey: "density",
                optionValues: [2, 1.75, 1.5, 1.25, 1.0, .75],
                defaultOptionIndex: 1,
                defaultSizeIndex: 4,
                optionLabel: "Density", // TODO: Win8Apps WORK 92: Add localization support
                supportedSizes: supportedSizes,
                textureImage: textureImage
            },
            eraser: {
                toolClass: AppNS.Painter.Tools.Eraser,
                label: "Eraser", // TODO: Win8Apps WORK 92: Add localization support
                supportedSizes: supportedSizes,
                defaultSizeIndex: 4
            }
        },

        // Loads all available tools into the given painter
        loadAllTools: function (painter) {
            var cards = AppNS.CanvasManager.ToolCards;
            var names = AppNS.CanvasManager.ToolNames;
            for (var name in cards) {
                var card = cards[name];
                var tool = new card.toolClass();
                tool.width = card.supportedSizes[card.defaultSizeIndex];
                if (name !== names.Eraser) {
                    tool[card.optionKey] = card.optionValues[card.defaultOptionIndex];
                }
                painter.loadTool(tool, name);
                
                if (name === names.Crayon) {
                    // Create texture image for crayon
                    var textureImage = new Image(40, 40);
                    var crayonTool = tool;
                    textureImage.addEventListener("load", function () {
                        crayonTool.setTexture(textureImage);
                    });
                    textureImage.src = "../Controls/Paint/Res/crayon_texture.png";
                }
            }
        }
    });
})(Microsoft.Paint);