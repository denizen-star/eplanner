const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * EmailService - Utility class for sending emails via SMTP
 * 
 * Configuration priority:
 * 1. Environment variables (production/Netlify)
 * 2. YAML config file (local development fallback)
 * 
 * Environment variables:
 * - EMAIL_ENABLED (true/false)
 * - SMTP_SERVER (e.g., smtp.zoho.com)
 * - SMTP_PORT (587 or 465)
 * - SENDER_EMAIL (your email address)
 * - SENDER_PASSWORD (app-specific password)
 * - EMAIL_DEFAULT_RECIPIENT (optional fallback)
 */
class EmailService {
  constructor(configPath = null) {
    this.config = this._loadConfig(configPath);
    this.enabled = this.config.enabled || false;
  }

  /**
   * Load email configuration from environment variables or YAML file
   * @param {string|null} configPath - Path to YAML config file (optional)
   * @returns {Object} Email configuration object
   */
  _loadConfig(configPath) {
    // Priority 1: Environment variables (production/Netlify)
    if (process.env.EMAIL_ENABLED || process.env.SMTP_SERVER) {
      // Handle case-insensitive EMAIL_ENABLED (TRUE, true, True all work)
      const emailEnabled = process.env.EMAIL_ENABLED 
        ? String(process.env.EMAIL_ENABLED).toLowerCase() === 'true'
        : false;
      
      return {
        enabled: emailEnabled,
        smtpServer: process.env.SMTP_SERVER,
        smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
        senderEmail: process.env.SENDER_EMAIL,
        senderPassword: process.env.SENDER_PASSWORD,
        defaultRecipient: process.env.EMAIL_DEFAULT_RECIPIENT || null,
      };
    }

    // Priority 2: YAML config file (local development fallback)
    if (!configPath) {
      configPath = path.join(__dirname, '..', 'config', 'email_config.yaml');
    }

    if (fs.existsSync(configPath)) {
      try {
        const fileContents = fs.readFileSync(configPath, 'utf8');
        const yamlConfig = yaml.load(fileContents);
        const emailConfig = yamlConfig.email || {};

        return {
          enabled: emailConfig.enabled || false,
          smtpServer: emailConfig.smtp_server,
          smtpPort: emailConfig.smtp_port || 587,
          senderEmail: emailConfig.sender_email,
          senderPassword: emailConfig.sender_password,
          defaultRecipient: emailConfig.recipient_email || null,
        };
      } catch (error) {
        console.error('[EMAIL SERVICE] Error loading YAML config:', error.message);
        return { enabled: false };
      }
    }

    // No configuration found
    return { enabled: false };
  }

