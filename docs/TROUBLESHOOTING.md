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
   (Get actual values from PlanetScale Dashboard or `docs/DATABASE_CREDENTIALS.md`)
4. If missing or incorrect, add/update it and **trigger a new deployment**

### Step 3: Verify Database Tables Exist

1. Connect to your PlanetScale database via DBeaver (see `docs/DBEAVER_SETUP.md`)
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
INSERT INTO runs (id, uuid, location, pacer_name, date_time, max_participants, status, created_at)
VALUES ('test123', 'test-uuid-123', 'Test Location', 'Test Pacer', '2025-11-22 12:00:00', 10, 'active', NOW());
```

If this fails, check:
- Table structure matches schema
- Column names are correct
- Data types match

### Step 5: Check Common Issues

#### Issue: "Table doesn't exist"
**Solution:** Run the schema SQL from `lib/schema.sql` in your PlanetScale database

#### Issue: "Access denied"
**Solution:** 
- Verify credentials in `docs/DATABASE_CREDENTIALS.md`
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

### From Netlify Function Logs

1. Go to Functions → `runs-create`
2. Look for lines starting with `ERROR` or `[DATABASE] Query error`
3. The error message will tell you exactly what's wrong

### From Browser Console

1. Open browser Developer Tools (F12)
2. Go to **Network** tab
3. Try creating a run again
4. Click on the failed request (`/api/runs/create`)
5. Go to **Response** tab to see the error message

### Common Error Messages and Solutions

| Error Message | Solution |
|--------------|----------|
| `Connection configuration is missing` | Add `DATABASE_URL` to Netlify env vars |
| `Access denied for user` | Check credentials, update `DATABASE_URL` |
| `Table 'runs' doesn't exist` | Run schema SQL to create tables |
| `Unknown column 'pacer_name'` | Table structure mismatch, recreate table |
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

