Walkthrough = {};

(function ($) {

  // JavaScript -> Cocoa bridging

  function sendMessage(type, message) {
    $('<iframe />')
      .attr('src', 'walkthrough-' + type + '://localhost/?' + encodeURIComponent(message))
      .hide()
      .appendTo($('body'));
  }

  function elementToHtml(element) {
    return $('<div>').append(element.clone()).html();
  }

  function translator(command) {
    console.log('Command log: ' + command);

    var $jQuerySelector;
    var $locatorType;
    var $locatorArgument;

    // splitting the command
    $splittedCommand = command.split("=");
    $locatorType = $splittedCommand[0];
    $locatorArgument = $splittedCommand[1];

    // create the jQuery selector from locator type
    switch($locatorType) {
      case 'identifier':
        $jQuerySelector = $('#' + $locatorArgument);
        if ($jQuerySelector === null) {
          $jQuerySelector = $("[name='" + $locatorArgument + "']");
        }
        break;
      case 'id':
        $jQuerySelector = $("#" + $locatorArgument + );
        break;
      case 'name':
        $jQuerySelector = $("[name=" + $locatorArgument + "]");
        break;
      case 'dom':
        // TODO: Find an element by evaluating the specified string.
        break;
      case 'xpath':
        // TODO: Locate an element using an XPath expression.
        break;
      case 'link':
        $jQuerySelector = $("a:contains('" + $locatorArgument + "')");
        break;
      case 'css':
        $jQuerySelector = $($locatorArgument);
        break;
      case 'ui':
        // TODO: Locate an element by resolving the UI specifier string to another locator, and evaluating it.
        break;
    }
    return $jQuerySelector;
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

  var previousJoyride = null;
  function createJoyrideBoilerplate(element, command) {
    var uniq = uniqueID();

    if (previousJoyride) {
      previousJoyride.joyride('end');
      previousJoyride.joyride('destroy');
    }

    element.addClass(uniq);

    previousJoyride = $('<ol />')
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
      var element = translator(command['arg1']);
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
