# Email Troubleshooting Guide

## Event Created But Email Not Sent

If events are being created successfully but emails are not being sent, follow this troubleshooting guide.

## Quick Diagnostic Steps

### Step 1: Check Server Logs

Look for these log messages in your server/Netlify function logs:

**If you see:**
```
[EMAIL SERVICE] Email disabled. Status: { enabled: false, ... }
```
**Problem**: Email is disabled in configuration

**If you see:**
```
[RUNS CREATE] Email service is disabled or configuration incomplete
```
**Problem**: Missing required configuration values

**If you see:**
```
[EMAIL SERVICE] Error sending email: [error message]
```
**Problem**: SMTP connection or authentication issue

### Step 2: Check Configuration

#### For Netlify (Production):

1. Go to Netlify Dashboard → Site settings → Environment variables
2. Verify these variables are set:
   - `EMAIL_ENABLED` = `true` (must be the string "true", not boolean)
   - `SMTP_SERVER` = your SMTP server (e.g., `smtp.zoho.com`)
   - `SMTP_PORT` = `587` or `465`
   - `SENDER_EMAIL` = your email address
   - `SENDER_PASSWORD` = your app-specific password

3. **Important**: After adding/updating environment variables, you may need to:
   - Trigger a new deploy, OR
   - Wait for the next automatic deploy

#### For Local Development:

1. Check if `config/email_config.yaml` exists
2. If not, copy from example:
   ```bash
   cp config/email_config.yaml.example config/email_config.yaml
   ```
3. Edit `config/email_config.yaml` and set:
   ```yaml
   email:
     enabled: true  # Must be true
     smtp_server: smtp.zoho.com
     smtp_port: 587
     sender_email: "your-email@zoho.com"
     sender_password: "your-app-specific-password"
   ```

### Step 3: Verify Email Service Status

The logs will now show detailed diagnostic information:

```
[RUNS CREATE] Email service status: {
  enabled: true/false,
  isEnabled: true/false,
  hasSmtpServer: true/false,
  hasSenderEmail: true/false,
  hasSenderPassword: true/false,
  smtpServer: 'smtp.zoho.com' or 'NOT SET',
  senderEmail: 'your@email.com' or 'NOT SET',
  hasPassword: true/false
}
```

**What to check:**
- `enabled` should be `true`
- `isEnabled` should be `true`
- All `has*` fields should be `true`
- `smtpServer` and `senderEmail` should show actual values (not "NOT SET")
- `hasPassword` should be `true`

## Common Issues and Solutions

### Issue 1: "Email service is disabled"

**Symptoms:**
- Log shows: `Email service is disabled or configuration incomplete`
- `enabled: false` in diagnostic logs

**Solutions:**
1. **Netlify**: Set `EMAIL_ENABLED=true` in environment variables
2. **Local**: Set `enabled: true` in `config/email_config.yaml`
3. **Both**: Make sure the value is the string `"true"`, not boolean `true`

### Issue 2: "Configuration incomplete"

**Symptoms:**
- `isEnabled: false` but `enabled: true`
- One or more `has*` fields are `false`
- `smtpServer` or `senderEmail` shows "NOT SET"

**Solutions:**
1. **Missing SMTP_SERVER**: Set `SMTP_SERVER` environment variable (Netlify) or `smtp_server` in YAML
2. **Missing SENDER_EMAIL**: Set `SENDER_EMAIL` environment variable (Netlify) or `sender_email` in YAML
3. **Missing SENDER_PASSWORD**: Set `SENDER_PASSWORD` environment variable (Netlify) or `sender_password` in YAML

### Issue 3: "Authentication failed"

**Symptoms:**
- Log shows: `Error sending email: Invalid login` or `Authentication failed`
- Email service is enabled but sending fails

**Solutions:**
1. **Use app-specific password**: For Gmail, Zoho (with 2FA), and Yahoo, you MUST use an app-specific password, not your regular password
2. **Check password**: Verify the password in environment variables/YAML is correct
3. **Check email**: Verify `SENDER_EMAIL` matches the account the password is for

