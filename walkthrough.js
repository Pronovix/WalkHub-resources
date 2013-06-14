if (!window.Walkhub) {
  window.Walkhub = {};
}

(function ($) {

  function WalkhubProxyServer(frame, defaultOrigin) {
    var tickets = {};
    var origin = defaultOrigin;
    var serverKey;

    function post(data, customFrame) {
      if (customFrame) {
        customFrame.source.postMessage(JSON.stringify(data), customFrame.origin);
      } else {
        frame.postMessage(JSON.stringify(data), origin);
      }
    }

    function log(data) {
      if (serverKey) {
        post({type: 'log', log: data, key: serverKey});
      }
    }

    window.addEventListener('message', function (event) {
      var data = JSON.parse(event.data);
      if (serverKey) {
        if (frame == event.source) {
          if (data.proxy_key && tickets[data.proxy_key]) {
            post(data, tickets[data.proxy_key]);
            log(['Proxying data to the client', data]);
          }
        } else {
          if (!data.proxy_key) { // add new client
            data.proxy_key = Math.random().toString();
            tickets[data.proxy_key] = {
              source: event.source,
              origin: event.origin
            };
            post({
              type: 'setProxy',
              proxy_key: data.proxy_key
            }, tickets[data.proxy_key]);
            log(['Client connected', data.proxy_key]);
          }
          post(data);
          log(['Proxying data to the server', data]);
        }
      } else {
        if (data && data.type && data.type == 'connect_ok') {
          origin = data.origin;
          serverKey = data.key;
          log('Proxy connected');
        }
      }
    });

    post({
      type: 'connect',
      origin: window.location.origin,
      tag: 'proxy'
    });

    log('Proxy starting.');
  }

  function WalkhubClient(frame, defaultOrigin) {
    var tickets = {};
    var origin = defaultOrigin;
    var baseURL;

    var serverKey;
    var proxyKey;

    var self = this;

    function post(data) {
      data.key = data.key || serverKey;
      data.tag = data.tag || 'client';
      if (proxyKey) {
        data.proxy_key = proxyKey;
      }
      frame.postMessage(JSON.stringify(data), origin);
      console.log(['Client data', data]);
    }

    this.stateChanged = null;

    this.send = function (endpoint, data, success, error) {
      if (!origin) {
        return false;
      }

      var ticket = Math.random().toString();
      tickets[ticket] = {
        success: success,
        error: error
      };

      post({
        type: 'request',
        ticket: ticket,
        URL: baseURL + 'api/v2/' + endpoint,
        data: data
      });

      return true;
    };

    this.log = function (data) {
      post({
        type: 'log',
        log: data
      });
    };

    var handlers = {
      connect_ok: function (data) {
        if (!serverKey) {
          if (!proxyKey) {
            origin = data.origin;
          }
          baseURL = data.baseurl;
          serverKey = data.key;
          post({
            type: 'getState'
          });
        }
      },
      success: function (data) {
        if (tickets[data.ticket]) {
          tickets[data.ticket].success(data.data);
          delete tickets[data.ticket];
        }
      },
      error: function (data) {
        if (tickets[data.ticket]) {
          tickets[data.ticket].error(data.status, data.error);
          delete tickets[data.ticket];
        }
      },
      state: function (data) {
        if (self.stateChanged) {
          self.stateChanged(data.state);
        }
      },
      setProxy: function (data) {
        proxyKey = data.proxy_key;
      }
    };

    window.addEventListener('message', function (event) {
      var data = JSON.parse(event.data);
      var handler = data && data.type && handlers[data.type];
      if (handler) {
        console.log(event);
        handler(data, event.source);
      }
    });

    this.updateState = function (state) {
      post({type: 'setState', state: state});
    };

    this.start = function () {
      if (frame && origin) {
        post({type: 'connect', origin: window.location.origin});
      }
    };
  }

  function WalkhubWalkthrough(server) {
    var state = {
      walkthrough: null,
      step: null,
      completed: false,
      stepIndex: 0
    };

    var walkthrough = null;
    var step = null;

    var self = this;

    this.initStep = function () {
      server.log('Step initialization started.');
      state.completed = false;
      server.updateState(state);
      Walkhub.execute(step, false, function () {
        state.completed = true;
        server.updateState(state);
        server.log('Step completed');
      });
      if (commands[step.pureCommand]['auto']) {
        server.log('Automatically executing step.');
        self.nextStep();
      }
    };

    this.finish = function () {
      state.walkthrough = null;
      state.step = null;
      state.completed = false;
      state.stepIndex = 0;
      walkthrough = null;
      step = null;
      server.updateState(state);
    };

    this.nextStep = function () {
      if (!state.completed && step) {
        server.log('Executing incomplete step.');
        Walkhub.execute(step, true);
      }

      if (walkthrough.steps.length == state.stepIndex) { // Last step
        server.log('Last step');
        self.finish();
        return;
      }

      server.log('Loading next step');
      state.step = walkthrough.steps[state.stepIndex];
      state.stepIndex++;
      server.updateState(state);
      refreshStep(function () {
        server.log('Next step loaded, initalizing.');
        self.initStep();
      });
    };

    function refreshWalkthrough(callback) {
      walkthrough = null;
      server.updateState(state);
      step = null;
      server.send('walkhub-walkthrough/' + state.walkthrough, null, function (data) {
        walkthrough = data;
        server.log(['Walkthrough loaded', walkthrough]);
        if (callback) {
          callback(data);
        }
      }, logParams);
    }

    function refreshStep(callback) {
      step = null;
      server.send('walkhub-step/' + state.step, null, function (data) {
        step = data;
        server.log(['Step loaded', step]);
        if (callback) {
          callback(data);
        }
      }, logParams);
    }

    server.stateChanged = function (_state) {
      state = _state;
      server.log(['New state', state]);
      if (state.walkthrough) {
        refreshWalkthrough(function () {
          if (state.step) {
            server.log('Loading step');
            refreshStep(function () {
              self.initStep();
            });
          }
          else {
            server.log('Empty step');
            self.nextStep();
          }
        });
      }
    };

    server.start();
  }

  // JavaScript -> Cocoa bridging

  function sendMessage(type, message) {
    $('<iframe />')
      .attr('src', 'walkhub-' + type + '://localhost/?' + encodeURIComponent(message))
      .hide()
      .appendTo($('body'));
  }

  function stepCompleted() {
    sendMessage('stepcompleted');
  }

  function translator(command) {
    if (!command) {
      return null;
    }

    var locators = {
      identifier: function (arg) {
        var jq = locators.id(arg);
        if (jq.length == 0) {
          jq = locators.name(arg);
        }
        return jq;
      },
      id: function (arg) {
        return $('#' + arg);
      },
      name: function (arg) {
        return $('[name=' + arg + ']');
      },
      dom: function (arg) {
      },
      xpath: function (arg) {
        var result = document.evaluate(arg, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        return $(result);
      },
      link: function (arg) {
        arg = arg.replace('(', '\\(').replace(')', '\\)');
        return $('a:contains("' + arg + '")');
      },
      css: function (arg) {
        return $(arg);
      },
      ui: function (arg) {
      }
    };

    for (var prefix in locators) {
      if (command.indexOf(prefix + "=") === 0) {
        return locators[prefix](command.substr(prefix.length + 1));
      }
    }

    return $(command);
  }

  function sanitizeValue(value) {
    var types = {
      'label': function (arg) {
        return arg;
      }
    };

    for (var prefix in types) {
      if (value.indexOf(prefix + "=") === 0) {
        return types[prefix](value.substr(prefix.length + 1));
      }
    }

    return value;
  }

  if (!window.console) {
    window.console = {
      'log': function (obj) {
        sendMessage('log', obj);
      }
    };
  }

  function logParams() {
    console.log(arguments);
  }

  var globalCounter = 0;

  function uniqueID() {
    return "px-walkhub-" + globalCounter++;
  }

  var previousJoyride = null;

  function createJoyrideBoilerplate(element, command, modal) {

    var uniq = uniqueID();

    if (previousJoyride) {
      previousJoyride.joyride('end');
      previousJoyride.joyride('destroy');
    }

    if (element) {
      element.addClass(uniq);
    }

    previousJoyride = $('<ol />')
      .append($('<li />').html('<p>' + (command['description'] || '') + '</p>').attr('data-class', modal ? '' : uniq))
      .hide()
      .appendTo($('body'))
      .joyride({
        nextButton: true,
        cookieMonster: false,
        autoStart: true,
        preStepCallback: function () {
          $('div.joyride-tip-guide').css('z-index', 2147483647);
          $('.joyride-next-tip')
            .unbind('click')
            .bind('click', function (event) {
              event.preventDefault();
              walkthrough.nextStep();
            })
            .html('Next');
        }
      });

  }

  // Dispatch command
  var commands = {
    click: {
      init: function (command, stepCompletionCallback) {
        translator(command['arg1'])
          .unbind('click.walkthough')
          .bind('click.walkhub', stepCompletionCallback || stepCompleted);
      },
      execute: function (command) {
        var element = translator(command['arg1']);
        var raw = element.get(0);
        raw.click();
      }
    },
    type: {
      init: function (command, stepCompletionCallback) {
        translator(command['arg1'])
          .unbind('change.walkhub')
          .bind('change.walkhub', stepCompletionCallback || stepCompleted);
      },
      execute: function (command) {
        translator(command['arg1'])
          .val(command['arg2'])
          .change();
      }
    },
    select: {
      init: function (command, stepCompletionCallback) {
        translator(command['arg1'])
          .unbind('change.walkhub')
          .bind('change.walkhub', stepCompletionCallback || stepCompleted);
      },
      execute: function (command) {
        translator(command['arg1'])
          .val(sanitizeValue(command['arg2']))
          .change();
      }
    },
    open: {
      init: function (command, stepCompletionCallback) {},
      execute: function (command) {
        window.location = command['arg1'];
      },
      // This means that this step will be executed automatically.
      auto: true
    }
  };

//  var client = null;
//  var walkthrough = null;
  window.client = null;
  window.walkthrough = null;
  window.proxy = null;

  function negotiateWalkhubOrigin() {
    if (Walkhub.Origin) {
      return Walkhub.Origin();
    }

    return window.location.hash.substr(1);
  }

  $(function () {
    if (window.opener) {
      var origin = negotiateWalkhubOrigin();
      window.client = new WalkhubClient(window.opener, origin);
      window.proxy = new WalkhubProxyServer(window.opener, origin);
    } else if (window.parent != window && window.parent) {
      window.client = new WalkhubClient(window.parent, window.location.origin);
    }
    if (client) {
      window.walkthrough = new WalkhubWalkthrough(client);
    }
  });

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
   * @param force
   * @param stepCompletionCallback
   */
  Walkhub.execute = function (command, force, stepCompletionCallback) {
    // This is very important. This script runs synchronously, which means that if
    // something locks here, the whole app will freeze/deadlock.
    setTimeout(function () {
      if (commands[command['pureCommand']]) {
        commands[command['pureCommand']]['init'](command, stepCompletionCallback);
        if ((command['highlight'] || commands[command['pureCommand']]['auto']) && !force) {
          createJoyrideBoilerplate(translator(command['highlight']), command, false);
        }
        else {
          commands[command['pureCommand']]['execute'](command);
        }
      }
    }, 0);
  };

  Walkhub.modal = function (command, force) {
    // This is very important. This script runs synchronously, which means that if
    // something locks here, the whole app will freeze/deadlock.
    setTimeout(function () {
      createJoyrideBoilerplate(null, command, true);
    }, 0);
  };


})(jQuery);
