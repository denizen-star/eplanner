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
      return {
        enabled: process.env.EMAIL_ENABLED === 'true',
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
    return this.enabled && this.config.smtpServer && this.config.senderEmail && this.config.senderPassword;
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
   * @returns {Promise<boolean>} True if email sent successfully, false otherwise
   */
  async sendEmail(options) {
    if (!this.isEnabled()) {
      console.log('[EMAIL SERVICE] Email is disabled or configuration is incomplete');
      return false;
    }

    const { to, subject, html, text, cc, bcc } = options;

    if (!to || !subject || !html) {
      console.error('[EMAIL SERVICE] Missing required email fields: to, subject, or html');
      return false;
    }

    try {
      // Create transporter based on port (SSL for 465, TLS for 587)
      const transporter = nodemailer.createTransport({
        host: this.config.smtpServer,
        port: this.config.smtpPort,
        secure: this.config.smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: this.config.senderEmail,
          pass: this.config.senderPassword,
        },
      });

      // Prepare email message
      const mailOptions = {
        from: this.config.senderEmail,
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
