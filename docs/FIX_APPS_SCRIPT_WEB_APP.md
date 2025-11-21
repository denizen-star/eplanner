# Fix: Apps Script Returning HTML Error Page

## Problem
Your Apps Script `doGet()` works when tested in the editor, but returns an HTML error page when called from Netlify. This is a common issue with Google Apps Script web app deployments.

## Solution: Redeploy the Web App

### Step 1: Open Apps Script Deployment

1. In your Apps Script editor, click **Deploy** → **Manage deployments**
2. You should see your existing web app deployment
3. Click the **pencil icon** (✏️) to edit it, OR click **New deployment**

### Step 2: Configure the Deployment

1. Click the **gear icon** (⚙️) next to "Select type"
2. Choose **Web app**
3. Set the following:
   - **Description:** (optional, e.g., "Gay Run Club Data Pipeline")
   - **Execute as:** **Me** (your email)
   - **Who has access:** **Anyone** (important!)
4. Click **Deploy**

### Step 3: Copy the New URL

1. After deploying, you'll see a new Web app URL
2. **Copy this URL** - it might be different from the old one
3. Update the environment variable in Netlify:
   - Go to Netlify → Site settings → Environment variables
   - Update `GS_DATA_PIPELINE_URL` with the new URL
   - Make sure there's no trailing slash

### Step 4: Test Again

1. Wait a few seconds for the deployment to propagate
2. Test the endpoint: `https://eplanner.kervinapps.com/api/test-sheets-read?action=getRuns`
3. It should now return JSON instead of HTML

## Why This Happens

Google Apps Script web apps sometimes need to be redeployed when:
- Code changes are made
- Permissions change
- The web app URL becomes stale

When the web app isn't properly deployed, it returns an HTML error page instead of executing your `doGet()` function.

## Alternative: Check Execution Logs

If redeploying doesn't work:

1. In Apps Script editor, go to **Executions** (left sidebar)
2. Look for recent executions when you call the web app URL
3. Check for any error messages
4. The error will tell you what's wrong

## Quick Checklist

- [ ] Web app is deployed (not just saved)
- [ ] "Execute as" is set to "Me"
- [ ] "Who has access" is set to "Anyone"
- [ ] Environment variable in Netlify matches the web app URL exactly
- [ ] No trailing slash in the URL
- [ ] Tested the web app URL directly in browser first

## Test the Web App URL Directly

Before updating Netlify, test the web app URL directly in your browser:

```
https://script.google.com/macros/s/YOUR_NEW_SCRIPT_ID/exec?action=getRuns
```

You should see JSON, not HTML. If you see HTML, the deployment isn't working correctly.

