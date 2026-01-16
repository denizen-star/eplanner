# Email Template Design Application Guide

## Overview
This guide provides detailed instructions for applying the modern design features from `eventCreatedEmail` to the remaining 4 email templates in the Event Planner application.

## Target Email Templates
Apply the design to these functions in `lib/emailTemplates.js`:
1. `signupConfirmationEmail` (lines ~789-921) - Confirmation email sent to attendees
2. `signupNotificationEmail` (lines ~922-1015) - Notification email sent to coordinator when someone signs up
3. `eventUpdatedEmail` (lines ~1016-1107) - Email sent to coordinator when event is updated
4. `eventUpdatedToSignupsEmail` (lines ~1108-1196) - Email sent to signups when event is updated

## Design Features to Apply

### 1. Typography & Font
- **Font Family**: Use Poppins from Google Fonts
- **Implementation**: Add to `<head>` section:
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  ```
- **Body Font**: Set `body` font-family to `'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- **Font Sizes**: 
  - Body text: 16px (default)
  - Labels: 16px
  - Detail values: 15px
  - Footer: 13px

### 2. Color Palette
Use these color constants:
- **Warm Beige Background**: `#F7F3ED`
- **Dark Border/Accent**: `#44390d`
- **Teal Button Background**: `#0b6799`
- **Light Blue Button Text**: `#d9f0fc`
- **Text Colors**: 
  - Primary: `#333`
  - Secondary: `#666`
  - Labels: `#44390d`

### 3. Header Section Structure
Replace existing header with this structure:
```html
<div class="email-header">
  <div class="header-top">
    <div class="logo-text">EP</div>
    <div class="creation-date">${appropriateDate}</div>
  </div>
  <div class="header-title">${centeredTitleText}</div>
</div>
```

**Header CSS** (include in `<style>`):
```css
.email-header { 
  background-color: #F7F3ED; 
  padding: 24px 20px;
  position: relative;
  border-bottom: 1px solid rgba(68, 57, 13, 0.1);
}
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.logo-text {
  font-size: 24px;
  font-weight: 700;
  color: #44390d;
  letter-spacing: 1px;
}
.creation-date {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}
.header-title {
  font-size: 28px;
  font-weight: 600;
  color: white;
  background-color: #44390d;
  padding: 12px 16px;
  border-radius: 8px;
  display: block;
  text-align: center;
}
```

### 4. Content Container
Wrap all content (except header and footer) in:
```html
<div class="email-content">
  <!-- All email content goes here -->
</div>
```

**CSS**:
```css
.email-content { 
  background-color: #F7F3ED; 
  padding: 0;
}
```

### 5. Glass Morphism Boxes
All content boxes should use glass morphism styling:

**Base Glass Box CSS**:
```css
.glass-box {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background-color: #ffffff; /* Fallback for email clients */
  padding: 20px;
  border-radius: 8px;
  margin: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
```

**Alternating Border Pattern** (apply to glass-box elements in order):
1. **First box**: Add class `link-box-left` (left border)
2. **Second box**: Add class `link-box-right` (right border)
3. **Third box**: Add class `link-box-left` (left border)
4. **Fourth box**: Add class `link-box-right` (right border)
5. **Fifth box**: No border class (calendar section)

**Border CSS**:
```css
.link-box-left {
  border-left: 3px solid #44390d;
}
.link-box-right {
  border-right: 3px solid #44390d;
}
```

### 6. Event Details Display
If showing event details (title, planner, location, date/time), use this structure:

```html
<div class="event-details-glass">
  <div class="detail-row">
    <span class="detail-value">${eventTitle} <span style="font-weight: 400; color: #666;">(${maxParticipants} participants)</span></span>
  </div>
  <div class="detail-row">
    <span class="detail-value">${plannerName}</span>
  </div>
  <div class="detail-row">
    <span class="detail-value">${location}</span>
  </div>
  <div class="detail-row">
    <span class="detail-label">Date & Time:</span>
    <span class="detail-value">${dateTime}</span>
  </div>
</div>
```

**CSS** (15% opaque glass):
```css
.event-details-glass {
  position: relative;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.15);
  padding: 24px;
  margin: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
.detail-row { 
  margin: 12px 0; 
  font-size: 15px;
}
.detail-label { 
  font-weight: 600; 
  color: #555;
  display: none; /* Hide most labels, only show Date & Time label */
}
.detail-label:has(+ .detail-value) {
  display: inline-block;
  min-width: 120px;
}
.detail-value {
  color: #333;
  font-weight: 500;
}
```

**Note**: For `eventUpdatedEmail` and `eventUpdatedToSignupsEmail`, you may want to show the "Date & Time:" label. In that case, keep the label visible for that row only.

### 7. Links and URLs Styling
```css
.link-label { 
  font-weight: 600; 
  margin-bottom: 8px;
  color: #44390d;
  font-size: 16px;
}
.link-url { 
  color: #0066cc; 
  word-break: break-all;
  font-size: 14px;
  line-height: 1.5;
}
.link-description {
  margin: 10px 0 0 0; 
  font-size: 13px; 
  color: #666;
  line-height: 1.5;
}
```

### 8. Calendar Buttons
If the email includes calendar buttons:

**HTML Structure**:
```html
<div class="glass-box calendar-links">
  <div class="link-label">Add to Calendar:</div>
  <div class="calendar-buttons">
    <a href="${googleCalendarLink}" target="_blank" rel="noopener noreferrer" class="calendar-button">Google Calendar</a>
    <a href="${icalLink}" download="event.ics" class="calendar-button">Download iCal</a>
  </div>
  <p class="link-description">Add this event to your calendar.</p>
</div>
```

