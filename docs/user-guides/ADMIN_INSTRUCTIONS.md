# Guide for Administrators: Managing Events

Welcome to the Event Planner Admin Dashboard! This comprehensive guide will help you manage all aspects of events, from creating new events to viewing signups and managing participants. As an administrator, you have full access to all events and can perform administrative tasks to keep the platform running smoothly.

## Overview

The Admin Dashboard provides you with:
- A complete view of all events (past and future) in collapsible sections
- Ability to create new events
- Edit existing event details
- View signups for any event
- Copy signup and management links
- Delete events
- Remove individual signups
- **Event Report**: View and sort all events with detailed statistics
- **Participants Report**: View participant participation statistics and engagement metrics
- **Tenant Manager**: Manage domain tenants and branding (admin-password protected)

This guide will walk you through each of these features in detail.

## Accessing the Admin Dashboard

1. Navigate to the Event Planner website
2. On desktop: Click on **"Admin"** in the navigation menu at the top of the page
3. On mobile: Tap the hamburger menu (☰) icon, then tap **"Admin"**
4. You'll see the Admin Dashboard with collapsible sections

**Note**: The Admin Dashboard is organized into collapsible sections that you can expand or collapse as needed:
- **Admin Dashboard**: Main event management interface
- **Event Report**: Detailed report of all events with sorting capabilities
- **Participants Report**: Statistics about participant participation
- **Tenant Manager**: Manage domain tenants and branding

[SCREENSHOT: Admin Dashboard showing collapsible sections]
[SCREENSHOT: Mobile view showing hamburger menu]

## Admin Login (Password)

Admin features are protected by an **admin password** (the same value as `ADMIN_PASSWORD` in your server/Netlify environment).

- When you expand **any** admin section for the first time, a **modal** will prompt you for the admin password.
- After you log in, the password is remembered for the current browser session.
- If you enter the wrong password, you’ll be prompted again.

## Admin Dashboard Section

The main Admin Dashboard section contains the event management interface. Click on the **"Admin Dashboard"** section header to expand it.

### Viewing All Events

The Admin Dashboard displays all events in a compact list format. Each event shows:

- **Location**: Where the event is taking place
- **Event Title**: The optional title given to the event (if provided by the activity coordinator)
- **Activity Coordinator Name**: The person organizing the event
- **Date & Time**: When the event is scheduled
- **Signups**: Current number of signups vs. maximum participants (e.g., "5 / 10")
- **Status**: "Open" (spots available) or "Full" (no spots remaining)

Events are sorted by date/time, with the newest events appearing first.

[SCREENSHOT: List of events showing all the information columns]

### Understanding the Event List

- **Green "Open" badge**: The event still has spots available
- **Red "Full" badge**: The event has reached its maximum capacity
- Each row is clickable and contains action buttons

## Creating a New Event

You can create a new event directly from the Admin Dashboard:

1. Expand the **"Admin Dashboard"** section if it's collapsed
2. Click the **"Create New Event"** button at the top of the dashboard
3. This will take you to the "Coordinate an Event" page
4. Follow the same process as activity coordinators (see the Activity Coordinator Instructions guide for detailed steps)
5. After creating the event, you'll be returned to the Admin Dashboard where you can see your new event

[SCREENSHOT: "Create New Event" button in the Admin Dashboard section]

**Note**: Creating an event from the Admin Dashboard works exactly the same as when activity coordinators create events. You'll receive signup and management links just like any other activity coordinator.

## Viewing Event Details and Signups

For each event in the list, you can view detailed information and signups:

### Viewing Links

1. Click the **"Links"** button on any event row
2. A dropdown will expand showing:
   - **Signup Link**: The public link for attendees to register
   - **Management Link**: The private link for the activity coordinator to manage signups
3. You can click on either link to open it, or click the **"Copy"** button to copy the link to your clipboard

[SCREENSHOT: Links dropdown showing both signup and management links with copy buttons]

### Viewing Signups

1. Click the **"Signups"** button on any event row
2. A dropdown will expand showing a list of all registered attendees
3. Each signup displays:
   - Attendee's name
   - Phone number (clickable to call)
   - Email address (if provided)
   - Instagram handle (if provided, clickable to view profile)
   - Signup date and time
   - Waiver acceptance status

[SCREENSHOT: Signups dropdown showing list of registered attendees with all their information]

**Tip**: Use the "Links" and "Signups" buttons to quickly access information without leaving the dashboard.

## Editing a Run

You can edit any run's details directly from the Admin Dashboard:

1. Click the **"Edit"** button on the run you want to modify
2. The run row will expand to show an edit form
3. You'll see a map showing the current location (if available)
4. Fill in or modify the following fields:
   - **Location**: Update the run location (the map will update as you type)
   - **Pacer Name**: Change the pacer's name
   - **Date and Time**: Modify the scheduled date and time
   - **Max Participants**: Adjust the maximum number of participants

