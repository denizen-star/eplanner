# DBeaver Setup Guide for PlanetScale

This guide provides step-by-step instructions for connecting DBeaver Community Edition to your PlanetScale database.

## Prerequisites

- DBeaver Community Edition installed (download from https://dbeaver.io/download/)
- PlanetScale database created
- PlanetScale connection string or credentials

## Connection Setup

### Step 1: Open DBeaver

Launch DBeaver Community Edition on your computer.

### Step 2: Create New Connection

1. Click the "New Database Connection" button (plug icon in toolbar)
   - Or go to **Database** → **New Database Connection**
   - Or press `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (macOS)

2. In the connection wizard, select **MySQL** from the database list
   - You can search for "MySQL" in the search box
   - Click "Next"

### Step 3: Configure Connection Parameters

#### Main Tab Settings

Fill in the following fields from your PlanetScale connection string:

- **Server Host**: 
  - From connection string: `mysql://username:password@host:port/database`
  - Extract the `host` part (e.g., `aws.connect.psdb.cloud`)
  - Enter in "Server Host" field

- **Port**: 
  - Default: `3306`
  - Usually included in connection string, or use default

- **Database**: 
  - Your database name (e.g., `eplanner`)
  - From connection string or PlanetScale dashboard

- **Username**: 
  - From connection string (before the `:`)
  - Enter in "Username" field

- **Password**: 
  - From connection string (between `:` and `@`)
  - Enter in "Password" field
  - Check "Save password" to avoid re-entering

#### SSL Tab Settings

**Important**: PlanetScale requires SSL connections.

1. Click on the **SSL** tab
2. Check **"Use SSL"** checkbox
3. Set **SSL Mode** to one of:
   - `REQUIRED` (recommended)
   - `VERIFY_CA` (if you have CA certificate)
4. Leave other SSL settings as default (unless you have specific certificates)

#### Driver Properties Tab (Optional)

You can add these properties for additional SSL configuration:

- `useSSL=true`
- `requireSSL=true`

### Step 4: Test Connection

1. Click **"Test Connection"** button at the bottom
2. If this is your first MySQL connection in DBeaver:
   - You'll be prompted to download MySQL driver
   - Click **"Download"** or **"Yes"**
   - Wait for download to complete (may take a minute)
3. You should see: **"Connected"** message in green
4. If connection fails, see Troubleshooting section below

### Step 5: Save Connection

1. Click **"Finish"** to save the connection
2. Your connection will appear in the **Database Navigator** panel (left side)
3. You can rename it by right-clicking → **"Edit Connection"**

## Using DBeaver

### Viewing Tables

1. Expand your connection in Database Navigator
2. Expand **"Databases"** → your database name
3. Expand **"Tables"**
4. You should see: `runs`, `signups`, `waivers`

### Running Queries

1. Right-click on your database → **"SQL Editor"** → **"New SQL Script"**
2. Or use menu: **SQL** → **New SQL Script**
3. Type your SQL query
4. Press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (macOS) to execute
5. Or click the "Execute SQL Script" button (play icon)

### Common Queries

#### View All Runs
```sql
SELECT * FROM ep_events ORDER BY created_at DESC;
```

#### View Signups for a Run
```sql
SELECT * FROM signups WHERE run_id = 'your-run-id';
```

#### View Runs with Signup Counts
```sql
SELECT 
  r.id, 
  r.location, 
  r.date_time, 
  COUNT(s.id) as signup_count
FROM ep_events r
LEFT JOIN signups s ON r.id = s.run_id
GROUP BY r.id
ORDER BY r.date_time DESC;
```

#### View Waivers for a Run
```sql
SELECT 
  w.*, 
  s.name, 
  s.phone
FROM waivers w
JOIN signups s ON w.signup_id = s.id
WHERE w.run_id = 'your-run-id';
```

#### View Recent Signups
```sql
SELECT 
  s.*,
  r.location,
  r.date_time
FROM signups s
JOIN runs r ON s.run_id = r.id
ORDER BY s.signed_at DESC
LIMIT 20;
```

### Editing Data

1. Right-click on a table → **"View Data"**
2. Data will appear in a grid view
3. You can:
   - Edit cells directly (double-click)
   - Add new rows (use toolbar or right-click)
   - Delete rows (select row, press Delete, or right-click → Delete)
4. Click **"Save"** (disk icon) to commit changes

**Note**: Be careful when editing production data. Consider using read-only mode for production.

### Setting Read-Only Mode

1. Right-click on connection → **"Edit Connection"**
2. Go to **"Connection settings"** → **"Main"** tab
3. Check **"Read-only"** checkbox
4. Click **"OK"**

## Connection String Format

Your PlanetScale connection string looks like:
```
mysql://username:password@host:port/database?sslmode=require
```

Example:
```
mysql://abc123:xyz789@aws.connect.psdb.cloud:3306/eplanner?sslmode=require
```

Breakdown:
- `username`: `abc123`
- `password`: `xyz789`
- `host`: `aws.connect.psdb.cloud`
- `port`: `3306`
- `database`: `eplanner`

## Troubleshooting

### Connection Fails: "Access Denied"

**Possible causes:**
- Incorrect username or password
- Connection string expired (PlanetScale passwords can expire)

**Solutions:**
1. Verify credentials in PlanetScale dashboard
2. Generate new password in PlanetScale dashboard
3. Update connection string or credentials in DBeaver

### Connection Fails: "SSL Required"

**Possible causes:**
- SSL not enabled in connection settings

**Solutions:**
1. Go to connection settings → **SSL** tab
2. Check **"Use SSL"** checkbox
3. Set SSL Mode to **"REQUIRED"**
4. Test connection again

### Connection Fails: "Host Not Found"

**Possible causes:**
- Incorrect hostname
- Network/firewall issues

**Solutions:**
1. Verify hostname from PlanetScale dashboard
2. Check internet connection
3. Try pinging the hostname: `ping aws.connect.psdb.cloud`
4. Check firewall settings

### Driver Download Fails

**Possible causes:**
- Network issues
- Firewall blocking download

**Solutions:**
1. Check internet connection
2. Try manual driver installation:
   - Go to **Database** → **Driver Manager**
   - Find MySQL driver
   - Click **"Download"**
3. Use proxy if behind corporate firewall

### "Table Doesn't Exist" Error

**Possible causes:**
- Schema not created yet
- Wrong database selected

**Solutions:**
1. Verify you're connected to correct database
2. Check if tables exist: `SHOW TABLES;`
3. Run schema SQL from `lib/schema.sql` if tables don't exist

### Slow Queries

**Possible causes:**
- Large dataset
- Missing indexes
- Network latency

**Solutions:**
1. Add LIMIT to queries: `SELECT * FROM ep_events LIMIT 100;`
2. Use specific WHERE clauses instead of scanning all rows
3. Check indexes on frequently queried columns

## Best Practices

1. **Use Read-Only Mode for Production**: Set connection to read-only when just viewing data
2. **Test Queries First**: Always test queries on development branch before production
3. **Backup Before Changes**: Export data before making bulk changes
4. **Use Transactions**: For multiple related changes, use transactions
5. **Close Connections**: Close DBeaver when not in use to free up connection pool

## Exporting Data

### Export to CSV
1. Right-click on table → **"Export Data"**
2. Select **"CSV"** format
3. Choose export options
4. Click **"Next"** → **"Finish"**

### Export to SQL
1. Right-click on database → **"Tools"** → **"Export Database"**
2. Select tables to export
3. Choose export format (SQL script)
4. Configure options and export

## Additional Resources

- DBeaver Documentation: https://dbeaver.io/docs/
- PlanetScale Documentation: https://docs.planetscale.com
- MySQL Documentation: https://dev.mysql.com/doc/

## Support

If you encounter issues:
1. Check PlanetScale dashboard for connection status
2. Review DBeaver error messages carefully
3. Check Netlify function logs for API-related issues
4. Consult PlanetScale support if connection issues persist

