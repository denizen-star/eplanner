# Email Configuration Setup Guide

This guide provides step-by-step instructions for setting up email functionality in the Event Planner application.

## Table of Contents

1. [Install Dependencies](#1-install-dependencies)
2. [Database Migration](#2-database-migration)
3. [Production Setup (Netlify)](#3-production-setup-netlify)
4. [Local Development Setup](#4-local-development-setup)
5. [Testing Email Functionality](#5-testing-email-functionality)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Install Dependencies

The email functionality requires two Node.js packages: `nodemailer` and `js-yaml`.

### Step-by-Step Instructions

1. **Open Terminal/Command Prompt**
   - On macOS/Linux: Open Terminal
   - On Windows: Open Command Prompt or PowerShell

2. **Navigate to Project Directory**
   ```bash
   cd /Users/kervinleacock/Documents/Development/EventPlan
   ```
   (Adjust the path to match your project location)

3. **Install Dependencies**
   ```bash
   npm install
   ```
   This will read `package.json` and install all dependencies, including the newly added `nodemailer` and `js-yaml`.

4. **Verify Installation**
   ```bash
   npm list nodemailer js-yaml
   ```
   You should see both packages listed with their versions.

### What This Does

- Reads `package.json` which now includes:
  - `nodemailer` (^6.9.7) - For sending emails via SMTP
  - `js-yaml` (^4.1.0) - For parsing YAML configuration files
- Downloads and installs these packages into `node_modules/`
- Updates `package-lock.json` with exact versions

---

## 2. Database Migration

Before using email functionality, you need to add the `coordinator_email` column to your database.

### Step-by-Step Instructions

1. **Access PlanetScale Dashboard**
   - Go to https://planetscale.com
   - Log in to your account
   - Select your organization
   - Click on the `kervapps` database

2. **Open Development Branch**
   - Click on "Branches" in the left sidebar
   - Select your development branch (or create one if needed)
   - **Important**: Always run migrations on a development branch first, then promote to main

3. **Run the Migration**
   - Click on "Console" tab (or use PlanetScale CLI)
   - Open the file: `lib/migration-add-coordinator-email.sql`
   - Copy the SQL content:
     ```sql
     ALTER TABLE ep_events 
     ADD COLUMN coordinator_email VARCHAR(255) NULL;
     ```
   - Paste and execute in the PlanetScale console

4. **Update Existing Records (if any)**
   - If you have existing events, update them with a coordinator email:
     ```sql
     UPDATE ep_events 
     SET coordinator_email = 'default@example.com' 
     WHERE coordinator_email IS NULL;
     ```
   - Replace `'default@example.com'` with an appropriate default email

5. **Make Column Required (Optional)**
   - After updating all records, you can make the column required:
     ```sql
     ALTER TABLE ep_events 
     MODIFY COLUMN coordinator_email VARCHAR(255) NOT NULL;
     ```

6. **Promote to Main**
   - Once tested, create a deploy request to promote the changes to main branch
   - Review and merge the deploy request

### Verification

Run this query to verify the column exists:
```sql
DESCRIBE ep_events;
```
You should see `coordinator_email` in the column list.

---

## 3. Production Setup (Netlify)

**IMPORTANT**: For production, use Netlify Environment Variables. Never commit email credentials to git!

### Step-by-Step Instructions

1. **Access Netlify Dashboard**
   - Go to https://app.netlify.com
   - Sign in to your account
   - Click on your **Event Planner site**

2. **Navigate to Environment Variables**
   - In the top navigation, click **"Site settings"** (gear icon)
   - In the left sidebar, scroll down to **"Build & deploy"** section
   - Click on **"Environment variables"**

3. **Add Environment Variables**
   Click **"Add a variable"** for each of the following:

   #### Variable 1: EMAIL_ENABLED
   - **Key**: `EMAIL_ENABLED`
   - **Value**: `true`
   - **Scopes**: Select "All scopes" (or specific scopes if needed)
   - Click **"Add variable"**

   #### Variable 2: SMTP_SERVER
   - **Key**: `SMTP_SERVER`
   - **Value**: `smtp.zoho.com` (or your email provider's SMTP server)
     - Zoho Personal: `smtp.zoho.com`
     - Zoho Enterprise: `smtppro.zoho.com`
     - Gmail: `smtp.gmail.com`
     - Outlook: `smtp-mail.outlook.com`
     - Yahoo: `smtp.mail.yahoo.com`
   - **Scopes**: Select "All scopes"
   - Click **"Add variable"**

   #### Variable 3: SMTP_PORT
   - **Key**: `SMTP_PORT`
   - **Value**: `587` (or `465` for SSL)
     - Port 587 = TLS (recommended)
     - Port 465 = SSL
   - **Scopes**: Select "All scopes"
   - Click **"Add variable"**

   #### Variable 4: SENDER_EMAIL
   - **Key**: `SENDER_EMAIL`
   - **Value**: Your email address (e.g., `your-email@zoho.com`)
   - **Scopes**: Select "All scopes"
   - Click **"Add variable"**

   #### Variable 5: SENDER_PASSWORD
   - **Key**: `SENDER_PASSWORD`
   - **Value**: Your app-specific password (see below for how to get this)
   - **Scopes**: Select "All scopes"
   - Click **"Add variable"**
   - **Security Note**: This value is encrypted by Netlify and never visible in logs

   #### Variable 6: EMAIL_DEFAULT_RECIPIENT (Optional)
   - **Key**: `EMAIL_DEFAULT_RECIPIENT`
   - **Value**: Fallback email address (optional)
   - **Scopes**: Select "All scopes"
   - Click **"Add variable"**

4. **Get App-Specific Password**

   For Gmail, Zoho (with 2FA), and Yahoo, you need an app-specific password:

   **Gmail:**
   1. Go to https://myaccount.google.com
   2. Click "Security" → "2-Step Verification" (must be enabled)
   3. Scroll down to "App passwords"
   4. Select "Mail" and "Other (Custom name)"
   5. Enter "Event Planner" as the name
   6. Copy the 16-character password (spaces don't matter)
   7. Use this password in `SENDER_PASSWORD`

   **Zoho Mail:**
   1. Go to https://mail.zoho.com
   2. Settings → Account Security
   3. Scroll to "Application-Specific Passwords"
   4. Generate a new password
   5. Copy and use in `SENDER_PASSWORD`

   **Yahoo:**
   1. Go to https://login.yahoo.com
   2. Account Security → Generate app password
   3. Select "Mail" and your device
   4. Copy the generated password
   5. Use in `SENDER_PASSWORD`

5. **Verify Variables**
   - You should see all 5-6 variables listed
   - Check that values are correct (you can edit by clicking the variable)
   - Variables are case-sensitive: `EMAIL_ENABLED` not `email_enabled`

6. **Redeploy Site (if needed)**
   - Netlify automatically uses environment variables on next deploy
   - To apply immediately: Go to "Deploys" → "Trigger deploy" → "Deploy site"

### Environment Variable Summary

| Variable | Example Value | Required | Notes |
|----------|--------------|----------|-------|
| `EMAIL_ENABLED` | `true` | Yes | Set to `false` to disable emails |
| `SMTP_SERVER` | `smtp.zoho.com` | Yes | Your email provider's SMTP server |
| `SMTP_PORT` | `587` | Yes | 587 for TLS, 465 for SSL |
| `SENDER_EMAIL` | `your-email@zoho.com` | Yes | Email address to send from |
| `SENDER_PASSWORD` | `abcd efgh ijkl mnop` | Yes | App-specific password (not regular password) |
| `EMAIL_DEFAULT_RECIPIENT` | `fallback@example.com` | No | Optional fallback recipient |

---

## 4. Local Development Setup

For local development and testing, you can use a YAML configuration file.

### Step-by-Step Instructions

1. **Navigate to Config Directory**
   ```bash
   cd /Users/kervinleacock/Documents/Development/EventPlan
   ```

2. **Copy Example File**
   ```bash
   cp config/email_config.yaml.example config/email_config.yaml
   ```
   
   Or manually:
   - Open `config/email_config.yaml.example`
   - Copy all contents
   - Create new file: `config/email_config.yaml`
   - Paste contents

3. **Edit Configuration File**
   Open `config/email_config.yaml` in a text editor and update:

   ```yaml
   email:
     enabled: true  # Change from false to true
     smtp_server: smtp.zoho.com  # Your SMTP server
     smtp_port: 587  # 587 for TLS, 465 for SSL
     sender_email: "your-email@zoho.com"  # Your email address
     sender_password: "your-app-specific-password"  # App-specific password
     recipient_email: "your-email@zoho.com"  # Optional fallback
   ```

4. **Save the File**
   - Make sure to save `config/email_config.yaml`
   - **Important**: This file is gitignored and will NOT be committed to git

5. **Verify Git Ignore**
   Check that `.gitignore` includes:
   ```
   config/email_config.yaml
   ```

### Configuration Priority

The application checks configuration in this order:
1. **Environment variables** (if set) - Used in production/Netlify
2. **YAML config file** (if exists) - Used for local development
3. **Disabled** (if neither exists) - Email functionality is disabled

This means:
- In Netlify: Environment variables are used (YAML file is ignored)
- Locally: YAML file is used (if environment variables aren't set)

---

## 5. Testing Email Functionality

### Test Email Configuration

1. **Create a Test Event**
   - Go to your local development server or Netlify site
   - Navigate to "Coordinate an Event"
   - Fill in the form including:
     - **Coordinator Email**: Use your real email address
     - All other required fields
   - Submit the form

2. **Check Your Email**
   - You should receive a confirmation email at the coordinator email address
   - Check spam/junk folder if not in inbox
   - Email should include:
     - Event details
     - Signup link
     - Management link

3. **Test Signup Email**
   - Use the signup link from the confirmation email
   - Sign up with an email address
   - Check both:
     - Attendee email (confirmation)
     - Coordinator email (notification)

4. **Test Update Email**
   - Use the management link
   - Update the event (change location, date, etc.)
   - Check emails:
     - Coordinator receives update notification
     - All signups with emails receive update notification

### Verify Email Service Status

Check server logs for email status:
- `[EMAIL SERVICE] Email sent successfully` = Working
- `[EMAIL SERVICE] Email is disabled` = Configuration issue
- `[EMAIL SERVICE] Error sending email` = Check credentials/SMTP settings

---

## 6. Troubleshooting

### Email Not Sending

**Check 1: Email Enabled?**
- Verify `EMAIL_ENABLED=true` in Netlify (or `enabled: true` in YAML)
- Check logs for: `Email service is disabled`

**Check 2: SMTP Credentials**
- Verify `SENDER_EMAIL` and `SENDER_PASSWORD` are correct
- For Gmail/Zoho/Yahoo: Must use app-specific password, not regular password
- Check logs for: `Authentication failed` or `Invalid login`

**Check 3: SMTP Server/Port**
- Verify `SMTP_SERVER` matches your email provider
- Verify `SMTP_PORT` is correct (587 for TLS, 465 for SSL)
- Check logs for: `Connection refused` or `Connection timeout`

**Check 4: Firewall/Network**
- Some networks block SMTP ports
- Try from different network
- Check logs for: `ETIMEDOUT` or connection errors

**Check 5: Email in Spam**
- Check spam/junk folder
- Add sender email to contacts
- Verify sender email reputation

### Common Error Messages

| Error | Solution |
|-------|----------|
| `Authentication failed` | Use app-specific password, not regular password |
| `Connection refused` | Check SMTP_SERVER and SMTP_PORT are correct |
| `Email service is disabled` | Set EMAIL_ENABLED=true or enabled: true |
| `Missing required fields` | Verify all environment variables are set |
| `Invalid email format` | Check coordinator email format in form |

### Testing SMTP Connection

You can test your SMTP settings using a simple Node.js script:

```javascript
// test-email.js
const EmailService = require('./lib/emailService');

async function test() {
  const emailService = new EmailService();
  console.log('Email enabled:', emailService.isEnabled());
  
  if (emailService.isEnabled()) {
    const result = await emailService.sendEmail({
      to: 'your-test-email@example.com',
      subject: 'Test Email',
      html: '<h1>Test</h1><p>This is a test email.</p>',
      text: 'Test: This is a test email.'
    });
    console.log('Email sent:', result);
  }
}

test();
```

Run: `node test-email.js`

---

## Additional Resources

- **Email Provider Documentation**:
  - Zoho: https://www.zoho.com/mail/help/zoho-smtp.html
  - Gmail: https://support.google.com/mail/answer/7126229
  - Outlook: https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-8361e398-8af4-4e97-b147-6c6c4ac95353

- **Email Troubleshooting**: See [Email Troubleshooting](EMAIL_TROUBLESHOOTING.md)

- **Netlify Environment Variables**: See [Netlify Environment Variables Setup](../setup/NETLIFY_ENV_VARS_SETUP.md)

---

## Security Reminders

1. **Never commit credentials to git**
   - `config/email_config.yaml` is gitignored
   - Only `config/email_config.yaml.example` is committed

2. **Use app-specific passwords**
   - Never use your main account password
   - Generate app-specific passwords for Gmail/Zoho/Yahoo

3. **Rotate passwords regularly**
   - Update passwords in Netlify environment variables
   - Update passwords in local config file

4. **Limit access**
   - Only trusted team members should have access to Netlify environment variables
   - Use dedicated email account for automated emails if possible

---

**Last Updated**: 2025-01-09
