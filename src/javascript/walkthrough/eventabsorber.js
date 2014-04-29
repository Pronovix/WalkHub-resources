(function ($, Walkhub, window) {
  "use strict";

  Walkhub.EventAbsorber = function () {
    this.mouseEventCallbacks = [];
    this.mouseEventAbsorber = null;

    this.keyboardEventCallbacks = [];
    this.keyboardWatcherLooping = false;
    this.activeElement = null;
    this.activeElementValue = null;
  };

  Walkhub.EventAbsorber.instance = function () {
    if (!this.instanceObject) {
      this.instanceObject = new Walkhub.EventAbsorber();
    }

    return this.instanceObject;
  };

  Walkhub.EventAbsorber.prototype.absorbKeyboardEvents = function () {
    var that = this;

    if (this.keyboardWatcherLooping) {
      return;
    }

    this.keyboardWatcherLooping = true;

    (function watcher() {
      if (that.activeElement !== window.document.activeElement) {
        var currentValue = null;
        var activeElement = $(that.activeElement);
        switch (Walkhub.Util.isInputElement(activeElement)) {
          case 1:
            currentValue = activeElement.val();
            break;
          case 2:
            // @TODO add proper support to contentEditable
            break;
        }

        if (that.activeElementValue !== currentValue && currentValue !== null) {
          for (var cb in that.keyboardEventCallbacks) {
            if (that.keyboardEventCallbacks.hasOwnProperty(cb)) {
              that.keyboardEventCallbacks[cb](activeElement, currentValue);
            }
          }
        }

        that.activeElement = window.document.activeElement;
        that.activeElementValue = currentValue;
      }
      if (that.keyboardWatcherLooping) {
        setTimeout(watcher, 100);
      }
    })();
  };

  Walkhub.EventAbsorber.prototype.subscribeToKeyboardEvents = function (callback) {
    this.keyboardEventCallbacks.push(callback);
    this.absorbKeyboardEvents();
  };

  Walkhub.EventAbsorber.prototype.unsubscribeFromKeyboardEvents = function (callback) {
    var i = this.keyboardEventCallbacks.indexOf(callback);
    if (i > -1) {
      this.keyboardEventCallbacks.splice(i, 1);
    }

    if (this.keyboardEventCallbacks.length === 0) {
      this.stopAbsorbingKeyboardEvents();
    }
  };

  Walkhub.EventAbsorber.prototype.stopAbsorbingKeyboardEvents = function () {
    this.keyboardWatcherLooping = false;
  };

  Walkhub.EventAbsorber.prototype.absorbMouseEvents = function () {
    var that = this;
    if (!this.mouseEventAbsorber) {
      this.mouseEventAbsorber = $('<div />')
        .css('width', '1px')
        .css('height', '1px')
        .css('background-color', 'rgba(1, 1, 1, 0)')
        .css('position', 'absolute')
        .click(function (event) {
          event.preventDefault();
          event.stopPropagation();

          var clickedElement = that.getElementAtEvent(event);

          for (var cb in that.mouseEventCallbacks) {
            if (that.mouseEventCallbacks.hasOwnProperty(cb)) {
              that.mouseEventCallbacks[cb](clickedElement);
            }
          }

          return false;
        })
        .appendTo($('body'));

      $(window)
        .bind('mousemove.walkhub', function (event) {
          var pos = that.getPositionFromEvent(event, false);
          that.mouseEventAbsorber
            .css('top', pos.y)
            .css('left', pos.x);

          that.refreshHover(event);
        });
    }
  };

  Walkhub.EventAbsorber.prototype.subscribeToMouseEvents = function (callback) {
    this.mouseEventCallbacks.push(callback);
    this.absorbMouseEvents();
  };

  Walkhub.EventAbsorber.prototype.unsubscribeFromMouseEvents = function (callback) {
    var i = this.mouseEventCallbacks.indexOf(callback);
    if (i > -1) {
      this.mouseEventCallbacks.splice(i, 1);
    }

    if (this.mouseEventCallbacks.length === 0) {
      this.stopAbsorbingMouseEvents();
    }
  };

  Walkhub.EventAbsorber.prototype.stopAbsorbingMouseEvents = function () {
    $(window).unbind('mousemove.walkhub');
    this.removeHover();
    this.mouseEventAbsorber.remove();
    this.mouseEventAbsorber = null;
  };

  Walkhub.EventAbsorber.prototype.removeHover = function () {
    $('.walkthrough-eventabsorber-hover')
      .removeClass('walkthrough-eventabsorber-hover');
  };

  Walkhub.EventAbsorber.prototype.refreshHover = function (event) {
    this.removeHover();
    this.getElementAtEvent(event).addClass('walkthrough-eventabsorber-hover');
  };

  Walkhub.EventAbsorber.prototype.getElementAtEvent = function (event) {
    var pos = this.getPositionFromEvent(event, true);
    return $(window.document.elementFromPoint(pos.x, pos.y - 1));
  };

  Walkhub.EventAbsorber.prototype.getPositionFromEvent = function (event, withscroll) {
    // @TODO IE support, see: http://stackoverflow.com/questions/3343384/mouse-position-cross-browser-compatibility-javascript
    return {
      x: event.pageX - (withscroll ? window.scrollX : 0),
      y: event.pageY - (withscroll ? window.scrollY : 0)
    };
  };

})(jqWalkhub, Walkhub, window);
