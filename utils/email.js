const sgMail = require("@sendgrid/mail");
// const { EmailLog } = require("../models");
const { DataTypes, Op } = require("sequelize");
const sequelize = require("../db");
const EmailLog = require("../models/emailLog")(sequelize, DataTypes);

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
// async function sendEmail(to, subject, text, html = null) {
//   const msg = {
//     to,
//     from: process.env.FROM_EMAIL || "noreply@example.com", // Default from email, can be set in env
//     subject,
//     text,
//     ...(html && { html }),
//   };

//   try {
//     await sgMail.send(msg);
//     console.log("email sent");

//     return { success: true };
//   } catch (error) {
//     console.error("SendGrid error:", error);
//     return { success: false, error: error.message };
//   }
// }


async function sendEmail(to, subject, text, html = null) {
  const fromEmail = process.env.FROM_EMAIL || "noreply@example.com";

  const msg = {
    to,
    from: fromEmail,
    subject,
    text,
    ...(html && { html }),
  };

  try {
    await sgMail.send(msg);
    console.log("email sent");

    await EmailLog.create({
      from: fromEmail,
      to,
      subject,
      status: "SUCCESS",
      errorMessage: null,
    });

    return { success: true };
  } catch (error) {
    console.error("SendGrid error:", error);

    await EmailLog.create({
      from: fromEmail,
      to,
      subject,
      status: "FAILED",
      errorMessage: error.message,
    });

    return { success: false, error: error.message };
  }
}


module.exports = { sendEmail };
