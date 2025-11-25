# Instructions: Reproduce Confirmation Page and Address Information

This document provides step-by-step instructions for implementing the confirmation page (manage.html) enhancements and address component fields feature in the EventPlan application.

## Overview

This implementation adds:
1. **Address Component Fields** - Store 15 detailed address fields from geocoding API
2. **Enhanced Confirmation Page** - Display address information on the manage/confirmation page
3. **Address Validation** - Require successful geocoding before event creation
4. **City/Zip Display** - Show city and zip code on sign-up pages
5. **Console Logging** - Debug tools for address component capture

## Step 1: Database Schema Updates

### 1.1 Update Schema File

File: `lib/schema.sql`

Add these address component fields to the `runs` (or your events table) CREATE TABLE statement:

```sql
-- Address component fields from Nominatim geocoding
house_number VARCHAR(50),
road VARCHAR(255),
suburb VARCHAR(255),
city VARCHAR(255),
county VARCHAR(255),
state VARCHAR(255),
postcode VARCHAR(20),
country VARCHAR(255),
country_code VARCHAR(5),
neighbourhood VARCHAR(255),
city_district VARCHAR(255),
village VARCHAR(255),
town VARCHAR(255),
municipality VARCHAR(255),
```

Also add indexes for commonly queried fields:

```sql
INDEX idx_city (city),
INDEX idx_state (state),
INDEX idx_postcode (postcode)
```

### 1.2 Create Migration File

Create: `lib/schema-add-address-fields.sql`

```sql
-- Migration: Add address component fields to runs table
-- Run this in PlanetScale development branch first, then promote to main
-- For existing databases

ALTER TABLE runs
ADD COLUMN house_number VARCHAR(50) AFTER status,
ADD COLUMN road VARCHAR(255) AFTER house_number,
ADD COLUMN suburb VARCHAR(255) AFTER road,
ADD COLUMN city VARCHAR(255) AFTER suburb,
ADD COLUMN county VARCHAR(255) AFTER city,
ADD COLUMN state VARCHAR(255) AFTER county,
ADD COLUMN postcode VARCHAR(20) AFTER state,
ADD COLUMN country VARCHAR(255) AFTER postcode,
ADD COLUMN country_code VARCHAR(5) AFTER country,
ADD COLUMN neighbourhood VARCHAR(255) AFTER country_code,
ADD COLUMN city_district VARCHAR(255) AFTER neighbourhood,
ADD COLUMN village VARCHAR(255) AFTER city_district,
ADD COLUMN town VARCHAR(255) AFTER village,
ADD COLUMN municipality VARCHAR(255) AFTER town,
ADD INDEX idx_city (city),
ADD INDEX idx_state (state),
ADD INDEX idx_postcode (postcode);
```

### 1.3 Run Migration

1. Connect to your PlanetScale database
2. Switch to development branch
3. Run the migration SQL
4. Test in development
5. Promote to main branch

## Step 2: Update Database Client

File: `lib/databaseClient.js`

### 2.1 Update `create()` Method

In the `runs.create()` method (or your events create method), update the INSERT statement:

**Before:**
```javascript
INSERT INTO runs (id, uuid, location, coordinates, pacer_name, title, date_time, max_participants, status, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

**After:**
```javascript
INSERT INTO runs (
  id, uuid, location, coordinates, pacer_name, title, date_time, max_participants, status, created_at,
  house_number, road, suburb, city, county, state, postcode, country, country_code,
  neighbourhood, city_district, village, town, municipality
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

Update the parameters array to include all address fields (set to `null` if not provided).

### 2.2 Update `getById()` Method

In the SELECT statement, add all address component fields:

```sql
SELECT 
  id,
  uuid,
  location,
  coordinates,
  pacer_name as pacerName,
  title,
  date_time as dateTime,
  max_participants as maxParticipants,
  status,
  created_at as createdAt,
  updated_at as updatedAt,
  house_number as houseNumber,
  road,
  suburb,
  city,
  county,
  state,
  postcode,
  country,
  country_code as countryCode,
  neighbourhood,
  city_district as cityDistrict,
  village,
  town,
  municipality
FROM runs
WHERE id = ? OR uuid = ?
LIMIT 1
```

### 2.3 Update `getAll()` Method

Add the same address fields to the SELECT statement in `getAll()` method.

## Step 3: Update Geocoding Function

File: `assets/js/map-utils.js`

### 3.1 Add `addressdetails=1` Parameter

**Critical:** Add `addressdetails=1` to the Nominatim API call to get address components:

```javascript
const response = await fetch(
  `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationText)}&limit=1&addressdetails=1`,
  {
    headers: {
      'User-Agent': 'YourAppName/1.0'
    }
  }
);
```

