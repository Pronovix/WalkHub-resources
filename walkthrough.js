Walkthrough = {};

(function ($) {

  // JavaScript -> Cocoa bridging

  function sendMessage(type, message) {
    $('<iframe />')
      .attr('src', 'walkthrough-' + type + '://localhost/?' + message)
      .hide()
      .appendTo($('body'));
  }

  function elementToHtml(element) {
    return $('<div>').append(element.clone()).html();
  }

  var console = {
    'log': function (obj) {
      sendMessage('log', obj);
    }
  };

  var globalCounter = 0;
  function uniqueID() {
    return "px-walkthrough-" + globalCounter++;
  }

  function createJoyrideBoilerplate(element, command) {
    var uniq = uniqueID();

    element.addClass(uniq);

    var ol = $('<ol />')
      .append(
        $('<li />')
          .html(command['description'])
          .attr('data-class', uniq)
      )
      .hide()
      .appendTo($('body'))
      .joyride({
        'nextButton': false
      });
  }

  // Dispatch command
  var commands = {
    "click": function (command) {
      var element = $(command['arg1']);
      createJoyrideBoilerplate(element, command);
    }
  };

  /**
   * Executes a command
   *
   * @param command
   *    Object with the following keys:
   *    string title
   *    string description
   *    string command
   *    string pureCommand
   *    string arg1
   *    string arg2
   *    string highlight
   *    bool andWait
   */
  Walkthrough.execute = function (command) {
    // This is very important. This script runs synchronously, which means that if
    // something locks here, the whole app will freeze/deadlock.
    setTimeout(function () {
      // TODO Check if it's a valid command
      commands[command['pureCommand']](command);
    }, 0);
  };

})(jQuery);
