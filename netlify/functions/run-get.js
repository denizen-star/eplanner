const { runs, signups } = require('../../lib/databaseClient');
const EmailService = require('../../lib/emailService');
const { eventUpdatedEmail, eventUpdatedToSignupsEmail } = require('../../lib/emailTemplates');

// Helper function to parse request body
function parseBody(event) {
  if (!event.body) return {};
  if (typeof event.body === 'string') {
    try {
      return JSON.parse(event.body);
    } catch (e) {
      return {};
    }
  }
  return event.body;
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event, context) => {
  // Handle OPTIONS for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { success: true });
  }
  
  // Extract runId from path: /api/runs/:runId
  const pathParts = event.path.split('/').filter(p => p);
  const runIdIndex = pathParts.indexOf('runs');
  const runId = runIdIndex >= 0 && pathParts[runIdIndex + 1] ? pathParts[runIdIndex + 1] : null;
  
  console.log('[RUN GET] Handler invoked for runId:', runId, 'path:', event.path, 'method:', event.httpMethod);
  
  // If method is PUT or PATCH, handle updates directly (no Express needed)
  if (event.httpMethod === 'PUT' || event.httpMethod === 'PATCH') {
    try {
      const body = parseBody(event);
      const { location, pacerName, plannerName, title, dateTime, endTime, maxParticipants, coordinates, picture, description, eventWebsite, eventInstagram, externalSignupEnabled } = body;

      console.log('[RUN GET] PUT request received:', {
        runId,
        bodyKeys: Object.keys(body),
        location: location ? location.substring(0, 50) : location,
        plannerName: plannerName || pacerName,
        title: title,
        dateTime: dateTime,
        maxParticipants: maxParticipants
      });

      if (!runId) {
        return jsonResponse(400, { error: 'Run ID is required' });
      }

      // Verify run exists
      const existingRun = await runs.getById(runId);
      if (!existingRun) {
        return jsonResponse(404, { error: 'Run not found' });
      }

      // Check if event is cancelled
      if (existingRun.status === 'cancelled') {
        return jsonResponse(400, { error: 'This event has been cancelled.' });
      }

      // Check if event can be modified (24-hour restriction)
      const eventStartTime = new Date(existingRun.dateTime);
      const now = new Date();
      const hoursUntilEvent = (eventStartTime - now) / (1000 * 60 * 60);
      if (hoursUntilEvent < 24) {
        return jsonResponse(400, { error: 'Event cannot be modified within 24 hours of the event start time.' });
      }

      // Prepare updates
      const finalPlannerName = plannerName || pacerName;
      const updates = {};
      if (location !== undefined) updates.location = location.trim();
      if (finalPlannerName !== undefined) updates.plannerName = finalPlannerName ? finalPlannerName.trim() : '';
      if (title !== undefined) updates.title = title ? title.trim() : null;
      if (dateTime !== undefined) updates.dateTime = dateTime;
      if (endTime !== undefined) updates.endTime = endTime;
      if (coordinates !== undefined) updates.coordinates = coordinates;
      if (picture !== undefined) updates.picture = picture;
      if (description !== undefined) updates.description = description;
      if (eventWebsite !== undefined) updates.eventWebsite = eventWebsite ? eventWebsite.trim() : null;
      if (eventInstagram !== undefined) updates.eventInstagram = eventInstagram ? eventInstagram.trim() : null;
      if (externalSignupEnabled !== undefined) updates.externalSignupEnabled = !!externalSignupEnabled;

      const finalEventWebsite = updates.eventWebsite !== undefined ? updates.eventWebsite : existingRun.eventWebsite;
      if (updates.externalSignupEnabled && (!finalEventWebsite || !String(finalEventWebsite).trim())) {
        return jsonResponse(400, { error: 'Event website URL is required when "Use this URL for external signups" is enabled.' });
      }

      if (maxParticipants !== undefined) {
        if (maxParticipants <= 0 || !Number.isInteger(maxParticipants)) {
          return jsonResponse(400, { error: 'Max participants must be a positive integer' });
        }
        // Check current signup count
        const signupCount = await signups.countByRunId(runId);
        if (signupCount > maxParticipants) {
          return jsonResponse(400, { error: 'Cannot set max participants below current signup count' });
        }
        updates.maxParticipants = parseInt(maxParticipants);
      }

      // Track changes for email notifications
      const changes = {};
      if (updates.location !== undefined && updates.location !== existingRun.location) {
        changes['Location'] = `${existingRun.location} → ${updates.location}`;
      }
      if (updates.title !== undefined && updates.title !== existingRun.title) {
        changes['Title'] = `${existingRun.title || '(none)'} → ${updates.title || '(none)'}`;
      }
      if (updates.dateTime !== undefined) {
        const oldDateObj = new Date(existingRun.dateTime);
        const newDateObj = new Date(updates.dateTime);
        if (oldDateObj.getTime() !== newDateObj.getTime()) {
          const oldDate = oldDateObj.toLocaleString();
          const newDate = newDateObj.toLocaleString();
          changes['Date & Time'] = `${oldDate} → ${newDate}`;
        }
      }
      if (updates.maxParticipants !== undefined && updates.maxParticipants !== existingRun.maxParticipants) {
        changes['Max Participants'] = `${existingRun.maxParticipants} → ${updates.maxParticipants}`;
      }
      if (updates.plannerName !== undefined && updates.plannerName !== existingRun.plannerName) {
        changes['Planner Name'] = `${existingRun.plannerName} → ${updates.plannerName}`;
      }
      if (updates.description !== undefined && updates.description !== existingRun.description) {
        changes['Description'] = 'Updated';
      }

      // Update in database
      const updatedRun = await runs.update(runId, updates);

      // Send update emails if there were changes (non-blocking)
      if (Object.keys(changes).length > 0) {
        try {
          const emailService = new EmailService();
          if (emailService.isEnabled()) {
            // Send email to coordinator
            if (updatedRun.coordinatorEmail && updatedRun.coordinatorEmail.trim()) {
              try {
                const coordinatorEmailContent = eventUpdatedEmail(updatedRun, changes, updatedRun.coordinatorEmail);
                await emailService.sendEmail({
                  to: updatedRun.coordinatorEmail.trim(),
                  subject: coordinatorEmailContent.subject,
                  html: coordinatorEmailContent.html,
                  text: coordinatorEmailContent.text,
                  fromName: coordinatorEmailContent.fromName,
                });
              } catch (coordinatorEmailError) {
                console.error('[RUN GET] Error sending email to coordinator:', coordinatorEmailError.message);
              }
            }

            // Send email to all signups with email addresses
            try {
              const allSignups = await signups.getByRunId(runId);
              const signupsWithEmail = allSignups.filter(s => s.email && s.email.trim());
              
              if (signupsWithEmail.length > 0) {
                const emailPromises = signupsWithEmail.map(async (signup) => {
                  try {
                    const signupEmailContent = eventUpdatedToSignupsEmail(updatedRun, changes, signup);
                    await emailService.sendEmail({
                      to: signup.email.trim(),
                      subject: signupEmailContent.subject,
                      html: signupEmailContent.html,
                      text: signupEmailContent.text,
                      fromName: signupEmailContent.fromName,
                    });
                  } catch (signupEmailError) {
                    console.error(`[RUN GET] Error sending email to signup ${signup.id}:`, signupEmailError.message);
                  }
                });
                
                await Promise.all(emailPromises);
              }
            } catch (signupsEmailError) {
              console.error('[RUN GET] Error sending emails to signups:', signupsEmailError.message);
            }
          }
        } catch (emailError) {
          console.error('[RUN GET] Error in email sending process:', emailError.message);
          // Don't fail the update if email fails
        }
      }

      return jsonResponse(200, { success: true, run: updatedRun });
    } catch (error) {
      console.error('[RUN GET] Error updating run:', error);
      console.error('[RUN GET] Error stack:', error.stack);
      return jsonResponse(500, {
        error: 'Failed to update run',
        message: error.message
      });
    }
  }
  
  // Handle GET requests only
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method Not Allowed. Use PUT for updates.' });
  }
  
  if (!runId) {
    console.error('[RUN GET] No runId provided');
    return jsonResponse(400, { error: 'Run ID is required' });
  }

  try {
    // Read run from PlanetScale database
    console.log('[RUN GET] Reading run from database...');
    const run = await runs.getById(runId);
    
    if (!run) {
      console.log('[RUN GET] Run not found:', runId);
      return jsonResponse(404, { error: 'Run not found' });
    }

    // Also get signups for this run
    try {
      console.log('[RUN GET] Reading signups for run...');
      const runSignups = await signups.getByRunId(runId);
      run.signups = runSignups || [];
    } catch (signupsError) {
      console.warn('[RUN GET] Failed to load signups:', signupsError.message);
      run.signups = [];
    }

    console.log('[RUN GET] Success! Returning run data');
    return jsonResponse(200, run);
  } catch (error) {
    console.error('[RUN GET] ERROR:', error);
    console.error('[RUN GET] Error stack:', error.stack);
    return jsonResponse(500, {
      error: 'Internal server error',
      message: error.message
    });
  }
};

