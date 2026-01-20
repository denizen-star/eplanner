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
// Shared field list for SELECT queries (DRY principle)
const EVENT_SELECT_FIELDS = `
  id,
  uuid,
  location,
  coordinates,
  planner_name as plannerName,
  title,
  date_time as dateTime,
  end_time as endTime,
  timezone,
  max_participants as maxParticipants,
  status,
  is_public as isPublic,
  app_name as appName,
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
  coordinator_email as coordinatorEmail,
  place_name as placeName,
  picture,
  description,
  signup_link as signupLink,
  manage_link as manageLink,
  event_view_link as eventViewLink,
  cancellation_message as cancellationMessage,
  cancelled_at as cancelledAt
`;

// Helper function to process run data (DRY principle)
function processRunData(run) {
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

  // Convert MySQL DATETIME string to ISO string with UTC timezone
  if (run.dateTime && typeof run.dateTime === 'string' && !run.dateTime.includes('T')) {
    run.dateTime = run.dateTime.replace(' ', 'T') + 'Z';
  }
  
  // Convert end_time if present
  if (run.endTime && typeof run.endTime === 'string' && !run.endTime.includes('T')) {
    run.endTime = run.endTime.replace(' ', 'T') + 'Z';
  }

  // Convert cancelled_at if present
  if (run.cancelledAt && typeof run.cancelledAt === 'string' && !run.cancelledAt.includes('T')) {
    run.cancelledAt = run.cancelledAt.replace(' ', 'T') + 'Z';
  }

  return run;
}