### 3.2 Return Address Components

Ensure the `geocodeLocation()` function returns address components:

```javascript
return {
  coordinates: [lat, lon],
  address: fullAddress,
  addressComponents: result.address || {},  // This contains all address fields
  rawResult: result
};
```

## Step 4: Update Coordinate/Create Page

File: `assets/js/coordinate.js` (or your event creation page)

### 4.1 Store Address Components

When address is validated, store the address components:

```javascript
let validatedAddressComponents = null;  // Add this global variable

// In the validation function:
const geocodeResult = await geocodeLocation(locationText);
validatedAddress = geocodeResult.address;
validatedCoordinates = geocodeResult.coordinates;
validatedAddressComponents = geocodeResult.addressComponents;  // Store this
```

### 4.2 Send Address Components on Submit

In the form submit handler, extract and send address components:

```javascript
// Extract address components from validated address
const addr = validatedAddressComponents || {};

const formData = {
  location: locationToSave,
  coordinates: validatedCoordinates,
  // ... other fields ...
  
  // Address component fields
  house_number: addr.house_number || null,
  road: addr.road || addr.street || addr.pedestrian || null,
  suburb: addr.suburb || null,
  city: addr.city || addr.town || addr.village || addr.municipality || null,
  county: addr.county || null,
  state: addr.state || null,
  postcode: addr.postcode || null,
  country: addr.country || null,
  country_code: addr.country_code || null,
  neighbourhood: addr.neighbourhood || null,
  city_district: addr.city_district || null,
  village: addr.village || null,
  town: addr.town || null,
  municipality: addr.municipality || null
};
```

### 4.3 Add Console Logging for Debugging

```javascript
console.log('=== SENDING ADDRESS COMPONENTS TO SERVER ===');
console.log('Validated Address Components Object:', addr);
console.log('Extracted fields:');
console.log('  house_number:', addr.house_number || '(not in addressComponents)');
console.log('  road:', addr.road || addr.street || addr.pedestrian || '(not in addressComponents)');
console.log('  city:', addr.city || addr.town || addr.village || addr.municipality || '(not in addressComponents)');
console.log('  state:', addr.state || '(not in addressComponents)');
console.log('  postcode:', addr.postcode || '(not in addressComponents)');
// ... log other fields
console.log('Form Data being sent (with address fields):', formData);
```

## Step 5: Update Server/API Endpoints

File: `server.js` and/or `netlify/functions/runs-create.js`

### 5.1 Extract Address Components from Request

In the create endpoint, extract address components:

```javascript
const { 
  location, coordinates, pacerName, title, dateTime, maxParticipants, 
  house_number, road, suburb, city, county, state, postcode, country, country_code,
  neighbourhood, city_district, village, town, municipality
} = req.body;
```

### 5.2 Pass to Database Create

When calling `runs.create()`, include all address fields:

```javascript
await runs.create({
  id: shortId,
  uuid: uuid,
  location: trimmedLocation,
  coordinates: coordinates || null,
  pacerName: trimmedPacerName,
  // ... other fields ...
  
  // Address component fields
  house_number: house_number || null,
  road: road || null,
  suburb: suburb || null,
  city: city || null,
  county: county || null,
  state: state || null,
  postcode: postcode || null,
  country: country || null,
  country_code: country_code || null,
  neighbourhood: neighbourhood || null,
  city_district: city_district || null,
  village: village || null,
  town: town || null,
  municipality: municipality || null
});
```

## Step 6: Update Confirmation/Manage Page

File: `assets/js/manage.js`

### 6.1 Add Console Logging for Address Fields

In the `loadRun()` function, add logging to see what address fields are available:

```javascript
async function loadRun() {
  try {
    const response = await fetch(`/api/runs/${runId}`);
    if (!response.ok) {
      throw new Error('Run not found');
    }
    const run = await response.json();
    
    // Log all address component fields for debugging
    console.log('=== RUN ADDRESS COMPONENT FIELDS ===');
    console.log('Run ID:', run.id);
    console.log('Full Location:', run.location);
    console.log('');
    console.log('Address Component Fields:');
    console.log('  house_number:', run.houseNumber || run.house_number || '(not set)');
    console.log('  road:', run.road || '(not set)');
    console.log('  suburb:', run.suburb || '(not set)');
    console.log('  city:', run.city || '(not set)');
    console.log('  county:', run.county || '(not set)');
    console.log('  state:', run.state || '(not set)');
    console.log('  postcode:', run.postcode || '(not set)');
    console.log('  country:', run.country || '(not set)');
    console.log('  country_code:', run.countryCode || run.country_code || '(not set)');
    console.log('  neighbourhood:', run.neighbourhood || '(not set)');
    console.log('  city_district:', run.cityDistrict || run.city_district || '(not set)');
    console.log('  village:', run.village || '(not set)');
    console.log('  town:', run.town || '(not set)');
    console.log('  municipality:', run.municipality || '(not set)');
    console.log('');
    console.log('Full Run Object:', run);
    console.log('====================================');
    
    // ... rest of the function
  }
}
```

