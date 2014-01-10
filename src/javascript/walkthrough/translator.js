(function ($, Walkhub, window) {
  Walkhub.Translator = function () {
    this.locators = {};
    this.defaultLocator = "";
    this.tries = 0;
  };

  Walkhub.Translator.prototype.translate = function (locator) {
    if (!locator) {
      return null;
    }

    var jqobj = null;

    for (var prefix in this.locators) {
      if (this.locators.hasOwnProperty(prefix) && locator.indexOf(prefix + "=") === 0) {
        jqobj = this.locators[prefix](locator.substr(prefix.length + 1));
        break;
      }
    }

    if (!jqobj && !!this.defaultLocator && !!this.locators[this.defaultLocator]) {
      jqobj = this.locators[this.defaultLocator](locator);
    }

    return jqobj;
  };

  Walkhub.Translator.prototype.translateOrWait = function (locator, callbacks) {
    var that = this;
    var remainingtries = this.tries;

    function translateOrWait() {
      var jqobj = that.translate(locator);
      if (jqobj.length > 0) {
        callbacks.success && callbacks.success(jqobj);
      }
      else if (Walkhub.Context.locatorTranslationCanWait()) {
        callbacks.waiting && callbacks.waiting(that.tries, remainingtries);

        if (that.tries ? (remainingtries > 0) : true) {
          remainingtries--;
          setTimeout(translateOrWait, 500);
        } else {
          callbacks.giveUp && callbacks.giveUp();
        }
      }
      else {
        callbacks.giveUp && callbacks.giveUp();
      }
    }

    translateOrWait();
  };

  Walkhub.Translator.prototype.addLocatorTranslator = function (name, callback) {
    this.locators[name] = callback;
    return this;
  };

  Walkhub.Translator.prototype.setDefaultLocator = function (name) {
    this.defaultLocator = name;
    return this;
  };

  Walkhub.Translator.prototype.setRetries = function (retries) {
    this.tries = retries;
    return this;
  };

  Walkhub.Translator.instance = function () {
    if (!this.instanceObject) {
      this.instanceObject = new Walkhub.Translator();

      var id = function (arg) {
        return $('#' + arg);
      };

      var name = function (arg) {
        return $('[name=' + arg + ']');
      };

      this.instanceObject
        .addLocatorTranslator('identifier', function (arg) {
          var jq = id(arg);
          if (jq.length == 0) {
            jq = name(arg);
          }
          return jq;
        })
        .addLocatorTranslator('id', id)
        .addLocatorTranslator('name', name)
        .addLocatorTranslator('dom', function (arg) {
          return null;
        })
        .addLocatorTranslator('xpath', function (arg) {
          var result = document.evaluate(arg, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
          if (result.snapshotLength > 0) {
            return $(result.snapshotItem(0));
          }
          return $(''); // empty jquery object
        })
        .addLocatorTranslator('link', function (arg) {
          return $('a').filter(function () {
            return $(this).text() === arg;
          });
        })
        .addLocatorTranslator('css', function (arg) {
          return $(arg);
        })
        .addLocatorTranslator('ui', function (arg) {
          return null;
        })
        .setDefaultLocator('xpath')
        .setRetries(120);
    }

    return this.instanceObject;
  };

})(jqWalkhub, Walkhub, window);