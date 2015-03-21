/*global Notifier*/
/*jslint browser: true, nomen: true, plusplus: true */
(function (Notifier) {
    "use strict";
    var ViewController = function (notifier) {
        this.ui = {
            startButton: null,
            stopButton: null,
            usernameField: null,
            messageBox: null,
            form: null
        };
        this.eventBounds = {
            run: notifier.run.bind(notifier),
            stop: notifier.stop.bind(notifier),
            closeMessageBox: this.closeMessageBox.bind(this),
            notificationTypeChanged: this.notificationTypeChanged.bind(this)
        };
    };


    ViewController.prototype.closeMessageBox = function () {
        var messageBox = this.ui.messageBox;

        messageBox.classList.remove("show-success");
        messageBox.classList.remove("show-error");
        messageBox.innerHTML = "";
    };

    ViewController.prototype.showError = function (message) {
        var messageBox = this.ui.messageBox;

        this.closeMessageBox();
        messageBox.classList.add("show-error");
        messageBox.innerHTML = message;
    };

    ViewController.prototype.showMessage = function (message) {
        var messageBox = this.ui.messageBox;

        this.closeMessageBox();
        messageBox.classList.add("show-success");
        messageBox.innerHTML = message;
    };

    ViewController.prototype.setState = function (currentState) {
        var states = Notifier.STATES;

        switch (currentState) {
        case states.RUNNING:
            this.closeMessageBox();
            this.toggleControlButtons("stop");
            this.disableInputs(true);
            break;
        default:
            this.closeMessageBox();
            this.notificationTypeChanged();
            this.toggleControlButtons("start");
            this.disableInputs(false);
            break;
        }

    };

    ViewController.prototype.disableInputs = function (disable) {
        var ui = this.ui,
            state = !!disable,
            tmp,
            i;

        ui.usernameField.disabled = state;
        ui.apikeyField.disabled = state;

        tmp = ui.form.querySelectorAll("[name='interval']");
        for (i = 0; i < tmp.length; i++) {
            tmp[i].disabled = state;
        }

        tmp = ui.form.querySelectorAll("[name='type']");
        for (i = 0; i < tmp.length; i++) {
            tmp[i].disabled = state;
        }
    };

    ViewController.prototype.toggleControlButtons = function (makeVisible) {
        var ui = this.ui;
        if (makeVisible === "stop") {
            ui.startButton.parentNode.classList.add("hidden");
            ui.stopButton.parentNode.classList.remove("hidden");
        } else {
            ui.startButton.parentNode.classList.remove("hidden");
            ui.stopButton.parentNode.classList.add("hidden");
        }
    };

    ViewController.prototype.notificationTypeChanged = function () {
        var ui = this.ui,
            apiKeyLabel = ui.apikeyField.parentNode;

        if (this.getNotificationType() === "balance") {
            apiKeyLabel.classList.remove("hidden");
        } else {
            apiKeyLabel.classList.add("hidden");
        }
    };

    ViewController.prototype.init = function (state) {
        var ui = this.ui,
            eventBounds = this.eventBounds,
            usernameField = document.getElementById("username"),
            apikeyField = document.getElementById("apikey"),
            startButton = document.getElementById("start"),
            stopButton = document.getElementById("stop"),
            messageBox = document.getElementById("messageBox"),
            form = document.getElementById("form"),
            tmp,
            i;

        if (!usernameField) {
            console.error("Couldn't find username input text field");
            return;
        }

        if (!apikeyField) {
            console.error("Couldn't find api key input text field");
            return;
        }

        if (!startButton) {
            console.error("Couldn't find start button");
            return;
        }

        if (!stopButton) {
            console.error("Couldn't find stop button");
            return;
        }

        if (!messageBox) {
            console.error("Couldn't find message box");
            return;
        }

        if (!form) {
            console.error("Couldn't find form element");
            return;
        }

        // Register event listener
        startButton.addEventListener("click", eventBounds.run, false);
        stopButton.addEventListener("click", eventBounds.stop, false);
        messageBox.addEventListener("click", eventBounds.closeMessageBox, false);

        tmp = form.querySelectorAll("[name='type']");
        for (i = 0; i < tmp.length; i++) {
            tmp[i].addEventListener("change", eventBounds.notificationTypeChanged, false);
        }

        // Cache it
        ui.startButton = startButton;
        ui.stopButton = stopButton;
        ui.usernameField = usernameField;
        ui.apikeyField = apikeyField;
        ui.messageBox = messageBox;
        ui.form = form;

        this.setState(state);
    };

    ViewController.prototype.destroy = function () {
        var tmp, i,
            eventBounds = this.eventBounds,
            ui = this.ui;
        // Remove event listener
        ui.startButton.removeEventListener("click", eventBounds.run, false);
        ui.stopButton.removeEventListener("click", eventBounds.stop, false);
        ui.messageBox.removeEventListener("click", eventBounds.closeMessageBox, false);

        tmp = ui.form.querySelectorAll("[name='type']");
        for (i = 0; i < tmp.length; i++) {
            tmp[i].removeEventListener("change", eventBounds.notificationTypeChanged, false);
        }
    };

    ViewController.prototype.getApiKey = function () {
        return this.ui.apikeyField.value;
    };

    ViewController.prototype.getUsername = function () {
        return this.ui.usernameField.value;
    };

    ViewController.prototype.getNotificationType = function () {
        var tmp, i, checkedValue;

        tmp = this.ui.form.querySelectorAll("[name='type']");
        for (i = 0; i < tmp.length; i++) {
            if (tmp[i].checked === true) {
                checkedValue = tmp[i].value;
            }
        }

        return checkedValue;
    };

    ViewController.prototype.getFetchInterval = function () {
        var tmp, i, checkedValue;

        tmp = this.ui.form.querySelectorAll("[name='interval']");
        for (i = 0; i < tmp.length; i++) {
            if (tmp[i].checked === true) {
                checkedValue = tmp[i].value;
            }
        }

        return checkedValue;
    };

    Notifier.ViewController = ViewController;
}(Notifier));