# Pre-Implementation Steps

This document outlines all the steps you need to complete **before** implementing the cloud transition to PlanetScale.

## Step 1: PlanetScale Account Setup

### 1.1 Create PlanetScale Account
1. Go to https://planetscale.com
2. Click "Sign up" or "Get started"
3. Sign up with your email or GitHub account
4. Verify your email if required

### 1.2 Create Organization
1. After logging in, create a new organization (or use existing)
2. Organization name: e.g., "Event Planner" or your personal name
3. This will be used to group your databases

### 1.3 Create Database
1. Click "Create database" or "New database"
2. Database name: `eplanner` (or your preferred name)
3. Choose region closest to your users:
   - US East (Virginia)
   - US West (Oregon)
   - EU (Frankfurt)
   - Asia Pacific (Singapore)
4. Select plan: **Free** (suitable for <100 events/month)
5. Click "Create database"

### 1.4 Get Connection Strings
1. Once database is created, go to the database dashboard
2. Click on "Connect" or "Connection strings"
3. You'll see connection strings for different branches
4. **Save these connection strings securely** - you'll need them for:
   - Netlify environment variables (production)
   - Local `.env` file (development)
   - DBeaver connection

### 1.5 Set Up Database Branches
1. PlanetScale uses Git-like branching for schema changes
2. **Main branch** (production):
   - This is your production database
   - Use this for Netlify environment variables
3. **Development branch** (optional):
   - Create a development branch for testing schema changes
   - Go to "Branches" → "Create branch"
   - Name it `development`
   - Use this for local development

## Step 2: Environment Variables Setup

### 2.1 Netlify Dashboard Configuration
1. Go to your Netlify site dashboard
2. Navigate to: **Site settings** → **Environment variables**
3. Click "Add variable" for each of the following:

   **Option A: Use Connection String (Recommended)**
   - Variable: `PLANETSCALE_DATABASE_URL`
   - Value: Your main branch connection string from Step 1.4
   - Scope: All scopes (Production, Deploy previews, Branch deploys)
   - Mark as: Sensitive/Encrypted

   **Option B: Use Individual Components**
   - Variable: `PLANETSCALE_HOST`
     - Value: e.g., `aws.connect.psdb.cloud`
   - Variable: `PLANETSCALE_USERNAME`
     - Value: Your username from connection string
   - Variable: `PLANETSCALE_PASSWORD`
     - Value: Your password from connection string
     - Mark as: Sensitive/Encrypted
   - Variable: `PLANETSCALE_DATABASE`
     - Value: `eplanner` (or your database name)

4. Click "Save" after adding each variable

