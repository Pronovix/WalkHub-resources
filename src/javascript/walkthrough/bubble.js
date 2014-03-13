(function ($, Walkhub, window) {
  Walkhub.Bubble = function (controller, element, step) {
    this.controller = controller;
    this.element = element;
    this.step = step;
    this.extraOptions = {};
    this.extraSetup = function () {};
    this.joyride = null;
  };

  Walkhub.Bubble.previous = null;

  Walkhub.Bubble.current = null;

  Walkhub.Bubble.uniqueID = function () {
    if (!this.counter) {
      this.counter = 0;
    }

    return "px-walkhub-" + this.counter++;
  };

  Walkhub.Bubble.prototype.setExtraOptions = function (extraOptions) {
    this.extraOptions = extraOptions;
    return this;
  };

  Walkhub.Bubble.prototype.setExtraSetupCallback = function (extraSetup) {
    this.extraSetup = extraSetup;
    return this;
  };

  Walkhub.Bubble.prototype.show = function () {
    var that = this;

    Walkhub.Bubble.current = this;

    if (Walkhub.Context.isUnloading()) {
      return;
    }

    var uniq = Walkhub.Bubble.uniqueID();

    if (Walkhub.Bubble.previous) {
      Walkhub.Bubble.previous.joyride('end');
      Walkhub.Bubble.previous.joyride('destroy');
    }

    if (this.element) {
      this.element.addClass(uniq);
    }

    var stepText = $('<h5 class="step-title step-title-UNIQ">TITLE</h5><p class="step-description step-description-UNIQ">DESCRIPTION</p>'
      .replace('TITLE', this.step.showTitle ? (this.step.title || '') : '')
      .replace('DESCRIPTION', this.step.description || '')
      .replace(/UNIQ/g, uniq));

    var opts = {
      nextButton: true,
      cookieMonster: false,
      autoStart: true,
      modal: !this.element,
      preStepCallback: function () {
        $('div.joyride-tip-guide').css('z-index', Walkhub.Context.MAXIMUM_ZINDEX);
        $('.joyride-next-tip')
          .unbind('click')
          .bind('click', function (event) {
            event.preventDefault();
            that.controller.nextStep();
          })
          .html('Next');
        if (that.step.canEdit) {
          var wrapper = $('.joyride-content-wrapper');
          $('<a />')
            .attr('href', '#')
            .addClass('joyride-normal-tip')
            .html('Edit')
            .click(function (event) {
              event.preventDefault();
              var dialog = new Walkhub.editDialog(that.step);
              dialog
                .setController(that.controller)
                .setSubmitCallback(function () {
                  $('.joyride-next-tip, .joyride-normal-tip').show();
                })
                .setSuccessCallback(function (step) {
                  $('h5.step-title-' + uniq).html(step.showTitle ? step.title : '');
                  $('p.step-description-' + uniq).html(step.description);
                })
                .open();
              $('.joyride-next-tip, .joyride-normal-tip').hide();
            })
            .appendTo(wrapper);
        }
        if (that.extraSetup) {
          that.extraSetup();
        }
      },
      preRideCallback: function() {
        if (Walkhub.Context.fullscreen) {
          // Hide close button on full window mode. We have to add the css to the head, because the element doesn't
          // exist, when we could encroach.
          var css = $('<style type="text/css">.joyride-close-tip{display: none !important;}</style>');
          $('head').append(css);
        }
      }
    };

    if (this.extraOptions) {
      opts = $.extend(opts, this.extraOptions);
    }

    this.joyride = $('<ol />')
      .append($('<li />').append(stepText).attr('data-class', this.element ? uniq : ''))
      .hide()
      .appendTo($('body'))
      .joyride(opts);

    Walkhub.Bubble.previous = this.joyride;

    this.moveBubble(this.element);
  };

  Walkhub.Bubble.prototype.beginMove = function () {
    $('div.joyride-tip-guide').css('display', 'none');

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
        console.log(clickedElement);
        var newLocator = Walkhub.LocatorGenerator.instance().generate(clickedElement);
        if (newLocator) {
          that.moveBubble(clickedElement);
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

  Walkhub.Bubble.prototype.moveBubble = function (element) {
    this.resetBubble();
    var tip = $('div.joyride-tip-guide');
    var nub = $('.joyride-nub', tip);
    var orientations = ['bottom', 'top', 'right', 'left', 'bottom'];
    var nubOrientations = {
      'bottom': 'top',
      'top': 'bottom',
      'left': 'right',
      'right': 'left'
    };


    for (var o in orientations) {
      if (orientations.hasOwnProperty(o)) {
        nub
          .removeClass('top')
          .removeClass('bottom')
          .removeClass('left')
          .removeClass('right');
        nub.addClass(nubOrientations[orientations[o]]);

        var pos = this.getBubblePosition(element, orientations[o]);
        tip
          .css('left', pos.x + 'px')
          .css('top', pos.y + 'px');

        if (this.checkCorners()) {
          return;
        } else {
          console.log('Corner check failed, trying with a different orientation');
        }
      }
    }
  };

  Walkhub.Bubble.prototype.resetBubble = function () {
    $('div.joyride-tip-guide').show();
  };

  Walkhub.Bubble.prototype.getBubblePosition = function (element, orientation) {
    var pos = {x: 0, y: 0};
    var tip = $('div.joyride-tip-guide');
    var tipHeight = tip.outerHeight();
    var tipWidth = tip.outerWidth();
    var nub = $('.joyride-nub', tip);
    var nubHeight = nub.outerHeight();
    var nubWidth = nub.outerWidth();
    var offset = element.offset();
    var elementHeight = element.outerHeight();
    var elementWidth = element.outerWidth();

    // @TODO check if modal

    if (this.isPhone()) {
//      if (orientation === 'top') {
//      } else {
//      }
    } else {
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
    }

    return pos;
  };

  Walkhub.Bubble.prototype.modalPosition = function (element) {
  };

  Walkhub.Bubble.prototype.checkCorners = function () {
    var tip = $('div.joyride-tip-guide');
    var offset = tip.offset();
    var tipWidth = tip.outerWidth();
    var tipHeight = tip.outerHeight();
    var d = $(document);
    var originalWidth = d.width();
    var originalHeight = d.height();
    var retval = true;

    tip.hide();

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

    tip.show();

    return retval;
  };

  Walkhub.Bubble.prototype.isPhone = function () {
    // @TODO make the screen detection more reliable
    if (Modernizr) {
      return Modernizr.mq('only screen and (max-width: 767px)');
    }

    return $(window).width() < 767;
  };

  Walkhub.Bubble.prototype.scrollToElement = function (element) {
    var tip = $('div.joyride-tip-guide');
    var windowHalf = $(window).height() / 2;
    var tipOffset = Math.ceil(element.offset().top - windowHalf + tip.outerHeight());

    $('html, body').stop().animate({
      scrollTop: tipOffset
    });
  };

})(jqWalkhub, Walkhub, window);
