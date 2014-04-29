(function ($, Walkhub) {
  "use strict";
  Walkhub.Util = {};

  Walkhub.Util.log = function () {
    Walkhub.currentExecutor.getClient().log(
      arguments.length === 1 ? arguments[0] : arguments
    );
  };

  Walkhub.Util.tagName = function (element) {
    var tn = $(element).prop('tagName');
    if (tn === null || tn === undefined || !tn.toLowerCase) {
      Walkhub.Util.log(["Invalid element", element, tn]);
      return null;
    }

    return tn.toLowerCase();
  };

  Walkhub.Util.dispatchMouseEvent = function (type, element) {
    var event = document.createEvent('MouseEvents');
    event.initMouseEvent(type, true, true, window);
    if (element.length) {
      element.get(0).dispatchEvent(event);
    }
  };

  Walkhub.Util.clickOnElement = function (element) {
    Walkhub.Util.dispatchMouseEvent('mousedown', element);
    Walkhub.Util.dispatchMouseEvent('mouseup', element);
    Walkhub.Util.dispatchMouseEvent('click', element);
  };

  /**
   * Checks if an element is some kind of input.
   *
   * @param element {jQuery}
   *   jQuery element to check.
   * @returns {number}
   *   - Returns Walkhub.Util.isInputElement.NOT_INPUT_ELEMENT
   *     if the element is not an input element.
   *   - Returns Walkhub.Util.isInputElement.INPUT_ELEMENT
   *     if the element is a form input element.
   *   - Returns Walkhub.Util.isInputElement.CONTENTEDITABLE_ELEMENT
   *     if the element is a regular element, but the contenteditable
   *     flag is set.
   */
  Walkhub.Util.isInputElement = function (element) {
    if (element.length === 0) {
      return Walkhub.Util.isInputElement.NOT_INPUT_ELEMENT;
    }
    // check for standard input elements
    var tn = Walkhub.Util.tagName(element);
    if (tn === 'textarea') {
      return Walkhub.Util.isInputElement.INPUT_ELEMENT;
    }
    if (tn === 'select') {
      return Walkhub.Util.isInputElement.INPUT_ELEMENT;
    }
    if (tn === 'option') {
      return Walkhub.Util.isInputElement.INPUT_ELEMENT;
    }
    if (tn === 'input') {
      switch (element.attr('type')) {
        case 'button':
        case 'submit':
          return Walkhub.Util.isInputElement.NOT_INPUT_ELEMENT;
        default:
          return Walkhub.Util.isInputElement.INPUT_ELEMENT;
      }
    }

    // check for contenteditable
    var rawElement = element.get(0);
    if (rawElement.contentEditable !== null && rawElement.contentEditable !== undefined) {
      if (rawElement.isContentEditable) {
        return Walkhub.Util.isInputElement.CONTENTEDITABLE_ELEMENT;
      }
    } else {
      for (var e = element; e.length > 0; e = e.parent()) {
        var ce = e.attr('contentEditable');
        if (ce === 'true') {
          return Walkhub.Util.isInputElement.CONTENTEDITABLE_ELEMENT;
        }
        if (ce === 'false') {
          return Walkhub.Util.isInputElement.NOT_INPUT_ELEMENT;
        }
      }
    }

    return Walkhub.Util.isInputElement.NOT_INPUT_ELEMENT;
  };

  Walkhub.Util.isInputElement.NOT_INPUT_ELEMENT = 0;
  Walkhub.Util.isInputElement.INPUT_ELEMENT = 1;
  Walkhub.Util.isInputElement.CONTENTEDITABLE_ELEMENT = 2;

})(jqWalkhub, Walkhub);
