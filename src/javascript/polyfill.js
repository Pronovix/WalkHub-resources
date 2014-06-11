(function (window) {
  "use strict";

  if (!window.console) {
    window.console = {
      log: function () {
      }
    };
  }

  if (!String.prototype.trim) {
    String.prototype.trim = function () {
      return this.replace(/^\s+|\s+$/g, "");
    };
  }
})(window);
