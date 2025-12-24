# Email System Documentation

**Last Updated:** December 24, 2025  
**Purpose:** Complete reference for how emails are sent in the Vendure application

---

## Overview

The application uses **Vendure's EmailPlugin** with **AWS SES SMTP** for all email sending. The system supports **channel-specific email addresses** for US and CA channels.

---

## Configuration

### 1. EmailPlugin Setup (`vendure-config.ts`)

```typescript
EmailPlugin.init({
  handlers: [],
  transport: {
    type: 'smtp',
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
  templatePath: path.join(__dirname, '../static/email/templates'),
  globalTemplateVars: {
    fromAddress: 'orders@hunterirrigationsupply.com', // Default
    fromName: process.env.EMAIL_FROM_NAME || 'Hunter Irrigation Supply',
  },
}),
```

### 2. Environment Variables (`.env`)

```bash
# AWS SES SMTP Configuration
SMTP_HOST=email-smtp.us-west-2.amazonaws.com
SMTP_PORT=587
SMTP_USER=REDACTED_AWS_ACCESS_KEY_ID
SMTP_PASS=<your-smtp-password>

# Email From Name
EMAIL_FROM_NAME=Hunter Irrigation Supply
```

**Note:** SMTP password must be obtained from AWS SES Console → SMTP Settings. It cannot be retrieved via CLI.

---

## Channel-Specific Email Addresses

### Email Addresses by Channel

- **US Channel:** `orders@hunterirrigationsupply.com`
- **CA Channel:** `orders@hunterirrigation.ca`
- **From Name:** `Hunter Irrigation Supply` (same for both)

### Helper Functions (`email-handlers.ts`)

```typescript
import { getFromAddressForChannel, getFromName } from './email-handlers';

// Get channel-specific from address
const fromAddress = getFromAddressForChannel(ctx);
// Returns: 'orders@hunterirrigationsupply.com' (US) or 'orders@hunterirrigation.ca' (CA)

// Get from name
const fromName = getFromName();
// Returns: 'Hunter Irrigation Supply'
```

**Implementation:**
```typescript
export function getFromAddressForChannel(ctx: RequestContext | undefined): string {
  if (!ctx || !ctx.channel) {
    return 'orders@hunterirrigationsupply.com'; // Default to US
  }
  
  const channelCode = ctx.channel.code?.toLowerCase();
  
  if (channelCode === 'ca') {
    return 'orders@hunterirrigation.ca';
  }
  
  // Default to US channel
  return 'orders@hunterirrigationsupply.com';
}

export function getFromName(): string {
  return process.env.EMAIL_FROM_NAME || 'Hunter Irrigation Supply';
}
```

---

## How to Send Emails

### Step-by-Step Pattern

**1. Bootstrap Vendure App:**
```typescript
import { bootstrap } from '@vendure/core';
import { config } from './vendure-config';

const app = await bootstrap(config);
```

**2. Get EmailService:**
```typescript
// EmailService is provided by EmailPlugin - use require() to get the service token
const { EmailService } = require('@vendure/email-plugin');
const emailService = app.get(EmailService);
```

**3. Create RequestContext with Channel:**
```typescript
import { RequestContext, ChannelService } from '@vendure/core';

const channelService = app.get(ChannelService);
const channel = await channelService.getDefaultChannel(); // or get specific channel

const ctx = new RequestContext({
  apiType: 'admin', // or 'shop'
  channel: channel,
  isAuthorized: true,
  authorizedAsOwnerOnly: false,
});
```

**4. Get Channel-Specific From Address:**
```typescript
import { getFromAddressForChannel, getFromName } from './email-handlers';

const fromAddress = getFromAddressForChannel(ctx);
const fromName = getFromName();
```

**5. Send Email:**
```typescript
await emailService.send({
  from: `${fromName} <${fromAddress}>`,
  to: 'recipient@example.com',
  subject: 'Your Subject',
  body: '<h1>HTML Content</h1>',
  // OR use template:
  // template: 'order-confirmation',
  // templateVars: { order, customer },
}, ctx);
```

---

## Complete Example

See `send-vendure-test-email.ts` for a complete working example:

```typescript
import 'reflect-metadata';
import { bootstrap, RequestContext, ChannelService } from '@vendure/core';
import { config } from './vendure-config';
import { getFromAddressForChannel, getFromName } from './email-handlers';

async function sendTestEmail() {
  const app = await bootstrap(config);
  
  // Get EmailService
  const { EmailService } = require('@vendure/email-plugin');
  const emailService = app.get(EmailService);
  
  // Get channel and create context
  const channelService = app.get(ChannelService);
  const channel = await channelService.getDefaultChannel();
  const ctx = new RequestContext({
    apiType: 'admin',
    channel: channel,
    isAuthorized: true,
    authorizedAsOwnerOnly: false,
  });
  
  // Get channel-specific from address
  const fromAddress = getFromAddressForChannel(ctx);
  const fromName = getFromName();
  
  // Send email
  await emailService.send({
    from: `${fromName} <${fromAddress}>`,
    to: 'test@example.com',
    subject: 'Test Email',
    body: '<p>This is a test email.</p>',
  }, ctx);
  
  await app.close();
}
```

