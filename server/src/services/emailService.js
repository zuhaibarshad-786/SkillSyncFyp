// server/src/services/emailService.js
const nodemailer = require('nodemailer');
const config = require('../config');

// Initialize the Nodemailer transporter using SMTP details from config
const transporter = nodemailer.createTransport({
    host: config.EMAIL_HOST,
    port: 587, // Standard TLS port
    secure: false, // Use TLS (587) or SSL (465)
    auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS,
    },
});

/**
 * Sends a generic email notification.
 * @param {string} to - Recipient email address.
 * @param {string} subject - Email subject line.
 * @param {string} text - Plain text body.
 * @param {string} html - HTML body content.
 */
exports.sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Skill Exchange Platform" <${config.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        
        console.log(`Message sent: ${info.messageId}`);
    } catch (error) {
        console.error('Email sending failed:', error.message);
        // In a production app, you might log this error but allow the request to proceed.
        // throw new Error('Failed to send email notification.'); 
    }
};

/**
 * Sends a specific notification for a new match found.
 * @param {string} recipientEmail - The user who received the match.
 * @param {string} matchedUserName - The name of the user they were matched with.
 * @param {string} skill - The skill they can now learn.
 */
exports.sendNewMatchNotification = async (recipientEmail, matchedUserName, skill) => {
    const subject = '🎉 You have a New Complementary Match!';
    const html = `
        <p>Hello,</p>
        <p>Great news! You have been matched with <strong>${matchedUserName}</strong>.</p>
        <p>They are looking for a skill you teach, and they can help you with <strong>${skill}</strong>.</p>
        <p>Log in to your dashboard to connect and schedule your first session!</p>
        <p>Thank you,<br>The Skill Exchange Team</p>
    `;
    
    await exports.sendEmail(recipientEmail, subject, html.replace(/<[^>]*>?/gm, ''), html);
};