[SCREENSHOT: Edit form expanded showing all editable fields and the map]

5. Review the changes, especially the location on the map
6. Click **"Save Changes"** to update the run
7. Or click **"Cancel"** to discard your changes

[SCREENSHOT: Save Changes and Cancel buttons in the edit form]

**Important Notes:**
- Editing a run does not affect existing signups
- If you reduce the max participants below the current number of signups, the run will show as "Full" but existing signups remain
- The signup and management links remain the same after editing

## Copying Links

You can easily copy links for any event:

1. Click the **"Links"** button on an event
2. In the dropdown, you'll see both the Signup Link and Management Link
3. Click the **"Copy"** button next to the link you want to copy
4. A confirmation will appear that the link has been copied to your clipboard
5. You can now paste the link wherever you need it (WhatsApp, email, etc.)

[SCREENSHOT: Copy button being clicked with confirmation message]

**Use Cases:**
- Share the signup link with attendees if the activity coordinator needs help distributing it
- Provide the management link to an activity coordinator who lost their original link
- Copy links for documentation or communication purposes

## Deleting an Event

If you need to remove an event from the system:

1. Click the **"Delete"** button on the event you want to remove
2. A confirmation dialog will appear asking: "Are you sure you want to delete this event? This action cannot be undone."
3. Click **"OK"** to confirm deletion, or **"Cancel"** to keep the event

[SCREENSHOT: Delete confirmation dialog]

**Warning**: Deleting an event is permanent and cannot be undone. All signups associated with that event will also be deleted.

**When to Delete:**
- An event was created by mistake
- An event needs to be cancelled and removed from the system
- Cleaning up old or expired events

**Alternative**: Instead of deleting, you could edit the event to change the date or other details if you just need to modify it.

## Managing Individual Signups

While you can view signups from the Admin Dashboard, to delete individual signups you'll need to:

1. Click the **"Signups"** button to view the list of signups
2. Click on the **Management Link** for that event (or use the "Links" button to get it)
3. This will take you to the event management page
4. Expand the "Signups" section
5. Click the **"Delete"** button next to the attendee you want to remove
6. Confirm the deletion

[SCREENSHOT: Management page showing delete button next to a signup]

**Note**: The Admin Dashboard shows signups in read-only mode. To delete individual signups, use the management link for that specific event.

## Event Report Section

The Event Report provides a comprehensive view of all events with advanced sorting and filtering capabilities.

### Accessing the Event Report

1. Click on the **"Event Report"** section header to expand it
2. The report will load and display all events in a table format

[SCREENSHOT: Event Report section expanded]

### Event Report Features

The Event Report table includes the following columns:
- **City**: The city where the event is located
- **Created (EST)**: When the event was created
- **Scheduled Date**: When the event is scheduled to occur
- **Activity Coordinator**: The name of the activity coordinator organizing the event
- **Status**: Whether the event is "Open" or "Full"
- **Title**: The optional event title (if provided)
- **Location**: The full location address
- **Manage**: Link to manage the event

### Sorting the Event Report

You can sort the report by clicking on any column header:
- Click **"City"** to sort by location
- Click **"Created (EST)"** to sort by creation date
- Click **"Scheduled Date"** to sort by event date
- Click **"Activity Coordinator"** to sort by activity coordinator name
- Click **"Status"** to sort by availability

Click the same header again to reverse the sort order. An arrow indicator (↑ or ↓) shows the current sort direction.

[SCREENSHOT: Event Report table with sortable column headers]

## Participants Report Section

The Participants Report provides detailed statistics about participant participation and engagement.

### Accessing the Participants Report

1. Click on the **"Participants Report"** section header to expand it
2. The report will load and display all participants with their participation statistics

[SCREENSHOT: Attendees Report section expanded]

### Participants Report Features

The Participants Report shows:
- **Attendee Name**: The name of the attendee
- **Email**: The attendee's email address (if provided)
- **Phone Number**: The attendee's phone number (used as unique identifier)
- **# of Events**: Total number of events the attendee has signed up for
- **# of Activity Coordinators**: Number of different activity coordinators the attendee has participated with

### Sorting the Participants Report

You can sort the report by clicking on any column header:
- Click **"Attendee Name"** to sort alphabetically by name
- Click **"Email"** to sort by email address
- Click **"Phone Number"** to sort by phone
- Click **"# of Events"** to sort by participation (most active attendees first)
- Click **"# of Activity Coordinators"** to sort by diversity of activity coordinators

[SCREENSHOT: Attendees Report table showing attendee statistics]

**Note**: Phone number is used as the unique identifier for tracking attendee participation across multiple events.

