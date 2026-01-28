# Data Management Playbook

This playbook documents the cloud-first data management architecture for the Gay Run Club application and serves as a reusable pattern for similar mobile-first applications.

## Architecture Overview

### Current Architecture

- **Primary Storage**: PlanetScale (MySQL-compatible serverless database)
- **Access Methods**: 
  - API Layer: Netlify Functions (serverless)
  - Admin Access: DBeaver Community Edition (direct SQL queries)
- **Data Location**: 100% cloud-based, no local filesystem storage
- **Scalability**: Serverless auto-scaling, suitable for small to medium scale

### Key Principles

1. **Cloud-First**: All data lives in the cloud, accessible from anywhere
2. **Single Source of Truth**: PlanetScale database is the only data store
3. **Mobile-Optimized**: Fast queries optimized for mobile network conditions
4. **No Vendor Lock-in**: MySQL-compatible, can migrate if needed
5. **Admin-Friendly**: Direct database access via standard SQL tools

## Database Schema

### Tables

#### `runs` Table
Stores run/event information.

**Columns:**
- `id` (VARCHAR(7)): Primary key, short identifier
- `uuid` (VARCHAR(36)): Unique identifier, UUID format
- `location` (TEXT): Run location/address
- `coordinates` (JSON): Latitude/longitude array
- `pacer_name` (VARCHAR(255)): Name of the pacer/coordinator
- `date_time` (DATETIME): Scheduled date and time
- `max_participants` (INT): Maximum number of participants
- `status` (VARCHAR(20)): Status (active, deleted, etc.)
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Indexes:**
- Primary key on `id`
- Index on `date_time`
- Index on `status`
- Index on `created_at`

#### `signups` Table
Stores participant signups for runs.

**Columns:**
- `id` (BIGINT): Primary key, auto-increment
- `run_id` (VARCHAR(7)): Foreign key to `runs.id`
- `name` (VARCHAR(255)): Participant name
- `phone` (VARCHAR(20)): Phone number
- `email` (VARCHAR(255)): Email address (optional)
- `instagram` (VARCHAR(255)): Instagram handle (optional)
- `waiver_accepted` (BOOLEAN): Waiver acceptance status
- `signed_at` (TIMESTAMP): Signup timestamp
- `metadata` (JSON): Additional metadata (device info, IP, etc.)

**Indexes:**
- Primary key on `id`
- Index on `run_id`
- Index on `signed_at`
- Foreign key constraint on `run_id` → `runs.id` (CASCADE DELETE)

#### `waivers` Table
Stores waiver signatures and text.

**Columns:**
- `id` (BIGINT): Primary key, auto-increment
- `run_id` (VARCHAR(7)): Foreign key to `runs.id`
- `signup_id` (BIGINT): Foreign key to `signups.id`
- `participant_name` (VARCHAR(255)): Participant name
- `participant_phone` (VARCHAR(20)): Participant phone
- `waiver_text` (TEXT): Full waiver text
- `timestamp` (TIMESTAMP): Waiver signature timestamp
- `metadata` (JSON): Additional metadata

**Indexes:**
- Primary key on `id`
- Index on `run_id`
- Index on `signup_id`
- Index on `timestamp`
- Foreign key constraints with CASCADE DELETE

## Data Access Patterns

### API Layer (Netlify Functions)

All API endpoints use the `databaseClient.js` module:

```javascript
const { runs, signups, waivers } = require('../../lib/databaseClient');

// Create a run
await runs.create({ id, uuid, location, ... });

// Get all runs
const allRuns = await runs.getAll();

// Get run by ID
const run = await runs.getById(runId);

// Update run
const updated = await runs.update(runId, { location: 'New Location' });

// Delete run (soft delete)
await runs.delete(runId);
```

### Direct Database Access (DBeaver)

For admin queries and data inspection:

```sql
-- View all runs
SELECT * FROM runs ORDER BY created_at DESC;

-- View signups with run details
SELECT s.*, r.location, r.date_time
FROM signups s
JOIN runs r ON s.run_id = r.id
ORDER BY s.signed_at DESC;
```

## Connection Management

### Environment Variables

**Required:**
- `PLANETSCALE_DATABASE_URL`: Full connection string (recommended)
- OR individual components:
  - `PLANETSCALE_HOST`
  - `PLANETSCALE_USERNAME`
  - `PLANETSCALE_PASSWORD`
  - `PLANETSCALE_DATABASE`

### Connection Pooling

PlanetScale handles connection pooling automatically. The `@planetscale/database` package manages connections efficiently for serverless functions.

## Data Flow

### Creating a Run

1. Client sends POST to `/api/runs/create`
2. Netlify Function validates input
3. Generates short ID and UUID
4. Saves to `runs` table in PlanetScale
5. Returns run data with signup/manage links

### Signing Up for a Run

1. Client sends POST to `/api/runs/:runId/signup`
2. Function verifies run exists
3. Checks if run is full (counts signups)
4. Creates record in `signups` table
5. Creates record in `waivers` table
6. Returns signup confirmation

### Reading Data

