# Netlify Environment Variables Setup - Detailed Guide

This guide provides step-by-step instructions for configuring environment variables in Netlify for the Event Planner application.

## Prerequisites

- ✅ Netlify site created and connected to GitHub repository
- ✅ PlanetScale database `kervapps` exists
- ✅ Tables created: `ep_events`, `ep_signups`, `ep_waivers`
- ✅ PlanetScale connection string or credentials ready

## Step 1: Get Your PlanetScale Connection String

### Option A: From PlanetScale Dashboard (Recommended)

1. Go to https://planetscale.com and log in
2. Select your organization
3. Click on the **`kervapps`** database
4. Click on the **"Connect"** button (or "Connection strings" tab)
5. Select the **main branch** (production)
6. Choose **"Node.js"** or **"@planetscale/database"** as the connection type
7. Copy the connection string - it will look like:
   ```
   mysql://[username]:[password]@[host]/kervapps?ssl={"rejectUnauthorized":true}
   ```
8. **Save this securely** - you'll need it in the next step

### Option B: Get Individual Components

If you prefer to use individual environment variables instead of a connection string:

1. From the PlanetScale connection string, extract:
   - **Host**: e.g., `aws.connect.psdb.cloud` or `us-east.connect.psdb.cloud`
   - **Username**: The username from the connection string
   - **Password**: The password from the connection string
   - **Database**: `kervapps`

## Step 2: Access Netlify Environment Variables

1. Go to https://app.netlify.com
2. Sign in to your account
3. Click on your **Event Planner site** (the one you just created)
4. In the top navigation, click **"Site settings"** (gear icon)
5. In the left sidebar, scroll down to **"Build & deploy"** section
6. Click on **"Environment variables"**

You should now see the Environment Variables page.

## Step 3: Add Environment Variables

You have two options: **Option A (Recommended)** uses a single connection string, while **Option B** uses individual components.

### Option A: Using DATABASE_URL (Recommended - Single Variable)

This is the simplest method using one connection string.

1. Click the **"Add a variable"** button (top right)
2. Fill in the form:
   - **Key**: `DATABASE_URL`
   - **Value**: Paste your complete PlanetScale connection string from Step 1
     ```
     mysql://[username]:[password]@[host]/kervapps?ssl={"rejectUnauthorized":true}
     ```
   - **Scopes**: Check all three boxes:
     - ✅ **Production** (required for live site)
     - ✅ **Deploy previews** (optional, for PR previews)
     - ✅ **Branch deploys** (optional, for branch deployments)
3. Click **"Add variable"**
4. The variable will appear in the list with a lock icon (🔒) indicating it's encrypted

**That's it!** You only need this one variable.

### Option B: Using Individual Components (Alternative)

If you prefer to use separate variables for each component:

#### Add PLANETSCALE_HOST

1. Click **"Add a variable"**
2. Fill in:
   - **Key**: `PLANETSCALE_HOST`
   - **Value**: Your hostname (e.g., `aws.connect.psdb.cloud` or `us-east.connect.psdb.cloud`)
   - **Scopes**: ✅ All three (Production, Deploy previews, Branch deploys)
3. Click **"Add variable"**

#### Add PLANETSCALE_USERNAME

1. Click **"Add a variable"**
2. Fill in:
   - **Key**: `PLANETSCALE_USERNAME`
   - **Value**: Your username from the connection string
   - **Scopes**: ✅ All three
3. Click **"Add variable"**

#### Add PLANETSCALE_PASSWORD

1. Click **"Add a variable"**
2. Fill in:
   - **Key**: `PLANETSCALE_PASSWORD`
   - **Value**: Your password from the connection string
   - **Scopes**: ✅ All three
   - **Important**: This will automatically be marked as sensitive/encrypted
3. Click **"Add variable"**

#### Add PLANETSCALE_DATABASE

1. Click **"Add a variable"**
2. Fill in:
   - **Key**: `PLANETSCALE_DATABASE`
   - **Value**: `kervapps`
   - **Scopes**: ✅ All three
3. Click **"Add variable"**

## Step 4: Verify Environment Variables

After adding variables, verify they're set correctly:

1. Check that all variables appear in the list
2. Verify sensitive variables (passwords) show a lock icon (🔒)
3. Verify the correct scopes are selected (Production should always be checked)
4. Double-check the variable names are exactly:
   - `DATABASE_URL` (if using Option A), OR
   - `PLANETSCALE_HOST`, `PLANETSCALE_USERNAME`, `PLANETSCALE_PASSWORD`, `PLANETSCALE_DATABASE` (if using Option B)

## Step 5: Trigger a New Deployment

**Important**: Environment variables are only available after a new deployment. You must trigger a deployment for the variables to take effect.

### Option A: Automatic Deployment (If Connected to Git)

1. Make a small change to your repository (or just wait for the next push)
2. Netlify will automatically detect the change
3. Go to the **"Deploys"** tab to watch the deployment
4. The new environment variables will be available in this deployment

