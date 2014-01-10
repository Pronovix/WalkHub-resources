(function ($, Walkhub, window) {
  Walkhub.editDialog = function (step) {
    this.step = step;
    this.submit = function () {};
    this.success = function () {};
    this.controller = null;
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

    var form = $('<form><fieldset></fieldset></form>');
    var fieldset = $('fieldset', form);

    $('<label />')
      .attr('for', 'title')
      .html('Title')
      .appendTo(fieldset);
    $('<input />')
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

    $('<label >')
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

    $('<hr />')
      .appendTo(fieldset);

    $('<input />')
      .attr('type', 'submit')
      .val('Save')
      .appendTo(fieldset);

    form.submit(function (event) {
      event.preventDefault();
      that.step.titleRaw = $('input#title', form).val();
      that.step.descriptionRaw = $('textarea#description', form).val();
      that.step.showTitle = $('input#showtitle', form).get(0).checked;
      that.submit();
      form.remove();
      that.controller.updateCurrentStep(that.step, that.success);
    });

    var querystring =
      'command=' + encodeURIComponent(this.step['command']) + '&' +
        'arg1=' + encodeURIComponent(this.step['arg1']) + '&' +
        'arg2=' + encodeURIComponent(this.step['arg2']);
    this.controller.client.send('walkhub-step-suggestion?' + querystring, null, function (data) {
      suggestionwrapper
        .show()
        .append($('<p/>').text('Suggestions: '));
      for (var i in data) {
        if (!data.hasOwnProperty(i)) {
          continue;
        }
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
    });

    form.appendTo($('.joyride-content-wrapper'));
  };
})(jqWalkhub, Walkhub, window);