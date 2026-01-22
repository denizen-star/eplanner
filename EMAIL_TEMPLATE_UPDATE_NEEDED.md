# Email Template Update Needed

## Issue
The email templates currently use base64 data URIs for event images, which can cause Gmail to clip emails due to size limits.

## Solution
Update the email templates to use the hosted image endpoint instead of base64 data URIs.

## Changes Required

### File: `lib/emailTemplates.js`

**Location 1** (around line 443 in `eventCreatedEmail` function):
```javascript
// OLD:
const eventPicture = run.picture ? `data:image/jpeg;base64,${run.picture}` : defaultEventImage;

// NEW:
const eventPicture = run.picture && run.id ? `${baseUrl}/api/event-image/${run.id}` : defaultEventImage;
```

**Location 2** (around line 888 in `signupConfirmationEmail` function):
```javascript
// OLD:
const eventPicture = run.picture ? `data:image/jpeg;base64,${run.picture}` : defaultEventImage;

// NEW:
const eventPicture = run.picture && run.id ? `${baseUrl}/api/event-image/${run.id}` : defaultEventImage;
```

## Additional Email Template Updates

### Add Website and Instagram Links

In the `eventCreatedEmail` function, add website and Instagram links in the event details section (after the Date & Time row, before the closing `</div>` of `event-details-glass`):

```html
${run.eventWebsite || run.eventInstagram ? `
<div class="detail-row" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(0, 0, 0, 0.1);">
  ${run.eventWebsite ? `
  <div style="margin-bottom: 8px;">
    <span class="detail-label">Website:</span>
    <span class="detail-value"><a href="${run.eventWebsite}" style="color: ${tealButton}; text-decoration: none; font-weight: 500;">${run.eventWebsite}</a></span>
  </div>
  ` : ''}
  ${run.eventInstagram ? `
  <div>
    <span class="detail-label">Instagram:</span>
    <span class="detail-value"><a href="${run.eventInstagram}" style="color: ${tealButton}; text-decoration: none; font-weight: 500;">${run.eventInstagram}</a></span>
  </div>
  ` : ''}
</div>
` : ''}
```

Apply the same pattern to `signupConfirmationEmail` and other event-related email templates.

## Testing
After making these changes:
1. Create a test event with a picture
2. Check the "Event Created" email in Gmail
3. Verify the image loads correctly via the hosted URL
4. Verify the email is not clipped
5. Verify website and Instagram links are clickable
