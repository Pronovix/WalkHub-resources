(function ($, Walkhub, window) {
  "use strict";

  Walkhub.Bubble = function (controller, element, step) {
    this.controller = controller;
    this.element = element;
    this.step = step;
    this.tipGuide = null;
    this.nub = null;
    this.contentWrapper = null;
    this.nextButton = null;
    this.editButton = null;
    this.title = null;
    this.description = null;
    this.editdialog = null;
    this.resizeEventHandler = null;

    this.nextButtonDisabled = false;

    this.extraButtons = {};
  };

  Walkhub.Bubble.current = null;

  Walkhub.Bubble.prototype.disableNextButton = function () {
    this.nextButtonDisabled = true;
    return this;
  };

  Walkhub.Bubble.prototype.addButton = function (text, callback) {
    this.extraButtons[text] = callback;
    return this;
  };

  Walkhub.Bubble.prototype.show = function () {
    var that = this;

    Walkhub.Bubble.current = this;

    if (Walkhub.Context.isUnloading()) {
      return;
    }

    this.resizeEventHandler = function () {
      that.reposition();
    };

    $(window).bind('resize', this.resizeEventHandler);

    this.tipGuide = $('<div />')
      .css('z-index', Walkhub.Context.MAXIMUM_ZINDEX)
      .addClass('wtbubble-tip-guide');

    this.nub = $('<span />')
      .addClass('wtbubble-nub')
      .appendTo(this.tipGuide);

    this.contentWrapper = $('<div />')
      .attr('role', 'dialog')
      .addClass('wtbubble-content-wrapper')
      .appendTo(this.tipGuide);

    this.title = $('<h5 />')
      .addClass('wtbubble-step-title')
      .html(this.step.title)
      .appendTo(this.contentWrapper);

    if (this.step.title && this.step.showTitle) {
      this.title.show();
    } else {
      this.title.hide();
    }

    this.description = $('<p />')
      .addClass('wtbubble-step-description')
      .html(this.step.description)
      .appendTo(this.contentWrapper);

    this.nextButton = $('<a />')
      .attr('href', '#')
      .text('Next')
      .addClass('wtbubble-next')
      .addClass('wtbubble-button')
      .click(function (event) {
        event.preventDefault();
        that.hide();
        that.controller.nextStep();
      })
      .appendTo(this.contentWrapper);

    if (this.nextButtonDisabled) {
      this.nextButton.hide();
    }

    if (this.step.canEdit) {
      this.editButton = $('<a />')
        .attr('href', '#')
        .addClass('wtbubble-edit')
        .addClass('wtbubble-button')
        .text('Edit')
        .click(function (event) {
          event.preventDefault();
          that.editdialog = new Walkhub.editDialog(that.step, that.contentWrapper);
          that.editdialog
            .setController(that.controller)
            .setSubmitCallback(function () {
              that.nextButton.show();
              that.editButton.show();
            })
            .setSuccessCallback(function (step) {
              that.title.html(step.title);
              that.title[step.showTitle ? 'show' : 'hide']();
              that.description.html(step.description);
              that.editdialog = null;
            })
            .open();
          that.nextButton.hide();
          that.editButton.hide();
        })
        .appendTo(this.contentWrapper);
    }

    for (var btn in this.extraButtons) {
      if (this.extraButtons.hasOwnProperty(btn)) {
        (function () {
          var key = btn;
          $('<a />')
            .attr('href', '#')
            .addClass('wtbubble-extrabutton')
            .addClass('wtbubble-button')
            .addClass('wtbubble-' + btn.toLowerCase().replace(/\s/g, "-"))
            .html(btn)
            .click(function (event) {
              event.preventDefault();
              that.extraButtons[key]();
            })
            .appendTo(that.contentWrapper);
        })();
      }
    }

    $('body').append(this.tipGuide);

    this.reposition();
  };

  Walkhub.Bubble.prototype.hide = function () {
    if (this.tipGuide) {
      this.tipGuide.remove();
    }

    if (this.resizeEventHandler) {
      $(window).unbind('resize', this.resizeEventHandler);
    }

    this.tipGuide = null;
    this.contentWrapper = null;
    this.nub = null;
    this.nextButton = null;
    this.editButton = null;
    this.title = null;
    this.description = null;
  };

  Walkhub.Bubble.prototype.reposition = function () {
    if (this.element) {
      this.moveBubble(this.element);
      this.scrollToElement(this.element);
    } else {
      this.moveBubble(null);
    }
  };

  Walkhub.Bubble.prototype.beginMove = function () {
    this.tipGuide.css('display', 'none');

    this.hideModalBackground();

    var that = this;

    var clickCatcher = $('<div />')
      .css('width', '1px')
      .css('height', '1px')
      .css('background-color', 'rgba(1, 1, 1, 0)')
      .css('position', 'absolute')
      .click(function (event) {
        event.preventDefault();
        event.stopPropagation();

        that.removeHover();
        $(window).unbind('mousemove.walkhub');

        var clickedElement = that.getElementAtEvent(event);
        var newLocator = Walkhub.LocatorGenerator.instance().generate(clickedElement);
        if (newLocator) {
          that.moveBubble(clickedElement);
          $('#firstarg', that.editdialog.form).val(newLocator);
        } else {
          that.resetBubble();
        }

        $(this).remove();

        return false;
      })
      .appendTo($('body'));

    // Intentionally left here. This is a very good method to debug.
    //clickCatcher.css('border', '5px solid red');

    $(window)
      .bind('mousemove.walkhub', function (event) {
        var pos = that.getPositionFromEvent(event, false);
        clickCatcher
          .css('top', pos.y)
          .css('left', pos.x);

        that.refreshHover(event);
      });
  };

  Walkhub.Bubble.prototype.getPositionFromEvent = function (event, withscroll) {
    // @TODO IE support, see: http://stackoverflow.com/questions/3343384/mouse-position-cross-browser-compatibility-javascript
    return {
      x: event.pageX - (withscroll ? window.scrollX : 0),
      y: event.pageY - (withscroll ? window.scrollY : 0)
    };
  };

  Walkhub.Bubble.prototype.removeHover = function () {
    $('.walkthrough-editor-hover')
      .removeClass('walkthrough-editor-hover');
  };

  Walkhub.Bubble.prototype.refreshHover = function (event) {
    this.removeHover();
    this.getElementAtEvent(event).addClass('walkthrough-editor-hover');
  };

  Walkhub.Bubble.prototype.getElementAtEvent = function (event) {
    var pos = this.getPositionFromEvent(event, true);
    return $(window.document.elementFromPoint(pos.x, pos.y - 1));
  };

  Walkhub.Bubble.prototype.resetNub = function () {
    this.nub
      .removeClass('top')
      .removeClass('bottom')
      .removeClass('left')
      .removeClass('right')
      // In the mobile view, the left css property will be explicitly set.
      .attr('style', '');
  };

  Walkhub.Bubble.prototype.moveBubble = function (element) {
    this.resetBubble();
    this.hideModalBackground();

    var orientations = this.isPhone() ?
      ['bottom'] :
      ['bottom', 'top', 'right', 'left', 'bottom'];

    var nubOrientations = {
      'bottom': 'top',
      'top': 'bottom',
      'left': 'right',
      'right': 'left'
    };

    this.resetNub();

    if (!element) {
      this.modalPosition();
      return;
    }

    for (var o in orientations) {
      if (orientations.hasOwnProperty(o)) {
        this.resetNub();
        this.nub.addClass(nubOrientations[orientations[o]]);

        var pos = this.getBubblePosition(element, orientations[o]);
        if (this.isPhone()) {
          this.tipGuide
            .css('left', 0)
            .css('top', pos.y + 'px');
          this.nub
            .css('left', pos.x + 'px');
        } else {
          this.tipGuide
            .css('left', pos.x + 'px')
            .css('top', pos.y + 'px');
        }

        if (this.checkCorners()) {
          return;
        } else {
          console.log('Corner check failed, trying with a different orientation');
        }
      }
    }
  };

  Walkhub.Bubble.prototype.resetBubble = function () {
    this.tipGuide.show();
  };

  Walkhub.Bubble.prototype.getBubblePosition = function (element, orientation) {
    var pos = {x: 0, y: 0};
    var tipHeight = this.tipGuide.outerHeight();
    var tipWidth = this.tipGuide.outerWidth();
    var nubHeight = this.nub.outerHeight();
    var nubWidth = this.nub.outerWidth();
    var offset = element.offset();
    var elementHeight = element.outerHeight();
    var elementWidth = element.outerWidth();

    // @TODO check if modal

    switch (orientation) {
      case 'top':
        pos.y = offset.top - tipHeight - nubHeight;
        pos.x = offset.left;
        break;
      case 'bottom':
        pos.y = offset.top + elementHeight + nubHeight;
        pos.x = offset.left;
        break;
      case 'left':
        pos.y = offset.top;
        pos.x = offset.left - tipWidth - nubWidth;
        break;
      case 'right':
        pos.y = offset.top;
        pos.x = elementWidth + offset.left + nubWidth;
        break;
    }

    return pos;
  };

  Walkhub.Bubble.prototype.modalPosition = function () {
    var w = $(window);
    var centerX = (w.width() - this.tipGuide.outerWidth()) / 2 + window.scrollX;
    var centerY = (w.height() - this.tipGuide.outerHeight()) / 2 + window.scrollY;
    this.tipGuide
      .css('top', centerY)
      .css('left', centerX);

    this.showModalBackground();
  };

  Walkhub.Bubble.prototype.showModalBackground = function () {
    this.hideModalBackground();
    $('<div />')
      .addClass('wtbubble-modal-bg')
      .appendTo($('body'));
  };

  Walkhub.Bubble.prototype.hideModalBackground = function () {
    $('div.wtbubble-modal-bg').remove();
  };

  Walkhub.Bubble.prototype.checkCorners = function () {
    var offset = this.tipGuide.offset();
    var tipWidth = this.tipGuide.outerWidth();
    var tipHeight = this.tipGuide.outerHeight();
    var d = $(document);
    var originalWidth = d.width();
    var originalHeight = d.height();
    var retval = true;

    this.tipGuide.hide();

    if (!offset) {
      return true;
    }

    // check for bottom overflow
    if (offset.top + tipHeight > d.height()) {
      retval = false;
    }

    // check for right overflow
    if (offset.left + tipWidth > d.width()) {
      retval = false;
    }

    // check for document size changes
    if (originalHeight !== d.height() || originalWidth !== d.width()) {
      retval = false;
    }

    this.tipGuide.show();

    return retval;
  };

  Walkhub.Bubble.prototype.isPhone = function () {
    if (Modernizr) {
      return Modernizr.mq('only screen and (max-width: ' + Walkhub.Context.mobileBreakpoint + 'px)');
    }

    return $(window).width() < Walkhub.Context.mobileBreakpoint;
  };

  Walkhub.Bubble.prototype.scrollToElement = function (element) {
    var windowHalf = $(window).height() / 2;
    var tipOffset = Math.ceil(element.offset().top - windowHalf + this.tipGuide.outerHeight());

    $('html, body').stop().animate({
      scrollTop: tipOffset
    });
  };

})(jqWalkhub, Walkhub, window);