### Issue 4: "Connection refused" or "Connection timeout"

**Symptoms:**
- Log shows: `Error sending email: Connection refused` or `ETIMEDOUT`
- Cannot connect to SMTP server

**Solutions:**
1. **Check SMTP_SERVER**: Verify the server address is correct:
   - Zoho: `smtp.zoho.com` (personal) or `smtppro.zoho.com` (enterprise)
   - Gmail: `smtp.gmail.com`
   - Outlook: `smtp-mail.outlook.com`
   - Yahoo: `smtp.mail.yahoo.com`
2. **Check SMTP_PORT**: 
   - Port 587 = TLS (most common)
   - Port 465 = SSL
3. **Check firewall**: Some networks block SMTP ports

### Issue 5: Email sent but not received

**Symptoms:**
- Log shows: `Email sent successfully`
- But email never arrives

**Solutions:**
1. **Check spam folder**: Emails often go to spam initially
2. **Check sender reputation**: New email accounts may be flagged
3. **Verify recipient email**: Double-check the coordinator email address
4. **Check email provider**: Some providers delay or block automated emails

## Diagnostic Commands

### Test Email Configuration (Local Development)

Create a test file `test-email.js`:

```javascript
const EmailService = require('./lib/emailService');

async function test() {
  const emailService = new EmailService();
  
  console.log('Email Configuration:');
  console.log('  Enabled:', emailService.enabled);
  console.log('  Is Enabled:', emailService.isEnabled());
  console.log('  SMTP Server:', emailService.config.smtpServer || 'NOT SET');
  console.log('  SMTP Port:', emailService.config.smtpPort || 'NOT SET');
  console.log('  Sender Email:', emailService.config.senderEmail || 'NOT SET');
  console.log('  Has Password:', !!emailService.config.senderPassword);
  
  if (emailService.isEnabled()) {
    console.log('\nAttempting to send test email...');
    const result = await emailService.sendEmail({
      to: 'your-test-email@example.com',
      subject: 'Test Email',
      html: '<h1>Test</h1><p>This is a test email.</p>',
      text: 'Test: This is a test email.'
    });
    console.log('Email sent:', result ? 'SUCCESS' : 'FAILED');
  } else {
    console.log('\nEmail service is not enabled. Check configuration.');
  }
}

test().catch(console.error);
```

Run: `node test-email.js`

## Environment Variable Checklist

For Netlify, verify all these are set:

- [ ] `EMAIL_ENABLED` = `true` (string, not boolean)
- [ ] `SMTP_SERVER` = your SMTP server address
- [ ] `SMTP_PORT` = `587` or `465`
- [ ] `SENDER_EMAIL` = your email address
- [ ] `SENDER_PASSWORD` = app-specific password (if using Gmail/Zoho/Yahoo with 2FA)

## YAML Config Checklist

For local development, verify `config/email_config.yaml` has:

- [ ] `email.enabled` = `true` (boolean or string "true")
- [ ] `email.smtp_server` = your SMTP server address
- [ ] `email.smtp_port` = `587` or `465`
- [ ] `email.sender_email` = your email address
- [ ] `email.sender_password` = app-specific password

## Still Not Working?

1. **Check Netlify Function Logs**:
   - Go to Netlify Dashboard → Functions → View logs
   - Look for `[EMAIL SERVICE]` and `[RUNS CREATE]` log messages
   - Check for any error messages

2. **Verify Environment Variables Are Applied**:
   - Environment variables are only available after a new deploy
   - If you just added them, trigger a new deploy

3. **Test SMTP Connection Manually**:
   - Use the test script above
   - Or use a tool like `telnet` or `openssl` to test SMTP connection

4. **Check Email Provider Status**:
   - Some providers have rate limits
   - Some providers block automated emails initially
   - Check your email provider's status page

## Next Steps

After fixing the configuration:
1. Create a new event
2. Check the logs for `[RUNS CREATE] Email service status`
3. Verify `isEnabled: true`
4. Check for `Email sent successfully` message
5. Check your email inbox (and spam folder)