### 6.2 Display Address Information on Page

You can add address information display in the manage.html page:

```html
<!-- Add this in manage.html where you want to show address details -->
<div id="addressDetails" style="margin-bottom: 24px;">
  <h3>Address Details</h3>
  <p><strong>Street:</strong> <span id="displayStreet">-</span></p>
  <p><strong>City:</strong> <span id="displayCity">-</span></p>
  <p><strong>State:</strong> <span id="displayState">-</span></p>
  <p><strong>Zip Code:</strong> <span id="displayPostcode">-</span></p>
  <p><strong>Country:</strong> <span id="displayCountry">-</span></p>
</div>
```

Update the JavaScript to populate these fields:

```javascript
// In loadRun() function, after fetching run data:
function displayAddressDetails(run) {
  // Build street address
  const streetParts = [];
  if (run.houseNumber || run.house_number) {
    streetParts.push(run.houseNumber || run.house_number);
  }
  if (run.road) {
    streetParts.push(run.road);
  }
  document.getElementById('displayStreet').textContent = streetParts.join(' ') || run.location || '-';
  
  // Display other address fields
  document.getElementById('displayCity').textContent = 
    run.city || run.town || run.village || run.municipality || '-';
  document.getElementById('displayState').textContent = run.state || '-';
  document.getElementById('displayPostcode').textContent = run.postcode || '-';
  document.getElementById('displayCountry').textContent = run.country || '-';
}

// Call it in loadRun():
displayAddressDetails(run);
```

## Step 7: Update Sign-Up Page (Optional)

File: `assets/js/signup.js`

If you want to display city and zip code on the sign-up page:

```javascript
// In loadRun() function, after fetching run data:
// Use address component fields instead of parsing location string
const city = run.city || run.town || run.village || run.municipality || extractCity(run.location || '');
const zipCode = run.postcode || extractZipCode(run.location || '');

document.getElementById('runCity').textContent = city || '-';
document.getElementById('runZipCode').textContent = zipCode || '-';
```

## Step 8: Add Address Validation

File: `assets/js/coordinate.js`

Ensure address validation is required before submission:

```javascript
// In form submit handler, before submitting:
if (!validatedAddress) {
  throw new Error('Address not valid');
}
```

This prevents submission if the address hasn't been successfully geocoded.

## Step 9: Testing Checklist

1. ✅ Run database migration to add address fields
2. ✅ Create a new event and verify address components are captured in console
3. ✅ Verify address components are stored in database
4. ✅ View confirmation/manage page and verify address fields are displayed
5. ✅ Check console logs on manage page to see all address fields
6. ✅ Verify city and zip code display correctly on sign-up page
7. ✅ Test with various address formats (street addresses, city names, landmarks)
8. ✅ Verify address validation prevents submission without valid address

## Step 10: Common Issues and Solutions

### Issue: Address components are empty/null

**Solution:** Ensure `addressdetails=1` is in the Nominatim API URL. Without this parameter, Nominatim won't return address components.

### Issue: Address fields not stored in database

**Solution:** 
1. Check that migration was run successfully
2. Verify database client is passing all address fields
3. Check server logs to see if fields are being received

### Issue: Address fields showing as "(not set)" on manage page

**Solution:**
1. Check that the event was created AFTER the address component feature was implemented
2. Old events won't have address components
3. Create a new event to test

## Key Files Summary

- `lib/schema.sql` - Database schema with address fields
- `lib/schema-add-address-fields.sql` - Migration script
- `lib/databaseClient.js` - Database operations with address fields
- `assets/js/map-utils.js` - Geocoding with addressdetails=1 parameter
- `assets/js/coordinate.js` - Event creation with address component extraction
- `server.js` / `netlify/functions/runs-create.js` - API endpoints accepting address fields
- `assets/js/manage.js` - Confirmation page displaying address information
- `assets/js/signup.js` - Sign-up page using address fields (optional)

## Reference Implementation

Reference implementation can be found in:
- Repository: `denizen-star/gayrunclub`
- Tag: `v2.0.0`
- Key commit: `9bf96ab` - "Add address component fields to runs table and update all pages to use them"



