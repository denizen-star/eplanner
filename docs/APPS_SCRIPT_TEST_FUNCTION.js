/**
 * Test function to verify doGet() is working
 * 
 * Instructions:
 * 1. Copy this entire function into your Apps Script Code.gs file
 * 2. Select "testDoGet" from the function dropdown
 * 3. Click "Run"
 * 4. Check the Execution log for the output
 */
function testDoGet() {
  try {
    // Simulate a GET request with action=getRuns
    const mockEvent = {
      parameter: {
        action: 'getRuns'
      }
    };
    
    Logger.log('Testing doGet() with action=getRuns...');
    Logger.log('Mock event:', JSON.stringify(mockEvent));
    
    const result = doGet(mockEvent);
    const content = result.getContent();
    
    Logger.log('=== RESULT ===');
    Logger.log(content);
    Logger.log('=== END RESULT ===');
    
    // Try to parse as JSON to verify format
    try {
      const json = JSON.parse(content);
      Logger.log('JSON parsed successfully!');
      Logger.log('Success:', json.success);
      Logger.log('Data type:', typeof json.data);
      if (Array.isArray(json.data)) {
        Logger.log('Number of runs:', json.data.length);
        if (json.data.length > 0) {
          Logger.log('First run:', JSON.stringify(json.data[0]));
        }
      }
    } catch (parseError) {
      Logger.log('ERROR: Response is not valid JSON!');
      Logger.log('Parse error:', parseError.toString());
    }
    
  } catch (error) {
    Logger.log('ERROR: Function failed!');
    Logger.log('Error:', error.toString());
    Logger.log('Stack:', error.stack);
  }
}

/**
 * Test function to verify doGet() with getRun action
 * 
 * Instructions:
 * 1. Replace 'YOUR_RUN_ID' with an actual run ID from your sheet
 * 2. Select "testDoGetSingleRun" from the function dropdown
 * 3. Click "Run"
 */
function testDoGetSingleRun() {
  try {
    // Replace with an actual run ID from your Runs sheet
    const runId = 'YOUR_RUN_ID';
    
    const mockEvent = {
      parameter: {
        action: 'getRun',
        runId: runId
      }
    };
    
    Logger.log('Testing doGet() with action=getRun, runId=' + runId);
    const result = doGet(mockEvent);
    const content = result.getContent();
    
    Logger.log('=== RESULT ===');
    Logger.log(content);
    Logger.log('=== END RESULT ===');
    
  } catch (error) {
    Logger.log('ERROR:', error.toString());
  }
}

