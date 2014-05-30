(function ($, Walkhub, window) {
  "use strict";

  Walkhub.EventAbsorber = function () {
    this.mouseEventCallbacks = [];
    this.mouseEventAbsorber = null;

    this.keyboardEventCallbacks = [];
    this.keyboardWatcherLooping = false;
    this.activeElement = null;
    this.activeElementValue = null;
    this.previousHover = null;

    window.addEventListener("beforeunload", function () {
      $(window.document.activeElement).blur();
    });
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
          case Walkhub.Util.isInputElement.INPUT_ELEMENT:
            currentValue = activeElement.val();
            break;
          case Walkhub.Util.isInputElement.CONTENTEDITABLE_ELEMENT:
            currentValue = $(activeElement).html();
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
    if (this.mouseEventAbsorber) {
      return;
    }
    var that = this;
    var $w = $(window);

    this.mouseEventAbsorber = $("<div />")
      .css("background-color", "rgba(255, 255, 255, 0)")
      .css("z-index", Walkhub.Context.MAXIMUM_ZINDEX)
      .click(function (event) {
        event.preventDefault();
        event.stopPropagation();

        var clickedElement = that.getElementAtEvent(event);

        for (var cb in that.mouseEventCallbacks) {
          if (that.mouseEventCallbacks.hasOwnProperty(cb)) {
            that.mouseEventCallbacks[cb](clickedElement, {
              canBubble: event.canBubble,
              cancelable: event.cancelable,
              detail: event.detail,
              screenX: event.screenX,
              screenY: event.screenY,
              clientX: event.clientX,
              clientY: event.clientY,
              ctrlKey: event.ctrlKey,
              altKey: event.altKey,
              shiftKey: event.shiftKey,
              metaKey: event.metaKey,
              button: event.button
            });
          }
        }

        return false;
      })
      .appendTo($("body"));

    this.resetOverlay();

    $w
      .bind("resize.walkhub", function (event) {
        that.resetOverlay();
      })
      .bind("mousemove.walkhub", function (event) {
        that.handleHovering(event);
        that.refreshHover(event);
      });
  };

  Walkhub.EventAbsorber.prototype.resetOverlay = function () {
    var $w = $(window);

    this.mouseEventAbsorber
      .css("width", $w.width() + "px")
      .css("height", $w.height() + "px")
      .css("position", "fixed")
      .css("top", "0")
      .css("left", "0");
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
    $(window).unbind("mousemove.walkhub");
    this.removeHover();
    this.mouseEventAbsorber.remove();
    this.mouseEventAbsorber = null;
  };

  Walkhub.EventAbsorber.prototype.removeHover = function () {
    $(".walkthrough-eventabsorber-hover")
      .removeClass("walkthrough-eventabsorber-hover");
  };

  Walkhub.EventAbsorber.prototype.refreshHover = function (event) {
    this.removeHover();
    this.getElementAtEvent(event).addClass("walkthrough-eventabsorber-hover");
  };

  Walkhub.EventAbsorber.prototype.handleHovering = function (event) {
    var currentElement = this.getElementAtEvent(event);
    if (currentElement.length) {
      currentElement = currentElement.get(0);
    } else {
      return;
    }

    var eventData = {
      canBubble: event.canBubble,
      cancelable: event.cancelable,
      detail: event.detail,
      screenX: event.screenX,
      screenY: event.screenY,
      clientX: event.clientX,
      clientY: event.clientY,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
      button: event.button
    };

    if (currentElement !== this.previousHover) {
      Walkhub.Util.dispatchMouseEvent("mouseleave", this.previousHover, eventData + {relatedTarget: currentElement});
      Walkhub.Util.dispatchMouseEvent("mouseout", this.previousHover, eventData + {relatedTarget: currentElement});

      if (this.previousHover === null || currentElement !== this.previousHover.parent()) {
        Walkhub.Util.dispatchMouseEvent("mouseenter", currentElement, eventData + {relatedTarget: this.previousHover});
      }
      Walkhub.Util.dispatchMouseEvent("mouseover", currentElement, eventData + {relatedTarget: this.previousHover});
      this.previousHover = currentElement;
    }

    Walkhub.Util.dispatchMouseEvent("mousemove", currentElement, eventData);
  };

  Walkhub.EventAbsorber.prototype.getElementAtEvent = function (event) {
    var pos = this.getPositionFromEvent(event, true);

    this.mouseEventAbsorber
      .css("top", pos.y + "px")
      .css("left", pos.x + "px")
      .css("width", "1px")
      .css("height", "1px")
      .css("position", "absolute");

    var element =  $(window.document.elementFromPoint(pos.x, pos.y - 1));

    this.resetOverlay();

    return element;
  };

  Walkhub.EventAbsorber.prototype.getPositionFromEvent = function (event, withscroll) {
    // @TODO IE support, see: http://stackoverflow.com/questions/3343384/mouse-position-cross-browser-compatibility-javascript
    return {
      x: event.pageX - (withscroll ? window.scrollX : 0),
      y: event.pageY - (withscroll ? window.scrollY : 0)
    };
  };

})(jqWalkhub, Walkhub, window);