### Option B: Manual Trigger

1. Go to the **"Deploys"** tab in your Netlify dashboard
2. Click **"Trigger deploy"** → **"Deploy site"**
3. This will trigger a new deployment with the updated environment variables
4. Wait for the deployment to complete (usually 1-2 minutes)

## Step 6: Verify Environment Variables Are Working

### Check Deployment Logs

1. Go to **"Deploys"** tab
2. Click on the latest deployment
3. Click **"View build log"** or **"View deploy log"**
4. Look for any connection errors (there shouldn't be any if variables are set correctly)

### Test via Netlify Function Logs

1. After deployment completes, go to **"Functions"** tab
2. Click on any function (e.g., `runs-get` or `runs-create`)
3. Check the **"Function log"** section
4. Look for messages like:
   - ✅ `[DATABASE] PlanetScale connection initialized` (success)
   - ❌ `Connection configuration is missing` (error - check env vars)
   - ❌ `Access denied` (error - check credentials)

### Test via API Endpoint

1. Go to your deployed site URL (or Netlify preview URL)
2. Test an API endpoint in your browser:
   ```
   https://your-site.netlify.app/api/events
   ```
   Or if using custom domain:
   ```
   https://eplanner.kervinapps.com/api/events
   ```
3. Check the response:
   - ✅ `{"events":[]}` - Success! (empty array is normal if no data yet)
   - ❌ `{"error":"..."}` - Check function logs for details

## Troubleshooting

### Issue: "Connection configuration is missing"

**Symptoms**: Function logs show this error message

**Solutions**:
- Verify `DATABASE_URL` is set in Netlify environment variables
- Check that the variable name is exactly `DATABASE_URL` (case-sensitive)
- Ensure the variable is set for the **Production** scope (at minimum)
- **Trigger a new deployment** after adding variables

### Issue: "Access denied" or Authentication Error

**Symptoms**: Function logs show authentication errors

**Solutions**:
- Verify the connection string is correct (copy from PlanetScale dashboard)
- Check that username and password are correct
- Ensure the password hasn't expired (PlanetScale passwords can expire)
- Verify the database name is `kervapps` in the connection string
- Try generating a new password in PlanetScale if needed

### Issue: "Host not found" or Connection Timeout

**Symptoms**: Function logs show connection timeout errors

**Solutions**:
- Verify the host is correct: `aws.connect.psdb.cloud` or `us-east.connect.psdb.cloud`
- Check PlanetScale dashboard for connection status
- Verify your Netlify region can reach PlanetScale (should work globally)
- Check Netlify function logs for detailed error messages

### Issue: Environment Variables Not Available

**Symptoms**: Functions can't find environment variables

**Solutions**:
- Environment variables are only available after a **new deployment**
- Trigger a new deployment after adding variables
- Check that variables are set for the correct scope (Production vs Preview)
- Verify you're checking the right deployment (Production vs Preview)

### Issue: SSL Connection Error

**Symptoms**: Function logs show SSL-related errors

**Solutions**:
- Ensure SSL is enabled in connection string: `?ssl={"rejectUnauthorized":true}`
- Verify PlanetScale requires SSL (it does)
- Check that the connection string format is correct

## Security Best Practices

1. **Never commit credentials to git** - Always use environment variables
2. **Use encrypted variables** - Passwords are automatically encrypted in Netlify
3. **Rotate passwords regularly** - Update PlanetScale password periodically
4. **Limit access** - Only give access to team members who need it
5. **Use different credentials** - Use different passwords for production vs development (if applicable)

## Updating Credentials

If you need to update the database credentials later:

1. Go to **Site settings** → **Environment variables**
2. Find the variable you want to update (e.g., `DATABASE_URL`)
3. Click the **"Edit"** button (pencil icon)
4. Update the value
5. Click **"Update variable"**
6. **Trigger a new deployment** for changes to take effect

## Quick Reference

### Required Environment Variable (Option A - Recommended)
```
DATABASE_URL=mysql://[username]:[password]@[host]/kervapps?ssl={"rejectUnauthorized":true}
```

### Required Environment Variables (Option B - Alternative)
```
PLANETSCALE_HOST=aws.connect.psdb.cloud
PLANETSCALE_USERNAME=[your_username]
PLANETSCALE_PASSWORD=[your_password]
PLANETSCALE_DATABASE=kervapps
```

## Next Steps

After environment variables are configured:

1. ✅ Verify deployment completed successfully
2. ✅ Check function logs for connection success
3. ✅ Test API endpoints
4. ✅ Proceed to Step 5: Testing the Application

## Support

If you encounter issues:
1. Check Netlify function logs for detailed error messages
2. Verify environment variables are set correctly
3. Test connection string locally first (in `.env` file)
4. Check PlanetScale dashboard for database status
5. Review `docs/TROUBLESHOOTING.md` for common issues










