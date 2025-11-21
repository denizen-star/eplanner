# Test the Netlify Endpoint Directly

Since your Apps Script `doGet()` is working perfectly, the issue is likely in how Netlify calls it. Let's test the actual endpoint.

## Step 1: Test the Test Endpoint

After Netlify redeploys, visit this URL in your browser:

```
https://eplanner.kervinapps.com/api/test-sheets-read?action=getRuns
```

This will show you:
- What URL is being called
- What response is received
- Any errors that occur

## Step 2: Test the Actual Runs Endpoint

Visit this URL:

```
https://eplanner.kervinapps.com/api/runs
```

**Expected:** JSON with `{"runs": [...]}`

**If you get an error:** Check the response body for the error message.

## Step 3: Test Apps Script URL Directly

Test your Apps Script URL directly in a browser (not through Netlify):

```
https://script.google.com/macros/s/AKfycbxbam43rprSCE5oEgYXKV-YvaqWG_saWkWopaC-1-hQ3nociWVvsuhCbdeq1v6EWsqLkw/exec?action=getRuns
```

**Expected:** JSON with `{"success": true, "data": [...]}`

## Common Issues

### Issue: Apps Script returns HTML redirect page
**Cause:** Google Apps Script web apps sometimes return an HTML redirect page on first access
**Solution:** This is normal - the redirect should happen automatically. If it persists, check the web app deployment settings.

### Issue: CORS error
**Cause:** Apps Script web app might not allow cross-origin requests
**Solution:** Make sure the web app is deployed with "Execute as: Me" and "Who has access: Anyone"

### Issue: Different response format
**Cause:** The response might be wrapped differently when called from external sources
**Solution:** Check the actual response in the test endpoint

## Next Steps

1. Test the `/api/test-sheets-read` endpoint
2. Share what you see in the response
3. We'll fix any issues based on the actual response

