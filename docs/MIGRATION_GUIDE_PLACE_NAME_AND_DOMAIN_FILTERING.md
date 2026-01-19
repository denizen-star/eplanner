# Migration Guide: Place Name Extraction & Domain Filtering

This guide documents the implementation of place name extraction and domain filtering features, making it easy to apply these changes to similar applications (e.g., gayrunclub).

## Overview

This implementation adds two main features:
1. **Enhanced Place Name Extraction**: Extracts venue/bar/restaurant names from multiple Nominatim geocoding fields
2. **Domain Filtering**: Filters events by `app_name` so each domain only shows its own events

## Key Learnings & Patterns

### 1. Domain Detection Must Check Specific Domains First

**Critical Pattern**: Always check for the most specific domain first, then fall back to generic patterns.

```javascript
// ✅ CORRECT - Check specific domain first
if (hostLower.includes('to-lgbtq')) {
  return 'to-lgbtq';
}
if (hostLower.includes('eplanner') || hostLower.includes('eventplan')) {
  return 'eplanner';
}

// ❌ WRONG - Generic check catches everything first
if (hostLower.includes('eplanner')) {
  return 'eplanner';  // This would catch 'to-lgbtq' if it contains 'eplanner'
}
```

**Why**: If you check generic patterns first, they may match more specific domains incorrectly.

### 2. Map Initialization Needs Dependency Checking

**Critical Pattern**: Always verify dependencies are loaded before initializing maps.

```javascript
// ✅ CORRECT - Check dependencies and retry
function initializeMapWhenReady() {
  const mapContainer = document.getElementById('locationMap');
  const dependenciesReady = typeof L !== 'undefined' && 
                            typeof initMap === 'function' && 
                            typeof MIAMI_COORDINATES !== 'undefined';
  
  if (mapContainer && dependenciesReady) {
    initMap('locationMap', null, null, false, MIAMI_COORDINATES);
  } else if (mapContainer) {
    setTimeout(initializeMapWhenReady, 100); // Retry
  }
}
```

**Why**: Scripts may load in different orders or timing, especially with CDN resources.

### 3. Database Migration Order Matters

**Critical Pattern**: Run migrations in order, and always update existing records.

```sql
-- Step 1: Add column with default
ALTER TABLE ep_events 
ADD COLUMN app_name VARCHAR(50) DEFAULT 'eplanner' AFTER is_public;

-- Step 2: Add index for performance
CREATE INDEX idx_app_name ON ep_events (app_name);

-- Step 3: Update existing records (important!)
UPDATE ep_events 
SET app_name = 'eplanner' 
WHERE app_name IS NULL;
```

**Why**: Existing records need explicit updates, defaults only apply to new records.

### 4. Place Name Extraction Priority Order

**Critical Pattern**: Check fields in priority order (most specific to least specific).

```javascript
// Priority order matters:
// 1. result.name (most specific - actual venue name)
// 2. result.address.amenity (bars, restaurants)
// 3. result.address.shop (shops, stores)
// 4. result.address.leisure (parks, recreation)
// 5. result.address.tourism (attractions)
// 6. result.address.building (building names)
// 7. result.display_name (fallback - parse first part)
```

**Why**: Different Nominatim results have place names in different fields. Checking in priority order ensures we get the best match.

---

## Step-by-Step Implementation Checklist

### Phase 1: Database Changes

- [ ] **Create migration file**: `lib/migration-add-app-name.sql`
  - Add `app_name VARCHAR(50) DEFAULT 'eplanner'` column
  - Add index `idx_app_name`
  - Update existing records to default value
- [ ] **Run migration** in PlanetScale development branch
- [ ] **Promote to main** after testing

### Phase 2: Place Name Extraction Enhancement

- [ ] **Update `assets/js/map-utils.js`**
  - Modify `geocodeLocation()` function
  - Add place name extraction logic checking multiple Nominatim fields
  - Priority: `name` > `amenity` > `shop` > `leisure` > `tourism` > `building` > `display_name` (parsed)

**Key Code Pattern:**
```javascript
let placeName = null;
const addr = result.address || {};

if (result.name) {
  placeName = result.name;
} else if (addr.amenity) {
  placeName = addr.amenity;
} else if (addr.shop) {
  placeName = addr.shop;
} // ... continue with other fields
```

### Phase 3: Domain Detection & Filtering

