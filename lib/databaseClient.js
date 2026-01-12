const { connect } = require('@planetscale/database');

// Get PlanetScale connection configuration from environment variables
function getConnectionConfig() {
  // Support both connection string and individual components
  // Check DATABASE_URL first (PlanetScale default), then PLANETSCALE_DATABASE_URL
  const connectionUrl = process.env.DATABASE_URL || process.env.PLANETSCALE_DATABASE_URL;
  
  if (connectionUrl) {
    // Parse connection string: mysql://username:password@host:port/database?ssl={"rejectUnauthorized":true}
    try {
      // Use URL constructor if available (Node.js built-in)
      const url = new URL(connectionUrl);
      return {
        host: url.hostname,
        username: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading slash
      };
    } catch (error) {
      // Fallback: manual parsing if URL constructor fails
      const match = connectionUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):?(\d+)?\/([^?]+)/);
      if (match) {
        return {
          host: match[3],
          username: match[1],
          password: match[2],
          database: match[5],
        };
      }
      throw new Error('Invalid DATABASE_URL or PLANETSCALE_DATABASE_URL format');
    }
  }

  // Fallback to individual environment variables
  return {
    host: process.env.PLANETSCALE_HOST,
    username: process.env.PLANETSCALE_USERNAME,
    password: process.env.PLANETSCALE_PASSWORD,
    database: process.env.PLANETSCALE_DATABASE || 'kervapps', // Using existing kervapps database
  };
}

// Create connection with connection pooling
let connection = null;

function getConnection() {
  if (!connection) {
    const config = getConnectionConfig();
    
    if (!config.host || !config.username || !config.password) {
      throw new Error('PlanetScale connection configuration is missing. Please set DATABASE_URL, PLANETSCALE_DATABASE_URL, or PLANETSCALE_HOST, PLANETSCALE_USERNAME, and PLANETSCALE_PASSWORD environment variables.');
    }

    connection = connect({
      host: config.host,
      username: config.username,
      password: config.password,
      database: config.database,
    });

    console.log('[DATABASE] PlanetScale connection initialized');
  }

  return connection;
}

