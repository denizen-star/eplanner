const { runs, signups } = require('../../lib/databaseClient');
const EmailService = require('../../lib/emailService');
const { eventCancelledEmail } = require('../../lib/emailTemplates');

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function parseBody(event) {
  if (!event || !event.body) {
    return {};
  }
  try {
    return JSON.parse(event.body);
  } catch (error) {
    throw new Error('Invalid JSON payload');
  }
}

exports.handler = async (event) => {
  console.log('[RUNS CANCEL] Handler invoked');
  
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(204, { success: true });
  }

  if (event.httpMethod !== 'PATCH') {
    return jsonResponse(405, { success: false, error: 'Method Not Allowed' });
  }

  try {
    // Extract runId from path: /api/runs/:runId/cancel
    const pathParts = event.path.split('/').filter(p => p);
    const runIdIndex = pathParts.indexOf('runs');
    const runId = runIdIndex >= 0 && pathParts[runIdIndex + 1] ? pathParts[runIdIndex + 1] : null;
    
    // Check if isAdmin is in query params or headers
    const isAdmin = event.queryStringParameters?.isAdmin === 'true' || event.headers['x-is-admin'] === 'true' || event.headers['X-Is-Admin'] === 'true';

    console.log('[RUNS CANCEL] Request received:', {
      path: event.path,
      pathParts: pathParts,
      runId: runId,
      isAdmin: isAdmin,
      queryStringParameters: event.queryStringParameters,
      method: event.httpMethod
    });

    if (!runId) {
      console.error('[RUNS CANCEL] Run ID not found in path');
      return jsonResponse(404, { success: false, error: 'Run not found' });
    }

    // Verify run exists
    const run = await runs.getById(runId);
    if (!run) {
      console.error('[RUNS CANCEL] Run not found:', runId);
      return jsonResponse(404, { success: false, error: 'Run not found' });
    }

    // Check if already cancelled
    if (run.status === 'cancelled') {
      console.error('[RUNS CANCEL] Event already cancelled:', runId);
      return jsonResponse(400, { success: false, error: 'This event has already been cancelled.' });
    }

    // Check time-based restrictions
    const eventStartTime = new Date(run.dateTime);
    const now = new Date();
    const hoursUntilEvent = (eventStartTime - now) / (1000 * 60 * 60);

    if (isAdmin) {
      // Admins can cancel up to event start time
      if (eventStartTime < now) {
        console.error('[RUNS CANCEL] Event has already started:', runId);
        return jsonResponse(400, { success: false, error: 'Event cannot be cancelled after it has started.' });
      }
    } else {
      // Coordinators can cancel up to 6 hours before event start
      if (hoursUntilEvent < 6) {
        console.error('[RUNS CANCEL] Event cannot be cancelled by coordinator - within 6 hours:', { runId, hoursUntilEvent });
        return jsonResponse(400, { success: false, error: 'Event cannot be cancelled within 6 hours of start time by coordinators.' });
      }
    }

    // Update event status to 'cancelled'
    console.log('[RUNS CANCEL] Updating event status to cancelled...');
    await runs.update(runId, { status: 'cancelled' });
    const cancelledRun = await runs.getById(runId);

    // Send cancellation emails to all signups (non-blocking)
    console.log('[RUNS CANCEL] Sending cancellation emails...');
    try {
      const emailService = new EmailService();
      if (emailService.isEnabled()) {
        const allSignups = await signups.getByRunId(runId);
        const signupsWithEmail = allSignups.filter(s => s.email && s.email.trim());

        if (signupsWithEmail.length > 0) {
          const emailPromises = signupsWithEmail.map(async (signup) => {
            try {
              const cancellationEmailContent = eventCancelledEmail(cancelledRun, signup);
              await emailService.sendEmail({
                to: signup.email.trim(),
                subject: cancellationEmailContent.subject,
                html: cancellationEmailContent.html,
                text: cancellationEmailContent.text,
                fromName: cancellationEmailContent.fromName,
              });
              console.log(`[RUNS CANCEL] Cancellation email sent to signup ${signup.id}`);
            } catch (signupEmailError) {
              console.error(`[RUNS CANCEL] Error sending email to signup ${signup.id}:`, signupEmailError.message);
            }
          });

          await Promise.all(emailPromises);
          console.log(`[RUNS CANCEL] Cancellation emails sent to ${signupsWithEmail.length} signup(s)`);
        } else {
          console.log('[RUNS CANCEL] No signups with email addresses found');
        }
      } else {
        console.log('[RUNS CANCEL] Email service is disabled, skipping emails');
      }
    } catch (emailError) {
      console.error('[RUNS CANCEL] Error in email sending process:', emailError.message);
      // Don't fail the cancellation if email fails
    }

    console.log('[RUNS CANCEL] Success! Event cancelled:', runId);
    return jsonResponse(200, {
      success: true,
      run: cancelledRun
    });
  } catch (error) {
    console.error('[RUNS CANCEL] ERROR:', error);
    console.error('[RUNS CANCEL] Error stack:', error.stack);
    return jsonResponse(500, {
      success: false,
      error: 'Failed to cancel run',
      message: error.message
    });
  }
};