1. Client sends GET request
2. Function queries PlanetScale database
3. Returns JSON response
4. No caching layer (database is fast enough)

## Performance Considerations

### Query Optimization

- **Indexes**: All foreign keys and frequently queried columns are indexed
- **Pagination**: Can be added for large result sets (not needed for small scale)
- **Connection Pooling**: Handled by PlanetScale automatically

### Mobile Optimization

- Fast queries (<100ms typical)
- Minimal data transfer (only necessary fields)
- Efficient JSON serialization
- Connection pooling reduces latency

## Security

### Data Protection

- SSL/TLS required for all connections
- Credentials stored as environment variables (encrypted in Netlify)
- No sensitive data in code or logs
- Soft deletes preserve data integrity

### Access Control

- API endpoints are public (can add authentication later)
- Database credentials are environment-specific
- DBeaver access requires valid credentials

## Monitoring and Maintenance

### Health Checks

- `/api/health` endpoint for basic health monitoring
- Database connection errors logged to Netlify function logs
- Query performance can be monitored via PlanetScale dashboard

### Backup Strategy

- PlanetScale provides automatic backups
- Can export data via DBeaver for additional backups
- Soft deletes preserve data for recovery

### Scaling Considerations

**Current Scale (Small):**
- <100 runs/month
- <1000 signups/month
- Free tier sufficient

**Future Scaling:**
- PlanetScale scales automatically
- Can upgrade to paid plan if needed
- Consider adding caching layer for very high traffic
- Add pagination for large result sets

## Migration from Previous Architecture

### What Changed

1. **Removed**: Local filesystem storage (`data/runs/`, `data/waivers/`)
2. **Removed**: Google Sheets integration
3. **Added**: PlanetScale database
4. **Added**: Direct database client library
5. **Updated**: All API endpoints to use database

### Data Migration

**Note**: No data migration was performed as per requirements. If you need to migrate existing data:

1. Export from Google Sheets (if available)
2. Transform to match new schema
3. Import via SQL scripts or API endpoints
4. Verify data integrity

## Reusable Patterns

### Pattern 1: Cloud-Only Architecture

**Use When:**
- Building mobile-first applications
- Need global accessibility
- Want to avoid local storage complexity

**Implementation:**
- Choose cloud database (PlanetScale, Supabase, etc.)
- Remove all filesystem dependencies
- Use environment variables for configuration
- Provide admin access via SQL tools

### Pattern 2: Serverless Database Access

**Use When:**
- Using serverless functions (Netlify, Vercel, AWS Lambda)
- Need connection pooling
- Want automatic scaling

**Implementation:**
- Use database client with connection pooling
- Handle connection errors gracefully
- Use environment variables for credentials
- Implement retry logic for transient failures

### Pattern 3: Admin Database Access

**Use When:**
- Non-technical users need data access
- Need to run ad-hoc queries
- Want to export/import data

**Implementation:**
- Use standard SQL tools (DBeaver, TablePlus, etc.)
- Document common queries
- Provide read-only access for safety
- Use MySQL-compatible database for tool compatibility

## Best Practices

1. **Always use transactions** for related operations (signup + waiver)
2. **Validate input** before database operations
3. **Handle errors gracefully** with meaningful messages
4. **Log operations** for debugging and auditing
5. **Use soft deletes** to preserve data integrity
6. **Index foreign keys** for query performance
7. **Store metadata as JSON** for flexibility
8. **Use connection strings** for easier configuration

## Troubleshooting

### Common Issues

**Connection Errors:**
- Verify environment variables are set
- Check SSL is enabled
- Verify credentials are correct
- Check PlanetScale dashboard for connection status

**Query Performance:**
- Check indexes are created
- Use EXPLAIN to analyze queries
- Consider adding pagination for large datasets

**Data Integrity:**
- Verify foreign key constraints
- Check CASCADE DELETE behavior
- Validate data before inserts

## Future Enhancements

Potential improvements for larger scale:

1. **Caching Layer**: Add Redis for frequently accessed data
2. **Read Replicas**: Use PlanetScale read replicas for scaling reads
3. **Full-Text Search**: Add search capabilities for locations
4. **Analytics**: Add analytics tables for reporting
5. **Audit Logging**: Track all data changes
6. **API Authentication**: Add authentication for API endpoints
7. **Rate Limiting**: Prevent abuse of API endpoints

## Resources

- PlanetScale Documentation: https://docs.planetscale.com
- DBeaver Documentation: https://dbeaver.io/docs/
- Netlify Functions: https://docs.netlify.com/functions/overview/
- MySQL Documentation: https://dev.mysql.com/doc/

## Conclusion

This architecture provides a solid foundation for cloud-first, mobile-optimized applications. The patterns documented here can be reused for similar event management, signup, or registration systems.

Key benefits:
- ✅ Cloud-first, accessible from anywhere
- ✅ Fast queries optimized for mobile
- ✅ Scalable serverless architecture
- ✅ Admin-friendly with direct database access
- ✅ No vendor lock-in (MySQL-compatible)
- ✅ Cost-effective for small to medium scale

