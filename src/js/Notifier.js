/*global Notification, alert*/
/*jslint browser: true, nomen: true, plusplus: true */
var Notifier = (function () {
    "use strict";
    var STATES = {
            INIT: 1000,
            NOTI_NOT_SUPPORTED_BY_BROWSER: 1001,
            NOTI_PERMISSION_DENIED: 1002,
            IDLE: 1003,
            RUNNING: 1004
        },
        Notifier = function () {
            this._currentState = STATES.INIT;
            this._viewController = new Notifier.ViewController(this);

            this.config = {
                envatoUser: null,
                envatoApiKey: null,
                notificationAutoClose: 5000 // Keep notification for 5 seconds and after that close it
            };
            this.api = null;
            this.intervalId = null;
            this.dataCache = {};
        };

    Notifier.prototype.notify = function (title, message, icon) {
        var notification,
            notificationClose,
            timeoutId,
            self = this;


        notification = new Notification(title, {
            tag: "notifier",
            icon: "img/envato-sign-128.png",
            body: message
        });

        notificationClose = notification.close.bind(notification);

        notification.onshow = function () {
            // Set auto close timeout
            timeoutId = setTimeout(notificationClose, self.config.notificationAutoClose);
        };

        // Clear timeout on close
        notification.onclose = function () {
            window.clearTimeout(timeoutId);
        };

        // Close notification on click
        notification.click = notificationClose;

        notification.error = function (e) {
            self.showError(e);
        };
    };

    Notifier.prototype.checkBrowserCompatibility = function () {
        if (!window.hasOwnProperty("Notification")) {
            return STATES.NOTI_NOT_SUPPORTED_BY_BROWSER;
        }

        if (Notification.permission !== "granted") {
            return STATES.NOTI_PERMISSION_DENIED;
        }

        return STATES.IDLE;
    };

    Notifier.prototype.requestNotificationPermission = function () {
        var self = this;

        if (Notification.permission !== "granted") {
            Notification.requestPermission(function (permission) {
                if (permission === "granted") {
                    self._currentState = STATES.IDLE;
                }
            });
        }
    };

    Notifier.prototype.run = function () {
        var config = this.config,
            self = this,
            _viewController = this._viewController,
            dataFetchInterval,
            notificationType,
            intervalFunction,
            apiCommand,
            envatoApi,
            dataCache = this.dataCache;

        if (this._currentState !== STATES.IDLE) {
            this.showError("Notifier is not in IDLE state. Can't do run again!");
            return;
        }

        config.envatoUser = _viewController.getUsername();
        config.envatoApiKey = _viewController.getApiKey();
        notificationType = _viewController.getNotificationType();

        if (config.envatoUser === "") {
            this.showError("Please provide your user name!");
            return;
        }

        if (config.envatoApiKey === "" && notificationType === "balance") {
            this.showError("To check your balance you need to input your Envato API Key!");
            return;
        }

        envatoApi = new Notifier.EnvatoAPI({
            envatoUser: config.envatoUser,
            envatoApiKey: config.envatoApiKey
        });

        // Create instance of API
        if (this.api) {
            this.api.destroy();
        }
        this.api = envatoApi;

        apiCommand = notificationType !== "balance" ? "user" : "vitals";

        switch (_viewController.getFetchInterval()) {
            case "1h": dataFetchInterval = 3600000; break;
            case "15min": dataFetchInterval = 900000; break;
            default:
            case "asap":
                dataFetchInterval = envatoApi.api[apiCommand].ttl * 1000;
                break;
        }

        this._currentState = STATES.RUNNING;
        _viewController.setState(this._currentState);

        switch (apiCommand) {
            case "user":
                intervalFunction = envatoApi.getUser.bind(envatoApi, function (data) {
                    if (!dataCache.user) {
                        dataCache.user = {sales: data.user.sales};
                        self.notify("I'm watching your sales!", "You have " + dataCache.user.sales + " sales for now.");
                    } else {
                        dataCache.user = {sales: data.user.sales};
                        if (data.user.sales !== dataCache.user.sales) {
                            self.notify("You've got sale!", "You have " + dataCache.user.sales + " sales for now.");
                        }
                    }
                });
                break;
            case "vitals":
                intervalFunction = envatoApi.getVitals.bind(envatoApi, function (data) {
                    if (!dataCache.vitals) {
                        dataCache.vitals = {balance: data.vitals.balance};
                        self.notify("I'm watching your balance!", "Your balance is $" + data.vitals.balance);
                    } else {
                        if (data.vitals.balance > dataCache.vitals.balance) {
                            self.notify("Gonna be rich!", "Your balance is $" + data.vitals.balance);
                        }
                        if (data.vitals.balance < dataCache.vitals.balance) {
                            self.notify("Hey, hey, where is my money?!", "Your balance is $" + data.vitals.balance);
                        }
                        dataCache.vitals = {balance: data.vitals.balance};
                    }
                });

        }

        intervalFunction();
        this.intervalId = setInterval(intervalFunction, dataFetchInterval);
        console.log("Interval %s was set to %ss", this.intervalId, (dataFetchInterval/1000))
    };

    Notifier.prototype.init = function () {
        // TODO: warn user, that running it from local files desktop
        if (this._currentState === STATES.RUNNING) {
            this.showError("Notifier is already running. Can't do init again!");
            return;
        }

        this._currentState = this.checkBrowserCompatibility();
        this._viewController.init();

        switch (this._currentState) {
            case STATES.NOTI_NOT_SUPPORTED_BY_BROWSER:
                this.showError("Desktop notifications are not supported by your web browser.");
                break;
            case STATES.NOTI_PERMISSION_DENIED:
                this.requestNotificationPermission();
                break;
            case STATES.IDLE:
                this._viewController.setState(STATES.IDLE);
                break;
        }
    };

    Notifier.prototype.stop = function () {
        window.clearInterval(this.intervalId);
        this.intervalId = null;
        this._viewController.setState(STATES.IDLE);
        this._currentState = STATES.IDLE;
    };

    Notifier.prototype.showError = function (message) {
        this._viewController.showError(message);
    };

    Notifier.prototype.showMessage = function (message) {
        this._viewController.showMessage(message);
    };

    Notifier.prototype.destroy = function () {
        if (this.intervalId !== null) {
            window.clearInterval(this.intervalId);
        }
        this._viewController.destroy();
        this.dataCache = {};
    };

    Notifier.STATES = STATES;
    return Notifier;
}());