  /**
   * Check if email is enabled
   * @returns {boolean}
   */
  isEnabled() {
    // Ensure we always return a boolean, not a truthy value like a password string
    const isEnabled = !!(this.enabled && this.config.smtpServer && this.config.senderEmail && this.config.senderPassword);
    
    if (!isEnabled) {
      const missingVars = [];
      if (!this.enabled) missingVars.push('EMAIL_ENABLED (or not set to true)');
      if (!this.config.smtpServer) missingVars.push('SMTP_SERVER');
      if (!this.config.senderEmail) missingVars.push('SENDER_EMAIL');
      if (!this.config.senderPassword) missingVars.push('SENDER_PASSWORD');
      
      // NEVER log passwords - only boolean flags
      console.log('[EMAIL SERVICE] Email disabled. Status:', {
        enabled: !!this.enabled, // Ensure boolean
        hasSmtpServer: !!this.config.smtpServer,
        hasSenderEmail: !!this.config.senderEmail,
        hasSenderPassword: !!this.config.senderPassword, // Only boolean, never actual password
        configSource: process.env.EMAIL_ENABLED || process.env.SMTP_SERVER ? 'environment' : 'yaml',
        missingVariables: missingVars.length > 0 ? missingVars : 'none (check individual fields)'
      });
      
      if (missingVars.length > 0) {
        console.warn('[EMAIL SERVICE] Missing or invalid environment variables:', missingVars.join(', '));
      }
    }
    
    return isEnabled;
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address(es) - can be string or array
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} [options.text] - Plain text content (optional)
   * @param {string|string[]} [options.cc] - CC recipients (optional)
   * @param {string|string[]} [options.bcc] - BCC recipients (optional)
   * @param {string} [options.fromName] - Display name for "From" field (optional)
   * @returns {Promise<boolean>} True if email sent successfully, false otherwise
   */
  async sendEmail(options) {
    if (!this.isEnabled()) {
      console.log('[EMAIL SERVICE] Email is disabled or configuration is incomplete');
      // NEVER log passwords - only boolean flags and non-sensitive config
      console.log('[EMAIL SERVICE] Configuration check:', {
        enabled: !!this.enabled, // Ensure boolean
        smtpServer: this.config.smtpServer || 'MISSING',
        senderEmail: this.config.senderEmail || 'MISSING',
        hasPassword: !!this.config.senderPassword // Only boolean, never actual password
      });
      return false;
    }

    const { to, subject, html, text, cc, bcc, fromName } = options;

    if (!to || !subject || !html) {
      console.error('[EMAIL SERVICE] Missing required email fields: to, subject, or html');
      return false;
    }

    try {
      // Create transporter based on port (SSL for 465, TLS for 587)
      // Port 465 requires secure: true (implicit SSL)
      // Port 587 requires secure: false with requireTLS: true (STARTTLS)
      const isSecurePort = this.config.smtpPort === 465;
      const transporter = nodemailer.createTransport({
        host: this.config.smtpServer,
        port: this.config.smtpPort,
        secure: isSecurePort, // true for 465 (SSL), false for 587 (TLS)
        auth: {
          user: this.config.senderEmail,
          pass: this.config.senderPassword,
        },
        // For port 587 (TLS), explicitly require TLS
        ...(this.config.smtpPort === 587 && {
          requireTLS: true,
          tls: {
            rejectUnauthorized: false // Some servers have self-signed certs
          }
        }),
        // For port 465 (SSL), ensure proper SSL handling
        ...(isSecurePort && {
          tls: {
            rejectUnauthorized: false // Some servers have self-signed certs
          }
        })
      });

      // Format "From" field with display name if provided
      const fromField = fromName 
        ? `${fromName} <${this.config.senderEmail}>`
        : this.config.senderEmail;

      // Prepare email message
      const mailOptions = {
        from: fromField,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subject,
        html: html,
      };

      // Add plain text version if provided
      if (text) {
        mailOptions.text = text;
      }

      // Add CC and BCC if provided
      if (cc) {
        mailOptions.cc = Array.isArray(cc) ? cc.join(', ') : cc;
      }
      if (bcc) {
        mailOptions.bcc = Array.isArray(bcc) ? bcc.join(', ') : bcc;
      }

      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log('[EMAIL SERVICE] Email sent successfully:', {
        messageId: info.messageId,
        to: to,
        subject: subject,
      });
      return true;
    } catch (error) {
      console.error('[EMAIL SERVICE] Error sending email:', error.message);
      // Don't throw - fail gracefully
      return false;
    }
  }

  /**
   * Send email to multiple recipients (using BCC for privacy)
   * @param {string[]} recipients - Array of recipient email addresses
   * @param {string} subject - Email subject
   * @param {string} html - HTML content
   * @param {string} [text] - Plain text content (optional)
   * @returns {Promise<boolean>} True if email sent successfully, false otherwise
   */
  async sendEmailToMultiple(recipients, subject, html, text = null) {
    if (!recipients || recipients.length === 0) {
      console.log('[EMAIL SERVICE] No recipients provided');
      return false;
    }

    // Filter out invalid email addresses
    const validRecipients = recipients.filter(email => email && email.includes('@'));

    if (validRecipients.length === 0) {
      console.log('[EMAIL SERVICE] No valid email addresses found');
      return false;
    }

    // Use BCC to send to multiple recipients while keeping them private
    return await this.sendEmail({
      to: this.config.senderEmail, // Send to self, then BCC to all recipients
      bcc: validRecipients,
      subject: subject,
      html: html,
      text: text,
    });
  }
}

module.exports = EmailService;
