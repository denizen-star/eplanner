# How to Test doGet() Function in Google Apps Script

## Step 1: Verify doGet() Exists

1. In your Apps Script editor, scroll up in `Code.gs`
2. Look for the `doGet(e)` function (should be around line 184)
3. Make sure it looks like this:

```javascript
function doGet(e) {
  try {
    const action = e.parameter.action || '';
    
    console.log('[DO GET] Action:', action, 'Parameters:', e.parameter);
    
    // Get the active spreadsheet
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    let result;
    switch (action) {
      case 'getRun':
        result = getRunFromSheet(spreadsheet, e.parameter.runId);
        break;
      case 'getRuns':
        result = getAllRunsFromSheet(spreadsheet);
        break;
      case 'getSignups':
        result = getSignupsFromSheet(spreadsheet, e.parameter.runId);
        break;
      default:
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Invalid action. Must be "getRun", "getRuns", or "getSignups"'
          }))
          .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: result
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        message: 'Failed to process GET request'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Step 2: Test doGet() Manually

### Option A: Test in Browser

1. Get your Apps Script Web App URL (from Deploy → Manage deployments)
2. Open it in a browser with query parameters:
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=getRuns
   ```
3. You should see JSON response like:
   ```json
   {"success": true, "data": [...]}
   ```

### Option B: Test in Apps Script Editor

1. In Apps Script editor, create a test function:

```javascript
function testDoGet() {
  // Simulate a GET request with action=getRuns
  const mockEvent = {
    parameter: {
      action: 'getRuns'
    }
  };
  
  const result = doGet(mockEvent);
  Logger.log('Result: ' + result.getContent());
}
```

2. Select `testDoGet` from the function dropdown
3. Click "Run"
4. Check the Execution log for the output

## Step 3: Verify Helper Functions Exist

Make sure these functions are also in your script:
- `getRunFromSheet(spreadsheet, runId)` - around line 236
- `getAllRunsFromSheet(spreadsheet)` - around line 274
- `getSignupsFromSheet(spreadsheet, runId)` - around line 308

## Step 4: Check for Common Issues

### Issue: "Script function not found: doGet"
- **Solution**: Make sure `doGet` is spelled exactly as shown (case-sensitive)
- Make sure there are no syntax errors before the function

### Issue: "Runs sheet not found"
- **Solution**: Check that your sheet is named exactly "Runs" (case-sensitive)
- Make sure it's in the same spreadsheet where the Apps Script is attached

### Issue: Empty data array
- **Solution**: Make sure you have data rows (not just headers) in the Runs sheet
- Check that the column order matches what's expected

### Issue: Invalid action error
- **Solution**: Make sure you're passing `?action=getRuns` in the URL
- Check that the action parameter is being read correctly

## Step 5: Test with Real Data

1. Make sure you have at least one run in your Runs sheet
2. Test the URL:
   ```
   https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?action=getRuns
   ```
3. You should see your run data in the response

## Quick Debug Checklist

- [ ] `doGet(e)` function exists in Code.gs
- [ ] Helper functions (`getAllRunsFromSheet`, etc.) exist
- [ ] Sheet named "Runs" exists (case-sensitive)
- [ ] At least one data row exists in Runs sheet
- [ ] Apps Script is deployed as Web App
- [ ] Web App has "Anyone" access
- [ ] Test URL works in browser

