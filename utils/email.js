const sgMail = require("@sendgrid/mail");

// Set SendGrid API key from environment variable
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends an email using SendGrid
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 * @returns {Promise<Object>} - Result object with success status and error if any
 */
async function sendEmail(to, subject, text, html = null) {
  const msg = {
    to,
    from: process.env.FROM_EMAIL || "noreply@example.com", // Default from email, can be set in env
    subject,
    text,
    ...(html && { html }),
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error("SendGrid error:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendEmail };
