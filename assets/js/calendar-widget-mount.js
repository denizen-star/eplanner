/**
 * Injects the calendar widget template into each mount point.
 * Must run after calendar-card-template.js and before calendar-view.js.
 * Mount points: elements with class "calendar-widget-mount".
 * Optional data-calendar-widget-filters="false" on the mount element hides the filter section.
 */
(function () {
  'use strict';

  if (typeof getCalendarCardTemplate !== 'function') {
    console.warn('[calendar-widget-mount] getCalendarCardTemplate not found. Load calendar-card-template.js first.');
    return;
  }

  var mountSelector = '.calendar-widget-mount';
  var mounts = document.querySelectorAll(mountSelector);

  for (var i = 0; i < mounts.length; i++) {
    var el = mounts[i];
    var showFilters = el.getAttribute('data-calendar-widget-filters') !== 'false';
    el.innerHTML = getCalendarCardTemplate({ showFilters: showFilters });
  }
})();
