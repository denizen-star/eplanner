/**
 * IP Geolocation Service
 * Fetches geolocation data from IP address using free APIs
 * Uses ip-api.com as primary, ipapi.co as fallback
 */

const fetch = require('node-fetch');

// Simple in-memory cache to avoid rate limits
// In production, consider using Redis or similar
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Get geolocation from IP using ip-api.com (free tier)
 * @param {string} ipAddress - IP address to geolocate
 * @returns {Promise<Object|null>} Geolocation data or null if failed
 */
async function getGeolocationFromIpApi(ipAddress) {
  try {
    // Skip localhost and private IPs
    if (!ipAddress || ipAddress === 'unknown' || 
        ipAddress.startsWith('127.') || 
        ipAddress.startsWith('192.168.') ||
        ipAddress.startsWith('10.') ||
        ipAddress.startsWith('172.')) {
      console.log('[IP GEO] Skipping localhost/private IP:', ipAddress);
      return null;
    }

    const url = `http://ip-api.com/json/${ipAddress}?fields=status,message,country,regionName,city,zip,lat,lon,timezone,isp,as,query`;
    
    // Use AbortController for timeout with node-fetch v3
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('[IP GEO] ip-api.com request failed:', response.status);
        return null;
      }

      const data = await response.json();

      if (data.status === 'fail') {
        console.warn('[IP GEO] ip-api.com returned error:', data.message);
        return null;
      }

      return {
        country: data.country || null,
        region: data.regionName || null,
        city: data.city || null,
        postalCode: data.zip || null,
        latitude: data.lat || null,
        longitude: data.lon || null,
        timezone: data.timezone || null,
        isp: data.isp || null,
        asn: data.as || null,
        source: 'ip-api.com'
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn('[IP GEO] ip-api.com request timeout');
      } else {
        throw fetchError;
      }
      return null;
    }
  } catch (error) {
    console.warn('[IP GEO] ip-api.com error:', error.message);
    return null;
  }
}

/**
 * Get geolocation from IP using ipapi.co (fallback)
 * @param {string} ipAddress - IP address to geolocate
 * @returns {Promise<Object|null>} Geolocation data or null if failed
 */
async function getGeolocationFromIpApiCo(ipAddress) {
  try {
    // Skip localhost and private IPs
    if (!ipAddress || ipAddress === 'unknown' || 
        ipAddress.startsWith('127.') || 
        ipAddress.startsWith('192.168.') ||
        ipAddress.startsWith('10.') ||
        ipAddress.startsWith('172.')) {
      console.log('[IP GEO] Skipping localhost/private IP:', ipAddress);
      return null;
    }

    const url = `https://ipapi.co/${ipAddress}/json/`;
    
    // Use AbortController for timeout with node-fetch v3
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('[IP GEO] ipapi.co request failed:', response.status);
        return null;
      }

      const data = await response.json();

      if (data.error) {
        console.warn('[IP GEO] ipapi.co returned error:', data.reason);
        return null;
      }

      return {
        country: data.country_name || null,
        region: data.region || null,
        city: data.city || null,
        postalCode: data.postal || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        timezone: data.timezone || null,
        isp: data.org || null,
        asn: data.asn || null,
        source: 'ipapi.co'
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn('[IP GEO] ipapi.co request timeout');
      } else {
        throw fetchError;
      }
      return null;
    }
  } catch (error) {
    console.warn('[IP GEO] ipapi.co error:', error.message);
    return null;
  }
}

/**
 * Get geolocation from IP address with caching
 * @param {string} ipAddress - IP address to geolocate
 * @returns {Promise<Object|null>} Geolocation data or null if failed
 */
async function getGeolocationFromIP(ipAddress) {
  // Validate IP address format
  if (!ipAddress || ipAddress === 'unknown' || ipAddress.trim() === '') {
    console.log('[IP GEO] Invalid IP address:', ipAddress);
    return null;
  }

  // Check cache first
  const cacheKey = ipAddress;
  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log('[IP GEO] Using cached result for:', ipAddress);
    return cached.data;
  }

  console.log('[IP GEO] Fetching geolocation for IP:', ipAddress);

  // Try primary service first
  let geolocation = await getGeolocationFromIpApi(ipAddress);
  
  // Fallback to secondary service if primary fails
  if (!geolocation) {
    console.log('[IP GEO] Primary service failed, trying fallback for:', ipAddress);
    geolocation = await getGeolocationFromIpApiCo(ipAddress);
  }

  // Cache the result (even if null, to avoid repeated failed requests)
  if (geolocation) {
    cache.set(cacheKey, {
      data: geolocation,
      timestamp: Date.now()
    });
    console.log('[IP GEO] Successfully geolocated IP:', ipAddress, 'from', geolocation.source);
  } else {
    console.warn('[IP GEO] Failed to geolocate IP:', ipAddress);
  }

  return geolocation;
}

module.exports = {
  getGeolocationFromIP
};

