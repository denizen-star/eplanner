# Google Sheets Read Functionality - Implementation Summary

## Overview
Implemented Google Sheets read functionality using GET requests to the Google Apps Script web app (Option B).

## Changes Made

### 1. Google Sheets Client (`lib/googleSheetsClient.js`)
- Added `readFromGoogleSheets()` function to read data via GET requests
- Supports three actions: `getRun`, `getRuns`, `getSignups`
- Includes comprehensive logging and error handling

### 2. Google Apps Script (`docs/google-apps-script-code.js`)
- Added `doGet()` function to handle GET requests
- Added `getRunFromSheet()` - Get a single run by ID or UUID
- Added `getAllRunsFromSheet()` - Get all runs from the sheet
- Added `getSignupsFromSheet()` - Get all signups for a specific run

### 3. Netlify Functions
- **`netlify/functions/run-get.js`**: Now reads from Google Sheets and includes signups
- **`netlify/functions/runs-get.js`**: Now reads all runs from Google Sheets
- **`netlify/functions/runs-signups.js`**: Now reads signups for a specific run from Google Sheets

### 4. Frontend Fixes
- **`assets/js/coordinate.js`**: 
  - Fixed `copyToClipboard()` to use `.value` instead of `.textContent`
  - Added debug logging to track API responses
  - Improved error handling

## Next Steps for User

### 1. Update Google Apps Script
You need to update your Google Apps Script with the new `doGet()` function and helper functions. The updated code is in:
- `docs/google-apps-script-code.js`

**Instructions:**
1. Open your Google Sheet
2. Go to Extensions → Apps Script
3. Replace the entire script with the updated code from `docs/google-apps-script-code.js`
4. Save the project
5. The web app should automatically handle both POST (write) and GET (read) requests

### 2. Test the Flow
1. Create a run → Verify it appears in Google Sheets
2. Use the signup link → Verify signup appears in Google Sheets
3. Use the manage link → Verify signups are displayed correctly
4. Check device information → Verify it's collected in production

## API Endpoints

### GET `/api/runs`
Returns all runs from Google Sheets.

### GET `/api/runs/:runId`
Returns a single run with its signups from Google Sheets.

### GET `/api/runs/:runId/signups`
Returns all signups for a specific run from Google Sheets.

## Google Apps Script GET Request Format

The Apps Script expects GET requests with query parameters:
- `action`: One of `getRun`, `getRuns`, or `getSignups`
- `runId`: Required for `getRun` and `getSignups`

Example:
```
GET https://script.google.com/.../exec?action=getRun&runId=abc123
```

## Response Format

All GET requests return:
```json
{
  "success": true,
  "data": { ... } // or [] for arrays
}
```

Or on error:
```json
{
  "success": false,
  "error": "Error message",
  "message": "Failed to process GET request"
}
```