// Helper function to convert ISO datetime to MySQL datetime format
function toMySQLDateTime(isoString) {
  if (!isoString) return null;
  // Convert ISO 8601 (2025-11-21T15:34:30.283Z) to MySQL format (2025-11-21 15:34:30)
  const date = new Date(isoString);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Helper function to execute queries with error handling
async function executeQuery(query, params = []) {
  const conn = getConnection();
  
  try {
    const result = await conn.execute(query, params);
    return result;
  } catch (error) {
    console.error('[DATABASE] Query error:', error.message);
    console.error('[DATABASE] Query:', query);
    console.error('[DATABASE] Params:', params);
    throw error;
  }
}

// CRUD Operations for Events (ep_events table)
const runs = {
  async create(runData) {
    const query = `
      INSERT INTO ep_events (
        id, uuid, location, coordinates, planner_name, title, date_time, timezone, max_participants, status, created_at,
        house_number, road, suburb, city, county, state, postcode, country, country_code,
        neighbourhood, city_district, village, town, municipality, coordinator_email
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const coordinates = runData.coordinates ? JSON.stringify(runData.coordinates) : null;
    // Convert ISO datetime strings to MySQL datetime format
    const dateTime = toMySQLDateTime(runData.dateTime);
    const createdAt = toMySQLDateTime(runData.createdAt || new Date().toISOString());
    
    await executeQuery(query, [
      runData.id,
      runData.uuid,
      runData.location,
      coordinates,
      runData.plannerName,
      runData.title || null,
      dateTime,
      runData.timezone || null,
      runData.maxParticipants,
      runData.status || 'active',
      createdAt,
      runData.house_number || null,
      runData.road || null,
      runData.suburb || null,
      runData.city || null,
      runData.county || null,
      runData.state || null,
      runData.postcode || null,
      runData.country || null,
      runData.country_code || null,
      runData.neighbourhood || null,
      runData.city_district || null,
      runData.village || null,
      runData.town || null,
      runData.municipality || null,
      runData.coordinatorEmail || null,
    ]);

    return runData;
  },

  async getById(runId) {
    const query = `
      SELECT 
        id,
        uuid,
        location,
        coordinates,
        planner_name as plannerName,
        title,
        date_time as dateTime,
        timezone,
        max_participants as maxParticipants,
        status,
        created_at as createdAt,
        updated_at as updatedAt,
        house_number as houseNumber,
        road,
        suburb,
        city,
        county,
        state,
        postcode,
        country,
        country_code as countryCode,
        neighbourhood,
        city_district as cityDistrict,
        village,
        town,
        municipality,
        coordinator_email as coordinatorEmail
      FROM ep_events
      WHERE id = ? OR uuid = ?
      LIMIT 1
    `;

    const result = await executeQuery(query, [runId, runId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const run = result.rows[0];
    
    // Add compatibility alias for pacerName (legacy support)
    if (run.plannerName) {
      run.pacerName = run.plannerName;
    }
    
    // Add compatibility aliases for snake_case address fields (backward compatibility)
    if (run.houseNumber !== undefined) run.house_number = run.houseNumber;
    if (run.countryCode !== undefined) run.country_code = run.countryCode;
    if (run.cityDistrict !== undefined) run.city_district = run.cityDistrict;
    
    // Parse coordinates JSON if present
    if (run.coordinates) {
      try {
        run.coordinates = typeof run.coordinates === 'string' 
          ? JSON.parse(run.coordinates) 
          : run.coordinates;
      } catch (e) {
        console.warn('[DATABASE] Failed to parse coordinates:', e);
        run.coordinates = null;
      }
    }

    return run;
  },

  async getAll() {
    const query = `
      SELECT 
        id,
        uuid,
        location,
        coordinates,
        planner_name as plannerName,
        title,
        date_time as dateTime,
        timezone,
        max_participants as maxParticipants,
        status,
        created_at as createdAt,
        updated_at as updatedAt,
        house_number as houseNumber,
        road,
        suburb,
        city,
        county,
        state,
        postcode,
        country,
        country_code as countryCode,
        neighbourhood,
        city_district as cityDistrict,
        village,
        town,
        municipality,
        coordinator_email as coordinatorEmail
      FROM ep_events
      WHERE status != 'deleted'
      ORDER BY created_at DESC
    `;

    const result = await executeQuery(query);
    
    return result.rows.map(run => {
      // Add compatibility alias for pacerName (legacy support)
      if (run.plannerName) {
        run.pacerName = run.plannerName;
      }
      
      // Add compatibility aliases for snake_case address fields (backward compatibility)
      if (run.houseNumber !== undefined) run.house_number = run.houseNumber;
      if (run.countryCode !== undefined) run.country_code = run.countryCode;
      if (run.cityDistrict !== undefined) run.city_district = run.cityDistrict;
      
      // Parse coordinates JSON if present
      if (run.coordinates) {
        try {
          run.coordinates = typeof run.coordinates === 'string' 
            ? JSON.parse(run.coordinates) 
            : run.coordinates;
        } catch (e) {
          run.coordinates = null;
        }
      }
      return run;
    });
  },

  async update(runId, updates) {
    const fields = [];
    const values = [];

    if (updates.location !== undefined) {
      fields.push('location = ?');
      values.push(updates.location);
    }
    if (updates.plannerName !== undefined) {
      fields.push('planner_name = ?');
      values.push(updates.plannerName);
    }
    if (updates.dateTime !== undefined) {
      fields.push('date_time = ?');
      values.push(toMySQLDateTime(updates.dateTime));
    }
    if (updates.timezone !== undefined) {
      fields.push('timezone = ?');
      values.push(updates.timezone || null);
    }
    if (updates.maxParticipants !== undefined) {
      fields.push('max_participants = ?');
      values.push(updates.maxParticipants);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.coordinates !== undefined) {
      fields.push('coordinates = ?');
      values.push(updates.coordinates ? JSON.stringify(updates.coordinates) : null);
    }
    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title ? updates.title.trim() : null);
    }
    if (updates.coordinatorEmail !== undefined) {
      fields.push('coordinator_email = ?');
      values.push(updates.coordinatorEmail ? updates.coordinatorEmail.trim() : null);
    }

    if (fields.length === 0) {
      return await this.getById(runId);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(runId);

    const query = `
      UPDATE ep_events
      SET ${fields.join(', ')}
      WHERE id = ? OR uuid = ?
    `;

    await executeQuery(query, values);
    return await this.getById(runId);
  },

  async delete(runId) {
    // Soft delete by setting status
    return await this.update(runId, { status: 'deleted' });
  },
};

// CRUD Operations for Signups (ep_signups table)
const signups = {
  async create(signupData) {
    const query = `
      INSERT INTO ep_signups (run_id, name, phone, email, instagram, waiver_accepted, signed_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const metadata = signupData.metadata ? JSON.stringify(signupData.metadata) : null;
    // Convert ISO datetime to MySQL datetime format
    const signedAt = toMySQLDateTime(signupData.signedAt || new Date().toISOString());

    const result = await executeQuery(query, [
      signupData.runId,
      signupData.name,
      signupData.phone,
      signupData.email || null,
      signupData.instagram || null,
      signupData.waiverAccepted ? 1 : 0,
      signedAt,
      metadata,
    ]);

    return {
      id: result.insertId,
      ...signupData,
    };
  },

  async getByRunId(runId) {
    const query = `
      SELECT 
        id,
        run_id as runId,
        name,
        phone,
        email,
        instagram,
        waiver_accepted as waiverAccepted,
        signed_at as signedAt,
        metadata
      FROM ep_signups
      WHERE run_id = ?
      ORDER BY signed_at ASC
    `;

    const result = await executeQuery(query, [runId]);
    
    return result.rows.map(signup => {
      // Parse metadata JSON if present
      if (signup.metadata) {
        try {
          signup.metadata = typeof signup.metadata === 'string' 
            ? JSON.parse(signup.metadata) 
            : signup.metadata;
        } catch (e) {
          signup.metadata = null;
        }
      }
      // Convert boolean
      signup.waiverAccepted = Boolean(signup.waiverAccepted);
      return signup;
    });
  },

  async getById(signupId) {
    const query = `
      SELECT 
        id,
        run_id as runId,
        name,
        phone,
        email,
        instagram,
        waiver_accepted as waiverAccepted,
        signed_at as signedAt,
        metadata
      FROM ep_signups
      WHERE id = ?
      LIMIT 1
    `;

    const result = await executeQuery(query, [signupId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const signup = result.rows[0];
    
    // Parse metadata JSON if present
    if (signup.metadata) {
      try {
        signup.metadata = typeof signup.metadata === 'string' 
          ? JSON.parse(signup.metadata) 
          : signup.metadata;
      } catch (e) {
        signup.metadata = null;
      }
    }
    
    signup.waiverAccepted = Boolean(signup.waiverAccepted);
    return signup;
  },

  async countByRunId(runId) {
    const query = `
      SELECT COUNT(*) as count
      FROM ep_signups
      WHERE run_id = ?
    `;

    const result = await executeQuery(query, [runId]);
    return result.rows[0]?.count || 0;
  },

  async delete(signupId) {
    const query = `DELETE FROM ep_signups WHERE id = ?`;
    await executeQuery(query, [signupId]);
    return true;
  },
};

// CRUD Operations for Waivers (ep_waivers table)
const waivers = {
  async create(waiverData) {
    const query = `
      INSERT INTO ep_waivers (run_id, signup_id, participant_name, participant_phone, waiver_text, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const metadata = waiverData.metadata ? JSON.stringify(waiverData.metadata) : null;
    // Convert ISO datetime to MySQL datetime format
    const timestamp = toMySQLDateTime(waiverData.timestamp || new Date().toISOString());

    const result = await executeQuery(query, [
      waiverData.runId,
      waiverData.signupId,
      waiverData.participantName,
      waiverData.participantPhone,
      waiverData.waiverText || null,
      timestamp,
      metadata,
    ]);

    return {
      id: result.insertId,
      ...waiverData,
    };
  },

  async getByRunId(runId) {
    const query = `
      SELECT 
        w.id,
        w.run_id as runId,
        w.signup_id as signupId,
        w.participant_name as participantName,
        w.participant_phone as participantPhone,
        w.waiver_text as waiverText,
        w.timestamp,
        w.metadata,
        s.name,
        s.phone
      FROM ep_waivers w
      JOIN ep_signups s ON w.signup_id = s.id
      WHERE w.run_id = ?
      ORDER BY w.timestamp DESC
    `;

    const result = await executeQuery(query, [runId]);
    
    return result.rows.map(waiver => {
      // Parse metadata JSON if present
      if (waiver.metadata) {
        try {
          waiver.metadata = typeof waiver.metadata === 'string' 
            ? JSON.parse(waiver.metadata) 
            : waiver.metadata;
        } catch (e) {
          waiver.metadata = null;
        }
      }
      return waiver;
    });
  },

  async getBySignupId(signupId) {
    const query = `
      SELECT 
        id,
        run_id as runId,
        signup_id as signupId,
        participant_name as participantName,
        participant_phone as participantPhone,
        waiver_text as waiverText,
        timestamp,
        metadata
      FROM ep_waivers
      WHERE signup_id = ?
      ORDER BY timestamp DESC
      LIMIT 1
    `;

    const result = await executeQuery(query, [signupId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const waiver = result.rows[0];
    
    // Parse metadata JSON if present
    if (waiver.metadata) {
      try {
        waiver.metadata = typeof waiver.metadata === 'string' 
          ? JSON.parse(waiver.metadata) 
          : waiver.metadata;
      } catch (e) {
        waiver.metadata = null;
      }
    }
    
    return waiver;
  },
};

// CRUD Operations for Telemetry
const telemetry = {
  async create(telemetryData) {
    const query = `
      INSERT INTO telemetry (
        event_type, run_id, signup_id, session_id, ip_address, ip_geolocation,
        device_info, session_info, page_url, referrer, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const ipGeolocation = telemetryData.ipGeolocation ? JSON.stringify(telemetryData.ipGeolocation) : null;
    const deviceInfo = telemetryData.deviceInfo ? JSON.stringify(telemetryData.deviceInfo) : null;
    const sessionInfo = telemetryData.sessionInfo ? JSON.stringify(telemetryData.sessionInfo) : null;
    const createdAt = toMySQLDateTime(telemetryData.createdAt || new Date().toISOString());

    const result = await executeQuery(query, [
      telemetryData.eventType,
      telemetryData.runId || null,
      telemetryData.signupId || null,
      telemetryData.sessionId || null,
      telemetryData.ipAddress || null,
      ipGeolocation,
      deviceInfo,
      sessionInfo,
      telemetryData.pageUrl || null,
      telemetryData.referrer || null,
      createdAt,
    ]);

    return {
      id: result.insertId,
      ...telemetryData,
    };
  },

  async getByRunId(runId) {
    const query = `
      SELECT 
        id,
        event_type as eventType,
        run_id as runId,
        signup_id as signupId,
        session_id as sessionId,
        ip_address as ipAddress,
        ip_geolocation as ipGeolocation,
        device_info as deviceInfo,
        session_info as sessionInfo,
        page_url as pageUrl,
        referrer,
        created_at as createdAt
      FROM telemetry
      WHERE run_id = ?
      ORDER BY created_at DESC
    `;

    const result = await executeQuery(query, [runId]);
    
    return result.rows.map(record => {
      // Parse JSON fields if present
      if (record.ipGeolocation) {
        try {
          record.ipGeolocation = typeof record.ipGeolocation === 'string' 
            ? JSON.parse(record.ipGeolocation) 
            : record.ipGeolocation;
        } catch (e) {
          record.ipGeolocation = null;
        }
      }
      if (record.deviceInfo) {
        try {
          record.deviceInfo = typeof record.deviceInfo === 'string' 
            ? JSON.parse(record.deviceInfo) 
            : record.deviceInfo;
        } catch (e) {
          record.deviceInfo = null;
        }
      }
      if (record.sessionInfo) {
        try {
          record.sessionInfo = typeof record.sessionInfo === 'string' 
            ? JSON.parse(record.sessionInfo) 
            : record.sessionInfo;
        } catch (e) {
          record.sessionInfo = null;
        }
      }
      return record;
    });
  },

  async getBySignupId(signupId) {
    const query = `
      SELECT 
        id,
        event_type as eventType,
        run_id as runId,
        signup_id as signupId,
        session_id as sessionId,
        ip_address as ipAddress,
        ip_geolocation as ipGeolocation,
        device_info as deviceInfo,
        session_info as sessionInfo,
        page_url as pageUrl,
        referrer,
        created_at as createdAt
      FROM telemetry
      WHERE signup_id = ?
      ORDER BY created_at DESC
    `;

    const result = await executeQuery(query, [signupId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const record = result.rows[0];
    
    // Parse JSON fields if present
    if (record.ipGeolocation) {
      try {
        record.ipGeolocation = typeof record.ipGeolocation === 'string' 
          ? JSON.parse(record.ipGeolocation) 
          : record.ipGeolocation;
      } catch (e) {
        record.ipGeolocation = null;
      }
    }
    if (record.deviceInfo) {
      try {
        record.deviceInfo = typeof record.deviceInfo === 'string' 
          ? JSON.parse(record.deviceInfo) 
          : record.deviceInfo;
      } catch (e) {
        record.deviceInfo = null;
      }
    }
    if (record.sessionInfo) {
      try {
        record.sessionInfo = typeof record.sessionInfo === 'string' 
          ? JSON.parse(record.sessionInfo) 
          : record.sessionInfo;
      } catch (e) {
        record.sessionInfo = null;
      }
    }
    
    return record;
  },

  async getByEventType(eventType) {
    const query = `
      SELECT 
        id,
        event_type as eventType,
        run_id as runId,
        signup_id as signupId,
        session_id as sessionId,
        ip_address as ipAddress,
        ip_geolocation as ipGeolocation,
        device_info as deviceInfo,
        session_info as sessionInfo,
        page_url as pageUrl,
        referrer,
        created_at as createdAt
      FROM telemetry
      WHERE event_type = ?
      ORDER BY created_at DESC
    `;

    const result = await executeQuery(query, [eventType]);
    
    return result.rows.map(record => {
      // Parse JSON fields if present
      if (record.ipGeolocation) {
        try {
          record.ipGeolocation = typeof record.ipGeolocation === 'string' 
            ? JSON.parse(record.ipGeolocation) 
            : record.ipGeolocation;
        } catch (e) {
          record.ipGeolocation = null;
        }
      }
      if (record.deviceInfo) {
        try {
          record.deviceInfo = typeof record.deviceInfo === 'string' 
            ? JSON.parse(record.deviceInfo) 
            : record.deviceInfo;
        } catch (e) {
          record.deviceInfo = null;
        }
      }
      if (record.sessionInfo) {
        try {
          record.sessionInfo = typeof record.sessionInfo === 'string' 
            ? JSON.parse(record.sessionInfo) 
            : record.sessionInfo;
        } catch (e) {
          record.sessionInfo = null;
        }
      }
      return record;
    });
  },
};

module.exports = {
  getConnection,
  executeQuery,
  runs,
  signups,
  waivers,
  telemetry,
};

