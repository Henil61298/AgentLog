# EmailJS Setup Guide for Investment Notifications

## Free Email Notifications Setup

This guide will help you set up free email notifications for investment end date reminders.

### Step 1: Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

### Optional: Separate notification timing

By default the system checks both browser and email reminders using the same day count. To configure them independently, the profile page now has two settings:

- **Browser notification days** – how many days before an investment end date you see a desktop alert
- **Email notification days** – how many days before you receive an email reminder

For example, you could set browser alerts at 7 days and emails at 30 days.

### Step 2: Add Email Service

1. In your EmailJS dashboard, click "Email Services" → "Add New Service"
2. Choose your email provider (Gmail, Outlook, Yahoo, etc.)
3. Connect your email account and grant permissions
4. Note down the **Service ID** (looks like `service_xxxxxx`)

### Step 3: Create Email Template

1. Click "Email Templates" → "Create New Template"
2. Use this template structure:

**Subject:**

```
Investment End Date Reminder - {{to_name}}
```

**HTML Body:**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Investment Reminder</title>
  </head>
  <body>
    <h2>Hello {{to_name}},</h2>

    <p>{{message}}</p>

    <p>Please log in to your AgentLog dashboard to review your investments.</p>

    <br />
    <p>Best regards,<br />AgentLog Team</p>
  </body>
</html>
```

**Template Variables:**

- `{{to_email}}` - Recipient email
- `{{to_name}}` - Recipient name
- `{{subject}}` - Email subject
- `{{message}}` - Notification message

3. Save the template and note down the **Template ID** (looks like `template_xxxxxx`)

### Step 4: Get Public Key

1. Go to "Account" → "General"
2. Copy the **Public Key** (looks like a long string of characters)

### Step 5: Configure in AgentLog

1. Go to your Profile page in AgentLog
2. Enable "Email Notifications"
3. Enter the three values:
   - Service ID
   - Template ID
   - Public Key
4. Click "Test Email Notification" to verify it works
5. Save your profile

## How It Works

- The system checks for investments ending within your configured days (default: 7 days)
- When found, it automatically sends an email with details of upcoming end dates
- Emails are sent when you log in and every 6 hours thereafter

## Troubleshooting

**Not receiving emails?**

- Check your spam/junk folder
- Verify EmailJS credentials are correct
- Test the email function in Profile settings

**Emails going to spam?**

- Add `noreply@emailjs.com` to your contacts
- Check your email provider's spam settings

## SMS Notifications

Currently, free SMS services are not available for reliable notifications. For SMS functionality, you'll need to integrate with paid services like:

- **Twilio**: $0.0075 per message
- **MessageBird**: $0.005 per message
- **AWS SNS**: Pay per use

Contact your developer for SMS integration setup.
