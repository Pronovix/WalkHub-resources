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
    var locators = {
      'identifier': function (arg) {
        var jq = locators.id(arg);
        if (jq.length == 0) {
          jq = locators.name(arg);
        }
        return jq;
      },
      'id': function (arg) {
        return $('#' + arg);
      },
      'name': function (arg) {
        return $('[name=' + arg + ']');
      },
      'dom': function (arg) {},
      'xpath': function (arg) {},
      'link': function (arg) {
        return $('a:contains("' + arg + '")');
      },
      'ui': function (arg) {}
    };

    for (var prefix in locators) {
      if (command.indexOf(prefix + "=") === 0) {
        return locators[prefix](command.substr(prefix.length + 1));
      }
    }

    return $(command);
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
      if (!command['highlight']) {
        createJoyrideBoilerplate(translator(command['arg1']), command);
      }
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
      if (command['highlight']) {
        createJoyrideBoilerplate(translator(command['highlight']), command);
      }
      if (commands[command['pureCommand']]) {
        commands[command['pureCommand']](command);
      }
    }, 0);
  };

})(jQuery);
