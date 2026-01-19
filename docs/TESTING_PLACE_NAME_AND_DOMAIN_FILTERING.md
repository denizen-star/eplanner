# Testing Guide: Place Name Extraction and Domain Filtering

## Prerequisites
- Database migration `migration-add-app-name.sql` has been run in PlanetScale
- Code has been deployed to production (Netlify)
- Access to both domains:
  - `eplanner.kervinapps.com`
  - `to-lgbtq.kervinapps.com`

---

## Test 1: Place Name Extraction

### Objective
Verify that venue/bar/restaurant names are extracted from Nominatim geocoding and stored/displayed correctly.

### Test Steps

1. **Navigate to Coordinate Page**
   - Go to `eplanner.kervinapps.com/coordinate` (or `to-lgbtq.kervinapps.com/coordinate`)

2. **Test with a Known Venue**
   - Enter a location that has a business name, for example:
     - "Gaythering, Miami Beach" (bar/venue)
     - "Lincoln Road, Miami Beach" (street - may not have place name)
     - "Starbucks, 1409 Lincoln Road, Miami Beach" (chain business)
     - "Basement Miami, Miami Beach" (nightclub)

3. **Verify Place Name Extraction**
   - After entering the location, check the browser console (F12 → Console tab)
   - Look for geocoding results
   - The map should display with a popup showing the place name if extracted
   - Check the location validation display below the map - it should show the place name if found

4. **Create Event and Verify Storage**
   - Fill out the event form completely
   - Submit the event
   - After successful creation, check the database:
     ```sql
     SELECT id, place_name, location FROM ep_events ORDER BY created_at DESC LIMIT 1;
     ```
   - Verify `place_name` column contains the venue name (not just the address)

5. **Verify Display in Calendar**
   - Navigate to the calendar page: `eplanner.kervinapps.com/calendar`
   - Find the event you just created
   - Verify the location display shows: `"Place Name: Address"` format
   - If no place name was found, it should just show the address

### Expected Results
- Place names should be extracted from Nominatim fields: `name`, `amenity`, `shop`, `leisure`, `tourism`, `building`, or parsed from `display_name`
- Place name should be stored in the `place_name` column in the database
- Calendar should display location as `"Place Name: Address"` when place name exists

### Test Cases

| Location Input | Expected Place Name Source | Expected Result |
|---------------|---------------------------|------------------|
| "Gaythering, Miami Beach" | `result.name` | "Gaythering" |
| "Starbucks, 1409 Lincoln Road" | `result.name` or `result.address.shop` | "Starbucks" |
| "1409 Lincoln Road, Miami Beach" | `result.display_name` (parsed) | First part of display_name if not a street address |
| Generic address without venue | None | No place name, just address |

---

## Test 2: Domain Filtering

### Objective
Verify that events created on one domain only appear on that domain's calendar, not on the other domain.

### Test Steps

#### Part A: Create Events on Each Domain

1. **Create Event on eplanner Domain**
   - Navigate to `eplanner.kervinapps.com/coordinate`
   - Create a test event with:
     - Title: "Eplanner Test Event"
     - Date: Any future date
     - Make it a **Public Event**
   - Note the event ID from the confirmation page

2. **Create Event on to-lgbtq Domain**
   - Navigate to `to-lgbtq.kervinapps.com/coordinate`
   - Create a test event with:
     - Title: "To-LGBTQ Test Event"
     - Date: Any future date (can be same week as eplanner event)
     - Make it a **Public Event**
   - Note the event ID from the confirmation page

#### Part B: Verify Database Storage

3. **Check Database Records**
   ```sql
   SELECT id, title, app_name, is_public FROM ep_events 
   WHERE title LIKE '%Test Event%' 
   ORDER BY created_at DESC;
   ```
   - Verify:
     - Eplanner event has `app_name = 'eplanner'`
     - To-LGBTQ event has `app_name = 'to-lgbtq'`

#### Part C: Verify Calendar Filtering

4. **Check eplanner Calendar**
   - Navigate to `eplanner.kervinapps.com/calendar`
   - Navigate to the week containing your test events
   - **Expected:** Should see "Eplanner Test Event"
   - **Expected:** Should NOT see "To-LGBTQ Test Event"

