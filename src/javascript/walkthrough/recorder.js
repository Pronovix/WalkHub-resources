(function ($, Walkhub) {
  "use strict";

  Walkhub.Recorder = function () {
    this.client = null;
    this.controller = null;
    this.state = null;
    this.started = false;
    this.unsubscribeFunc = null;
  };

  Walkhub.Recorder.instance = function () {
    if (!this.instanceObject) {
      this.instanceObject = new Walkhub.Recorder();
    }

    return this.instanceObject;
  };

  Walkhub.Recorder.prototype.setClient = function (client) {
    this.client = client;
    return this;
  };

  Walkhub.Recorder.prototype.setController = function (controller) {
    this.controller = controller;
    return this;
  };

  Walkhub.Recorder.prototype.setState = function (state) {
    this.state = state;
    return this;
  };

  Walkhub.Recorder.prototype.start = function () {
    if (this.started) {
      return;
    }

    var that = this;

    var mouseWrapper = function (clickedElement, eventData) { that.mouseEventHandler(clickedElement, eventData); };
    var keyboardWrapper = function (type, key) { that.keyboardEventHandler(type, key); };

    Walkhub.EventAbsorber.instance().subscribeToMouseEvents(mouseWrapper);
    Walkhub.EventAbsorber.instance().subscribeToKeyboardEvents(keyboardWrapper);

    this.unsubscribeFunc = function () {
      Walkhub.EventAbsorber.instance().unsubscribeFromMouseEvents(mouseWrapper);
      Walkhub.EventAbsorber.instance().unsubscribeFromKeyboardEvents(keyboardWrapper);
    };

    this.started = true;
  };

  Walkhub.Recorder.prototype.stop = function () {
    if (!this.started) {
      return;
    }

    this.started = false;

    if (this.unsubscribeFunc) {
      this.unsubscribeFunc();
    }
  };

  Walkhub.Recorder.prototype.save = function () {
    this.client.updateState(this.state);
  };

  Walkhub.Recorder.prototype.mouseEventHandler = function (clickedElement, eventData) {
    if (!clickedElement) {
      return;
    }

    if (!Walkhub.Util.isInputElement(clickedElement)) {
      var locator = Walkhub.LocatorGenerator.instance().generate(clickedElement);
      this.client.saveStep("click", locator, null);
    }

    if (clickedElement.length === 0) {
      return;
    }

    var rawClickedElement = clickedElement.get(0);

    Walkhub.Util.clickOnElement(rawClickedElement, eventData);

    if (window.document.activeElement === rawClickedElement) {
      return;
    }

    if (rawClickedElement.isContentEditable) {
      var focusElement = rawClickedElement;
      while (focusElement && focusElement.contentEditable === "inherit") {
        focusElement = focusElement.parentNode;
        if (window.document.activeElement === focusElement) {
          return;
        }
      }
      focusElement.focus();
    } else {
      rawClickedElement.focus();
    }
  };

  Walkhub.Recorder.prototype.keyboardEventHandler = function (element, value) {
    var locator = Walkhub.LocatorGenerator.instance().generate(element);

    if (!locator) {
      return;
    }

    var tagName = (element.prop("tagName") || "").toLowerCase();
    switch (tagName) {
      case "select":
        this.client.saveStep("select", locator, "value=" + value);
        break;
      case "input":
      case "textarea":
        var ispw = element.attr("type") === "password";
        if (ispw) {
          this.client.enablePasswordParameter();
        }
        this.client.saveStep("type", locator, ispw ? "[password]" : value);
        break;
      default:
        if (element.length && element.get(0).isContentEditable) {
          var valueDom = $(element.html());
          valueDom.find(".walkthrough-eventabsorber-hover").removeClass("walkthrough-eventabsorber-hover");
          var finalValue = $("<div />").append(valueDom).html();
          this.client.saveStep("type", locator, finalValue);
        } else {
          this.client.log(["TODO add support for: " + tagName, locator, value]);
        }
    }
  };


})(jqWalkhub, Walkhub);
