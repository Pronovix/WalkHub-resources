(function ($, Walkhub, window) {
  Walkhub.SocialSharing = {
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

  Walkhub.SocialSharingFix = function () {
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
  };

})(jqWalkhub, Walkhub, window);