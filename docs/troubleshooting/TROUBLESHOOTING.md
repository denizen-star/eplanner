# Troubleshooting Guide

## Issue: 500 Error When Creating a Run

If you're getting a 500 Internal Server Error when trying to create a run, follow these steps:

### Step 1: Check Function Logs

1. Go to Netlify Dashboard → Your Site
2. Click **"Functions"** in the left sidebar
3. Click on **"runs-create"**
4. Look at the **"Function log"** section
5. Look for error messages, especially:
   - `[DATABASE] Query error: ...`
   - `[RUNS CREATE] Database save failed: ...`
   - `Connection configuration is missing`
   - `Table 'runs' doesn't exist`
   - `Access denied`

### Step 2: Verify Environment Variables

1. Go to **Site settings** → **Environment variables**
2. Verify `DATABASE_URL` exists and is set correctly
3. The value should be in the format:
   ```
   mysql://[USERNAME]:[PASSWORD]@us-east.connect.psdb.cloud/[DATABASE]?ssl={"rejectUnauthorized":true}
   ```
   (Get actual values from PlanetScale Dashboard or [Database Credentials](../setup/DATABASE_CREDENTIALS.md))
4. If missing or incorrect, add/update it and **trigger a new deployment**

### Step 3: Verify Database Tables Exist

1. Connect to your PlanetScale database via DBeaver (see [DBeaver Setup](../setup/DBEAVER_SETUP.md))
2. Run this query:
   ```sql
   SHOW TABLES;
   ```
3. You should see:
   - `runs`
   - `signups`
   - `waivers`
4. If tables don't exist, run the SQL from `lib/schema.sql`

### Step 4: Test Database Connection

In DBeaver, try inserting a test record:
```sql
INSERT INTO ep_events (id, uuid, location, planner_name, date_time, max_participants, status, created_at)
VALUES ('test123', 'test-uuid-123', 'Test Location', 'Test Planner', '2025-11-22 12:00:00', 10, 'active', NOW());
```

If this fails, check:
- Table structure matches schema
- Column names are correct
- Data types match

### Step 5: Check Common Issues

#### Issue: "Table doesn't exist"
**Solution:** Run the schema SQL from `lib/schema.sql` in your PlanetScale database (kervapps). Tables should be: `ep_events`, `ep_signups`, `ep_waivers`

#### Issue: "Access denied"
**Solution:** 
- Verify credentials in [Database Credentials](../setup/DATABASE_CREDENTIALS.md)
- Check if password has expired (generate new one in PlanetScale)
- Update `DATABASE_URL` in Netlify environment variables

#### Issue: "Connection configuration is missing"
**Solution:**
- Add `DATABASE_URL` to Netlify environment variables
- Trigger a new deployment after adding

#### Issue: "Column count doesn't match"
**Solution:**
- Verify table structure matches `lib/schema.sql`
- Check that all required columns exist

#### Issue: "ON UPDATE CURRENT_TIMESTAMP" error
**Solution:**
- PlanetScale may not support `ON UPDATE CURRENT_TIMESTAMP` in all cases
- The `updated_at` column will be handled by application code if needed

## Getting Detailed Error Information

### How to Find Netlify Function Logs

#### Method 1: Netlify Dashboard (Recommended)

1. **Go to your Netlify Dashboard**
   - Visit https://app.netlify.com
   - Sign in if needed

2. **Select Your Site**
   - Click on your site name (e.g., "eplanner" or "eventplan")

3. **Navigate to Functions**
   - In the left sidebar, click **"Functions"**
   - OR look for a tab/menu item called **"Functions"** at the top

4. **View Function Logs**
   - You should see a list of functions: `runs-create`, `runs-get`, `run-get`, etc.
   - Click on the function you want to debug (e.g., `runs-create`)
   - Look for lines starting with `ERROR` or `[DATABASE] Query error`
   - The error message will tell you exactly what's wrong

5. **Alternative: Real-time Logs**
   - Look for a **"Real-time logs"** or **"Live logs"** option
   - This shows logs as they happen

#### Method 2: Site Deploys

1. Go to your site in Netlify
2. Click **"Deploys"** in the left sidebar
3. Click on the most recent deploy
4. Scroll down to see **"Function logs"** section
5. Click on the function name to see its logs

#### Method 3: Browser Network Tab

1. Open your admin dashboard or the page with the issue
2. Open Developer Tools (F12)
3. Go to **Network** tab
4. Click **Refresh** on the page
5. Click on the failed request (e.g., `/api/runs/create`)
6. Check the **Response** tab to see the error message

### What to Look For in Logs

In the logs, look for:
- `[RUNS CREATE]` - Messages from the runs-create function
- `[DATABASE]` - Database query messages
- `[GOOGLE SHEETS READ]` - Messages from the Google Sheets client (if applicable)
- Error messages or stack traces
- The actual response from APIs

### Common Error Messages and Solutions

| Error Message | Solution |
|--------------|----------|
| `Connection configuration is missing` | Add `DATABASE_URL` to Netlify env vars |
| `Access denied for user` | Check credentials, update `DATABASE_URL` |
| `Table 'ep_events' doesn't exist` | Run schema SQL to create tables in kervapps database |
| `Unknown column 'planner_name'` | Table structure mismatch, ensure using `ep_events` table |
| `Column count doesn't match value count` | Check INSERT query matches table structure |

## Testing the Fix

After making changes:

1. **Trigger a new deployment** in Netlify
2. Wait for deployment to complete
3. Test creating a run again
4. Check function logs for success messages:
   - `[RUNS CREATE] Run saved to database successfully`
   - `[DATABASE] PlanetScale connection initialized`

## Still Having Issues?

1. Check all function logs (not just `runs-create`)
2. Verify environment variables are set for **Production** scope
3. Ensure you've triggered a new deployment after adding env vars
4. Test the database connection directly via DBeaver
5. Compare your table structure with `lib/schema.sql`