## Refreshing the Dashboard

To see the latest updates:

1. Expand the **"Admin Dashboard"** section
2. Click the **"Refresh"** button at the top of the dashboard
3. The page will reload and show the most current information
4. This is useful if:
   - New events have been created
   - Signups have been added to events
   - You want to see updated status badges

[SCREENSHOT: Refresh button location in Admin Dashboard section]

## Additional Features

### Collapsible Sections

The Admin Dashboard uses collapsible sections to organize information:
- **Expand/Collapse**: Click on any section header to expand or collapse it
- **Multiple Sections**: You can have multiple sections open at once
- **Organized Layout**: Keeps the interface clean and easy to navigate
- **Section Icons**: Arrow icons (▶/▼) indicate whether a section is expanded or collapsed

### Mobile Navigation

The platform is fully mobile-friendly:
- **Hamburger Menu**: On mobile devices, tap the ☰ icon to access the navigation menu
- **User Guides**: Access all instruction guides directly from the navigation menu
- **Touch-Optimized**: All buttons and tables are optimized for mobile interaction

### Event Title Display

Events may now include an optional title:
- Titles appear in the event list and reports
- Help identify events more easily
- Displayed prominently in the signup pages
- Useful for organizing and finding specific events

## Tips for Administrators

### Daily Management

- **Check regularly**: Review the dashboard daily to monitor event activity
- **Monitor capacity**: Keep an eye on events that are getting full
- **Verify information**: Ensure event details (location, time) are accurate
- **Stay organized**: Use the dashboard to keep track of all upcoming events

### Best Practices

- **Verify locations**: When editing events, always check that the map shows the correct location
- **Communicate changes**: If you edit an event, consider notifying the activity coordinator and registered attendees
- **Backup important data**: Before deleting events, ensure you have any needed information saved
- **Help activity coordinators**: Be ready to assist activity coordinators who need help accessing their management links

### Working with Activity Coordinators

- **Respect activity coordinator autonomy**: Activity coordinators manage their own events through their management links
- **Provide support**: Help activity coordinators who have lost their management links by providing them from the dashboard
- **Coordinate when needed**: Use the dashboard to coordinate between multiple activity coordinators and events

### Data Management

- **Regular cleanup**: Periodically review and delete old or cancelled events
- **Monitor signups**: Keep an eye on signup patterns to help plan future events
- **Track capacity**: Use the dashboard to understand which events are popular and adjust accordingly

## Tenant Manager Section

The Tenant Manager is for domain tenants + branding overrides.

1. Expand the **"Tenant Manager"** section
2. Click **"Log in"** (you’ll be prompted in a modal for the admin password)
3. Create/edit tenants and branding settings as needed
4. Click **"Log out"** to clear the stored admin password for this session

## Troubleshooting

### I can't see any events in the dashboard

- Click the **"Refresh"** button to reload the data
- Check your internet connection
- Expand an admin section and enter the admin password when prompted
- Contact technical support if the issue persists

### The edit form won't save changes

- Make sure all required fields are filled out
- Verify the date/time is in the future
- Check that max participants is a number greater than 0
- Ensure the location is valid (the map should display it)
- Try refreshing the page and editing again

### I can't delete an event

- Make sure you clicked "OK" in the confirmation dialog
- Check your internet connection
- Try refreshing the page and attempting again
- Some events may be protected from deletion (contact technical support if needed)

### The map isn't showing in the edit form

- Make sure you've entered a valid location
- Wait a moment for the map to load
- Try refreshing the page
- Check your internet connection

### Links aren't copying

- Make sure you clicked the "Copy" button (not just the link itself)
- Check if your browser allows clipboard access
- Try a different browser if the issue persists
- You can always manually select and copy the link text

### Signups aren't updating

- Click the **"Refresh"** button to reload the latest data
- Signups update in real-time, but you may need to refresh to see changes
- Check the individual event's management link for the most up-to-date signup count

## WhatsApp Quick Guide

👨‍💼 **Quick Guide: Admin Dashboard**

**Viewing Events:**
📋 See all events with status (Open/Full)
🔄 Click "Refresh" for latest updates

**Creating Events:**
➕ Click "Create New Event" button
📝 Fill form & get signup/management links

**Managing Events:**
🔗 Click "Links" to view/copy signup & management links
👥 Click "Signups" to see registered attendees
✏️ Click "Edit" to modify event details
🗑️ Click "Delete" to remove an event

**Quick Actions:**
📋 Copy links to share with activity coordinators/attendees
👀 Monitor signup counts & capacity
✅ Verify event details are accurate

💡 Tip: Use "Links" button to quickly help activity coordinators who lost their management link!

---

*Need help? Contact technical support or refer to the full guide for detailed instructions.*

