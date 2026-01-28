const { runs, signups, tenants } = require('../../lib/databaseClient');
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
    
    // Extract cancellation data from request body
    const body = parseBody(event);
    const { coordinatorEmail, cancellationMessage } = body;

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
    const existingRun = await runs.getById(runId);
    if (!existingRun) {
      console.error('[RUNS CANCEL] Run not found:', runId);
      return jsonResponse(404, { success: false, error: 'Run not found' });
    }

    // Verify coordinator email matches (unless admin)
    if (!isAdmin) {
      if (!coordinatorEmail || coordinatorEmail.trim().toLowerCase() !== existingRun.coordinatorEmail.toLowerCase()) {
        console.error('[RUNS CANCEL] Coordinator email does not match:', { provided: coordinatorEmail, expected: existingRun.coordinatorEmail });
        return jsonResponse(403, { success: false, error: 'Coordinator email does not match' });
      }
    }

    // Check if already cancelled
    if (existingRun.status === 'cancelled') {
      console.error('[RUNS CANCEL] Event already cancelled:', runId);
      return jsonResponse(400, { success: false, error: 'This event has already been cancelled.' });
    }

    // Check time-based restrictions
    const eventStartTime = new Date(existingRun.dateTime);
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

    // Update event status to 'cancelled' with cancellation message and timestamp
    const cancelledAt = new Date().toISOString();
    const updateData = { 
      status: 'cancelled',
      cancelledAt: cancelledAt
    };

    if (cancellationMessage && cancellationMessage.trim()) {
      updateData.cancellationMessage = cancellationMessage.trim();
    }

    console.log('[RUNS CANCEL] Updating event status to cancelled...');
    await runs.update(runId, updateData);
    const cancelledRun = await runs.getById(runId);

    // Send cancellation emails to all signups (non-blocking)
    console.log('[RUNS CANCEL] ===== STARTING CANCELLATION EMAIL PROCESS =====');
    console.log('[RUNS CANCEL] Event ID:', runId);
    console.log('[RUNS CANCEL] Event Title:', cancelledRun.title || 'N/A');
    
    try {
      const emailService = new EmailService();
      const isEmailEnabled = emailService.isEnabled();
      // Only log boolean value, never log sensitive information
      console.log('[RUNS CANCEL] Email service enabled:', !!isEmailEnabled);
      
      if (!isEmailEnabled) {
        console.warn('[RUNS CANCEL] ⚠️ Email service is DISABLED - cancellation emails will NOT be sent');
        console.warn('[RUNS CANCEL] Check EMAIL_ENABLED environment variable');
      } else {
        console.log('[RUNS CANCEL] Email service is enabled, proceeding with email sending...');
        
        // Step 1: Get all signups
        console.log('[RUNS CANCEL] Step 1: Retrieving all signups for event...');
        const allSignups = await signups.getByRunId(runId);
        console.log(`[RUNS CANCEL] Total signups retrieved: ${allSignups.length}`);
        
        if (allSignups.length === 0) {
          console.warn('[RUNS CANCEL] ⚠️ No signups found for this event');
        } else {
          // Log signup details for debugging
          allSignups.forEach((signup, index) => {
            console.log(`[RUNS CANCEL] Signup ${index + 1}: ID=${signup.id}, Name=${signup.name || 'N/A'}, Email=${signup.email ? 'YES' : 'NO'}, EmailValue="${signup.email || 'N/A'}"`);
          });
        }
        
        // Step 2: Filter signups with email addresses
        console.log('[RUNS CANCEL] Step 2: Filtering signups with email addresses...');
        const signupsWithEmail = allSignups.filter(s => {
          const hasEmail = s.email && typeof s.email === 'string' && s.email.trim().length > 0;
          if (!hasEmail) {
            console.log(`[RUNS CANCEL] Signup ${s.id} (${s.name || 'N/A'}) excluded - no email address`);
          }
          return hasEmail;
        });
        
        console.log(`[RUNS CANCEL] Signups with email addresses: ${signupsWithEmail.length} out of ${allSignups.length}`);
        
        if (signupsWithEmail.length === 0) {
          console.warn('[RUNS CANCEL] ⚠️ No signups have email addresses - cancellation emails cannot be sent');
          console.warn('[RUNS CANCEL] This means participants will NOT receive cancellation notifications via email');
        } else {
          // Step 3: Build BCC list
          console.log('[RUNS CANCEL] Step 3: Building BCC recipient list...');
          const bccRecipients = ['info@kervinapps.com'];
          if (cancelledRun.coordinatorEmail && cancelledRun.coordinatorEmail.trim()) {
            const coordinatorEmail = cancelledRun.coordinatorEmail.trim();
            if (coordinatorEmail.includes('@')) {
              bccRecipients.push(coordinatorEmail);
              console.log(`[RUNS CANCEL] Added coordinator email to BCC: ${coordinatorEmail}`);
            } else {
              console.warn(`[RUNS CANCEL] Coordinator email invalid (no @ symbol): ${coordinatorEmail}`);
            }
          } else {
            console.warn('[RUNS CANCEL] No coordinator email found for BCC');
          }
          console.log(`[RUNS CANCEL] BCC recipients: ${bccRecipients.join(', ')}`);

          let cancelFromEmail = null;
          try {
            const tk = cancelledRun.tenantKey || null;
            if (tk) {
              const tn = await tenants.getByKey(tk);
              if (tn && tn.senderEmail) cancelFromEmail = tn.senderEmail;
            }
          } catch (e) { /* ignore */ }
          const cancelFromOpt = cancelFromEmail ? { fromEmail: cancelFromEmail } : {};

          console.log('[RUNS CANCEL] Step 4: Sending cancellation emails to participants...');
          let successCount = 0;
          let failureCount = 0;
          const emailResults = [];

          const emailPromises = signupsWithEmail.map(async (signup) => {
            const signupEmail = signup.email.trim();
            console.log(`[RUNS CANCEL] Attempting to send email to signup ${signup.id} (${signup.name || 'N/A'}) at ${signupEmail}...`);
            
            try {
              const cancellationEmailContent = eventCancelledEmail(cancelledRun, signup, cancelledRun.cancellationMessage || null);
              console.log(`[RUNS CANCEL] Email content generated for signup ${signup.id}, subject: "${cancellationEmailContent.subject}"`);
              
              await emailService.sendEmail({
                to: signupEmail,
                bcc: bccRecipients,
                subject: cancellationEmailContent.subject,
                html: cancellationEmailContent.html,
                text: cancellationEmailContent.text,
                fromName: cancellationEmailContent.fromName,
                ...cancelFromOpt,
              });
              
              successCount++;
              emailResults.push({ signupId: signup.id, email: signupEmail, status: 'success' });
              console.log(`[RUNS CANCEL] ✅ SUCCESS: Cancellation email sent to signup ${signup.id} (${signup.name || 'N/A'}) at ${signupEmail} with BCC to ${bccRecipients.join(', ')}`);
            } catch (signupEmailError) {
              failureCount++;
              emailResults.push({ signupId: signup.id, email: signupEmail, status: 'failed', error: signupEmailError.message });
              console.error(`[RUNS CANCEL] ❌ FAILED: Error sending email to signup ${signup.id} (${signup.name || 'N/A'}) at ${signupEmail}:`, signupEmailError.message);
              console.error(`[RUNS CANCEL] Error stack:`, signupEmailError.stack);
              // Continue with other emails even if one fails
            }
          });

          await Promise.all(emailPromises);
          
          // Step 5: Summary
          console.log('[RUNS CANCEL] ===== EMAIL SENDING SUMMARY =====');
          console.log(`[RUNS CANCEL] Total signups: ${allSignups.length}`);
          console.log(`[RUNS CANCEL] Signups with email: ${signupsWithEmail.length}`);
          console.log(`[RUNS CANCEL] Emails sent successfully: ${successCount}`);
          console.log(`[RUNS CANCEL] Emails failed: ${failureCount}`);
          
          if (failureCount > 0) {
            console.error(`[RUNS CANCEL] ⚠️ WARNING: ${failureCount} email(s) failed to send. Check logs above for details.`);
            emailResults.filter(r => r.status === 'failed').forEach(result => {
              console.error(`[RUNS CANCEL] Failed: Signup ${result.signupId} at ${result.email} - ${result.error}`);
            });
          }
          
          if (successCount === 0 && signupsWithEmail.length > 0) {
            console.error(`[RUNS CANCEL] ❌ CRITICAL: All ${signupsWithEmail.length} email(s) failed to send!`);
          } else if (successCount > 0) {
            console.log(`[RUNS CANCEL] ✅ Successfully sent ${successCount} cancellation email(s) with BCC copies`);
          }
        }
      }
    } catch (emailError) {
      console.error('[RUNS CANCEL] ❌ CRITICAL ERROR in email sending process:', emailError.message);
      console.error('[RUNS CANCEL] Error stack:', emailError.stack);
      // Don't fail the cancellation if email fails, but log the error clearly
    }
    
    console.log('[RUNS CANCEL] ===== CANCELLATION EMAIL PROCESS COMPLETE =====');

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
