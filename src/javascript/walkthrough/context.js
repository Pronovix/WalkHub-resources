(function ($, Walkhub, window) {
  'use strict';

  Walkhub.Context = {
    MAXIMUM_ZINDEX: 2147483647,
    fullscreen: false,
    mobileBreakpoint: 479,
    iOS:
      window.navigator.platform === 'iPad' ||
      window.navigator.platform === 'iPad Simulator' ||
      window.navigator.platform === 'iPhone' ||
      window.navigator.platform === 'iPhone Simulator' ||
      window.navigator.platform === 'iPod',
    isUnloading: function () {
      return !!Walkhub.Context.isUnloading.unloading;
    },
    start: function () {
      if (!!Walkhub.Context.start.started) {
        return;
      }

      window.addEventListener('beforeunload', function () {
        Walkhub.Context.isUnloading.unloading = true;
      });

      Walkhub.Context.start.started = true;
    },
    locatorTranslationCanWait: function () {
      return !Walkhub.Context.isUnloading() && !Walkhub.Context.iOS;
    }
  };

})(jqWalkhub, Walkhub, window);
