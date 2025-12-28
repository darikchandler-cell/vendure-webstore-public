/**
 * Centralized Error Reporting Service
 * 
 * Automatically detects user issues/bugs and:
 * 1. Sends detailed email to darikchandler@gmail.com
 * 2. Creates GitHub issue ticket
 * 
 * Usage:
 *   import { reportError } from './utils/error-reporter';
 *   reportError(error, { context: 'API', userId: '123' });
 */

import nodemailer from 'nodemailer';

interface ErrorContext {
  /** Application source: 'api' | 'storefront' | 'remix-storefront' */
  source?: string;
  /** User ID if available */
  userId?: string;
  /** Request URL if available */
  url?: string;
  /** HTTP method if available */
  method?: string;
  /** Additional context data */
  [key: string]: any;
}

interface ErrorReport {
  error: Error;
  context: ErrorContext;
  timestamp: string;
  environment: string;
  hostname?: string;
}

/**
 * Create SMTP transporter for sending error reports
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
}

/**
 * Format error details for email
 */
function formatErrorEmail(report: ErrorReport): { subject: string; html: string; text: string } {
  const { error, context, timestamp, environment, hostname } = report;
  
  const subject = `🐛 Bug Report: ${error.message?.substring(0, 100) || 'Unknown Error'}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: bold; color: #1f2937; margin-bottom: 10px; font-size: 16px; }
    .error-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 10px 0; }
    .context-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 10px 0; }
    pre { background: #1f2937; color: #f9fafb; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px; }
    .label { font-weight: bold; color: #6b7280; }
    .value { color: #111827; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🐛 Bug Report Detected</h1>
      <p>An error was automatically detected and reported</p>
    </div>
    <div class="content">
      <div class="section">
        <div class="section-title">Error Details</div>
        <div class="error-box">
          <div><span class="label">Message:</span> <span class="value">${escapeHtml(error.message || 'No message')}</span></div>
          <div><span class="label">Type:</span> <span class="value">${escapeHtml(error.name || 'Error')}</span></div>
        </div>
      </div>
      
      ${error.stack ? `
      <div class="section">
        <div class="section-title">Stack Trace</div>
        <pre>${escapeHtml(error.stack)}</pre>
      </div>
      ` : ''}
      
      <div class="section">
        <div class="section-title">Context Information</div>
        <div class="context-box">
          <div><span class="label">Source:</span> <span class="value">${escapeHtml(context.source || 'unknown')}</span></div>
          <div><span class="label">Environment:</span> <span class="value">${escapeHtml(environment)}</span></div>
          <div><span class="label">Timestamp:</span> <span class="value">${escapeHtml(timestamp)}</span></div>
          ${hostname ? `<div><span class="label">Hostname:</span> <span class="value">${escapeHtml(hostname)}</span></div>` : ''}
          ${context.url ? `<div><span class="label">URL:</span> <span class="value">${escapeHtml(context.url)}</span></div>` : ''}
          ${context.method ? `<div><span class="label">Method:</span> <span class="value">${escapeHtml(context.method)}</span></div>` : ''}
          ${context.userId ? `<div><span class="label">User ID:</span> <span class="value">${escapeHtml(context.userId)}</span></div>` : ''}
        </div>
      </div>
      
      ${Object.keys(context).filter(k => !['source', 'url', 'method', 'userId'].includes(k)).length > 0 ? `
      <div class="section">
        <div class="section-title">Additional Context</div>
        <pre>${escapeHtml(JSON.stringify(context, null, 2))}</pre>
      </div>
      ` : ''}
      
      <div class="section">
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated bug report. A GitHub issue has been created automatically.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  
  const text = `
BUG REPORT DETECTED
==================

Error Details:
  Message: ${error.message || 'No message'}
  Type: ${error.name || 'Error'}
  
${error.stack ? `Stack Trace:\n${error.stack}\n` : ''}

Context Information:
  Source: ${context.source || 'unknown'}
  Environment: ${environment}
  Timestamp: ${timestamp}
  ${hostname ? `Hostname: ${hostname}\n` : ''}
  ${context.url ? `URL: ${context.url}\n` : ''}
  ${context.method ? `Method: ${context.method}\n` : ''}
  ${context.userId ? `User ID: ${context.userId}\n` : ''}

${Object.keys(context).filter(k => !['source', 'url', 'method', 'userId'].includes(k)).length > 0 ? `Additional Context:\n${JSON.stringify(context, null, 2)}\n` : ''}

This is an automated bug report. A GitHub issue has been created automatically.
  `;
  
  return { subject, html, text };
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Create GitHub issue via API
 */
async function createGitHubIssue(report: ErrorReport): Promise<number | null> {
  const githubToken = process.env.GITHUB_TOKEN;
  const githubOwner = process.env.GITHUB_OWNER || 'darikchandler-cell';
  const githubRepo = process.env.GITHUB_REPO || 'vendure-hunterirrigation';
  
  if (!githubToken) {
    console.warn('⚠️  GITHUB_TOKEN not set, skipping GitHub issue creation');
    return null;
  }
  
  try {
    const { error, context, timestamp, environment } = report;
    
    // Format issue title
    const title = `🐛 ${error.message?.substring(0, 100) || 'Unknown Error'}`;
    
    // Format issue body
    const body = `## Bug Report

**Automatically detected on:** ${timestamp}
**Environment:** ${environment}
**Source:** ${context.source || 'unknown'}

### Error Details
\`\`\`
Message: ${error.message || 'No message'}
Type: ${error.name || 'Error'}
\`\`\`

${error.stack ? `### Stack Trace
\`\`\`
${error.stack}
\`\`\`
` : ''}

