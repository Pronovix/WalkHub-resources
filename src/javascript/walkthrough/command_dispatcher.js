(function ($, Walkhub, window) {
  'use strict';

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
        .addCommand('click',
          function (step, onStepCompleteCallback) {
            Walkhub.Translator.instance().translate(step.arg1)
              .unbind('click.walkhub')
              .bind('click.walkhub', onStepCompleteCallback);
          },
          function (step) {
            var element = Walkhub.Translator.instance().translate(step.arg1);
            var raw = element.get(0);
            raw.click();
          })
        .addCommand('type',
          function (step, onStepCompleteCallback) {
            Walkhub.Translator.instance().translate(step.arg1)
              .unbind('change.walkhub')
              .bind('change.walkhub', onStepCompleteCallback);
          },
          function (step) {
            Walkhub.Translator.instance().translate(step.arg1)
              .val(step.arg2)
              .keydown()
              .keyup()
              .change();
          })
        .addCommand('select',
          function (step, onStepCompleteCallback) {
            var element = Walkhub.Translator.instance().translate(step.arg1);
            element
              .unbind('change.walkhub')
              .bind('change.walkhub', onStepCompleteCallback);
          },
          function (step) {
            var element = Walkhub.Translator.instance().translate(step.arg1);
            var sanitizedValue = Walkhub.CommandDispatcher.sanitizeValue(step.arg2);
            var realValue = null;
            if (element.get(0).tagName.toLowerCase() === 'select') {
              element.children().each(function () {
                if ($(this).html() === sanitizedValue) {
                  realValue = $(this).attr('value');
                }
              });
            }
            element
              .val(realValue || sanitizedValue)
              .change();
          })
        .addCommand('open',
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
                .hostname(protocol + "." + hostname + "." + port + "." + proxyhostname)
                .search({url: url});
              window.location = proxyuri.toString();
            } else {
              window.location = url;
            }
          }, true)
        .addAlias('sendKeys', 'type');
    }

    return this.instanceObject;
  };

  Walkhub.CommandDispatcher.sanitizeValue = function (value) {
    if (value) {
      var types = {
        'label': function (arg) {
          return arg;
        }
      };

      for (var prefix in types) {
        if (types.hasOwnProperty(prefix) && value.indexOf(prefix + "=") === 0) {
          return types[prefix](value.substr(prefix.length + 1));
        }
      }
    }

    return value;
  };

})(jqWalkhub, Walkhub, window);
