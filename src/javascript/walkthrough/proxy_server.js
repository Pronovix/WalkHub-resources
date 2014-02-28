(function ($, Walkhub, window) {
  'use strict';

  Walkhub.ProxyServer = function (frame, defaultOrigin) {
    var that = this;

    this.tickets = {};
    this.frame = frame;
    this.origin = defaultOrigin;
    this.serverKey = null;
    this.paused = false;

    window.addEventListener('message', function (event) {
      if (that.paused) {
        return;
      }
      var data = JSON.parse(event.data);
      if (data && data.type && data.type == 'ping') {
        that.log(['Ping received, sending pong', event.origin]);
        event.source.postMessage(JSON.stringify({type: 'pong', tag: 'proxy'}), event.origin);
        return;
      }
      if (that.serverKey) {
        if (frame == event.source) {
          if (data.proxy_key && that.tickets[data.proxy_key]) {
            that.post(data, that.tickets[data.proxy_key]);
            that.log(['Proxying data to the client', data]);
          }
        } else {
          if (!data.proxy_key) { // add new client
            data.proxy_key = window.Math.random().toString();
            that.tickets[data.proxy_key] = {
              source: event.source,
              origin: event.origin
            };
            that.post({
              type: 'setProxy',
              proxy_key: data.proxy_key
            }, that.tickets[data.proxy_key]);
            that.log(['Client connected', data.proxy_key]);
          }
          that.post(data);
          that.log(['Proxying data to the server', data]);
        }
      } else if (data && data.type && data.type == 'connect_ok') {
        that.origin = data.origin;
        that.serverKey = data.key;
        that.log('Proxy connected');
      }
    });

    this.post({
      type: 'connect',
      origin: window.location.origin,
      tag: 'proxy'
    });

    this.log('Proxy starting.');
  };

  Walkhub.ProxyServer.prototype.pause = function () {
    this.paused = true;
  };

  Walkhub.ProxyServer.prototype.resume = function () {
    this.paused = false;
  };

  Walkhub.ProxyServer.prototype.post = function (data, customFrame) {
    if (customFrame) {
      customFrame.source.postMessage(JSON.stringify(data), customFrame.origin);
    } else {
      this.frame.postMessage(JSON.stringify(data), this.origin);
    }
  };

  Walkhub.ProxyServer.prototype.log = function (data) {
    if (this.serverKey) {
      this.post({type: 'log', log: data, key: this.serverKey});
    }
  };

})(jqWalkhub, Walkhub, window);