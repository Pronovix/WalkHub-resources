(function ($, Walkhub, window) {
  "use strict";

  Walkhub.Controller = function (client, executor, logger) {
    var that = this;

    this.client = client;
    this.executor = executor;
    this.logger = logger;
    this.state = {
      walkthrough: null,
      step: null,
      completed: false,
      stepIndex: 0,
      parameters: {},
      HTTPProxyURL: "",
      next: []
    };

    this.playerMouseEventHandlerAdded = false;

    this.walkthrough = null;
    this.step = null;

    this.client.setStateChanged(function (_state) {
      that.state = _state;
      that.client.log(["New state", that.state]);
      if (that.state.recording) {
        if (that.state.recordStarted) {
          Walkhub.Recorder.instance()
            .setClient(that.client)
            .setController(that)
            .setState(that.state)
            .start();
        } else {
          that.state.recordStarted = true;
          that.client.updateState(that.state);
          Walkhub.CommandDispatcher.instance().executeCommand("open", {
            arg1: that.state.recordStartUrl
          });
        }
      } else {
        if (that.state.disableClicks && !that.playerMouseEventHandlerAdded) {
          Walkhub.EventAbsorber.instance()
            .disableHover()
            .subscribeToMouseEvents(function (clickedElement, eventData) {
              that.playerMouseEventHandler(clickedElement, eventData);
            });

          that.playerMouseEventHandlerAdded = true;
        }
        if (that.state.walkthrough) {
          that.refreshWalkthrough(function () {
            if (that.state.step && !that.state.completed) {
              that.client.log("Loading step");
              that.refreshStep(function () {
                that.initStep();
              });
            }
            else {
              that.client.log("Empty step");
              that.nextStep();
            }
          });
        }
      }
    });

    this.client.start();
  };

  Walkhub.Controller.prototype.playerMouseEventHandler = function (clickedElement, eventData) {
    if (Walkhub.Bubble.current && Walkhub.Bubble.current.editdialog) {
      return;
    }

    if (!clickedElement) {
      return;
    }

    if (clickedElement.length === 0) {
      return;
    }

    var rawClickedElement = clickedElement.get(0);

    if (this.clickShouldBeForwarded(clickedElement)) {
      Walkhub.Util.clickOnElement(rawClickedElement, eventData);

      if (Walkhub.Util.isInputElement(clickedElement)) {
        clickedElement.focus();
      }
    } else {
      if (window.confirm("This action is not part of the Walkthrough, to explore this page you can open it in a new tab.")) {
        window.open(window.location.href, "_blank");
      }
    }
  };

  Walkhub.Controller.prototype.clickShouldBeForwarded = function (clickedElement) {
    if (Walkhub.Util.isInputElement(clickedElement)) {
      return true;
    }

    if (this.step && this.step.pureCommand && !Walkhub.editDialog.actionNotLocatorBased[this.step.pureCommand]) {
      var locator = this.step.arg1;
      var element = Walkhub.Translator.instance().translate(locator);
      if (clickedElement.is(element)) {
        return true;
      }
    }

    return false;
  };

  Walkhub.Controller.prototype.getHTTPProxyURL = function () {
    return this.state.HTTPProxyURL;
  };

  Walkhub.Controller.prototype.getEditLink = function () {
    return this.state.editLink;
  };

  Walkhub.Controller.prototype.initStep = function () {
    var that = this;
    this.client.log("Step initialization started.");
    this.state.completed = false;
    this.client.updateState(this.state);
    this.executor.execute(this.step, false, function () {
      that.state.completed = true;
      that.client.updateState(that.state);
      that.client.log("Step completed");
    });
    if (Walkhub.CommandDispatcher.instance().isAutomaticCommand(this.step.pureCommand)) {
      this.client.log("Automatically executing step.");
      this.nextStep();
    }
  };

  Walkhub.Controller.prototype.finish = function () {
    this.logger.logResult(this.state, true);

    this.state.walkthrough = null;
    this.state.step = null;
    this.state.completed = false;
    this.state.stepIndex = 0;
    this.state.next = [];
    this.walkthrough = null;
    this.step = null;
    this.client.updateState(this.state);
    this.client.finish();
  };

  Walkhub.Controller.prototype.next = function () {
    var that = this;
    this.state.walkthrough = this.state.next.shift();
    this.state.step = null;
    this.state.completed = false;
    this.state.stepIndex = 0;
    this.walkthrough = null;
    this.step = null;
    this.client.updateState(this.state);
    this.refreshWalkthrough(function () {
      that.nextStep();
    });
  };

  Walkhub.Controller.prototype.nextStep = function () {
    var that = this;

    if (!this.state.completed && this.step) {
      this.client.log("Executing incomplete step.");
      this.state.completed = true;
      this.client.updateState(this.state);
      this.executor.execute(this.step, true);
    }

    if (this.walkthrough.steps.length === this.state.stepIndex) { // Last step
      this.client.log("Last step");

      setTimeout(function () {
        // Remove trailing "/start" from the url.
        var url = that.walkthrough.url.replace(new RegExp("(%2F|/)start$"), "");

        var share = "";
        for (var sl in Walkhub.SocialSharing) {
          if (Walkhub.SocialSharing.hasOwnProperty(sl)) {
            share += " " + Walkhub.SocialSharing[sl](url, that.name) + " ";
          }
        }

        var finish_text = "<p>This is the end of this walkthrough. Liked it?</p>";
        if (that.state.socialSharing === "1") {
          finish_text += "<p>Share it through one of the following services:</p>";
          finish_text += share;
        }

        var buttons = {};
        buttons.Finish = function () {
          that.finish();
        };
        if (that.state.next && that.state.next.length > 0) {
          buttons.Next = function () {
            that.next();
          };
        }

        that.executor.showExitDialog(finish_text, buttons);
      }, 100);
      return;
    }

    this.client.log("Loading next step (" + this.state.stepIndex + ")");
    this.state.step = this.walkthrough.steps[this.state.stepIndex];
    this.state.stepIndex++;
    this.state.completed = false;
    this.client.updateState(this.state);
    this.refreshStep(function () {
      that.client.log("Next step loaded, initalizing.");
      that.initStep();
    });
  };

  Walkhub.Controller.prototype.updateCurrentStep = function (step, callback) {
    var that = this;
    console.log(["Updating step", step]);
    this.client.send("walkhub-step/" + this.state.step, step, function (data) {
      console.log(["Updated data", data]);
      that.step = data;
      callback(data);
    }, function () {
      that.client.showError("updateCurrentStep", "Updating the step failed.");
    });
  };

  Walkhub.Controller.prototype.refreshWalkthrough = function (callback) {
    var that = this;
    this.walkthrough = null;
    this.client.updateState(this.state);
    this.step = null;
    this.client.send("walkhub-walkthrough/" + this.state.walkthrough, null, function (data) {
      that.walkthrough = data;
      that.client.log(["Walkthrough loaded", that.walkthrough]);
      if (callback) {
        callback(data);
      }
    }, Walkhub.logParams);
  };

  Walkhub.Controller.prototype.refreshStep = function (callback) {
    var that = this;
    this.step = null;
    this.client.send("walkhub-step/" + this.state.step, null, function (data) {
      that.step = that.processStep(data);
      that.client.log(["Step loaded", that.step]);
      if (callback) {
        callback(data);
      }
    }, Walkhub.logParams);
  };

  Walkhub.Controller.prototype.processStep = function (step) {
    var props = ["arg1", "arg2", "highlight", "description"];

    for (var parameter in this.state.parameters) {
      if (this.state.parameters.hasOwnProperty(parameter)) {
        for (var prop in props) {
          if (props.hasOwnProperty(prop)) {
            prop = props[prop];
            if (step[prop]) {
              step[prop] = step[prop].replace("[" + parameter + "]", this.state.parameters[parameter]);
            }
          }
        }
      }
    }

    // Override step editing parameter if the global state requires it.
    // For example during screening.
    if (!this.state.allowEditing) {
      step.canEdit = false;
    }

    return step;
  };

})(jqWalkhub, Walkhub, window);
