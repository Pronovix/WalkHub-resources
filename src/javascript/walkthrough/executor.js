(function ($, Walkhub, window) {
  Walkhub.Executor = function () {
    this.client = null;
    this.controller = null;
    this.proxy = null;
    this.origin = null;
  };

  Walkhub.Executor.prototype.start = function () {
    if (Walkhub.initialized) {
      return;
    }
    Walkhub.initialized = true;
    Walkhub.Context.start();
    this.origin = Walkhub.Executor.negotiateWalkhubOrigin();
    this.pingPong();
    Walkhub.SocialSharingFix();
  };

  Walkhub.Executor.prototype.pingPong = function () {
    var that = this;

    function pingPongServer(event) {
      if (that.client) {
        window.removeEventListener('message', pingPongServer);
        return;
      }

      var data = JSON.parse(event.data);
      if (data.type === 'pong') {
        that.client = new Walkhub.Client(event.source, event.origin);
        that.proxy = new Walkhub.ProxyServer(event.source, event.origin);
        that.controller = new Walkhub.Controller(that.client, that);
        window.removeEventListener('message', pingPongServer);
      }
    }
    window.addEventListener('message', pingPongServer);

    if (window.parent && window.parent != window) {
      Walkhub.Executor.ping(window.parent, window.location.origin);
      Walkhub.Executor.ping(window.parent, this.origin);
    }
  };

  Walkhub.Executor.prototype.showExitDialog = function (message, buttons, cancel) {
    var opts = {
      nextButton: false
    };
    if (cancel) {
      opts.postRideCallback = cancel;
    }
    var bubble = new Walkhub.Bubble(this.controller, null, {description: message});
    bubble
      .setExtraOptions(opts)
      .setExtraSetupCallback(function () {
        for (var text in buttons) {
          if (!buttons.hasOwnProperty(text)) {
            continue;
          }
          (function () {
            var buttonfunc = buttons[text];
            var button = $('<a />')
              .attr('href', '#')
              .addClass('joyride-next-tip')
              .html(text)
              .click(function (event) {
                event.preventDefault();
                buttonfunc();
              });
            $('.joyride-content-wrapper').append(button);
          })();
        }
      })
      .show();
  };

  Walkhub.Executor.prototype.execute = function (step, force, onStepComplete) {
    var that = this;
    setTimeout(function () {
      var command = step['pureCommand'];
      if (Walkhub.CommandDispatcher.instance().resolve(command)) {
        Walkhub.CommandDispatcher.instance().initCommand(command, step, onStepComplete);

        function noElement() {
          var bubble = new Walkhub.Bubble(that.controller, null, step);
          bubble.show();
        }

        if (force || Walkhub.CommandDispatcher.instance().isAutomaticCommand(command)) {
          Walkhub.CommandDispatcher.instance().executeCommand(command, step);
        } else if (step['highlight']) {
          var error = false;
          Walkhub.Translator.instance().translateOrWait(step['highlight'], {
            success: function (jqobj) {
              if (error) {
                that.client.suppressError('locator-fail');
              }
              var bubble = new Walkhub.Bubble(that.controller, jqobj, step);
              bubble.show();
            },
            waiting: function (tries, remainingtries) {
              var message = "The Selenium locator \"[locator]\" can't find the item, because the page isn't fully loaded, the item is yet to be loaded by Javascript or the walkthrough is broken.".replace('[locator]', step['highlight']);
              that.client.showError('locator-fail', message);
              error = true;
            },
            giveUp: noElement
          });
        } else {
          noElement();
        }
      } else {
        that.client.showError('command-not-supported',
          'The Selenium command "[command]" is not supported.'.replace('[command]', command));
      }
    }, 0);
  };

  Walkhub.Executor.prototype.getClient = function () {
    return this.client;
  };

  Walkhub.Executor.prototype.getProxy = function () {
    return this.proxy;
  };

  Walkhub.Executor.prototype.getController = function () {
    return this.controller;
  };

  Walkhub.Executor.ping = function (source, origin) {
    var message = JSON.stringify({type: 'ping', origin: window.location.origin});
    source.postMessage(message, origin);
  };

  Walkhub.Executor.negotiateWalkhubOrigin = function () {
    if (Walkhub['ProxyOrigin']) {
      return Walkhub['ProxyOrigin']();
    }

    if (Walkhub.Origin) {
      return Walkhub.Origin();
    }

    return window.location.hash.substr(1);
  };

})(jqWalkhub, Walkhub, window);