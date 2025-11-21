# Event Planner

Community event management platform for coordinating and managing events.

## Features

- Event Scheduling: Easy-to-use interface for organizing regular events and special occasions
- Community Building: Foster connections among members with social features
- Safety Tools: Built-in safety features for community protection
- Attendance Tracking: Monitor participation and engagement metrics

## Getting Started

### Prerequisites

- Node.js 14.0.0 or higher
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

Start the development server:
```bash
npm run dev
```

Or start the production server:
```bash
npm start
```

The server will run on port 3000 by default (or the port specified in the PORT environment variable).

## Usage

### Coordinate an Event

1. Navigate to the "Coordinate an Event" page
2. Fill in the location, date/time, and maximum number of participants
3. Submit the form to generate signup and management links
4. Share the signup link with participants
5. Use the management link to view signups

### Sign Up for an Event

1. Click on a signup link
2. Fill in your name and phone number
3. Read and accept the waiver
4. Submit to complete signup

### Manage Events

Use the admin dashboard to:
- View all events
- Edit event details
- View signups for each event
- Delete events

## Project Structure

```
eplanner/
├── index.html          # Homepage
├── coordinate.html     # Event coordination page
├── signup.html         # Public signup page
├── manage.html         # Event management page
├── admin.html          # Admin CRUD interface
├── server.js           # Express API server
├── package.json        # Dependencies
├── netlify.toml        # Netlify configuration
├── assets/
│   ├── css/
│   │   └── main.css    # Main stylesheet
│   └── js/
│       ├── coordinate.js
│       ├── signup.js
│       ├── manage.js
│       └── admin.js
└── data/
    ├── runs/           # Event data files
    └── waivers/        # Waiver signature files
```

## API Endpoints

- `POST /api/runs/create` - Create a new event
- `GET /api/runs` - Get all events
- `GET /api/runs/:runId` - Get a specific event
- `POST /api/runs/:runId/signup` - Sign up for an event
- `GET /api/runs/:runId/signups` - Get signups for an event
- `PUT /api/runs/:runId` - Update an event
- `DELETE /api/runs/:runId` - Delete an event

## Deployment

The application is configured for deployment on Netlify. The `netlify.toml` file contains the necessary configuration for redirects, headers, and caching.

## License

MIT

