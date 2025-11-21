# Debug: Runs Not Loading

## Issue
Runs are being created successfully in Google Sheets, but the admin dashboard shows a 500 error when trying to load them.

## Steps to Debug

### 1. Check Netlify Function Logs
1. Go to your Netlify dashboard
2. Navigate to **Functions** → **runs-get**
3. Check the logs for errors
4. Look for messages starting with `[RUNS GET]` or `[GOOGLE SHEETS READ]`

### 2. Test the Google Apps Script Directly
Test your Apps Script URL directly in a browser:

```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=getRuns
```

Replace `YOUR_SCRIPT_ID` with your actual script ID from the Apps Script URL.

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "uuid": "...",
      "location": "...",
      ...
    }
  ]
}
```

**If you get an error:**
- "Script function not found: doGet" → The `doGet()` function is missing from your Apps Script
- "Runs sheet not found" → The sheet name is incorrect (should be exactly "Runs")
- Any other error → Check the error message

### 3. Verify Apps Script Code
Make sure your Apps Script has:
1. ✅ `doGet(e)` function
2. ✅ `getAllRunsFromSheet(spreadsheet)` function
3. ✅ Sheet named exactly "Runs" (case-sensitive)

### 4. Check Environment Variable
In Netlify:
1. Go to **Site settings** → **Environment variables**
2. Verify `GOOGLE_APPS_SCRIPT_URL` or `GS_DATA_PIPELINE_URL` is set
3. Make sure it matches your Apps Script web app URL exactly

### 5. Test with curl
Test the endpoint directly:
```bash
curl "https://eplanner.kervinapps.com/api/runs"
```

Check the response and status code.

## Common Issues

### Issue: "Script function not found: doGet"
**Solution:** Update your Apps Script with the code from `docs/google-apps-script-code.js`

### Issue: "Runs sheet not found"
**Solution:** 
- Check that your sheet is named exactly "Runs" (case-sensitive)
- Make sure it's in the same spreadsheet as your Apps Script

### Issue: Empty array returned
**Solution:**
- Check that you have data rows (not just headers) in the Runs sheet
- Verify the column order matches what's expected

### Issue: 500 error with no details
**Solution:**
- Check Netlify function logs for the actual error
- Test the Apps Script URL directly in a browser
- Verify the environment variable is set correctly

## Next Steps
If the issue persists after checking all of the above, check the Netlify function logs and share the error message.

