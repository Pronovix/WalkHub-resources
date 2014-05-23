(function($, Walkhub) {
  "use strict";

  Walkhub.Logger = function(client) {
    this.client = client;
    this.start_timestamp = null;
    this.stop_timestamp = null;
    this.walkthrough_logged = false;
  };

  Walkhub.Logger.prototype.startWalkthrough = function() {
    this.start_timestamp = new Date().getTime();
  };

  Walkhub.Logger.prototype.stopWalkthrough = function() {
    this.stop_timestamp = new Date().getTime();
  };

  Walkhub.Logger.prototype.getPlayMode = function(state) {
    if (state.HTTPProxyURL === "") {
      return "module";
    }

    return "proxy";
  };

  /**
   * Logs the walkthrough play result to the walkhub-log-play-result endpoint.
   *
   * If the endpoint doesn't exist, the query will 404, without causing any
   * problem.
   *
   * @param result boolean.
   *   true if playing was successful, false otherwise.
   */
  Walkhub.Logger.prototype.logResult = function(state, result, message) {
    if (this.walkthrough_logged) {
      return;
    }
    this.walkthrough_logged = true;

    this.stopWalkthrough();

    if (message === null) {
      message = "";
    }

    var play_result = {
      "uuid": state.walkthrough,
      "result": result,
      "error_message": message,
      "play_mode" : this.getPlayMode(state),
      "time": (this.stop_timestamp - this.start_timestamp),
      "parameters": state.parameters
    };

    this.client.send("walkhub-log-play-result", play_result , null, null, "post");
  };

})(jqWalkhub, Walkhub);
