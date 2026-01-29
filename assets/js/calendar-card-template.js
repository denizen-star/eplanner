/**
 * Single source of truth for the calendar widget card inner HTML.
 * Used by calendar.html and index.html via calendar-widget-mount.js (DRY).
 * @param { { showFilters?: boolean } } [options] - Optional. showFilters defaults to true.
 * @returns {string} HTML string for the card inner content.
 */
function getCalendarCardTemplate(options) {
  var showFilters = options && options.showFilters === false ? false : true;

  var filterBlock = showFilters
    ? '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-xl); flex-wrap: wrap; gap: var(--space-md);">'
        + '<h2 class="section-headline" style="margin-bottom: 0;" id="weekTitle">This Week\'s Events</h2>'
        + '<div id="filterToggleContainer" class="filter-toggle-container">'
          + '<button id="filterToggleBtn" class="filter-toggle-pill" type="button">'
            + '<span>Filters</span>'
            + '<span class="filter-toggle-icon">▼</span>'
          + '</button>'
        + '</div>'
      + '</div>'
      + '<div id="filterSection" class="filter-section collapsible-section" style="margin-bottom: var(--space-lg);">'
        + '<div class="collapsible-content" id="filterContent" style="display: none; padding: var(--space-md);">'
          + '<div style="display: flex; flex-direction: column; gap: var(--space-md);">'
            + '<div style="display: flex; gap: var(--space-md); flex-wrap: wrap; align-items: center;">'
              + '<div style="flex: 0.5; min-width: 150px;">'
                + '<label for="filterStartDate" style="display: block; margin-bottom: 4px; font-size: var(--font-sm); font-weight: var(--font-medium);">Start Date:</label>'
                + '<input type="date" id="filterStartDate" style="width: 100%; padding: 8px; border: 1px solid var(--border-gray); border-radius: 4px;">'
              + '</div>'
              + '<div style="flex: 0.5; min-width: 150px;">'
                + '<label for="filterEndDate" style="display: block; margin-bottom: 4px; font-size: var(--font-sm); font-weight: var(--font-medium);">End Date:</label>'
                + '<input type="date" id="filterEndDate" style="width: 100%; padding: 8px; border: 1px solid var(--border-gray); border-radius: 4px;">'
              + '</div>'
            + '</div>'
            + '<div style="display: flex; gap: var(--space-sm); align-items: center;">'
              + '<button id="applyDateFilterBtn" class="button button-primary" style="white-space: nowrap;">Apply Date Range</button>'
              + '<button id="clearDateFilterBtn" class="button button-secondary" style="white-space: nowrap;">Clear</button>'
            + '</div>'
            + '<div style="display: flex; align-items: center; gap: var(--space-sm);">'
              + '<input type="checkbox" id="hideCancelledCheckbox" style="width: 18px; height: 18px;">'
              + '<label for="hideCancelledCheckbox" style="font-size: var(--font-sm); cursor: pointer;">Hide cancelled events</label>'
            + '</div>'
          + '</div>'
        + '</div>'
      + '</div>'
    : '<div style="margin-bottom: var(--space-xl);">'
        + '<h2 class="section-headline" style="margin-bottom: 0;" id="weekTitle">This Week\'s Events</h2>'
      + '</div>';

  return (
    filterBlock +
    '<div id="loading" style="text-align: center; padding: var(--space-2xl); color: var(--text-secondary);">'
      + 'Loading events...'
    + '</div>'
    + '<!-- Desktop Panel Layout (hidden on mobile) -->'
    + '<div id="desktopCalendarPanel" class="desktop-calendar-panel" style="display: none;">'
      + '<div class="desktop-calendar-left">'
        + '<div id="desktopEventList" class="desktop-event-list"></div>'
      + '</div>'
      + '<div class="desktop-calendar-right">'
        + '<div id="desktopEventDetails" class="desktop-event-details">'
          + '<div class="desktop-event-details-placeholder">'
            + '<p style="text-align: center; color: var(--text-secondary); padding: var(--space-2xl);">'
              + 'Select an event to view details'
            + '</p>'
          + '</div>'
        + '</div>'
      + '</div>'
    + '</div>'
    + '<!-- Mobile/Tablet Week Grid (hidden on desktop) -->'
    + '<div id="calendarContainer" class="calendar-week-container" style="display: none;">'
      + '<div class="calendar-week" id="calendarWeek"></div>'
    + '</div>'
    + '<div id="noEvents" style="display: none; text-align: center; padding: var(--space-2xl); color: var(--text-secondary);">'
      + '<p style="font-size: var(--font-lg); margin-bottom: var(--space-md);">No public events scheduled for this week.</p>'
      + '<a href="coordinate.html" class="button button-primary">Create an Event</a>'
    + '</div>'
    + '<div id="error" class="message message-error" style="display: none;"></div>'
  );
}

if (typeof window !== 'undefined') {
  window.getCalendarCardTemplate = getCalendarCardTemplate;
}
