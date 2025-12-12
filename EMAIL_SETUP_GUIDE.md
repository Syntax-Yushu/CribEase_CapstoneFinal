# Email Configuration Setup Guide

## Problem: Password Reset Emails Not Being Sent

Firebase's default email service is limited. We've created a Cloud Function that will reliably send emails.

---

## Setup Instructions

### Step 1: Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### Step 2: Install Cloud Functions Dependencies
```bash
cd functions
npm install
cd ..
```

### Step 3: Choose Email Provider

#### Option A: Gmail (Quick Setup for Testing)

1. **Enable 2-Factor Authentication on your Gmail account**
   - Go to myaccount.google.com
   - Security → 2-Step Verification

2. **Generate App Password**
   - Go to myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Copy the 16-character password

3. **Set Environment Variables in Firebase**
   ```bash
   firebase functions:config:set gmail.user="your-email@gmail.com" gmail.password="your-app-password"
   ```

#### Option B: SendGrid (Recommended for Production)

1. **Create Free SendGrid Account**
   - Go to sendgrid.com
   - Sign up for free account (up to 100 emails/day)

2. **Get API Key**
   - Dashboard → Settings → API Keys
   - Create new key and copy it

3. **Set Environment Variable**
   ```bash
   firebase functions:config:set sendgrid.api_key="your-sendgrid-api-key"
   ```

---

### Step 4: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

Wait for deployment to complete. You should see:
```
✔ Deploy complete!
```

---

### Step 5: Test Password Reset

1. Open your app
2. Click "Forgot Password?"
3. Enter a real email address
4. You should receive an email within 30 seconds

---

## Troubleshooting

### Email Not Received
- ✓ Check spam/promotions folder
- ✓ Verify email address exists
- ✓ Check Firebase Console → Functions → Logs for errors
- ✓ Wait 30 seconds (email takes time to deliver)

### "Functions not found" error
- ✓ Run `firebase deploy --only functions`
- ✓ Make sure `functions/index.js` exists
- ✓ Check `functions/package.json` has dependencies

### Gmail auth errors
- ✓ Verify Gmail App Password (not regular password)
- ✓ Enable 2FA on Gmail account
- ✓ Re-run `firebase functions:config:set` command

### SendGrid errors
- ✓ Verify API key is correct
- ✓ Check SendGrid account isn't rate limited
- ✓ Verify sender email in function matches SendGrid settings

---

## View Logs

To see what's happening:
```bash
firebase functions:log
```

Or in Firebase Console:
- Project Settings → Functions → Logs tab

---

## Next Steps

Once emails are working:
1. Test with multiple email addresses
2. Customize email template in `functions/index.js`
3. Add error tracking/monitoring
4. Consider adding SMS notifications

---

## Security Notes
- ✓ Never commit Gmail passwords to git
- ✓ Use Firebase Config variables (encrypted)
- ✓ For production, use SendGrid or similar service
- ✓ Monitor email delivery rates