const runs = {
  async create(runData) {
    const query = `
      INSERT INTO ep_events (
        id, uuid, location, coordinates, planner_name, title, date_time, end_time, timezone, max_participants, status, is_public, app_name, created_at,
        house_number, road, suburb, city, county, state, postcode, country, country_code,
        neighbourhood, city_district, village, town, municipality, coordinator_email, place_name, picture, description,
        signup_link, manage_link, event_view_link
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const coordinates = runData.coordinates ? JSON.stringify(runData.coordinates) : null;
    // Convert ISO datetime strings to MySQL datetime format
    const dateTime = toMySQLDateTime(runData.dateTime);
    const endTime = runData.endTime ? toMySQLDateTime(runData.endTime) : null;
    const createdAt = toMySQLDateTime(runData.createdAt || new Date().toISOString());
    
    await executeQuery(query, [
      runData.id,
      runData.uuid,
      runData.location,
      coordinates,
      runData.plannerName,
      runData.title || null,
      dateTime,
      endTime,
      runData.timezone || null,
      runData.maxParticipants,
      runData.status || 'active',
      runData.isPublic !== undefined ? (runData.isPublic ? 1 : 0) : 1, // Default to true
      runData.appName || 'eplanner', // Default to 'eplanner' for backward compatibility
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
      runData.placeName || null,
      runData.picture || null,
      runData.description || null,
      runData.signupLink || null,
      runData.manageLink || null,
      runData.eventViewLink || null,
    ]);

    return runData;
  },

  async getById(runId) {
    const query = `
      SELECT ${EVENT_SELECT_FIELDS}
      FROM ep_events
      WHERE id = ? OR uuid = ?
      LIMIT 1
    `;

    const result = await executeQuery(query, [runId, runId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return processRunData(result.rows[0]);
  },

  async getAll() {
    const query = `
      SELECT ${EVENT_SELECT_FIELDS}
      FROM ep_events
      WHERE status != 'deleted'
      ORDER BY created_at DESC
    `;

    const result = await executeQuery(query);
    
    return result.rows.map(run => processRunData(run));
  },

  async getPublicEvents(startDate, endDate, appName = null) {
    const startDateTime = toMySQLDateTime(startDate);
    const endDateTime = toMySQLDateTime(endDate);
    
    // Build query parameters array
    const queryParams = [startDateTime, endDateTime];
    
    // Try query with is_public filter first
    let query = `
      SELECT ${EVENT_SELECT_FIELDS},
        (SELECT COUNT(*) FROM ep_signups WHERE run_id = ep_events.id) as signupCount
      FROM ep_events
      WHERE is_public = TRUE 
        AND status != 'deleted'
        AND date_time >= ? 
        AND date_time <= ?
    `;
    
    // Add app_name filter if provided
    if (appName) {
      query += ` AND app_name = ?`;
      queryParams.push(appName);
    }
    
    query += ` ORDER BY date_time ASC`;
    
    let result;
    try {
      result = await executeQuery(query, queryParams);
    } catch (error) {
      // If query fails due to missing is_public or app_name column, use fallback query
      if (error.message && (error.message.includes('is_public') || error.message.includes('app_name') || error.message.includes('Unknown column'))) {
        console.warn('[DATABASE] Column missing - using fallback query. Please run migrations: migration-add-public-endtime-place-links.sql and migration-add-app-name.sql');
        // Fallback: select all active events (for backward compatibility before migration)
        query = `
          SELECT id, uuid, location, coordinates, planner_name as plannerName, title, date_time as dateTime, timezone, max_participants as maxParticipants, status, created_at as createdAt, updated_at as updatedAt, coordinator_email as coordinatorEmail, picture, description,
            (SELECT COUNT(*) FROM ep_signups WHERE run_id = ep_events.id) as signupCount
          FROM ep_events
          WHERE status != 'deleted'
            AND date_time >= ? 
            AND date_time <= ?
        `;
        const fallbackParams = [startDateTime, endDateTime];
        // Try to add app_name filter even in fallback (if column exists)
        if (appName) {
          try {
            query += ` AND app_name = ?`;
            fallbackParams.push(appName);
          } catch (e) {
            // app_name column doesn't exist, skip filter
            console.warn('[DATABASE] app_name column not available, skipping filter');
          }
        }
        query += ` ORDER BY date_time ASC`;
        result = await executeQuery(query, fallbackParams);
      } else {
        throw error;
      }
    }
    
    return result.rows.map(run => {
      const processed = processRunData(run);
      // Ensure signupCount is a number
      processed.signupCount = run.signupCount ? parseInt(run.signupCount, 10) : 0;
      // Set default isPublic if column doesn't exist (backward compatibility)
      if (processed.isPublic === undefined) {
        processed.isPublic = true;
      }
      // Set default appName if column doesn't exist (backward compatibility)
      if (processed.appName === undefined) {
        processed.appName = 'eplanner';
      }
      return processed;
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
    if (updates.picture !== undefined) {
      fields.push('picture = ?');
      values.push(updates.picture || null);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description ? updates.description.trim() : null);
    }
    if (updates.isPublic !== undefined) {
      fields.push('is_public = ?');
      values.push(updates.isPublic ? 1 : 0);
    }
    if (updates.endTime !== undefined) {
      fields.push('end_time = ?');
      values.push(updates.endTime ? toMySQLDateTime(updates.endTime) : null);
    }
    if (updates.placeName !== undefined) {
      fields.push('place_name = ?');
      values.push(updates.placeName ? updates.placeName.trim() : null);
    }
    if (updates.signupLink !== undefined) {
      fields.push('signup_link = ?');
      values.push(updates.signupLink || null);
    }
    if (updates.manageLink !== undefined) {
      fields.push('manage_link = ?');
      values.push(updates.manageLink || null);
    }
    if (updates.eventViewLink !== undefined) {
      fields.push('event_view_link = ?');
      values.push(updates.eventViewLink || null);
    }
    if (updates.cancellationMessage !== undefined) {
      fields.push('cancellation_message = ?');
      values.push(updates.cancellationMessage ? updates.cancellationMessage.trim() : null);
      console.log('[DATABASE] Adding cancellation_message to update:', updates.cancellationMessage ? 'has value' : 'null');
    }
    if (updates.cancelledAt !== undefined) {
      const mysqlDateTime = toMySQLDateTime(updates.cancelledAt);
      fields.push('cancelled_at = ?');
      values.push(mysqlDateTime);
      console.log('[DATABASE] Adding cancelled_at to update:', mysqlDateTime);
    }
    
    // Address component fields
    console.log('[DATABASE UPDATE] Address components in updates object:', {
      has_house_number: updates.house_number !== undefined,
      has_road: updates.road !== undefined,
      has_city: updates.city !== undefined,
      has_state: updates.state !== undefined,
      has_postcode: updates.postcode !== undefined,
      has_country: updates.country !== undefined,
      house_number_value: updates.house_number,
      road_value: updates.road,
      city_value: updates.city,
      state_value: updates.state,
      postcode_value: updates.postcode,
      country_value: updates.country
    });
    
    if (updates.house_number !== undefined) {
      fields.push('house_number = ?');
      const value = updates.house_number ? updates.house_number.trim() : null;
      values.push(value);
      console.log('[DATABASE UPDATE] Adding house_number to query:', value);
    }
    if (updates.road !== undefined) {
      fields.push('road = ?');
      const value = updates.road ? updates.road.trim() : null;
      values.push(value);
      console.log('[DATABASE UPDATE] Adding road to query:', value);
    }
    if (updates.suburb !== undefined) {
      fields.push('suburb = ?');
      values.push(updates.suburb ? updates.suburb.trim() : null);
    }
    if (updates.city !== undefined) {
      fields.push('city = ?');
      const value = updates.city ? updates.city.trim() : null;
      values.push(value);
      console.log('[DATABASE UPDATE] Adding city to query:', value);
    }
    if (updates.county !== undefined) {
      fields.push('county = ?');
      values.push(updates.county ? updates.county.trim() : null);
    }
    if (updates.state !== undefined) {
      fields.push('state = ?');
      const value = updates.state ? updates.state.trim() : null;
      values.push(value);
      console.log('[DATABASE UPDATE] Adding state to query:', value);
    }
    if (updates.postcode !== undefined) {
      fields.push('postcode = ?');
      const value = updates.postcode ? updates.postcode.trim() : null;
      values.push(value);
      console.log('[DATABASE UPDATE] Adding postcode to query:', value);
    }
    if (updates.country !== undefined) {
      fields.push('country = ?');
      const value = updates.country ? updates.country.trim() : null;
      values.push(value);
      console.log('[DATABASE UPDATE] Adding country to query:', value);
    }
    if (updates.country_code !== undefined) {
      fields.push('country_code = ?');
      values.push(updates.country_code ? updates.country_code.trim() : null);
    }
    if (updates.neighbourhood !== undefined) {
      fields.push('neighbourhood = ?');
      values.push(updates.neighbourhood ? updates.neighbourhood.trim() : null);
    }
    if (updates.city_district !== undefined) {
      fields.push('city_district = ?');
      values.push(updates.city_district ? updates.city_district.trim() : null);
    }
    if (updates.village !== undefined) {
      fields.push('village = ?');
      values.push(updates.village ? updates.village.trim() : null);
    }
    if (updates.town !== undefined) {
      fields.push('town = ?');
      values.push(updates.town ? updates.town.trim() : null);
    }
    if (updates.municipality !== undefined) {
      fields.push('municipality = ?');
      values.push(updates.municipality ? updates.municipality.trim() : null);
    }

    if (fields.length === 0) {
      return await this.getById(runId);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    // WHERE clause uses two placeholders (id = ? OR uuid = ?), so we need two values
    values.push(runId, runId);

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
      signupData.phone || null,
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

// CRUD Operations for App Events (app_events table - shared cross-app analytics)
const appEvents = {
  async create(eventData) {
    // Reuse toMySQLDateTime helper for timestamp conversion
    const timestamp = toMySQLDateTime(eventData.timestamp || new Date().toISOString());
    
    // Prepare JSON fields
    const articleContext = eventData.articleContext ? JSON.stringify(eventData.articleContext) : null;
    const deviceInfo = eventData.deviceInfo ? JSON.stringify(eventData.deviceInfo) : null;
    const ipGeolocation = eventData.ipGeolocation ? JSON.stringify(eventData.ipGeolocation) : null;

    // Try full schema first (with cta_type and ip_geolocation)
    try {
      const query = `
        INSERT INTO app_events (
          app_name, timestamp, session_id,
          event_type, page_category, page_url,
          article_id, article_slug, article_context,
          cta_type, depth_percent, referrer,
          device_info, ip_address, ip_geolocation, user_agent
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await executeQuery(query, [
        eventData.appName,
        timestamp,
        eventData.sessionId || null,
        eventData.eventType,
        eventData.pageCategory || null,
        eventData.pageUrl || null,
        eventData.articleId || null,
        eventData.articleSlug || null,
        articleContext,
        eventData.ctaType || null,
        eventData.depthPercent || null,
        eventData.referrer || null,
        deviceInfo,
        eventData.ipAddress || null,
        ipGeolocation,
        eventData.userAgent || null,
      ]);
    } catch (error) {
      // Fallback: Try without optional columns if migration hasn't run
      // This provides backward compatibility if cta_type or ip_geolocation columns don't exist
      try {
        const fallbackQuery = `
          INSERT INTO app_events (
            app_name, timestamp, session_id,
            event_type, page_category, page_url,
            article_id, article_slug, article_context,
            depth_percent, referrer,
            device_info, ip_address, user_agent
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await executeQuery(fallbackQuery, [
          eventData.appName,
          timestamp,
          eventData.sessionId || null,
          eventData.eventType,
          eventData.pageCategory || null,
          eventData.pageUrl || null,
          eventData.articleId || null,
          eventData.articleSlug || null,
          articleContext,
          eventData.depthPercent || null,
          eventData.referrer || null,
          deviceInfo,
          eventData.ipAddress || null,
          eventData.userAgent || null,
        ]);
      } catch (fallbackError) {
        // Log error but don't throw - telemetry should never break the app
        console.error('[DATABASE] Failed to insert app_event:', fallbackError.message);
        throw fallbackError;
      }
    }

    return eventData;
  },

  async getByAppName(appName, limit = 100) {
    const query = `
      SELECT 
        id,
        app_name as appName,
        timestamp,
        session_id as sessionId,
        event_type as eventType,
        page_category as pageCategory,
        page_url as pageUrl,
        article_id as articleId,
        article_slug as articleSlug,
        article_context as articleContext,
        cta_type as ctaType,
        depth_percent as depthPercent,
        referrer,
        device_info as deviceInfo,
        ip_address as ipAddress,
        ip_geolocation as ipGeolocation,
        user_agent as userAgent
      FROM app_events
      WHERE app_name = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `;

    const result = await executeQuery(query, [appName, limit]);
    
    return result.rows.map(record => {
      // Parse JSON fields using same pattern as telemetry methods
      if (record.articleContext) {
        try {
          record.articleContext = typeof record.articleContext === 'string' 
            ? JSON.parse(record.articleContext) 
            : record.articleContext;
        } catch (e) {
          record.articleContext = null;
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
      if (record.ipGeolocation) {
        try {
          record.ipGeolocation = typeof record.ipGeolocation === 'string' 
            ? JSON.parse(record.ipGeolocation) 
            : record.ipGeolocation;
        } catch (e) {
          record.ipGeolocation = null;
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
  appEvents,
};