- [ ] **Update `netlify/functions/utils.js`** (or equivalent)
  - Modify `getAppName()` function
  - **CRITICAL**: Check specific domains BEFORE generic ones
  - Add domain detection for your specific domain (e.g., 'gayrunclub')

**Key Code Pattern:**
```javascript
function getAppName(event) {
  const host = event?.headers?.['host'] || event?.headers?.['Host'] || '';
  const hostLower = host.toLowerCase();
  
  // Check MOST SPECIFIC domain first
  if (hostLower.includes('gayrunclub')) {
    return 'gayrunclub';
  }
  if (hostLower.includes('to-lgbtq')) {
    return 'to-lgbtq';
  }
  if (hostLower.includes('eplanner') || hostLower.includes('eventplan')) {
    return 'eplanner';
  }
  
  return process.env.APP_NAME || 'eplanner';
}
```

- [ ] **Update `lib/databaseClient.js`**
  - Add `app_name` to `EVENT_SELECT_FIELDS`
  - Add `app_name` to `runs.create()` INSERT statement
  - Update `runs.getPublicEvents()` to accept optional `appName` parameter
  - Add `app_name` filter to query when `appName` is provided

**Key Code Pattern:**
```javascript
// In EVENT_SELECT_FIELDS
app_name as appName,

// In runs.create() INSERT
app_name,
// In VALUES
runData.appName || 'eplanner', // Default

// In getPublicEvents()
async getPublicEvents(startDate, endDate, appName = null) {
  // ... build query
  if (appName) {
    query += ` AND app_name = ?`;
    queryParams.push(appName);
  }
}
```

- [ ] **Update event creation endpoints**
  - `netlify/functions/runs-create.js`: Use `getAppName(event)` and store in database
  - `server.js` (local): Detect domain from request and store `appName`

**Key Code Pattern:**
```javascript
// In runs-create.js
const { getAppName } = require('./utils');
const appName = getAppName(event);
// ... in runs.create() call
appName: appName,

// In server.js
const host = req.get('host') || '';
const hostLower = host.toLowerCase();
let appName = 'eplanner'; // Default
if (hostLower.includes('gayrunclub')) {
  appName = 'gayrunclub';
} // ... other domains
```

- [ ] **Update calendar endpoints**
  - `netlify/functions/runs-public-calendar.js`: Use `getAppName(event)` and pass to `getPublicEvents()`
  - `server.js` `/api/runs/public-calendar`: Detect domain and pass to `getPublicEvents()`

**Key Code Pattern:**
```javascript
const appName = getAppName(event);
const events = await runs.getPublicEvents(startDate, endDate, appName);
```

### Phase 4: Map Loading Fix

- [ ] **Update `assets/js/coordinate.js`**
  - Replace direct map initialization with dependency-checking function
  - Add retry logic for script loading timing issues

**Key Code Pattern:**
```javascript
function initializeMapWhenReady() {
  const mapContainer = document.getElementById('locationMap');
  const dependenciesReady = typeof L !== 'undefined' && 
                            typeof initMap === 'function' && 
                            typeof MIAMI_COORDINATES !== 'undefined';
  
  if (mapContainer && dependenciesReady) {
    try {
      initMap('locationMap', null, null, false, MIAMI_COORDINATES);
    } catch (error) {
      console.error('[COORDINATE] Error initializing map:', error);
      setTimeout(() => {
        try {
          initMap('locationMap', null, null, false, MIAMI_COORDINATES);
        } catch (retryError) {
          console.error('[COORDINATE] Map initialization failed after retry:', retryError);
        }
      }, 500);
    }
  } else if (mapContainer) {
    setTimeout(initializeMapWhenReady, 100);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initializeMapWhenReady();
  // ... rest of initialization
});
```

---

## File Change Summary

### Files to Modify

1. **Database Client** (`lib/databaseClient.js`)
   - Add `app_name` to SELECT fields
   - Add `app_name` to INSERT statement
   - Update `getPublicEvents()` to filter by `app_name`

2. **Event Creation** (`netlify/functions/runs-create.js`, `server.js`)
   - Detect and store `app_name` when creating events

3. **Calendar Endpoint** (`netlify/functions/runs-public-calendar.js`, `server.js`)
   - Detect domain and filter events by `app_name`

4. **Utils** (`netlify/functions/utils.js`)
   - Update `getAppName()` to check specific domains first

