(function ($, Walkhub, window) {
  "use strict";

  Walkhub.CommandDispatcher = function () {
    this.commands = {};
    this.aliases = {};
  };

  Walkhub.CommandDispatcher.prototype.addCommand = function (name, init, execute, automatic) {
    this.commands[name] = {
      init: init,
      execute: execute,
      automatic: !!automatic
    };
    return this;
  };

  Walkhub.CommandDispatcher.prototype.addAlias = function (alias, command) {
    this.aliases[alias] = command;
    return this;
  };

  Walkhub.CommandDispatcher.prototype.resolve = function (command) {
    var realCommand = this.aliases[command] || command;
    return this.commands[realCommand];
  };

  Walkhub.CommandDispatcher.prototype.initCommand = function (command, step, onStepComplete) {
    var resolvedCommand = this.resolve(command);
    if (resolvedCommand) {
      resolvedCommand.init(step, onStepComplete);
    }
  };

  Walkhub.CommandDispatcher.prototype.executeCommand = function (command, step) {
    var resolvedCommand = this.resolve(command);
    if (resolvedCommand) {
      resolvedCommand.execute(step);
    }
  };

  Walkhub.CommandDispatcher.prototype.isAutomaticCommand = function (command) {
    var realCommand = this.resolve(command);
    return realCommand.automatic;
  };

  Walkhub.CommandDispatcher.instance = function () {
    if (!this.instanceObject) {
      this.instanceObject = new Walkhub.CommandDispatcher();

      this.instanceObject
        .addCommand("click",
          function (step, onStepCompleteCallback) {
            Walkhub.Translator.instance().translate(step.arg1)
              .unbind("click.walkhub")
              .bind("click.walkhub", onStepCompleteCallback);
          },
          function (step) {
            var element = Walkhub.Translator.instance().translate(step.arg1);
            var raw = element.get(0);
            raw.click();
          })
        .addCommand("type",
          function (step, onStepCompleteCallback) {
            Walkhub.Translator.instance().translate(step.arg1)
              .unbind("change.walkhub")
              .bind("change.walkhub", onStepCompleteCallback);
          },
          function (step) {
            var element = Walkhub.Translator.instance().translate(step.arg1);
            switch (Walkhub.Util.isInputElement(element)) {
              case Walkhub.Util.isInputElement.NOT_INPUT_ELEMENT:
                break;
              case Walkhub.Util.isInputElement.INPUT_ELEMENT:
                element
                  .val(step.arg2)
                  .keydown()
                  .keyup()
                  .change();
                break;
              case Walkhub.Util.isInputElement.CONTENTEDITABLE_ELEMENT:
                element.html(Walkhub.Util.filterXSS(step.arg2));
                break;
            }
          })
        .addCommand("select",
          function (step, onStepCompleteCallback) {
            var element = Walkhub.Translator.instance().translate(step.arg1);
            element
              .unbind("change.walkhub")
              .bind("change.walkhub", onStepCompleteCallback);
          },
          function (step) {
            var element = Walkhub.Translator.instance().translate(step.arg1);
            var value = Walkhub.CommandDispatcher.getValueForSelectOption(element, step.arg2);
            element
              .val(value)
              .change();
          })
        .addCommand("open",
          function (step, onStepCompleteCallback) {},
          function (step) {
            var url = step.arg1;
            var httpProxy = Walkhub.currentExecutor.getController().getHTTPProxyURL();
            if (httpProxy) {
              var uri = new URI(url);
              var protocol = uri.protocol() || "http";
              var hostname = uri.hostname();
              var port = uri.port() || "80";
              var proxyuri = new URI(httpProxy);
              var proxyhostname = proxyuri.hostname();
              proxyuri
                .hostname(CryptoJS.MD5(protocol + "." + hostname + "." + port) + "." + proxyhostname)
                .search({url: url});
              window.location = proxyuri.toString();
            } else {
              window.location = url;
            }
          }, true)
        .addCommand("",
          function (step, onStepCompleteCallback) {},
          function (step, onStepCompleteCallback) {}
        )
        .addAlias("sendKeys", "type");
    }

    return this.instanceObject;
  };

  Walkhub.CommandDispatcher.getValueForSelectOption = function (element, value) {
    var types = {
      "label": function (val) {
        var ret = null;
        element.find("option").each(function () {
          if ($(this).attr("label") === val) {
            ret = $(this);
          }
          if ($(this).html() === val) {
            ret = $(this);
          }
        });
        return ret;
      },
      "value": function (val) {
        var ret = null;
        element.find("option").each(function () {
          if ($(this).attr("value") === val) {
            ret = $(this);
          }
          if ($(this).html() === val) {
            ret = $(this);
          }
        });
        return ret;
      },
      "id": function (val) {
        return element.find("option#" + val);
      },
      "index": function (val) {
        return element.find("option:nth-child(" + val + ")");
      }
    };

    var option;

    for (var prefix in types) {
      if (types.hasOwnProperty(prefix) && value.indexOf(prefix + "=") === 0) {
        option = types[prefix](value.substr(prefix.length + 1));
        break;
      }
    }

    if (!option) {
      option = types.label(value);
    }

    if (!option) {
      return null;
    }

    return option.attr("value") || option.html();
  };

})(jqWalkhub, Walkhub, window);
