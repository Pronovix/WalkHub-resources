(function ($, Walkhub, window) {
  "use strict";

  Walkhub.Client = function (frame, defaultOrigin) {
    var that = this;

    this.tickets = {};
    this.origin = defaultOrigin;
    this.baseURL = null;
    this.serverKey = null;
    this.proxyKey = null;
    this.frame = frame;
    this.stateChanged = null;

    this.handlers = {
      connect_ok: function (data) {
        if (!that.serverKey) {
          if (!that.proxyKey) {
            that.origin = data.origin;
          }
          that.baseURL = data.baseurl;
          that.serverKey = data.key;
          Walkhub.Context.fullscreen = data.fullscreen;
          that.post({
            type: "getState"
          });
        }
      },
      success: function (data) {
        if (that.tickets[data.ticket]) {
          that.tickets[data.ticket].success(data.data);
          delete that.tickets[data.ticket];
        }
      },
      error: function (data) {
        if (that.tickets[data.ticket]) {
          that.tickets[data.ticket].error(data.status, data.error);
          delete that.tickets[data.ticket];
        }
      },
      state: function (data) {
        if (that.stateChanged) {
          that.stateChanged(data.state);
        }
      },
      setProxy: function (data) {
        that.proxyKey = data.proxy_key;
      }
    };

    window.addEventListener("message", function (event) {
      var data = JSON.parse(event.data);
      var handler = data && data.type && that.handlers[data.type];
      if (handler) {
        handler(data, event.source);
      }
    });
  };

  Walkhub.Client.prototype.post = function (data) {
    data.key = data.key || this.serverKey;
    data.tag = data.tag || "client";
    if (this.proxyKey) {
      data.proxy_key = this.proxyKey;
    }
    try {
      this.frame.postMessage(JSON.stringify(data), this.origin);
    } catch (e) {
      console.log(e, data, this.frame);
    }
  };

  Walkhub.Client.prototype.send = function (endpoint, data, success, error, method) {
    if (!this.origin) {
      return false;
    }

    var ticket = window.Math.random().toString();
    this.tickets[ticket] = {
      success: success,
      error: error
    };

    var message = {
      type: "request",
      ticket: ticket,
      URL: this.baseURL + "api/v2/" + endpoint,
      data: data
    };

    if (method) {
      message.method = method;
    }

    this.post(message);

    return true;
  };

  Walkhub.Client.prototype.setStateChanged = function (callback) {
    this.stateChanged = callback;
  };

  Walkhub.Client.prototype.log = function (data) {
    this.post({
      type: "log",
      log: data
    });
  };

  Walkhub.Client.prototype.showError = function (id, error) {
    this.post({
      type: "showError",
      id: id,
      error: error
    });
  };

  Walkhub.Client.prototype.suppressError = function (id) {
    this.post({
      type: "suppressError",
      id: id
    });
  };

  Walkhub.Client.prototype.updateState = function (state) {
    this.post({type: "setState", state: state});
  };

  Walkhub.Client.prototype.saveStep = function (cmd, arg0, arg1) {
    this.post({
      type: "saveStep",
      cmd: cmd,
      arg0: arg0,
      arg1: arg1
    });
  };

  Walkhub.Client.prototype.enablePasswordParameter = function () {
    this.post({
      type: "enablePasswordParameter"
    });
  };

  Walkhub.Client.prototype.finish = function () {
    this.post({type: "finished"});
  };

  Walkhub.Client.prototype.start = function () {
    if (this.frame && this.origin) {
      this.post({type: "connect", origin: window.location.origin, url: window.location.href});
    }
  };

})(jqWalkhub, Walkhub, window);
