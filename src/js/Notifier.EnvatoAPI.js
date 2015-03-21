/*global Notifier*/
/*jslint browser: true, nomen: true, plusplus: true */
(function (Notifier) {
    "use strict";
    var EnvatoAPI = function (options) {
        this.apiVersion = "v3";

        this.config = {
            requestTimeout: options.requestTimeout || 5000,
            envatoUser: options.envatoUser || "",
            envatoApiKey: options.envatoApiKey || "",
            callbackError: options.callbackError || this.printError
        };

        this.urlPattern = "http://marketplace.envato.com/api/v3/%s.json";
        this.api = {
            user: { label: "user", private: false, ttl: 180 },
            vitals: { label: "vitals", private: true, ttl: 60 }
        };

    };


    EnvatoAPI.prototype.printError = function (msg) {
        console.error(msg);
    };

    EnvatoAPI.prototype.prepareUrl = function (action, payload) {
        var apiCommand = "",
            config = this.config,
            apiAction = this.api[action];

        if (!apiAction) {
            return null;
        }

        if (apiAction.private) {
            apiCommand = config.envatoUser + "/" + config.envatoApiKey + "/" + apiAction.label;
        } else {
            apiCommand = apiAction.label;
        }

        if (payload) {
            apiCommand += ":" + payload;
        }

        return this.urlPattern.replace("%s", apiCommand);
    };

    EnvatoAPI.prototype.fetchData = function (apiAction, payload, callback) {
        var self = this,
            callbackError = self.config.callbackError,
            url,
            xhr;

        url = this.prepareUrl(apiAction, payload);

        if (!url) {
            return null;
        }

        xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = this.requestTimeout;
        xhr.onerror = function (error) {
            // Note: there is CORS issue on 403 headers, it makes impossible to get error.
            callbackError("Oops, we've got error! Double check your user name & API key if you are in Notification balance mode");
        };
        xhr.onreadystatechange = function () {
            var data;
            if (xhr.readyState === 4) {
                try {
                    data = JSON.parse(xhr.responseText);
                    callback(data);
                } catch (e) {
                    callbackError(e);
                }
            }
        };

        xhr.send(null);
    };

    EnvatoAPI.prototype.getUser = function (callback) {
        this.fetchData("user", this.config.envatoUser, callback);
    };

    EnvatoAPI.prototype.getVitals = function (callback) {
        this.fetchData("vitals", null, callback);
    };

    EnvatoAPI.prototype.destroy = function () {
        this.config = {};
    };

    Notifier.EnvatoAPI = EnvatoAPI;
}(Notifier));