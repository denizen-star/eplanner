/**
 * Google Apps Script for Gay Run Club Data Pipeline
 * 
 * Instructions:
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Delete any default code
 * 4. Paste this entire code
 * 5. Save the project
 * 6. Deploy as Web App (see setup guide)
 */

/**
 * Main handler for POST requests
 */
function doPost(e) {
  try {
    // Parse the JSON payload
    const payload = JSON.parse(e.postData.contents);
    
    // Get the active spreadsheet
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Route to appropriate sheet based on dataType
    const dataType = payload.dataType || '';
    
    let result;
    switch (dataType) {
      case 'run':
        result = appendToRunsSheet(spreadsheet, payload);
        break;
      case 'signup':
        result = appendToSignupsSheet(spreadsheet, payload);
        break;
      case 'waiver':
        result = appendToWaiversSheet(spreadsheet, payload);
        break;
      default:
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Invalid dataType. Must be "run", "signup", or "waiver"'
          }))
          .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: `Data appended to ${dataType} sheet`,
        row: result.row,
        sheet: dataType
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        message: 'Failed to process request'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Append data to Runs sheet
 */
function appendToRunsSheet(spreadsheet, payload) {
  const sheet = spreadsheet.getSheetByName('Runs');
  if (!sheet) {
    throw new Error('Runs sheet not found. Please create a sheet named "Runs"');
  }
  
  // Prepare row data matching the column order
  const rowData = [
    payload.id || '',
    payload.uuid || '',
    payload.location || '',
    payload.coordinates || '',
    payload.pacerName || '',
    payload.dateTime || '',
    payload.maxParticipants || '',
    payload.createdAt || '',
    payload.updatedAt || '',
    payload.status || 'active',
    payload.dataType || 'run',
    payload.timestamp || new Date().toISOString(),
    payload.deviceInfo || '',
    payload.ipAddress || '',
    payload.userAgent || ''
  ];
  
  // Append the row
  const lastRow = sheet.getLastRow();
  sheet.appendRow(rowData);
  
  return {
    success: true,
    row: lastRow + 1
  };
}

/**
 * Append data to Signups sheet
 */
function appendToSignupsSheet(spreadsheet, payload) {
  const sheet = spreadsheet.getSheetByName('Signups');
  if (!sheet) {
    throw new Error('Signups sheet not found. Please create a sheet named "Signups"');
  }
  
  // Prepare row data matching the column order
  const rowData = [
    payload.runId || '',
    payload.runUuid || '',
    payload.name || '',
    payload.phone || '',
    payload.email || '',
    payload.instagram || '',
    payload.waiverAccepted || false,
    payload.signedAt || '',
    payload.dataType || 'signup',
    payload.timestamp || new Date().toISOString(),
    payload.sessionId || '',
    payload.deviceInfo || '',
    payload.sessionInfo || '',
    payload.ipAddress || '',
    payload.userAgent || '',
    payload.pageUrl || '',
    payload.referrer || ''
  ];
  
  // Append the row
  const lastRow = sheet.getLastRow();
  sheet.appendRow(rowData);
  
  return {
    success: true,
    row: lastRow + 1
  };
}

/**
 * Append data to Waivers sheet
 */
function appendToWaiversSheet(spreadsheet, payload) {
  const sheet = spreadsheet.getSheetByName('Waivers');
  if (!sheet) {
    throw new Error('Waivers sheet not found. Please create a sheet named "Waivers"');
  }
  
  // Prepare row data matching the column order
  const rowData = [
    payload.runId || '',
    payload.runUuid || '',
    payload.participantName || '',
    payload.participantPhone || '',
    payload.timestamp || new Date().toISOString(),
    payload.waiverText || '',
    payload.dataType || 'waiver',
    payload.deviceInfo || '',
    payload.ipAddress || '',
    payload.userAgent || '',
    payload.sessionId || ''
  ];
  
  // Append the row
  const lastRow = sheet.getLastRow();
  sheet.appendRow(rowData);
  
  return {
    success: true,
    row: lastRow + 1
  };
}