5. **Check to-lgbtq Calendar**
   - Navigate to `to-lgbtq.kervinapps.com/calendar`
   - Navigate to the same week
   - **Expected:** Should see "To-LGBTQ Test Event"
   - **Expected:** Should NOT see "Eplanner Test Event"

#### Part D: Verify API Endpoints

6. **Test API Directly (Optional)**
   - Open browser console on `eplanner.kervinapps.com/calendar`
   - Check Network tab for `/api/runs/public-calendar` request
   - Verify response only contains events with `appName: 'eplanner'`
   
   - Open browser console on `to-lgbtq.kervinapps.com/calendar`
   - Check Network tab for `/api/runs/public-calendar` request
   - Verify response only contains events with `appName: 'to-lgbtq'`

### Expected Results

| Domain | Events Created On | Should Appear On Calendar |
|--------|------------------|---------------------------|
| eplanner.kervinapps.com | eplanner | ✅ Yes |
| eplanner.kervinapps.com | to-lgbtq | ❌ No |
| to-lgbtq.kervinapps.com | eplanner | ❌ No |
| to-lgbtq.kervinapps.com | to-lgbtq | ✅ Yes |

---

## Test 3: Backward Compatibility

### Objective
Verify that existing events (created before migration) still work correctly.

### Test Steps

1. **Check Existing Events**
   ```sql
   SELECT id, title, app_name FROM ep_events 
   WHERE app_name IS NULL OR app_name = 'eplanner'
   LIMIT 10;
   ```
   - All existing events should have `app_name = 'eplanner'` (from migration)

2. **Verify Calendar Display**
   - Navigate to `eplanner.kervinapps.com/calendar`
   - Existing events should still appear (they default to 'eplanner')
   - Navigate to `to-lgbtq.kervinapps.com/calendar`
   - Existing events should NOT appear (they're filtered out)

---

## Troubleshooting

### Place Name Not Extracted

**Symptoms:** Place name is null in database even when location has a venue name.

**Debug Steps:**
1. Open browser console on coordinate page
2. Enter a location with a known venue
3. Check the geocoding response in console
4. Verify which Nominatim fields contain the place name
5. Check if the extraction logic in `map-utils.js` is checking the right fields

**Common Issues:**
- Nominatim may not return `name` field for some locations
- Try different location formats (e.g., "Venue Name, Address" vs "Address")

### Domain Filtering Not Working

**Symptoms:** Events from one domain appear on the other domain's calendar.

**Debug Steps:**
1. Check database: `SELECT id, title, app_name FROM ep_events WHERE title LIKE '%Test%';`
2. Verify `app_name` is set correctly for new events
3. Check browser console on calendar page for API response
4. Verify `getAppName()` function is detecting domain correctly
5. Check Netlify Function logs for `[RUNS PUBLIC CALENDAR] Detected app name:` messages

**Common Issues:**
- Domain detection may fail if host header is different than expected
- Check `netlify/functions/utils.js` `getAppName()` function logic
- Verify migration was run successfully

### Events Not Showing on Calendar

**Symptoms:** Events exist in database but don't appear on calendar.

**Debug Steps:**
1. Verify event has `is_public = TRUE`
2. Verify event `status != 'deleted'`
3. Verify event `date_time` is within the calendar week range
4. Verify `app_name` matches the current domain
5. Check browser console for API errors
6. Check Netlify Function logs for errors

---

## SQL Queries for Verification

### Check Place Names
```sql
SELECT id, title, place_name, location 
FROM ep_events 
WHERE place_name IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check App Names
```sql
SELECT app_name, COUNT(*) as count 
FROM ep_events 
GROUP BY app_name;
```

### Check Events by Domain
```sql
SELECT id, title, app_name, is_public, date_time 
FROM ep_events 
WHERE is_public = TRUE 
  AND status != 'deleted'
  AND date_time >= CURDATE()
ORDER BY date_time ASC;
```

---

## Success Criteria

✅ **Place Name Extraction:**
- Venue names are extracted from Nominatim geocoding
- Place names are stored in `place_name` column
- Calendar displays location as "Place Name: Address" when available

✅ **Domain Filtering:**
- Events created on eplanner domain only appear on eplanner calendar
- Events created on to-lgbtq domain only appear on to-lgbtq calendar
- Existing events default to 'eplanner' and only show on eplanner domain
- API endpoints filter events by `app_name` correctly
