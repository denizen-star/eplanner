# How to Find Netlify Function Logs

## Method 1: Netlify Dashboard (Recommended)

1. **Go to your Netlify Dashboard**
   - Visit https://app.netlify.com
   - Sign in if needed

2. **Select Your Site**
   - Click on "gayrunclub" (or your site name)

3. **Navigate to Functions**
   - In the left sidebar, click **"Functions"**
   - OR look for a tab/menu item called **"Functions"** at the top

4. **View Function Logs**
   - You should see a list of functions: `runs-create`, `runs-get`, `run-get`, etc.
   - Click on **`runs-get`** to see its logs
   - OR click on **"Logs"** or **"View logs"** button

5. **Alternative: Real-time Logs**
   - Look for a **"Real-time logs"** or **"Live logs"** option
   - This shows logs as they happen

## Method 2: Site Deploys

1. Go to your site in Netlify
2. Click **"Deploys"** in the left sidebar
3. Click on the most recent deploy
4. Scroll down to see **"Function logs"** section
5. Click on **`runs-get`** to see its logs

## Method 3: Using the Test Endpoint

I've created a test endpoint to help debug. After deploying, visit:

```
https://eplanner.kervinapps.com/api/test-sheets-read?action=getRuns
```

This will show you:
- What parameters are being sent
- What response is received from Google Sheets
- Any errors that occur
- The endpoint URL being used

## Method 4: Browser Network Tab

1. Open your admin dashboard
2. Open Developer Tools (F12)
3. Go to **Network** tab
4. Click **Refresh** on the admin page
5. Click on the `/api/runs` request
6. Check the **Response** tab to see the error message

## What to Look For

In the logs, look for:
- `[RUNS GET]` - Messages from the runs-get function
- `[GOOGLE SHEETS READ]` - Messages from the Google Sheets client
- Error messages or stack traces
- The actual response from Google Apps Script

## Quick Test

Test your Apps Script directly in a browser:

```
https://script.google.com/macros/s/AKfycbxbam43rprSCE5oEgYXKV-YvaqWG_saWkWopaC-1-hQ3nociWVvsuhCbdeq1v6EWsqLkw/exec?action=getRuns
```

Replace with your actual Apps Script URL if different.

**Expected:** JSON response with `{"success": true, "data": [...]}`
**If error:** You'll see the exact error message

