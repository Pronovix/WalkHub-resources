if (!window.Walkhub) {
  window.Walkhub = {};
}

(function ($) {

  if (window.Walkhub.initialized) {
    return;
  }

  window.Walkhub.initialized = true;

  var MAXIMUM_ZINDEX = 2147483647;
  var LINK_CHECK_TIMEOUT = 500;

  var iOS =
    navigator.platform === 'iPad' ||
    navigator.platform === 'iPad Simulator' ||
    navigator.platform === 'iPhone' ||
    navigator.platform === 'iPhone Simulator' ||
    navigator.platform === 'iPod';

  var unloading = false;

  window.addEventListener('beforeunload', function () {
    unloading = true;
  });

  var sharing_links = {
    twitter: function (url) {
      var link = '<a href="https://twitter.com/intent/tweet?url=URL_PLACEHOLDER&text=TEXT_PLACEHOLDER&via=WalkHub" target="_blank" class="walkhub-sharing-link-open-in-dialog" data-width="550" data-height="420">twitter</a>';
      return link
        .replace('URL_PLACEHOLDER', encodeURIComponent(url))
        .replace('TEXT_PLACEHOLDER', encodeURIComponent('I\'ve just played this walkthrough'));
    },
    facebook: function (url) {
      return '<a href="https://facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) + '" target="_blank" class="walkhub-sharing-link-open-in-dialog" data-width="626" data-height="436">facebook</a>';
    },
    googleplus: function (url) {
      return '<a href="https://plus.google.com/share?url=' + encodeURIComponent(url) + '" target="_blank" class="walkhub-sharing-link-open-in-dialog">google+</a>';
    },
    email: function (url, title) {
      var link = '<a href="mailto:?subject=SUBJECT_TEMPLATE&body=BODY_TEMPLATE">email</a>';
      return link
        .replace('SUBJECT_TEMPLATE', encodeURIComponent('A walkthrough has been shared with you: ' + title))
        .replace('BODY_TEMPLATE', encodeURIComponent('A walkthrough has been shared with you: ' + title + '. Click here to play it: ' + url));
    }
  };

  function WalkhubProxyServer(frame, defaultOrigin) {
    var tickets = {};
    var origin = defaultOrigin;
    var serverKey;
    var paused = false;

    this.pause = function () {
      paused = true;
    };

    this.resume = function () {
      paused = false;
    };

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
      if (paused) {
        return;
      }
      var data = JSON.parse(event.data);
      if (data && data.type && data.type == 'ping') {
        log(['Ping received, sending pong', event.origin]);
        event.source.postMessage(JSON.stringify({type: 'pong', tag: 'proxy'}), event.origin);
        return;
      }
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
      } else if (data && data.type && data.type == 'connect_ok') {
          origin = data.origin;
          serverKey = data.key;
          log('Proxy connected');
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

    this.finish = function () {
      post({type: 'finished'});
    };

    function checkLink() {
      if (frame.closed) {
        var cancel = function () { console.log('Cancel walkthrough') };
        Walkhub.showExitDialog('Walkhub window is closed.', {
          'Cancel walkthrough': cancel
        }, cancel);
      } else {
        setTimeout(checkLink, LINK_CHECK_TIMEOUT);
      }
    }

    this.start = function () {
      if (frame && origin) {
        post({type: 'connect', origin: window.location.origin, url: window.location.href});
      }
      checkLink();
    };
  }

  function WalkhubWalkthrough(server) {
    var state = {
      walkthrough: null,
      step: null,
      completed: false,
      stepIndex: 0,
      parameters: {},
      HTTPProxyURL: ''
    };

    var walkthrough = null;
    var step = null;

    var self = this;

    this.getHTTPProxyURL = function () {
      return state.HTTPProxyURL;
    };

    this.initStep = function () {
      server.log('Step initialization started.');
      state.completed = false;
      server.updateState(state);
      Walkhub.execute(step, false, function () {
        state.completed = true;
        server.updateState(state);
        server.log('Step completed');
      });
      if (commands[step['pureCommand']]['auto']) {
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
      server.finish();
    };

    this.nextStep = function () {
      if (!state.completed && step) {
        server.log('Executing incomplete step.');
        Walkhub.execute(step, true);
      }

      if (walkthrough.steps.length == state.stepIndex) { // Last step
        server.log('Last step');
        function finished() {
          self.finish();
        }
        setTimeout(function () {
          var share = '';
          for (var sl in sharing_links) {
            share += ' ' +  sharing_links[sl](walkthrough.url, walkthrough.name) + ' ';
          }
          Walkhub.showExitDialog('<p>This is the end of this walkthrough. Liked it? Share it through one of the following services:</p>' + share, {
            'Finish': finished
          }, function () {});
        }, 100);
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

    this.updateCurrentStep = function (step, callback) {
      console.log(['Updating step', step]);
      server.send('walkhub-step/' + state.step, step, function (data) {
        console.log(['Updated data', data]);
        step = data;
        callback(data);
      }, function () {
        alert('Updating the step failed.');
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
        step = processStep(data);
        server.log(['Step loaded', step]);
        if (callback) {
          callback(data);
        }
      }, logParams);
    }

    function processStep(step) {
      var props = ['arg1', 'arg2', 'highlight', 'description'];
      for (var parameter in state.parameters) {
        for (var prop in props) {
          prop = props[prop];
          if (step[prop]) {
            step[prop] = step[prop].replace('[' + parameter + ']', state.parameters[parameter]);
          }
        }
      }
      return step;
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

  var cocoaBridgeEnabled = false;

  window.Walkhub.enableCocoaBridge = function () {
    cocoaBridgeEnabled = true;
  };

  function sendMessage(type, message) {
    if (cocoaBridgeEnabled) {
      $('<iframe />')
        .attr('src', 'walkhub-' + type + '://localhost/?' + encodeURIComponent(message))
        .hide()
        .appendTo($('body'));
    }
  }

  function stepCompleted() {
    sendMessage('stepcompleted');
  }

  function translator(locator, verbose) {
    if (!locator) {
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
        var result = document.evaluate(arg, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        if (result.snapshotLength > 0) {
          return $(result.snapshotItem(0));
        }
        return $(''); // empty jquery object
      },
      link: function (arg) {
        return $('a').filter(function () {
          return $(this).text() === arg;
        });
      },
      css: function (arg) {
        return $(arg);
      },
      ui: function (arg) {
      }
    };

    var jqobj = null;

    for (var prefix in locators) {
      if (locator.indexOf(prefix + "=") === 0) {
        jqobj = locators[prefix](locator.substr(prefix.length + 1));
        break;
      }
    }

    jqobj = jqobj || locators.xpath(locator);

    if (verbose && jqobj.length == 0 && !unloading && !iOS) {
      alert("The Selenium locator \"[locator]\" can't find the item, because the page isn't fully loaded, the item is yet to be loaded by Javascript or the walkthrough is broken.".replace('[locator]', locator));
      return null;
    }

    return jqobj;
  }

  function sanitizeValue(value) {
    if (value) {
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

  function createJoyrideBoilerplate(element, command, modal, extra_opts, extra_setup) {
    if (unloading) {
      return;
    }

    var uniq = uniqueID();

    if (previousJoyride) {
      previousJoyride.joyride('end');
      previousJoyride.joyride('destroy');
    }

    if (element) {
      element.addClass(uniq);
    }

    var stepText = $('<p><span class="step-title-UNIQ">TITLE</span><br /><span class="step-description-UNIQ">DESCRIPTION</span></p>'
                       .replace('TITLE', command['showTitle'] ? (command['title'] || '') : '')
                       .replace('DESCRIPTION', command['description'] || '')
                       .replace(/UNIQ/g, uniq));

    var opts = {
      nextButton: true,
      cookieMonster: false,
      autoStart: true,
      preStepCallback: function () {
        $('div.joyride-tip-guide').css('z-index', MAXIMUM_ZINDEX);
        $('.joyride-next-tip')
          .unbind('click')
          .bind('click', function (event) {
            event.preventDefault();
            walkthrough.nextStep();
          })
          .html('Next');
        if (command.canEdit) {
          $('<a />')
            .attr('href', '#')
            .addClass('joyride-normal-tip')
            .html('Edit')
            .click(function (event) {
               event.preventDefault();
               openStepEditDialog(command, function () {
                 $('.joyride-next-tip, .joyride-normal-tip').show();
               }, function (step) {
                 $('span.step-title-' + uniq).html(step.showTitle ? step.title : '');
                 $('span.step-description-' + uniq).html(step.description);
               });
               $('.joyride-next-tip, .joyride-normal-tip').hide();
             })
            .appendTo($('.joyride-content-wrapper'));
        }
        if (extra_setup) {
          extra_setup();
        }
      }
    };

    if (extra_opts) {
      opts = $.extend(opts, extra_opts);
    }

    previousJoyride = $('<ol />')
      .append($('<li />').append(stepText).attr('data-class', modal ? '' : uniq))
      .hide()
      .appendTo($('body'))
      .joyride(opts);
  }

  function openStepEditDialog(step, submit, success) {
    var form = $('<form><fieldset></fieldset></form>');
    var fieldset = $('fieldset', form);

    $('<label />')
      .attr('for', 'title')
      .html('Title')
      .appendTo(fieldset);
    $('<input />')
      .attr('type', 'textfield')
      .attr('name', 'title')
      .attr('id', 'title')
      .val(step.titleRaw)
      .appendTo(fieldset);

    $('<label />')
      .attr('for', 'description')
      .html('Description')
      .appendTo(fieldset);

    var description = $('<textarea />')
      .val(step.descriptionRaw)
      .attr('name', 'description')
      .attr('id', 'description')
      .appendTo(fieldset);

    var suggestionwrapper = $('<div />')
      .attr('class', 'suggestions')
      .appendTo(fieldset)
      .hide();

    $('<label >')
      .attr('for', 'showtitle')
      .html('Show title')
      .appendTo(fieldset);

    var showtitle = $('<input />')
      .attr('type', 'checkbox')
      .attr('name', 'showtitle')
      .attr('id', 'showtitle')
      .appendTo(fieldset);

    if (step.showTitle) {
      showtitle.attr('checked', 'checked');
    }

    $('<hr />')
      .appendTo(fieldset);

    $('<input />')
      .attr('type', 'submit')
      .val('Save')
      .appendTo(fieldset);

    form.submit(function (event) {
      event.preventDefault();
      step.titleRaw = $('input#title', form).val();
      step.descriptionRaw = $('textarea#description', form).val();
      step.showTitle = $('input#showtitle', form).get(0).checked;
      submit();
      form.remove();
      window.walkthrough.updateCurrentStep(step, success);
    });

    var querystring =
      'command=' + encodeURIComponent(step.command) + '&' +
      'arg1=' + encodeURIComponent(step.arg1) + '&' +
      'arg2=' + encodeURIComponent(step.arg2);
    window.client.send('walkhub-step-suggestion?' + querystring, null, function (data) {
      suggestionwrapper
        .show()
        .append($('<p/>').text('Suggestions: '));
      for (var i in data) {
        $('<p />')
          .text(data[i])
          .click(function (event) {
            event.preventDefault();
            description.val($(this).text());
          })
          .css('cursor', 'pointer')
          .css('font-size', 'small')
          .appendTo(suggestionwrapper);
      }
    });

    form.appendTo($('.joyride-content-wrapper'));
  }

  function isElementButtonLike(element) {
    var tagname = element.prop('tagName').toLowerCase();
    return tagname == 'a' ||
      tagname == 'button' ||
      (tagname == 'input' && element.attr('type').toLowerCase() == 'submit');
  }

  // Dispatch command
  var commands = {
    click: {
      init: function (command, stepCompletionCallback) {
        translator(command['arg1'])
          .unbind('click.walkhub')
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
          .keydown()
          .keyup()
          .change();
      }
    },
    select: {
      init: function (command, stepCompletionCallback) {
        var element = translator(command['arg1']);
        if (isElementButtonLike(element)) {
          commands.click.init(command, stepCompletionCallback);
        } else {
          element
            .unbind('change.walkhub')
            .bind('change.walkhub', stepCompletionCallback || stepCompleted);
        }
      },
      execute: function (command) {
        var element = translator(command['arg1']);
        if (isElementButtonLike(element)) {
          commands.click.execute(command);
        } else {
          element
            .val(sanitizeValue(command['arg2']))
            .change();
        }
      }
    },
    open: {
      init: function (command, stepCompletionCallback) {},
      execute: function (command) {
        var url = command['arg1'];
        var httpProxy = walkthrough.getHTTPProxyURL();
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
      },
      // This means that this step will be executed automatically.
      auto: true
    }
  };

  // Aliases
  commands.sendKeys = commands.type;

//  var client = null;
//  var walkthrough = null;
  window.client = null;
  window.walkthrough = null;
  window.proxy = null;

  function negotiateWalkhubOrigin() {
    if (Walkhub.ProxyOrigin) {
      return Walkhub.ProxyOrigin();
    }

    if (Walkhub.Origin) {
      return Walkhub.Origin();
    }

    return window.location.hash.substr(1);
  }

  $(function () {
    // Set up connection to the parent or opener (server or proxy)
    var origin = negotiateWalkhubOrigin();
    function ping(source, origin) {
      var message = JSON.stringify({type: 'ping', origin: window.location.origin});
      source.postMessage(message, origin);
    }
    window.addEventListener('message', function (event) {
      if (window.client) {
        return;
      }
      var data = JSON.parse(event.data);
      if (data.type === 'pong') {
        window.client = new WalkhubClient(event.source, event.origin);
        window.proxy = new WalkhubProxyServer(event.source, event.origin);
        window.walkthrough = new WalkhubWalkthrough(window.client);
        window.removeEventListener('message', this);
      }
    });
    if (window.opener) {
      ping(window.opener, origin);
    }
    if (window.parent && window.parent != window) {
      ping(window.parent, window.location.origin);
      ping(window.parent, origin);
    }

    // Misc setups
    $(document).on('click', 'a.walkhub-sharing-link-open-in-dialog', function (event) {
      var link = $(this);
      var width = link.data('width') || '550';
      var height = link.data('height') || '420';
      var url = link.attr('href');
      event.preventDefault();

      // Avoid duplicated event calls
      var lastclicked = link.data('lastclicked');
      var now = (new Date()).getTime() / 1000.0;
      link.data('lastclicked', now);
      if ((lastclicked + 1.0) < now) {
        window.open(url, 'Share', 'height=' + height + ',width=' + width + ',menubar=no,toolbar=no,location=no,personalbar=no,status=no,dependent=yes,dialog=yes', true);
      }

      return false;
    });
  });

  Walkhub.showExitDialog = function (message, buttons, cancel) {
    var opts = {
      nextButton: false
    };
    if (cancel) {
      opts.postRideCallback = cancel;
    }
    createJoyrideBoilerplate(null, {description: message}, true, opts, function () {
      for (var text in buttons) {
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
    });
  };

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

        var highlight;
        if (force || commands[command['pureCommand']]['auto']) {
          commands[command['pureCommand']].execute(command);
        } else if (command['highlight'] && (highlight = translator(command['highlight'], true))) {
          createJoyrideBoilerplate(highlight, command, false);
        } else {
          Walkhub.modal(command);
        }

      } else {
        alert('The Selenium command "[command]" is not supported.'.replace('[command]', command['pureCommand']));
      }
    }, 0);
  };

  Walkhub.modal = function (command) {
    // This is very important. This script runs synchronously, which means that if
    // something locks here, the whole app will freeze/deadlock.
    setTimeout(function () {
      createJoyrideBoilerplate(null, command, true);
    }, 0);
  };


})(jqWalkhub);
