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

  Walkhub.currentExecutor = new Walkhub.Executor();

  $(function () {
    Walkhub.currentExecutor.start();
  });

})(jqWalkhub, Walkhub, window);