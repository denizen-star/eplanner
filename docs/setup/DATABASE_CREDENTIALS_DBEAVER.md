# DBeaver Connection Guide - PlanetScale Database

**⚠️ IMPORTANT: This file contains sensitive credentials. Keep this file local and do NOT commit to main branch.**

## Connection Information

### Database Credentials

| Field | Value |
|-------|-------|
| **Host** | `aws.connect.psdb.cloud` |
| **Port** | `3306` (default) |
| **Database** | `kervapps` |
| **Username** | `[YOUR_USERNAME]` |
| **Password** | `[YOUR_PASSWORD]` |

### Environment Variables

```bash
DATABASE_HOST=aws.connect.psdb.cloud
DATABASE_NAME=[YOUR_DATABASE]
DATABASE_USERNAME=[YOUR_USERNAME]
DATABASE_PASSWORD=[YOUR_PASSWORD]
```

## Step-by-Step DBeaver Connection Instructions

### Step 1: Open DBeaver and Create New Connection

1. Launch **DBeaver Community Edition**
2. Click the **"New Database Connection"** button (plug icon in toolbar)
   - Or go to **Database** → **New Database Connection**
   - Or press `Cmd+Shift+D` (macOS) / `Ctrl+Shift+D` (Windows/Linux)

### Step 2: Select MySQL Database Type

1. In the connection wizard, select **MySQL** from the database list
2. You can search for "MySQL" in the search box
3. Click **"Next"**

### Step 3: Configure Main Connection Settings

In the **Main** tab, enter the following:

- **Server Host**: `aws.connect.psdb.cloud`
- **Port**: `3306`
- **Database**: `[YOUR_DATABASE]`
- **Username**: `[YOUR_USERNAME]`
- **Password**: `[YOUR_PASSWORD]`
- ✅ Check **"Save password"** to avoid re-entering

### Step 4: Configure SSL Settings (Required)

**Important**: PlanetScale requires SSL connections.

1. Click on the **SSL** tab
2. ✅ Check **"Use SSL"** checkbox
3. Set **SSL Mode** to: `VERIFY_IDENTITY` (recommended for PlanetScale)
   - Alternative: `REQUIRED` (if VERIFY_IDENTITY doesn't work)
4. For macOS, you may need to specify the CA certificate path:
   - **CA Certificate**: `/etc/ssl/cert.pem`

### Step 5: Test Connection

1. Click **"Test Connection"** button at the bottom
2. If this is your first MySQL connection in DBeaver:
   - You'll be prompted to download MySQL driver
   - Click **"Download"** or **"Yes"**
   - Wait for download to complete (may take a minute)
3. You should see: **"Connected"** message in green
4. If connection fails, see Troubleshooting section below

### Step 6: Save Connection

1. Click **"Finish"** to save the connection
2. Your connection will appear in the **Database Navigator** panel (left side)
3. You can rename it by right-clicking → **"Edit Connection"** (e.g., "PlanetScale - kervapps")

## Command Line Connection (macOS)

For reference, here's the macOS command line connection:

```bash
mysql -h aws.connect.psdb.cloud \
      -D [YOUR_DATABASE] \
      -u [YOUR_USERNAME] \
      -p[YOUR_PASSWORD] \
      --ssl-mode=VERIFY_IDENTITY \
      --ssl-ca=/etc/ssl/cert.pem
```

**Note**: No space between `-p` and the password.

## Troubleshooting

### Connection Fails: SSL Error

**Solution**:
1. Go to connection settings → **SSL** tab
2. Ensure **"Use SSL"** is checked
3. Try different SSL modes:
   - `VERIFY_IDENTITY` (recommended)
   - `REQUIRED` (if VERIFY_IDENTITY fails)
   - `VERIFY_CA` (alternative)
4. For macOS, ensure CA certificate path is set: `/etc/ssl/cert.pem`

### Connection Fails: "Access Denied"

**Possible causes**:
- Incorrect username or password
- Connection string expired (PlanetScale passwords can expire)

**Solutions**:
1. Verify credentials in PlanetScale dashboard
2. Generate new password in PlanetScale dashboard if expired
3. Update connection settings in DBeaver

### Connection Fails: "Host Not Found"

**Solutions**:
1. Verify hostname: `aws.connect.psdb.cloud`
2. Check internet connection
3. Try pinging: `ping aws.connect.psdb.cloud`
4. Check firewall settings

### Driver Download Fails

**Solutions**:
1. Check internet connection
2. Try manual driver installation:
   - Go to **Database** → **Driver Manager**
   - Find MySQL driver
   - Click **"Download"**
3. Use proxy if behind corporate firewall

## Using DBeaver

### Viewing Tables

1. Expand your connection in Database Navigator
2. Expand **"Databases"** → `kervapps`
3. Expand **"Tables"**
4. You should see your database tables

### Running Queries

1. Right-click on database → **"SQL Editor"** → **"New SQL Script"**
2. Or use menu: **SQL** → **New SQL Script**
3. Type your SQL query
4. Press `Cmd+Enter` (macOS) / `Ctrl+Enter` (Windows/Linux) to execute

### Viewing Data

1. Right-click on a table → **"View Data"**
2. Data will appear in a grid view
3. You can edit cells directly (double-click)
4. Click **"Save"** (disk icon) to commit changes

**⚠️ Warning**: Be careful when editing production data. Consider using read-only mode.

### Setting Read-Only Mode

1. Right-click on connection → **"Edit Connection"**
2. Go to **"Connection settings"** → **"Main"** tab
3. ✅ Check **"Read-only"** checkbox
4. Click **"OK"**

## Security Notes

- **Never commit this file to version control**
- **Never share credentials publicly**
- **Rotate passwords regularly** in PlanetScale dashboard
- **Use read-only mode** when just viewing data
- **Consider using environment variables** for application connections

## Additional Resources

- DBeaver Documentation: https://dbeaver.io/docs/
- PlanetScale Documentation: https://docs.planetscale.com
- MySQL Documentation: https://dev.mysql.com/doc/

