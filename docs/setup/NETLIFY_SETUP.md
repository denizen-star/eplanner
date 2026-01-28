# Netlify Setup Guide

This guide provides detailed steps to configure your Netlify deployment with PlanetScale database credentials.

## Prerequisites

- Netlify account and site created
- PlanetScale database created and schema deployed
- Database connection string ready (from [Database Credentials](DATABASE_CREDENTIALS.md))

## Step 1: Access Netlify Dashboard

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Sign in to your account
3. Select your site (or create a new site if needed)

## Step 2: Navigate to Environment Variables

1. In your site dashboard, click on **"Site settings"** in the top navigation
2. In the left sidebar, scroll down to **"Build & deploy"** section
3. Click on **"Environment variables"**

## Step 3: Add Database Connection String

### Option A: Using DATABASE_URL (Recommended)

1. Click the **"Add a variable"** button
2. Fill in the form:
   - **Key:** `DATABASE_URL`
   - **Value:** Your complete connection string:
     ```
     mysql://[USERNAME]:[PASSWORD]@us-east.connect.psdb.cloud/[DATABASE]?ssl={"rejectUnauthorized":true}
     ```
     (Get actual values from PlanetScale Dashboard)
   - **Scopes:** Select all scopes you need:
     - ✅ **Production** (required for live site)
     - ✅ **Deploy previews** (optional, for PR previews)
     - ✅ **Branch deploys** (optional, for branch deployments)
3. Click **"Add variable"**

### Option B: Using Individual Components (Alternative)

If you prefer to use individual environment variables:

1. Add `PLANETSCALE_HOST`:
   - **Key:** `PLANETSCALE_HOST`
   - **Value:** `us-east.connect.psdb.cloud`
   - **Scopes:** All scopes

2. Add `PLANETSCALE_USERNAME`:
   - **Key:** `PLANETSCALE_USERNAME`
   - **Value:** `[YOUR_USERNAME]` (Get from PlanetScale Dashboard)
   - **Scopes:** All scopes

3. Add `PLANETSCALE_PASSWORD`:
   - **Key:** `PLANETSCALE_PASSWORD`
   - **Value:** `[YOUR_PASSWORD]` (Get from PlanetScale Dashboard)
   - **Scopes:** All scopes
   - **Important:** Mark this as sensitive/encrypted

4. Add `PLANETSCALE_DATABASE`:
   - **Key:** `PLANETSCALE_DATABASE`
   - **Value:** `kervapps`
   - **Scopes:** All scopes

## Step 4: Verify Environment Variables

1. After adding variables, verify they appear in the list
2. Check that sensitive variables (passwords) are marked as encrypted
3. Verify the correct scopes are selected

## Step 5: Trigger a New Deployment

### Option A: Automatic Deployment (If Connected to Git)

1. Make a small change to your repository (or just trigger a redeploy)
2. Netlify will automatically detect the change
3. Go to **"Deploys"** tab to watch the deployment
4. The new environment variables will be available in the build

### Option B: Manual Trigger

1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. This will trigger a new deployment with the updated environment variables

## Step 6: Test the Connection

### Test via Netlify Function Logs

1. After deployment completes, go to **"Functions"** tab
2. Click on any function (e.g., `runs-get`)
3. Check the logs for connection errors
4. Look for messages like:
   - ✅ `[DATABASE] PlanetScale connection initialized` (success)
   - ❌ `Connection configuration is missing` (error - check env vars)
   - ❌ `Access denied` (error - check credentials)

### Test via API Endpoint

1. Go to your deployed site URL
2. Test an API endpoint:
   ```
   https://your-site.netlify.app/api/runs
   ```
3. Check the response:
   - ✅ `{"runs":[]}` - Success (empty array is normal if no data)
   - ❌ `{"error":"..."}` - Check function logs for details

### Test via Browser Console

1. Open your deployed site
2. Open browser developer tools (F12)
3. Go to **Console** tab
4. Test an API call:
   ```javascript
   fetch('/api/runs')
     .then(r => r.json())
     .then(console.log)
     .catch(console.error)
   ```

## Step 7: Verify Environment Variables in Build Logs

1. Go to **"Deploys"** tab
2. Click on the latest deployment
3. Click **"View build log"**
4. Look for environment variable references (they won't show values, but you can verify they're being used)

## Troubleshooting

### Issue: "Connection configuration is missing"

**Solution:**
- Verify `DATABASE_URL` is set in Netlify environment variables
- Check that the variable name is exactly `DATABASE_URL` (case-sensitive)
- Ensure the variable is set for the correct scope (Production, etc.)
- Redeploy after adding variables

### Issue: "Access denied" or Authentication Error

**Solution:**
- Verify the connection string is correct (copy from [Database Credentials](DATABASE_CREDENTIALS.md))
- Check that username and password are correct
- Ensure the password hasn't expired (PlanetScale passwords can expire)
- Verify the database name is correct (`kervapps`)

### Issue: "Host not found" or Connection Timeout

**Solution:**
- Verify the host is correct: `us-east.connect.psdb.cloud`
- Check PlanetScale dashboard for connection status
- Try switching to optimized host: `aws.connect.psdb.cloud` (if available)
- Check Netlify function logs for detailed error messages

### Issue: Environment Variables Not Available

**Solution:**
- Environment variables are only available after a new deployment
- Trigger a new deployment after adding variables
- Check that variables are set for the correct scope
- Verify you're checking the right deployment (Production vs Preview)

### Issue: SSL Connection Error

**Solution:**
- Ensure SSL is enabled in connection string: `?ssl={"rejectUnauthorized":true}`
- Verify PlanetScale requires SSL (it does)
- Check that the connection string format is correct

## Security Best Practices

1. **Never commit credentials to git** - Always use environment variables
2. **Use encrypted variables** - Mark passwords as sensitive in Netlify
3. **Rotate passwords regularly** - Update PlanetScale password periodically
4. **Limit access** - Only give access to team members who need it
5. **Use different credentials** - Use different passwords for production vs development

## Updating Credentials

If you need to update the database credentials:

1. Go to **Site settings** → **Environment variables**
2. Find the variable you want to update
3. Click the **"Edit"** button (pencil icon)
4. Update the value
5. Click **"Update variable"**
6. **Trigger a new deployment** for changes to take effect

## Verifying Setup is Complete

✅ Checklist:
- [ ] `DATABASE_URL` is set in Netlify environment variables
- [ ] Variable is set for Production scope (at minimum)
- [ ] New deployment has been triggered
- [ ] Function logs show successful connection
- [ ] API endpoints return data (or empty arrays if no data)
- [ ] No connection errors in function logs

## Next Steps

After Netlify is configured:

1. **Test all API endpoints:**
   - `POST /api/runs/create` - Create a run
   - `GET /api/runs` - List all runs
   - `GET /api/runs/:runId` - Get specific run
   - `POST /api/runs/:runId/signup` - Sign up for a run

2. **Monitor function logs** for any errors

3. **Set up DBeaver** (see [DBeaver Setup](DBEAVER_SETUP.md)) for direct database access

4. **Test the full flow:**
   - Create a run via the web interface
   - Sign up for the run
   - Verify data appears in PlanetScale via DBeaver

## Support

If you encounter issues:
1. Check Netlify function logs for detailed error messages
2. Verify environment variables are set correctly
3. Test connection string locally first (in `.env` file)
4. Check PlanetScale dashboard for database status
5. Review [Database Credentials](DATABASE_CREDENTIALS.md) for current credentials

