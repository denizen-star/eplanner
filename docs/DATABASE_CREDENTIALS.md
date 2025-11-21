# Database Credentials - DO NOT COMMIT

**WARNING: This file contains sensitive database credentials. Never commit this file to git.**

## PlanetScale MySQL Database

**Database:** `kervapps`  
**Organization:** `kervin-leacock`  
**Branch:** `main`  
**Password:** `[REDACTED - Get from PlanetScale Dashboard]`  
**Connection Type:** Direct (us-east.connect.psdb.cloud)

### Connection Credentials

**Username:** `[REDACTED - Get from PlanetScale Dashboard]`  
**Password:** `[REDACTED - Get from PlanetScale Dashboard]`  
**Host:** `us-east.connect.psdb.cloud` (Direct connection)

### Complete Connection String

**For use with @planetscale/database or mysql2:**
```
mysql://[USERNAME]:[PASSWORD]@us-east.connect.psdb.cloud/[DATABASE]?ssl={"rejectUnauthorized":true}
```

### Environment Variables

**For local development (`.env` file):**
```env
DATABASE_URL=mysql://[USERNAME]:[PASSWORD]@us-east.connect.psdb.cloud/[DATABASE]?ssl={"rejectUnauthorized":true}
```

**Or use PLANETSCALE_DATABASE_URL (also supported):**
```env
PLANETSCALE_DATABASE_URL=mysql://[USERNAME]:[PASSWORD]@us-east.connect.psdb.cloud/[DATABASE]?ssl={"rejectUnauthorized":true}
```

**Or use individual components:**
```env
PLANETSCALE_HOST=us-east.connect.psdb.cloud
PLANETSCALE_USERNAME=[YOUR_USERNAME]
PLANETSCALE_PASSWORD=[YOUR_PASSWORD]
PLANETSCALE_DATABASE=[YOUR_DATABASE]
```

**Note:** Our code supports both `DATABASE_URL` (PlanetScale default) and `PLANETSCALE_DATABASE_URL`.

### Important Notes

- **Password cannot be displayed again** - save this securely
- **Connection Type:** Using Direct connection (`us-east.connect.psdb.cloud`)
- **Database Name:** `kervapps` (note: different from previous `kervinapps`)
- Use these credentials for:
  - Netlify environment variables
  - Local `.env` file
  - DBeaver connection (use MySQL connection type)
- Never share these credentials publicly
- Rotate password if compromised

### Connection Details

- **Host:** `us-east.connect.psdb.cloud` (Direct connection - current)
- **Alternative Host:** `aws.connect.psdb.cloud` (Optimized - for lower latency if needed)
- **Database:** `kervapps`
- **SSL:** Required (included in connection string)

