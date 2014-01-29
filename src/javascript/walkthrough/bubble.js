(function ($, Walkhub, window) {
  Walkhub.Bubble = function (controller, element, step) {
    this.controller = controller;
    this.element = element;
    this.step = step;
    this.extraOptions = {};
    this.extraSetup = function () {};
  };

  Walkhub.Bubble.previous = null;

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
      .replace('TITLE', this.step['showTitle'] ? (this.step['title'] || '') : '')
      .replace('DESCRIPTION', this.step['description'] || '')
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
        if (that.step['canEdit']) {
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
            .appendTo($('.joyride-content-wrapper'));
        }
        if (that.extraSetup) {
          that.extraSetup();
        }
      }
    };

    if (this.extraOptions) {
      opts = $.extend(opts, this.extraOptions);
    }

    Walkhub.Bubble.previous = $('<ol />')
      .append($('<li />').append(stepText).attr('data-class', this.element ? uniq : ''))
      .hide()
      .appendTo($('body'))
      .joyride(opts);
  };

})(jqWalkhub, Walkhub, window);
