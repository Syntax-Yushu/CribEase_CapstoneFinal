// Firebase Cloud Function for Sending Password Reset Emails
// Deploy this to your Firebase project

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configure with your email service
// Option 1: Using Gmail (requires App Password)
// Option 2: Using SendGrid (free tier available)

// ============================================
// OPTION 1: Gmail SMTP (Recommended for testing)
// ============================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Set in Firebase Console
    pass: process.env.GMAIL_PASSWORD, // Use App Password (not regular password)
  },
});

// ============================================
// OPTION 2: SendGrid (Recommended for production)
// ============================================
// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendPasswordResetEmail = functions.https.onCall(async (data, context) => {
  const { email, actionCode, continueUrl } = data;

  if (!email || !actionCode) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email and actionCode are required'
    );
  }

  // Build the password reset link
  const resetLink = `https://cribease-default-rtdb.firebaseapp.com/auth/action?mode=resetPassword&oobCode=${actionCode}&continueUrl=${encodeURIComponent(continueUrl || 'https://your-app.com')}`;

  const mailOptions = {
    from: process.env.GMAIL_USER || 'noreply@cribease.com',
    to: email,
    subject: 'CribEase - Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #a34f9f; color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .content { padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin-top: 20px; }
          .button { background-color: #a34f9f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { font-size: 12px; color: #666; margin-top: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CribEase Password Reset</h1>
          </div>
          
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hi there,</p>
            <p>We received a request to reset your CribEase account password. Click the button below to reset it.</p>
            
            <a href="${resetLink}" class="button">Reset Password</a>
            
            <p>Or copy this link:</p>
            <p><small>${resetLink}</small></p>
            
            <p><strong>This link expires in 1 hour.</strong></p>
            
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            
            <p>Best regards,<br>The CribEase Team</p>
          </div>
          
          <div class="footer">
            <p>© 2025 CribEase. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return { success: true, message: 'Password reset email sent' };
  } catch (error) {
    console.error('Error sending email:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send password reset email');
  }
});

// Alternative: Listen to auth events and send emails automatically
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  console.log(`New user created: ${user.email}`);
  // You can send welcome email here if needed
});
