////////////////////////////////////////////////////////////
////   © Microsoft. All rights reserved.                ////
////////////////////////////////////////////////////////////

/// <reference path="Global.js"/>
/// <reference path="Utilities.js"/>

(function (AppNS) {

    // Error strings for logging purposes
    var invalidKeyError = "Invalid argument: The specified key is not a non-empty string.";
    var invalidValueError = "Invalid argument: The specified value is not valid.";
    var storeValueError = "Error storing value '{0}' for key '{1}': '{2}'";
    var getValueError = "Error getting value for key '{0}': '{1}'";
    var removeError = "Error removing key '{0}': '{1}'";

    // Local scope objects
    var emptyFunction = function () {};
    var localSettings = Windows.Storage.ApplicationData.current.localSettings.values;

    // Etw with default noop handlers
    var etw = {
        stateManagerStoreValueStart: emptyFunction,
        stateManagerStoreValueEnd: emptyFunction,
        stateManagerGetValueStart: emptyFunction,
        stateManagerGetValueEnd: emptyFunction
    };

    function validateKey(key) {
        /// <summary>
        /// Check if the given key is a non-empty string
        /// </summary>
        return (typeof key === "string" && key !== "");
    };

    /// <summary>
    /// Static methods for manipulating persisted states in key/value pairs
    /// </summary>
    WinJS.Namespace.defineWithParent(AppNS, "StateManager", {
        storeValue: function (key, value) {
            /// <summary>
            /// Stores the given key/value pair
            /// </summary>
            /// <param name='key'>
            /// The name of the key the value is associated with
            /// </param>
            /// <param name='value'>
            /// The value to store
            /// </param>
            /// <returns>
            /// true if successful; false otherwise.
            /// </returns>
            if (!validateKey(key)) {
                throw new Error(invalidKeyError);
            }

            if (value === undefined || value === null) {
                throw new Error(invalidValueError);
            }

            etw.stateManagerStoreValueStart(key);

            var succeeded = false;

            try {
                var valueToStore = "";

                if (typeof value === "object") {
                    valueToStore = JSON.stringify(value);
                } else {
                    valueToStore = value.toString();
                }

                localSettings.insert(key, valueToStore);

                succeeded = true;
            } catch (error) {
                window.console.log("StateManager.storeValue", storeValueError.format([value, key, error]));
            }

            etw.stateManagerStoreValueEnd(key);

            return succeeded;
        },

        getValueAsString: function (key) {
            /// <summary>
            /// Retrieves the value for the given key
            /// </summary>
            /// <param name='key'>
            /// The name of the key to retrieve the value
            /// </param>
            /// <returns>
            /// The string value associated with the given key,
            /// or null if the key is not found or error.
            /// </returns>
            if (!validateKey(key)) {
                throw new Error(invalidKeyError);
            }

            etw.stateManagerGetValueStart(key);

            var value = null;

            try {
                value = localSettings.lookup(key);
            } catch (error) {
                window.console.log("StateManager.getValueAsString", getValueError.format([key, error]));
            }

            etw.stateManagerGetValueEnd(key);

            return value;
        },

        getValueAsObject: function (key) {
            /// <summary>
            /// Retrieves the value for the given key and returns it as a JSON object
            /// </summary>
            /// <param name='key'>
            /// The name of the key to retrieve the value
            /// </param>
            /// <returns>
            /// The JSON value associated with the given key,
            /// or null if the key is not found or error.
            /// </returns>
            if (!validateKey(key)) {
                throw new Error(invalidKeyError);
            }

            etw.stateManagerGetValueStart(key);

            var value = null;

            try {
                value = JSON.parse(localSettings.lookup(key));
            } catch (error) {
                window.console.log("StateManager.getValueAsObject", getValueError.format([key, error]));
            }

            etw.stateManagerGetValueEnd(key);

            return value;
        },

        remove: function (key) {
            /// <summary>
            /// Removes the given key from the store
            /// </summary>
            /// <param name='key'>
            /// The name of the key to be removed
            /// </param>
            /// <returns>
            /// true if the key is successfully removed or not present; false otherwise.
            /// </returns>
            if (!validateKey(key)) {
                throw new Error(invalidKeyError);
            }

            var succeeded = false;

            try {
                localSettings.remove(key);
                succeeded = true;
            } catch (error) {
                window.console.log("StateManager.remove", removeError.format([key, error]));
            }

            return succeeded;
        },

        clear: function () {
            /// <summary>
            /// Clear all settings
            /// </summary>
            localSettings.clear();
        },

        init: function (etwProvider) {
            /// <summary>
            /// Initializes state manager
            /// </summary>
            /// <param name='etwProvider'>
            /// etwProvider is a reference to the ETW provider for logging events.
            /// </param>
            if (etwProvider) {
                etw.stateManagerStoreValueStart = etwProvider.stateManagerStoreValueStart || etw.stateManagerStoreValueStart;
                etw.stateManagerStoreValueEnd = etwProvider.stateManagerStoreValueEnd || etw.stateManagerStoreValueEnd;
                etw.stateManagerGetValueStart = etwProvider.stateManagerGetValueStart || etw.stateManagerGetValueStart;
                etw.stateManagerGetValueEnd = etwProvider.stateManagerGetValueEnd || etw.stateManagerGetValueEnd;
            }
        }
    });
})(Microsoft.Paint);