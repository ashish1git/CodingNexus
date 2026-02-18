# Brevo Email Service Module

A production-ready, reusable email service module for sending transactional emails using Brevo (formerly Sendinblue).

## Features

- ✅ Brevo TransactionalEmailsApi integration
- ✅ Support for HTML and plain text emails
- ✅ Bulk email sending to multiple recipients
- ✅ Configurable sender (name and email)
- ✅ Environment-based configuration
- ✅ Comprehensive error handling
- ✅ Email validation
- ✅ Configuration verification utility

## Installation

This module requires the Brevo SDK to be installed:

```bash
npm install @getbrevo/brevo
```

## Configuration

Add the following environment variables to your `.env` file:

```env
BREVO_API_KEY="your-brevo-api-key-here"
EMAIL_FROM="sender@example.com"
EMAIL_FROM_NAME="Your App Name"
```

### Getting Your Brevo API Key

1. Sign up at [Brevo.com](https://www.brevo.com)
2. Go to Settings → SMTP & API → API keys
3. Create a new API key
4. Copy and paste it in your `.env` file

## Usage

### Basic Email

```javascript
import { sendEmail } from './server/services/email/brevo.service.js';

const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to Our App!',
  html: '<h1>Welcome!</h1><p>Thank you for signing up.</p>',
  text: 'Welcome! Thank you for signing up.'
});

if (result.success) {
  console.log('Email sent! Message ID:', result.messageId);
} else {
  console.error('Error:', result.error);
}
```

### HTML-Only Email

```javascript
await sendEmail({
  to: 'user@example.com',
  subject: 'Order Confirmation',
  html: `
    <html>
      <body>
        <h2>Order #12345</h2>
        <p>Your order has been confirmed.</p>
      </body>
    </html>
  `
});
```

### Plain Text Email

```javascript
await sendEmail({
  to: 'user@example.com',
  subject: 'Notification',
  text: 'This is a simple text email.'
});
```

### Email with CC and BCC

```javascript
await sendEmail({
  to: 'recipient@example.com',
  subject: 'Project Update',
  html: '<p>Project status: In Progress</p>',
  cc: ['manager@example.com'],
  bcc: ['archive@example.com']
});
```

### Bulk Email to Multiple Recipients

```javascript
import { sendBulkEmail } from './server/services/email/brevo.service.js';

const result = await sendBulkEmail({
  to: [
    'user1@example.com',
    'user2@example.com',
    'user3@example.com'
  ],
  subject: 'Important Announcement',
  html: '<h2>Announcement</h2><p>We have exciting news to share...</p>'
});

console.log(`Sent: ${result.sent}/${result.total}`);
console.log(`Failed: ${result.failed}`);
if (result.errors.length > 0) {
  console.log('Errors:', result.errors);
}
```

### Verify Configuration

```javascript
import { verifyConfiguration } from './server/services/email/brevo.service.js';

const config = verifyConfiguration();
if (config.isConfigured) {
  console.log('✅ Email service is ready');
  console.log('Sender:', config.sender);
} else {
  console.log('❌', config.message);
}
```

## API Reference

### `sendEmail(options)`

Send a single email.

**Parameters:**
- `to` (string, required): Recipient email address
- `subject` (string, required): Email subject
- `html` (string, optional): HTML email body
- `text` (string, optional): Plain text email body
- `cc` (array, optional): CC recipients
- `bcc` (array, optional): BCC recipients
- `attachments` (array, optional): Email attachments

**Returns:**
```javascript
{
  success: true,
  messageId: 'string',
  timestamp: 'ISO-8601 datetime'
}
// or
{
  success: false,
  error: 'error message',
  details: 'additional error details'
}
```

### `sendBulkEmail(options)`

Send email to multiple recipients in parallel.

**Parameters:**
- `to` (array, required): Array of recipient email addresses
- `subject` (string, required): Email subject
- `html` (string, optional): HTML email body
- `text` (string, optional): Plain text email body

**Returns:**
```javascript
{
  total: 100,
  sent: 95,
  failed: 5,
  errors: [
    { email: 'invalid@', error: 'Invalid email address' },
    // ...
  ]
}
```

### `verifyConfiguration()`

Check if Brevo email service is properly configured.

**Returns:**
```javascript
{
  isConfigured: true,
  message: 'Brevo email service is properly configured',
  sender: 'Your App Name <sender@example.com>'
}
// or
{
  isConfigured: false,
  message: 'Error message explaining what is missing'
}
```

## Testing

Run the test file to verify your email service is working:

```bash
# Edit testEmail.js and change TEST_EMAIL to your email address
# Then run:
node server/services/email/testEmail.js
```

The test file will:
1. Verify Brevo configuration
2. Send an HTML email
3. Send a plain text email
4. Test bulk email functionality

Check your inbox and spam folder for the test emails.

## Error Handling

The service handles various error scenarios:

- **Missing environment variables**: Logs warning and disables service
- **Invalid email format**: Returns error with message
- **API authentication errors**: Returns error with details
- **Network errors**: Returns error with message

All errors are logged to console with error level (`❌` prefix).

## Integration with Existing Code

This service is **standalone** and doesn't modify any existing code. To use it alongside existing email functionality:

```javascript
// In your route or controller
import { sendEmail } from '../services/email/brevo.service.js';

// Your existing code continues to work
// Use Brevo service when needed
const emailResult = await sendEmail({
  to: userEmail,
  subject: 'Welcome',
  html: '<h1>Welcome!</h1>'
});
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BREVO_API_KEY` | Brevo API authentication key | `xkeysib-...` |
| `EMAIL_FROM` | Sender email address | `noreply@example.com` |
| `EMAIL_FROM_NAME` | Sender display name | `My App` |

## Best Practices

1. **Always verify configuration** before sending emails
2. **Use both HTML and text** versions for better compatibility
3. **Validate email addresses** before sending
4. **Test with testEmail.js** before going to production
5. **Monitor Brevo dashboard** for delivery statistics
6. **Use environment variables** for all sensitive data
7. **Handle errors gracefully** in your application
8. **Log email activity** for debugging and audit trails

## Production Deployment

### Vercel

Set environment variables in Vercel project settings:
1. Go to Settings → Environment Variables
2. Add: `BREVO_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`
3. Deploy

### Render

Set environment variables in Render project:
1. Go to Environment → Environment Variables
2. Add: `BREVO_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`
3. Deploy

### VPS / Self-Hosted

1. Add variables to `.env` file (never commit to git)
2. Ensure `.env` is in `.gitignore`
3. Restart your application

## Troubleshooting

### "Email service is not configured"
- Check if `BREVO_API_KEY` is set in `.env`
- Verify API key is correct in Brevo dashboard
- Restart your application

### "Invalid email address"
- Verify recipient email is correctly formatted
- Check for typos in the email address
- Ensure `to` parameter is a string, not an object

### Email goes to spam
- Configure SPF and DKIM records for your domain
- Verify sender domain in Brevo dashboard
- Use a branded sender email (not noreply)

### API errors
- Check Brevo dashboard for account status
- Verify API rate limits haven't been exceeded
- Check Brevo status page for service incidents

## Support

For Brevo-specific issues:
- [Brevo Documentation](https://developers.brevo.com)
- [Brevo Support](https://help.brevo.com)

## License

This service module is part of the Coding Nexus project.
