/**
 * Set default Open Graph and Twitter Card meta tags for link previews.
 * Uses og-default.jpeg as the default image when no page-specific image is set (e.g. signup uses og-signup-image.jpg).
 */
(function () {
  var origin = window.location.origin;
  var imageUrl = origin + '/assets/images/og-default.jpeg';
  var url = window.location.href;
  var title = document.title;
  var description = 'Community event management - find and coordinate events.';

  var setMeta = function (id, value) {
    var el = document.getElementById(id);
    if (el) el.setAttribute('content', value);
  };

  setMeta('og-url', url);
  setMeta('og-title', title);
  setMeta('og-description', description);
  setMeta('og-image', imageUrl);
  setMeta('twitter-title', title);
  setMeta('twitter-description', description);
  setMeta('twitter-image', imageUrl);
})();
