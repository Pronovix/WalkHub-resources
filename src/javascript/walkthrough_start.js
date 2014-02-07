(function ($, Walkhub, window) {
  if (!window.console) {
    window.console = {
      'log': function () {
      }
    };
  }

  Walkhub.logParams = function () {
    console.log(arguments);
  };

  if (window.parent == window) {
    return;
  }

  Walkhub.currentExecutor = new Walkhub.Executor();

  $(function () {
    Walkhub.currentExecutor.start();
  });

})(jqWalkhub, Walkhub, window);
