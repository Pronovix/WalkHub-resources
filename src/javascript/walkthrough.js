if (!window.Walkhub) {
  window.Walkhub = {};
}

(function (Walkhub, window) {
  Walkhub.enforcer = function () {
    if (!this.tries) {
      this.tries = 0;
    }
    if (Walkhub.initialized) {
      return;
    }

    if (window.document.readyState == 'complete') {
      if (this.tries > 4) {
        Walkhub.currentExecutor.start();
      } else {
        this.tries++;
      }
    }

    setTimeout(Walkhub.enforcer, 500);
  };

  if (window.parent != window) {
    Walkhub.enforcer();
  }
})(window.Walkhub, window);
