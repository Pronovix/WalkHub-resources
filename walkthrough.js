Walkthrough = {};

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
  // Dispatch command
  var commands = {
    "click": function () {
      alert('foo');
    }
  };

  // This is very important. This script runs synchronously, which means that if
  // something locks here, the whole app will freeze/deadlock.
  setTimeout(function () {
    // TODO Check if it's a valid command
    commands[command['pureCommand']]();
  }, 0);
};