5. **Map Utils** (`assets/js/map-utils.js`)
   - Enhance place name extraction from multiple Nominatim fields

6. **Coordinate Page** (`assets/js/coordinate.js`)
   - Fix map initialization with dependency checking

### Files to Create

1. **Migration** (`lib/migration-add-app-name.sql`)
2. **Update SQL** (`lib/update-existing-events-app-name.sql`) - Optional, for reference

---

## Domain-Specific Customization

### For gayrunclub Application

When applying to gayrunclub, you'll need to:

1. **Update domain detection**:
   ```javascript
   if (hostLower.includes('gayrunclub')) {
     return 'gayrunclub';
   }
   ```

2. **Update migration default** (if different):
   ```sql
   ALTER TABLE ep_events 
   ADD COLUMN app_name VARCHAR(50) DEFAULT 'gayrunclub' AFTER is_public;
   ```

3. **Update default in code** (if different):
   ```javascript
   appName: appName || 'gayrunclub', // Instead of 'eplanner'
   ```

4. **Check table name**: Verify the events table is named `ep_events` or adjust accordingly

---

## Common Pitfalls to Avoid

### ❌ Pitfall 1: Domain Detection Order
```javascript
// WRONG - Generic check first
if (hostLower.includes('eplanner')) {
  return 'eplanner';
}
if (hostLower.includes('to-lgbtq')) {
  return 'to-lgbtq'; // Never reached if 'eplanner' matches first
}
```

### ❌ Pitfall 2: Missing Dependency Checks
```javascript
// WRONG - No dependency check
document.addEventListener('DOMContentLoaded', () => {
  initMap('locationMap', null, null, false, MIAMI_COORDINATES);
  // Fails if Leaflet not loaded yet
});
```

### ❌ Pitfall 3: Forgetting to Update Existing Records
```sql
-- WRONG - Only adds column, doesn't update existing records
ALTER TABLE ep_events ADD COLUMN app_name VARCHAR(50) DEFAULT 'eplanner';
-- Existing records will have NULL app_name!
```

### ❌ Pitfall 4: Not Filtering in Calendar Endpoint
```javascript
// WRONG - Doesn't filter by app_name
const events = await runs.getPublicEvents(startDate, endDate);
// Shows all events from all domains
```

---

## Testing Checklist

After implementation, verify:

- [ ] Place names extracted from various Nominatim fields
- [ ] Place names stored in database `place_name` column
- [ ] Place names displayed in calendar view
- [ ] Events created on domain A only show on domain A calendar
- [ ] Events created on domain B only show on domain B calendar
- [ ] Existing events default to correct `app_name`
- [ ] Map loads on coordinate page for all domains
- [ ] API endpoints filter correctly by `app_name`

---

## Quick Reference: Key Patterns

### Domain Detection Pattern
```javascript
// Always check most specific first
if (hostLower.includes('specific-domain')) return 'specific-domain';
if (hostLower.includes('generic-domain')) return 'generic-domain';
return 'default';
```

### Place Name Extraction Pattern
```javascript
// Check fields in priority order
placeName = result.name || 
            addr.amenity || 
            addr.shop || 
            addr.leisure || 
            // ... fallback to display_name parsing
```

### Map Initialization Pattern
```javascript
// Always check dependencies and retry
if (dependenciesReady) {
  initMap(...);
} else {
  setTimeout(retry, 100);
}
```

### Database Filtering Pattern
```javascript
// Add filter conditionally
if (appName) {
  query += ` AND app_name = ?`;
  params.push(appName);
}
```

---

## Estimated Time

- **Experienced developer**: 1-2 hours
- **Following this guide**: 30-45 minutes
- **Without guide**: 3-4 hours (due to iterations and debugging)

---

## Questions to Ask Before Starting

1. What is the domain name for this application? (e.g., `gayrunclub.kervinapps.com`)
2. What should the default `app_name` be? (e.g., `'gayrunclub'`)
3. What is the events table name? (e.g., `ep_events` or `gr_events`)
4. Are there existing events that need to be updated? (Yes - run UPDATE query)

---

## Success Criteria

✅ Place names extracted and displayed correctly  
✅ Events filtered by domain correctly  
✅ Map loads on all domains  
✅ No breaking changes to existing functionality  
✅ Database migration runs successfully  
✅ All tests pass
