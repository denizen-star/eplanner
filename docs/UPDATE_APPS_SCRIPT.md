# Update Google Apps Script - Quick Guide

## Problem
Runs are being created successfully in Google Sheets, but they're not loading in the admin dashboard. This is because the Google Apps Script needs to be updated with the `doGet()` function to handle read requests.

## Solution
Update your Google Apps Script with the new code that includes read functionality.

## Steps

### 1. Open Your Google Sheet
- Go to your Google Sheet (the one with the "Runs", "Signups", and "Waivers" sheets)

### 2. Open Apps Script Editor
- Click **Extensions** → **Apps Script**
- This opens the Apps Script editor in a new tab

### 3. Replace the Code
- **Select all** the existing code in the editor (Cmd+A or Ctrl+A)
- **Delete** it
- **Copy** the entire contents of `docs/google-apps-script-code.js` from this repository
- **Paste** it into the Apps Script editor

### 4. Save the Project
- Click the **Save** icon (💾) or press Cmd+S / Ctrl+S
- Give it a name if prompted (e.g., "Gay Run Club Data Pipeline")

### 5. Deploy as Web App (if needed)
- If you haven't already deployed it, or if you want to update the deployment:
  - Click **Deploy** → **New deployment**
  - Click the gear icon ⚙️ next to "Select type"
  - Choose **Web app**
  - Set:
    - **Execute as**: Me
    - **Who has access**: Anyone
  - Click **Deploy**
  - **Copy the Web app URL** (you'll need this for the environment variable)

### 6. Test It
- Go back to your admin dashboard: `https://eplanner.kervinapps.com/admin.html`
- Click **Refresh**
- The runs should now load!

## What Changed?
The updated Apps Script now includes:
- `doGet()` function - Handles GET requests for reading data
- `getRunFromSheet()` - Gets a single run by ID
- `getAllRunsFromSheet()` - Gets all runs
- `getSignupsFromSheet()` - Gets signups for a run

## Troubleshooting

### Still getting 500 errors?
1. Check the Netlify function logs to see the exact error
2. Make sure the Apps Script is saved and deployed
3. Verify the `GOOGLE_APPS_SCRIPT_URL` environment variable in Netlify matches your Apps Script URL

### "Script function not found: doGet" error?
- This means the `doGet()` function wasn't added correctly
- Make sure you copied the entire code from `docs/google-apps-script-code.js`
- Check that the `doGet()` function is present in your Apps Script

### Runs still not showing?
- Check the browser console for errors
- Check Netlify function logs
- Verify the sheet name is exactly "Runs" (case-sensitive)
- Make sure there's at least one row of data (not just headers)

