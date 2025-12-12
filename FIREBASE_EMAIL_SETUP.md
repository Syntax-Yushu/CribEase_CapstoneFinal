# Firebase Email Configuration for Password Reset

## The Problem
Firebase stores emails but doesn't automatically send real emails. You need to configure email sending.

## Solution: Use Firebase Authentication Built-in Email Service

### Step 1: Enable Email/Password Authentication in Firebase Console
1. Go to **Firebase Console** → Your Project
2. Click **Authentication** (left sidebar)
3. Click **Sign-in method** tab
4. Enable **Email/Password**
5. Save

### Step 2: Configure Email Sender Address (Optional but Recommended)
1. In **Authentication** → **Templates** tab
2. You can customize email templates and sender address
3. Default is `noreply@[your-project].firebaseapp.com`

### Step 3: Enable Firebase Extensions (Recommended for Production)
If you want custom email templates and reliable delivery:

1. Go to **Extensions** in Firebase Console
2. Search for **"Trigger Email"** extension
3. Click **Install**
4. Configure with your email provider (SendGrid, Mailgun, etc.)
5. This will handle sending actual emails

### Step 4: Test Password Reset
1. Sign up a user with a real email address
2. Click "Forgot Password?"
3. Enter the email
4. Check your email inbox for reset link

---

## Alternative Solution: Cloud Functions + SendGrid (Advanced)

If Firebase's built-in email doesn't work, you can use Cloud Functions:

### Install Dependencies
```bash
npm install --save firebase-functions firebase-admin
```

### Create Cloud Function (functions/index.js)
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD, // Use App Password, not regular password
  },
});

exports.sendPasswordResetEmail = functions.https.onCall(async (data, context) => {
  const { email, resetLink } = data;

  const mailOptions = {
    from: process.env.EMAIL_ADDRESS,
    to: email,
    subject: 'CribEase - Password Reset Request',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send email');
  }
});
```

### Deploy Function
```bash
firebase deploy --only functions
```

---

## Quick Checklist
- [ ] Firebase Authentication enabled
- [ ] Email/Password sign-in method enabled
- [ ] Tested password reset with real email
- [ ] Check spam/promotions folder if email not received
- [ ] (Optional) Firebase Extensions or Cloud Functions configured for custom emails

---

## Troubleshooting
- **Email not received**: Check spam folder, verify email is real
- **Auth/OPERATION_NOT_ALLOWED**: Enable Email/Password in Firebase Console
- **Custom email templates**: Use Firebase Extensions for this