### Context
- **Source:** ${context.source || 'unknown'}
- **Environment:** ${environment}
- **Timestamp:** ${timestamp}
${context.url ? `- **URL:** ${context.url}` : ''}
${context.method ? `- **Method:** ${context.method}` : ''}
${context.userId ? `- **User ID:** ${context.userId}` : ''}

${Object.keys(context).filter(k => !['source', 'url', 'method', 'userId'].includes(k)).length > 0 ? `### Additional Context
\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`
` : ''}

---
*This issue was automatically created by the error reporting system.*
`;
    
    const response = await fetch(`https://api.github.com/repos/${githubOwner}/${githubRepo}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        labels: ['bug', 'auto-reported', context.source || 'unknown'],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to create GitHub issue:', response.status, errorText);
      return null;
    }
    
    const issue = await response.json();
    console.log(`✅ GitHub issue created: #${issue.number} - ${issue.html_url}`);
    return issue.number;
  } catch (err: any) {
    console.error('❌ Error creating GitHub issue:', err.message);
    return null;
  }
}

/**
 * Send error report via email
 */
async function sendErrorEmail(report: ErrorReport): Promise<boolean> {
  const recipientEmail = process.env.ERROR_REPORT_EMAIL || 'darikchandler@gmail.com';
  
  try {
    const transporter = createTransporter();
    const { subject, html, text } = formatErrorEmail(report);
    
    await transporter.sendMail({
      from: `"Error Reporter" <${process.env.SMTP_FROM || 'orders@hunterirrigationsupply.com'}>`,
      to: recipientEmail,
      subject,
      html,
      text,
    });
    
    console.log(`✅ Error report email sent to ${recipientEmail}`);
    return true;
  } catch (err: any) {
    console.error('❌ Failed to send error report email:', err.message);
    return false;
  }
}

/**
 * Main function to report an error
 * 
 * @param error - The error object to report
 * @param context - Additional context about the error
 */
export async function reportError(error: Error, context: ErrorContext = {}): Promise<void> {
  // Don't report in development unless explicitly enabled
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment && process.env.ENABLE_ERROR_REPORTING !== 'true') {
    console.log('⚠️  Error reporting disabled in development mode');
    console.error('Error:', error, context);
    return;
  }
  
  // Create error report
  const report: ErrorReport = {
    error,
    context: {
      source: context.source || 'api',
      ...context,
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hostname: typeof process !== 'undefined' ? process.env.HOSTNAME : undefined,
  };
  
  // Send email and create GitHub issue in parallel
  const [emailSent, issueNumber] = await Promise.allSettled([
    sendErrorEmail(report),
    createGitHubIssue(report),
  ]);
  
  // Log results
  if (emailSent.status === 'fulfilled' && emailSent.value) {
    console.log('✅ Error report email sent successfully');
  }
  
  if (issueNumber.status === 'fulfilled' && issueNumber.value) {
    console.log(`✅ GitHub issue #${issueNumber.value} created successfully`);
  }
}

/**
 * Report an error synchronously (fire and forget)
 * Use this when you don't want to await the reporting
 */
export function reportErrorAsync(error: Error, context: ErrorContext = {}): void {
  reportError(error, context).catch((err) => {
    console.error('❌ Failed to report error:', err);
  });
}



