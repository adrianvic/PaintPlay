////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

/// <reference path="../WinJS/js/base.js" />
/// <reference path="../WinJS/js/ui.js" />

(function (BaseNS) {
    var AppNS = WinJS.Namespace.defineWithParent(BaseNS, "Paint", {
        ViewManager: WinJS.Class.define(function (host, views) {
                this._host = host;
                this._loadedViews = [];
                if (typeof views === "object") {
                    this._views = views;
                } else {
                    throw new Error("views parameter must be object");
                }
            },
            {
                // Public members

                load: function(view, state) {
                    /// <summary>
                    /// Load a view into the main section
                    /// </summary>
                    /// <param name='view'>
                    /// String key for the view to be loaded
                    /// </param>
                    /// <param name='state' optional='true'>
                    /// State object to be passed to the view
                    /// </param>

                    if (this._views[view]) {
                        var that = this;
                        if (this._views[view].uri) {
                            WinJS.UI.Fragments.clone(this._views[view].uri, state)
                                .then(function (frag) {
                                    that._host.appendChild(frag);
                                    if(that._views[view].setupFunction) {
                                        var setup =  WinJS.Utilities.getMember(that._views[view].setupFunction, null);
                                        var persistedData = AppNS.StateManager.getValueAsObject(view);
                                        setup(that._host, persistedData);
                                        that._loadedViews.push(view);
                                    }
                                    document.body.focus();
                                });
                        } else {
                            throw new Error("View does not have a uri property");
                        }
                    } else {
                        throw new Error("View is not defined in the view list");
                    }
                },

                persistViewStates: function () {
                    /// <summary>
                    /// Persists the loaded view states
                    /// </summary>
                    var persistedData = {};
                    for (var viewIndex in this._loadedViews) {
                        var view = this._loadedViews[viewIndex];
                        var viewNamespace = WinJS.Utilities.getMember(this._views[view].namespace);
                        if (viewNamespace) {
                            var getViewData = viewNamespace.getViewData;
                            var getViewBlobs = viewNamespace.getViewBlobs;
                            if (getViewData && typeof getViewData === "function") {
                                var viewBlobs = getViewBlobs();
                                var viewData = getViewData();

                                // Write blobs to local storage
                                for (var blob in viewBlobs) {
                                    AppNS.Utils.writeBlobToLocalFolderAsync(viewBlobs[blob], blob)
                                        .then(function () { }, function () { });
                                }

                                // Persist data
                                AppNS.StateManager.storeValue(view, viewData);
                            } else {
                                throw new Error("View does not implement getViewData function");
                            }
                        } else {
                            throw new Error("Invalid namespace for view");
                        }
                    }
                },

                changeViewsLayout: function (newLayout) {
                    /// <summary>
                    /// Changes the layout that the views are displaying
                    /// </summary>
                    for (var viewIndex in this._loadedViews) {
                        var view = this._loadedViews[viewIndex];
                        var viewNamespace = WinJS.Utilities.getMember(this._views[view].namespace);
                        if (viewNamespace) {
                            var changeLayout = viewNamespace.changeLayout;
                            if (changeLayout && typeof changeLayout === "function") {
                                changeLayout(newLayout);
                            } else {
                                throw new Error("View does not implement changeLayout function");
                            }
                        } else {
                            throw new Error("Invalid namespace for view");
                        }
                    }
                }
            }
    )});
})(Microsoft);