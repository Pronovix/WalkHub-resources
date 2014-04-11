// Show a warning message that you are browsing through a proxy.

(function ($) {
  "use strict";
  $(document).ready(function() {
    var popupContent = Walkhub.proxyMessage;
    var $popup = $('<div id="walkthrough-proxy-message" class="wtbubble-tip-guide"><span id="walkthrough-proxy-message-close">X</span>' + popupContent +'</div>');
    $('body').append($popup);

    $('#walkthrough-proxy-message-close').on("click", function() {
      $('#walkthrough-proxy-message').fadeOut().destroy();
    });
  });

})(jqWalkhub);