### 2.2 Local Development Configuration
1. In your project root, create a `.env` file (if it doesn't exist)
2. Add the following variables:

```env
# PlanetScale Database Configuration
# Use development branch connection string for local development
PLANETSCALE_DATABASE_URL=mysql://username:password@host:port/database?sslmode=require

# OR use individual components:
PLANETSCALE_HOST=aws.connect.psdb.cloud
PLANETSCALE_USERNAME=your_username
PLANETSCALE_PASSWORD=your_password
PLANETSCALE_DATABASE=eplanner

# Server Configuration
PORT=3000
NODE_ENV=development
```

3. **Important**: Never commit `.env` to git (it's already in `.gitignore`)

## Step 3: DBeaver Community Edition Setup

### 3.1 Installation
1. Download DBeaver Community Edition:
   - Go to https://dbeaver.io/download/
   - Select your operating system (Windows, macOS, Linux)
   - Download the installer
2. Install DBeaver:
   - **Windows**: Run the installer executable
   - **macOS**: Open the DMG file and drag to Applications
   - **Linux**: Extract and run the installer script

### 3.2 Create Database Connection
1. Open DBeaver
2. Click "New Database Connection" (plug icon) or go to **Database** → **New Database Connection**
3. Select **MySQL** from the list
4. Click "Next"

### 3.3 Configure Connection Settings
1. **Main Tab:**
   - **Host**: From your PlanetScale connection string (e.g., `aws.connect.psdb.cloud`)
   - **Port**: `3306` (default MySQL port)
   - **Database**: Your database name (e.g., `gayrunclub`)
   - **Username**: From your PlanetScale connection string
   - **Password**: From your PlanetScale connection string
   - **Save password**: Check this box to save credentials

2. **SSL Tab:**
   - **Use SSL**: Check this box (PlanetScale requires SSL)
   - **SSL Mode**: Select "REQUIRED" or "VERIFY_CA"
   - Leave other SSL settings as default

3. **Driver Properties Tab (Optional):**
   - You can leave defaults, or add:
     - `useSSL=true`
     - `requireSSL=true`

### 3.4 Test Connection
1. Click "Test Connection" button
2. If prompted to download MySQL driver:
   - Click "Download" or "Yes"
   - Wait for driver download to complete
3. You should see: "Connected" message
4. If connection fails:
   - Verify connection string is correct
   - Check that SSL is enabled
   - Verify username and password are correct
   - Check PlanetScale dashboard for any connection restrictions

### 3.5 Save Connection
1. Click "Finish" to save the connection
2. Your connection will appear in the Database Navigator panel
3. You can rename it by right-clicking → "Edit Connection"

## Step 4: Schema Design and Migration

### 4.1 Review Current Data Structure
1. Look at existing JSON files in `data/runs/` and `data/waivers/` (if any)
2. Note the data structure:
   - Run fields: id, uuid, location, coordinates, pacerName, dateTime, maxParticipants, status, createdAt
   - Signup fields: name, phone, email, instagram, waiverAccepted, signedAt
   - Waiver fields: participantName, participantPhone, waiverText, timestamp

### 4.2 Create Schema in PlanetScale
1. Open DBeaver and connect to your PlanetScale database
2. Navigate to your database in the tree view
3. Right-click on "Tables" → "Create New Table" (or use SQL editor)
4. Alternatively, use the SQL file provided: `lib/schema.sql`

### 4.3 Execute Schema SQL
1. In DBeaver, open SQL Editor:
   - Right-click on your database → "SQL Editor" → "New SQL Script"
   - Or use menu: **SQL** → **New SQL Script**
2. Open `lib/schema.sql` from your project
3. Copy the SQL statements
4. Paste into DBeaver SQL Editor
5. **Important**: If using development branch, execute there first
6. Click "Execute SQL Script" (or press Ctrl+Enter / Cmd+Enter)
7. Verify tables are created:
   - Refresh the database tree
   - You should see: `runs`, `signups`, `waivers` tables

### 4.4 Verify Schema
1. In DBeaver, expand your database → Tables
2. Verify all three tables exist:
   - `runs`
   - `signups`
   - `waivers`
3. Right-click each table → "View Data" to see structure
4. Verify indexes are created (check table properties)

### 4.5 Promote Schema to Main Branch (When Ready)
1. In PlanetScale dashboard, go to your database
2. Go to "Branches" tab
3. If you created schema in development branch:
   - Click on development branch
   - Click "Create deploy request"
   - Review changes
   - Click "Merge" to promote to main branch
4. This ensures production uses the correct schema

## Step 5: Code Preparation

### 5.1 Install Dependencies
1. Open terminal in project root
2. Run: `npm install`
3. This will install `@planetscale/database` package
4. Verify installation: `npm list @planetscale/database`

### 5.2 Verify Environment Variables
1. Check that `.env.example` has been updated with PlanetScale variables
2. Ensure your local `.env` file has correct values
3. Test connection locally (optional):
   ```bash
   node -e "require('dotenv').config(); const {getConnection} = require('./lib/databaseClient'); getConnection(); console.log('Connection successful');"
   ```

### 5.3 Review Code Changes
1. All Netlify functions have been updated to use PlanetScale
2. `server.js` has been updated to use PlanetScale
3. Google Sheets dependencies have been removed
4. Filesystem operations have been removed

## Step 6: Testing Checklist

Before deploying, test the following:

- [ ] PlanetScale database connection works from DBeaver
- [ ] Environment variables are set in Netlify dashboard
- [ ] Local `.env` file is configured correctly
- [ ] Schema has been created in PlanetScale
- [ ] All three tables (runs, signups, waivers) exist
- [ ] Dependencies installed (`npm install` completed)
- [ ] No syntax errors in updated code files

## Next Steps

Once all pre-implementation steps are complete:

1. Deploy to Netlify (or test locally)
2. Test creating a run via API
3. Test signing up for a run
4. Verify data appears in PlanetScale via DBeaver
5. Monitor Netlify function logs for any errors

## Troubleshooting

### Connection Issues
- **"Access denied"**: Check username and password
- **"SSL required"**: Ensure SSL is enabled in DBeaver
- **"Host not found"**: Verify hostname from PlanetScale dashboard

### Schema Issues
- **"Table already exists"**: Drop tables and recreate, or use different database
- **"Foreign key error"**: Ensure tables are created in correct order (runs → signups → waivers)

### Environment Variable Issues
- **"Connection configuration missing"**: Verify `.env` file exists and has correct variables
- **Netlify errors**: Check environment variables in Netlify dashboard are set correctly

## Support Resources

- PlanetScale Documentation: https://docs.planetscale.com
- DBeaver Documentation: https://dbeaver.io/docs/
- PlanetScale Support: Available in dashboard or via email