**CSS**:
```css
.calendar-links {
  text-align: center;
}
.calendar-buttons { 
  margin-top: 12px;
  text-align: center;
}
.calendar-button { 
  display: inline-block; 
  padding: 12px 24px; 
  background-color: #0b6799; 
  color: #d9f0fc; 
  text-decoration: none; 
  border-radius: 6px; 
  margin: 6px;
  font-weight: 500;
  font-size: 15px;
}
.calendar-button:hover {
  background-color: #094d73;
}
```

### 9. Footer
Replace existing footer with:
```html
<div class="footer">
  <p>Thank you for using Event Planner!</p>
</div>
```

**CSS**:
```css
.footer { 
  margin-top: 20px; 
  padding: 20px;
  padding-top: 20px; 
  border-top: 1px solid rgba(68, 57, 13, 0.1); 
  color: #666; 
  font-size: 13px;
  text-align: center;
  background-color: #F7F3ED;
}
```

### 10. Mobile Responsive Design
Add media queries at the end of the `<style>` section:

```css
/* Mobile Responsive */
@media only screen and (max-width: 600px) {
  body {
    padding: 0;
  }
  .email-header {
    padding: 20px 16px;
  }
  .header-title {
    font-size: 22px;
    padding: 10px 14px;
  }
  .logo-text {
    font-size: 20px;
  }
  .creation-date {
    font-size: 12px;
  }
  .event-details-glass {
    margin: 16px;
    padding: 20px;
  }
  .glass-box {
    margin: 16px;
    padding: 16px;
  }
  .detail-label {
    display: block;
    margin-bottom: 4px;
    min-width: auto;
  }
  .calendar-button {
    display: block;
    width: 100%;
    margin: 8px 0;
  }
}
```

## Email-Specific Implementation Details

### signupConfirmationEmail
**Header Title**: `You're All Set!` or `Confirmation: ${eventTitle}`
**Date to Show**: Event date/time (formatted)
**Content Boxes** (in order with borders):
1. Event details (left border)
2. View Event link if available (right border)
3. Calendar section (no border)

**Special Considerations**:
- Include participant name: `Hi ${participantName},`
- Event details should show title, planner, location, date/time
- Calendar buttons are important here

### signupNotificationEmail
**Header Title**: `New Signup!`
**Date to Show**: Current date or event date
**Content Boxes** (in order with borders):
1. Event info box (left border)
2. Participant info box (right border)

**Special Considerations**:
- Two-column layout: Event info | Participant info
- Event info: Title, Location, Date & Time
- Participant info: Name, Phone, Email

### eventUpdatedEmail
**Header Title**: `Event Updated`
**Date to Show**: Current date or update timestamp
**Content Boxes** (in order with borders):
1. Event info (left border)
2. Changes made box (right border)

**Special Considerations**:
- Changes box should highlight what changed
- Use a different background color for changes: `#fff3cd` with yellow border
- Format: List of changes with labels

### eventUpdatedToSignupsEmail
**Header Title**: `Event Update` or `Update: ${eventTitle}`
**Date to Show**: Event date or update date
**Content Boxes** (in order with borders):
1. Event info (left border)
2. Changes made box (right border)

**Special Considerations**:
- Include participant name: `Hi ${participantName},`
- Similar to eventUpdatedEmail but addressed to participant
- Changes box styling same as eventUpdatedEmail

## Step-by-Step Application Process

### Step 1: Replace Head Section
1. Replace `<meta charset="UTF-8">` with:
   ```html
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
   ```

### Step 2: Replace CSS in `<style>` Tag
1. Replace entire `<style>` section
2. Copy base styles from `eventCreatedEmail` template
3. Remove photo-specific styles (unless email needs photos)
4. Adjust event-details-glass margin if no photo overlay
5. Keep only relevant styles for that email type

### Step 3: Replace HTML Body Structure
1. Replace header with new header structure
2. Wrap content in `<div class="email-content">`
3. Replace content boxes with glass-box structure
4. Apply alternating border classes
5. Replace footer with new footer structure

### Step 4: Update Variable References
1. Ensure all template variables (${variable}) are correctly referenced
2. Format dates using `formatCreationDate()` or `formatDate()` as appropriate
3. Escape HTML content properly for user-generated text

### Step 5: Test Responsive Design
1. Verify mobile media queries are included
2. Test that boxes stack properly on mobile
3. Ensure text is readable at all sizes

## Validation Checklist

After applying the design, verify:
- [ ] Poppins font is imported and applied to body
- [ ] Header has EP logo (left) and date (right)
- [ ] Title is centered in header
- [ ] Background color is #F7F3ED throughout
- [ ] Glass boxes have alternating borders (left, right, left, right, none)
- [ ] Event details box uses 15% opaque glass
- [ ] Calendar buttons are teal (#0b6799) with light blue text (#d9f0fc)
- [ ] Footer is centered with warm beige background
- [ ] Mobile responsive styles are included
- [ ] All text is properly escaped and formatted
- [ ] Links are properly styled and functional

## Reference Implementation
See `eventCreatedEmail` function (lines ~351-780 in `lib/emailTemplates.js`) for complete reference implementation.

## Notes
- Not all emails need event photos - only apply photo section if relevant
- Some emails may not need calendar buttons - adjust accordingly
- The "Date to Show" in header varies by email purpose (creation date, event date, update date)
- Always maintain backward compatibility - don't break existing functionality
- Test emails in multiple clients (Gmail, Outlook, Apple Mail) after changes
