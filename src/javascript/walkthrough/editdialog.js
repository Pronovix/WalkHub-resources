(function ($, Walkhub, window) {
  "use strict";

  Walkhub.editDialog = function (step) {
    this.step = step;
    this.submit = function () {};
    this.success = function () {};
    this.controller = null;
    this.form = null;
  };

  Walkhub.editDialog.actionHasNoArguments = {
    altKeyDown: true,
    altKeyUp: true,
    "break": true,
    chooseCancelOnNextConfirmation: true,
    chooseOkOnNextConfirmation: true,
    close: true,
    controlKeyDown: true,
    controlKeyUp: true,
    deleteAllVisibleCookies: true,
    deselectPopUp: true,
    goBack: true,
    metaKeyDown: true,
    metaKeyUp: true,
    refresh: true,
    shiftKeyDown: true,
    shiftKeyUp: true,
    windowFocus: true,
    windowMaximize: true
  };

  Walkhub.editDialog.actionNotLocatorBased = {
    addLocationStrategy: 'strategy name',
    addScript: 'script content',
    allowNativeXpath: 'allow (boolean)',
    answerOnNextPrompt: 'answer',
    captureEntirePageScreenshot: 'filename',
    createCookie: 'name-value pair',
    deleteCookie: 'name',
    echo: 'message',
    ignoreAttributesWithoutValue: 'ignore (boolean)',
    open: 'url',
    openWindow: 'url',
    pause: 'wait time',
    removeScript: 'script tag id',
    rollup: 'rollup name',
    runScript: 'script',
    selectPopUp: 'window id',
    selectWindow: 'window id',
    setBrowserLogLevel: 'log level',
    setMouseSpeed: 'pixels',
    setSpeed: 'value',
    setTimeout: 'value',
    store: 'expression',
    useXpathLibrary: 'library name',
    waitForCondition: 'script',
    waitForFrameToLoad: 'frame address',
    waitForPageToLoad: 'timeout',
    waitForPopUp: 'window id'
  };

  Walkhub.editDialog.actionSecondArguments = {
    addLocationStrategy: 'function definition',
    addScript: 'script tag id',
    addSelection: 'option locator',
    assignId: 'identifier',
    captureEntirePageScreenshot: 'kwargs',
    clickAt: 'coordinates',
    contextMenuAt: 'coordinates',
    createCookie: 'options',
    deleteCookie: 'options',
    doubleClickAt: 'coordinates',
    dragAndDrop: 'movements',
    fireEvent: 'event name',
    keyDown: 'key sequence',
    keyPress: 'key sequence',
    keyUp: 'key sequence',
    mouseDownAt: 'coordinates',
    mouseDownRightAt: 'coordinates',
    mouseMoveAt: 'coordinates',
    mouseUpAt: 'coordinates',
    mouseUpRightAt: 'coordinates',
    openWindow: 'window id',
    removeSelection: 'option locator',
    rollup: 'kwargs',
    select: 'option locator',
    setCursorPosition: 'position',
    store: 'variable name',
    type: 'value',
    typeKeys: 'value',
    waitForCondition: 'timeout',
    waitForFrameToLoad: 'timeout',
    waitForPopUp: 'timeout'
  };

  Walkhub.editDialog.prototype.setSubmitCallback = function (submit) {
    this.submit = submit;
    return this;
  };

  Walkhub.editDialog.prototype.setSuccessCallback = function (success) {
    this.success = success;
    return this;
  };

  Walkhub.editDialog.prototype.setController = function (controller) {
    this.controller = controller;
    return this;
  };

  Walkhub.editDialog.prototype.open = function () {
    var that = this;

    this.form = $('<form><fieldset></fieldset></form>');
    var fieldset = $('fieldset', this.form);

    $('<label />')
      .attr('for', 'title')
      .html('Title')
      .appendTo(fieldset);
    var title = $('<input />')
      .attr('type', 'textfield')
      .attr('name', 'title')
      .attr('id', 'title')
      .val(this.step.titleRaw)
      .appendTo(fieldset);

    $('<label />')
      .attr('for', 'description')
      .html('Description')
      .appendTo(fieldset);

    var description = $('<textarea />')
      .val(this.step.descriptionRaw)
      .attr('name', 'description')
      .attr('id', 'description')
      .appendTo(fieldset);

    var suggestionwrapper = $('<div />')
      .attr('class', 'suggestions')
      .appendTo(fieldset)
      .hide();

    $('<label />')
      .attr('for', 'showtitle')
      .html('Show title')
      .appendTo(fieldset);

    var showtitle = $('<input />')
      .attr('type', 'checkbox')
      .attr('name', 'showtitle')
      .attr('id', 'showtitle')
      .appendTo(fieldset);

    if (this.step.showTitle) {
      showtitle.attr('checked', 'checked');
    }

    $('<a />')
      .html('Advanced settings')
      .attr('href', '#')
      .click(function (event) {
        event.preventDefault();

        advancedSettings.toggle();

        return false;
      })
      .appendTo($('<p />').appendTo(fieldset));

    var advancedSettings = $('<fieldset />')
      .hide()
      .appendTo(fieldset);

    var popularActions = {'click': true, 'type': true, 'select': true, 'open': true};

    $('<label />')
      .attr('for', 'action')
      .html('Action')
      .appendTo(advancedSettings);

    var actions = $('<select />')
      .attr('name', 'action')
      .attr('id', 'action')
      .appendTo(advancedSettings);

    for (var act in popularActions) {
      if (popularActions.hasOwnProperty(act)) {
        $('<option />')
          .attr('value', act)
          .text(act)
          .appendTo(actions);
      }
    }

    $('<option />')
      .attr('value', '')
      .text('other...')
      .appendTo(actions);

    var otherAction = $('<input />')
      .attr('name', 'otheraction')
      .attr('id', 'otheraction')
      .attr('type', 'textfield')
      .appendTo(advancedSettings);

    if (popularActions[this.step.pureCommand]) {
      actions.val(this.step.pureCommand);
      otherAction.val('');
    } else {
      actions.val('');
      otherAction.val(this.step.pureCommand);
    }

    var firstarglabel = $('<label />')
      .attr('for', 'firstarg')
      .appendTo(advancedSettings);

    var firstarg = $('<input />')
      .val(this.step.arg1)
      .attr('type', 'textfield')
      .attr('name', 'firstarg')
      .attr('id', 'firstarg')
      .appendTo(advancedSettings);

    var secondarglabel = $('<label />')
      .attr('for', 'secondarg')
      .appendTo(advancedSettings);

    var secondarg = $('<input />')
      .val(this.step.arg2)
      .attr('type', 'textfield')
      .attr('name', 'secondarg')
      .attr('id', 'secondarg')
      .appendTo(advancedSettings);

    $('<hr />')
      .appendTo(fieldset);

    $('<input />')
      .attr('type', 'submit')
      .val('Save')
      .appendTo(fieldset);

    var movebutton = $('<input />')
      .attr('type', 'submit')
      .val('Move')
      .appendTo(fieldset)
      .click(function (event) {
        event.preventDefault();

        Walkhub.Bubble.current.beginMove();

        return false;
      });

    var getAction = function () {
      var selectAction = actions.val();
      return selectAction ? selectAction : otherAction.val();
    };

    var refreshArgs = function () {
      var action = getAction();

      if (Walkhub.editDialog.actionHasNoArguments[action]) {
        firstarglabel.hide();
        firstarg.hide();
        secondarglabel.hide();
        secondarg.hide();
        movebutton.hide();
        return;
      }

      firstarglabel.show();
      firstarg.show();

      if (Walkhub.editDialog.actionNotLocatorBased[action]) {
        firstarglabel.html(Walkhub.editDialog.actionNotLocatorBased[action]);
        movebutton.hide();
      } else {
        firstarglabel.html('Locator');
        movebutton.show();
      }

      if (Walkhub.editDialog.actionSecondArguments[action]) {
        secondarglabel.html(Walkhub.editDialog.actionSecondArguments[action]);
        secondarglabel.show();
        secondarg.show();
      } else {
        secondarglabel.hide();
        secondarg.hide();
      }
    };

    otherAction.keyup(function () {
      refreshArgs();
    });

    actions
      .change(function () {
        if (actions.val()) {
          otherAction.hide();
        } else {
          otherAction.show();
        }

        refreshArgs();
      })
      .change();

    this.form.submit(function (event) {
      event.preventDefault();

      var possibleHighlight = firstarg.val();
      var action = getAction();

      if (Walkhub.editDialog.actionHasNoArguments[action]) {
        that.step.highlight = '';
      } else if (!Walkhub.editDialog.actionNotLocatorBased[action]) {
        that.step.highlight = possibleHighlight;
      }

      that.step.titleRaw = title.val();
      that.step.descriptionRaw = description.val();
      that.step.showTitle = showtitle.get(0).checked;
      that.step.pureCommand = action;
      that.step.command = that.step.andWait ? that.step.pureCommand + 'AndWait' : that.step.pureCommand;
      that.step.arg1 = possibleHighlight;
      that.step.arg2 = secondarg.val();
      that.submit();
      that.form.remove();
      that.form = null;
      that.controller.updateCurrentStep(that.step, that.success);
    });

    var querystring =
      'command=' + encodeURIComponent(this.step.command) + '&' +
        'arg1=' + encodeURIComponent(this.step.arg1) + '&' +
        'arg2=' + encodeURIComponent(this.step.arg2);
    this.controller.client.send('walkhub-step-suggestion?' + querystring, null, function (data) {
      suggestionwrapper
        .show()
        .append($('<p/>').text('Suggestions: '));
      for (var i in data) {
        if (data.hasOwnProperty(i)) {
          $('<p />')
            .text(data[i])
            .click(function (event) {
              event.preventDefault();
              description.val($(this).text());
            })
            .css('cursor', 'pointer')
            .css('font-size', 'small')
            .appendTo(suggestionwrapper);
        }
      }
    });

    this.form.appendTo($('.joyride-content-wrapper'));

    refreshArgs();
  };
})(jqWalkhub, Walkhub, window);