---

## Files Reference

### Core Files

1. **`vendure-config.ts`** - EmailPlugin configuration
2. **`email-handlers.ts`** - Channel-specific email helper functions
3. **`send-vendure-test-email.ts`** - Complete example of sending emails
4. **`test-order-emails.ts`** - Example of triggering order emails via events

### Scripts Using Email

1. **`sync-tax-rates-with-email.ts`** - Tax rate sync notifications
2. **`send-test-email-simple.ts`** - Simple email test script
3. **`send-test-email.ts`** - Advanced email test script

---

## Common Patterns

### Pattern 1: Simple Email (No Template)

```typescript
await emailService.send({
  from: `${fromName} <${fromAddress}>`,
  to: recipient,
  subject: 'Subject',
  body: '<p>HTML content</p>',
}, ctx);
```

### Pattern 2: Email with Template

```typescript
await emailService.send({
  from: `${fromName} <${fromAddress}>`,
  to: recipient,
  subject: 'Order Confirmation',
  template: 'order-confirmation',
  templateVars: {
    order,
    customer,
    fromAddress,
    fromName,
  },
}, ctx);
```

### Pattern 3: Error Handling

```typescript
try {
  await emailService.send({...}, ctx);
  console.log('✅ Email sent successfully');
} catch (error: any) {
  console.error('❌ Failed to send email:', error.message);
  // Don't throw - allow script to continue
}
```

---

## Troubleshooting

### Issue: "Nest could not find given element"

**Solution:** Make sure you're using `require()` to get EmailService:
```typescript
const { EmailService } = require('@vendure/email-plugin');
const emailService = app.get(EmailService);
```

**Note:** If EmailService is not found, ensure EmailPlugin is in the plugins array and not filtered out:
```typescript
const seedConfig = {
  ...config,
  plugins: config.plugins || [], // Don't filter out EmailPlugin
};
```

**Alternative:** If EmailService still can't be found, you can use nodemailer directly with the same SMTP credentials:
```typescript
import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

await transporter.sendMail({
  from: `${fromName} <${fromAddress}>`,
  to: recipient,
  subject: 'Subject',
  html: '<p>Content</p>',
});
```

### Issue: "Invalid login: 535 Authentication Credentials Invalid"

**Solution:** SMTP password is incorrect. Get new password from AWS SES Console:
1. Go to AWS SES Console → SMTP Settings
2. Create new SMTP credentials
3. Update `SMTP_PASS` in `.env` file

### Issue: Email not using correct channel address

**Solution:** Make sure you're passing the correct `RequestContext` with the channel:
```typescript
const ctx = new RequestContext({
  apiType: 'admin',
  channel: channel, // Must include channel
  isAuthorized: true,
  authorizedAsOwnerOnly: false,
});
```

---

## AWS SES Configuration

### Verified Email Addresses

- `hunterirrigationsupply.com` ✅
- `hunterirrigation.ca` ✅
- `orders@hunterirrigationsupply.com` ✅
- `orders@hunterirrigation.ca` ✅

### SMTP Endpoint

- **Host:** `email-smtp.us-west-2.amazonaws.com`
- **Port:** `587` (TLS)
- **Region:** `us-west-2`

### Getting SMTP Credentials

1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Select region: **us-west-2**
3. Navigate to **SMTP Settings**
4. Click **Create SMTP Credentials**
5. Copy username and password (password shown only once!)

---

## Best Practices

1. **Always use channel-specific addresses** via `getFromAddressForChannel(ctx)`
2. **Always pass RequestContext** to `emailService.send()` for channel awareness
3. **Handle errors gracefully** - don't let email failures break the main process
4. **Use templates** for complex emails (order confirmations, etc.)
5. **Test emails** using `send-vendure-test-email.ts` before deploying

---

## Quick Reference

```typescript
// 1. Bootstrap
const app = await bootstrap(config);

// 2. Get EmailService
const { EmailService } = require('@vendure/email-plugin');
const emailService = app.get(EmailService);

// 3. Get channel and create context
const channelService = app.get(ChannelService);
const channel = await channelService.getDefaultChannel();
const ctx = new RequestContext({
  apiType: 'admin',
  channel: channel,
  isAuthorized: true,
  authorizedAsOwnerOnly: false,
});

// 4. Get from address
const fromAddress = getFromAddressForChannel(ctx);
const fromName = getFromName();

// 5. Send
await emailService.send({
  from: `${fromName} <${fromAddress}>`,
  to: 'recipient@example.com',
  subject: 'Subject',
  body: '<p>Content</p>',
}, ctx);
```

---

**For questions or issues, refer to:**
- `send-vendure-test-email.ts` - Complete working example
- `email-handlers.ts` - Channel-specific helper functions
- `vendure-config.ts` - EmailPlugin configuration

