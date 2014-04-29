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

    var mouseWrapper = function (clickedElement) { that.mouseEventHandler(clickedElement); };
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

  Walkhub.Recorder.prototype.mouseEventHandler = function (clickedElement) {
    if (!Walkhub.Util.isInputElement(clickedElement)) {
      var locator = Walkhub.LocatorGenerator.instance().generate(clickedElement);
      this.client.saveStep('click', locator, null);
    }

    Walkhub.Util.clickOnElement(clickedElement);
    clickedElement.focus();
  };

  Walkhub.Recorder.prototype.keyboardEventHandler = function (element, value) {
    var locator = Walkhub.LocatorGenerator.instance().generate(element);

    this.client.saveStep('type', locator, value);
  };


})(jqWalkhub, Walkhub);
