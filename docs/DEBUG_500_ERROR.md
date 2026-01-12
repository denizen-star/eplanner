# Debugging 500 Error: Failed to Save Event to Database

## Error Summary

You're seeing this error when trying to create an event:
- **Status**: 500 Internal Server Error
- **Endpoint**: `/api/runs/create`
- **Error Message**: "Failed to create event" / "Failed to save event to database"

## Step 1: Check Netlify Function Logs

The function logs will show the exact database error.

### How to Access Function Logs:

1. Go to https://app.netlify.com
2. Click on your **Event Planner site**
3. Click on **"Functions"** tab in the left sidebar
4. Click on **"runs-create"** function
5. Look at the **"Function log"** section
6. Scroll to find the most recent error (look for red text or error messages)

### What to Look For:

Common error messages you might see:

- `Connection configuration is missing` → Environment variables not set
- `Access denied for user` → Wrong credentials
- `Table 'ep_events' doesn't exist` → Tables not created
- `Unknown column 'planner_name'` → Schema mismatch
- `Connection timeout` → Network/connection issue

## Step 2: Verify Environment Variables

1. Go to **Site settings** → **Environment variables**
2. Verify `DATABASE_URL` exists and is set correctly
3. Check that it's set for **Production** scope
4. Verify the connection string includes:
   - Correct username and password
   - Correct host (e.g., `aws.connect.psdb.cloud`)
   - Database name: `kervapps`
   - SSL parameter: `?ssl={"rejectUnauthorized":true}`

## Step 3: Verify Tables Exist

1. Connect to PlanetScale database using DBeaver (or PlanetScale dashboard)
2. Run this query:
   ```sql
   SHOW TABLES;
   ```
3. You should see:
   - `ep_events`
   - `ep_signups`
   - `ep_waivers`
4. If tables don't exist, run `lib/schema.sql` again

## Step 4: Test Database Connection

In DBeaver or PlanetScale dashboard, try inserting a test record:

```sql
INSERT INTO ep_events (id, uuid, location, planner_name, date_time, max_participants, status, created_at)
VALUES ('test123', 'test-uuid-123', 'Test Location', 'Test Planner', '2025-11-22 12:00:00', 10, 'active', NOW());
```

If this fails, check:
- Table structure matches schema
- Column names are correct
- Data types match

## Step 5: Check Recent Code Deployment

Make sure the latest code with updated table names is deployed:

1. Go to **"Deploys"** tab
2. Check the latest deployment includes your recent changes
3. If not, trigger a new deployment:
   - Go to **"Deploys"** → **"Trigger deploy"** → **"Deploy site"**

## Step 6: Common Fixes

### Fix 1: Environment Variables Not Set

**Symptoms**: Function logs show "Connection configuration is missing"

**Solution**:
1. Add `DATABASE_URL` to Netlify environment variables
2. Trigger a new deployment
3. Test again

### Fix 2: Wrong Database Name

**Symptoms**: Function logs show "Unknown database" or connection errors

**Solution**:
- Verify connection string uses `kervapps` as database name
- Update `DATABASE_URL` if needed
- Trigger new deployment

### Fix 3: Tables Don't Exist

**Symptoms**: Function logs show "Table 'ep_events' doesn't exist"

**Solution**:
1. Connect to PlanetScale `kervapps` database
2. Run `lib/schema.sql` to create tables
3. Verify tables exist: `SHOW TABLES;`

### Fix 4: Schema Mismatch

**Symptoms**: Function logs show "Unknown column" errors

**Solution**:
- Verify table structure matches `lib/schema.sql`
- Check column names: `planner_name` (not `pacer_name`)
- Recreate tables if needed

### Fix 5: Connection String Format

**Symptoms**: SSL errors or connection failures

**Solution**:
- Ensure connection string includes: `?ssl={"rejectUnauthorized":true}`
- Verify format: `mysql://username:password@host/kervapps?ssl={"rejectUnauthorized":true}`
- Try generating a new connection string from PlanetScale

## Step 7: Get Detailed Error Information

### From Browser Console

1. Open browser Developer Tools (F12)
2. Go to **Network** tab
3. Try creating an event again
4. Click on the failed request (`/api/runs/create`)
5. Go to **Response** tab to see full error message

### From Netlify Function Logs

1. Go to **Functions** → **runs-create**
2. Look for lines starting with:
   - `[DATABASE] Query error:`
   - `[RUNS CREATE] Database save failed:`
   - `ERROR:`
3. The error message will tell you exactly what's wrong

## Quick Checklist

- [ ] Checked Netlify function logs for detailed error
- [ ] Verified `DATABASE_URL` is set in Netlify environment variables
- [ ] Verified environment variable is set for Production scope
- [ ] Triggered a new deployment after adding environment variables
- [ ] Verified tables exist in PlanetScale (`ep_events`, `ep_signups`, `ep_waivers`)
- [ ] Tested database connection directly (DBeaver or PlanetScale dashboard)
- [ ] Verified connection string format is correct
- [ ] Checked that latest code is deployed

## Next Steps

Once you identify the specific error from the function logs:

1. Share the exact error message from Netlify function logs
2. I can help you fix the specific issue
3. Common issues are usually:
   - Missing environment variables
   - Tables not created
   - Wrong connection string format
   - Schema mismatch

## Need More Help?

If you're still stuck:
1. Copy the exact error message from Netlify function logs
2. Share it and I'll help you fix it
3. Also share:
   - Whether environment variables are set
   - Whether tables exist in database
   - The connection string format (without actual password)