/**
 * Main handler for GET requests (reading data)
 */
function doGet(e) {
  try {
    const action = e.parameter.action || '';
    
    console.log('[DO GET] Action:', action, 'Parameters:', e.parameter);
    
    // Get the active spreadsheet
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    let result;
    switch (action) {
      case 'getRun':
        result = getRunFromSheet(spreadsheet, e.parameter.runId);
        break;
      case 'getRuns':
        result = getAllRunsFromSheet(spreadsheet);
        break;
      case 'getSignups':
        result = getSignupsFromSheet(spreadsheet, e.parameter.runId);
        break;
      default:
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Invalid action. Must be "getRun", "getRuns", or "getSignups"'
          }))
          .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: result
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        message: 'Failed to process GET request'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get a single run by ID or UUID
 */
function getRunFromSheet(spreadsheet, runId) {
  const sheet = spreadsheet.getSheetByName('Runs');
  if (!sheet) {
    throw new Error('Runs sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return null; // No data rows (header only)
  }
  
  // Find the run by ID (column 0) or UUID (column 1)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === runId || row[1] === runId) {
      // Found the run, return it as an object
      return {
        id: row[0] || '',
        uuid: row[1] || '',
        location: row[2] || '',
        coordinates: row[3] || '',
        pacerName: row[4] || '',
        dateTime: row[5] || '',
        maxParticipants: row[6] || 0,
        createdAt: row[7] || '',
        updatedAt: row[8] || '',
        status: row[9] || 'active',
        signups: [] // Will be populated separately if needed
      };
    }
  }
  
  return null; // Run not found
}

/**
 * Get all runs from the sheet
 */
function getAllRunsFromSheet(spreadsheet) {
  const sheet = spreadsheet.getSheetByName('Runs');
  if (!sheet) {
    throw new Error('Runs sheet not found');
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return []; // No data rows (header only)
  }
  
  const runs = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    runs.push({
      id: row[0] || '',
      uuid: row[1] || '',
      location: row[2] || '',
      coordinates: row[3] || '',
      pacerName: row[4] || '',
      dateTime: row[5] || '',
      maxParticipants: row[6] || 0,
      createdAt: row[7] || '',
      updatedAt: row[8] || '',
      status: row[9] || 'active'
    });
  }
  
  return runs;
}

/**
 * Get all signups for a specific run
 */
function getSignupsFromSheet(spreadsheet, runId) {
  const signupsSheet = spreadsheet.getSheetByName('Signups');
  if (!signupsSheet) {
    throw new Error('Signups sheet not found');
  }
  
  const data = signupsSheet.getDataRange().getValues();
  if (data.length < 2) {
    return []; // No data rows (header only)
  }
  
  const signups = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Check if this signup belongs to the requested run (column 0 = runId, column 1 = runUuid)
    if (row[0] === runId || row[1] === runId) {
      signups.push({
        runId: row[0] || '',
        runUuid: row[1] || '',
        name: row[2] || '',
        phone: row[3] || '',
        email: row[4] || '',
        instagram: row[5] || '',
        waiverAccepted: row[6] || false,
        signedAt: row[7] || ''
      });
    }
  }
  
  return signups;
}

/**
 * Test function - you can run this manually to test the script
 * Make sure your sheets are set up first
 */
function testScript() {
  const testPayload = {
    dataType: 'run',
    id: 'test123',
    uuid: 'test-uuid-123',
    location: 'Test Location',
    coordinates: '[25.7905644, -80.1438276]',
    pacerName: 'Test Pacer',
    dateTime: '2025-01-20T18:30:00',
    maxParticipants: 10,
    createdAt: new Date().toISOString(),
    updatedAt: '',
    status: 'active',
    timestamp: new Date().toISOString(),
    deviceInfo: '{}',
    ipAddress: '127.0.0.1',
    userAgent: 'Test User Agent'
  };
  
  const e = {
    postData: {
      contents: JSON.stringify(testPayload)
    }
  };
  
  const result = doPost(e);
  Logger.log(result.getContent());
}

