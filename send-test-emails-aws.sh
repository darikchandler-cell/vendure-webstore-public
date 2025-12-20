#!/bin/bash

# Send test emails using AWS CLI
echo "📧 Sending test emails via AWS SES..."
echo ""

# Send US channel email
echo "📨 Sending US channel test email..."
aws ses send-email \
  --from "Hunter Irrigation Supply <orders@hunterirrigationsupply.com>" \
  --destination "ToAddresses=darikchandler@gmail.com" \
  --message "Subject={Data=Test Email from US Channel - Hunter Irrigation Supply,Charset=utf-8},Body={Text={Data=This is a test email from the US channel (hunterirrigationsupply.com) to verify channel-specific email addresses. From: Hunter Irrigation Supply <orders@hunterirrigationsupply.com> Channel: US,Charset=utf-8},Html={Data=<h2>Test Email from US Channel</h2><p>This is a test email from the US channel to verify channel-specific email addresses.</p><p><strong>From:</strong> Hunter Irrigation Supply &lt;orders@hunterirrigationsupply.com&gt;</p><p><strong>Channel:</strong> US (hunterirrigationsupply.com)</p>,Charset=utf-8}}" \
  --region us-west-2

if [ $? -eq 0 ]; then
    echo "✅ US channel email sent successfully!"
else
    echo "❌ Failed to send US channel email"
fi

echo ""

# Send CA channel email
echo "📨 Sending CA channel test email..."
aws ses send-email \
  --from "Hunter Irrigation Supply <orders@hunterirrigation.ca>" \
  --destination "ToAddresses=darikchandler@gmail.com" \
  --message "Subject={Data=Test Email from CA Channel - Hunter Irrigation Supply,Charset=utf-8},Body={Text={Data=This is a test email from the CA channel (hunterirrigation.ca) to verify channel-specific email addresses. From: Hunter Irrigation Supply <orders@hunterirrigation.ca> Channel: CA,Charset=utf-8},Html={Data=<h2>Test Email from CA Channel</h2><p>This is a test email from the CA channel to verify channel-specific email addresses.</p><p><strong>From:</strong> Hunter Irrigation Supply &lt;orders@hunterirrigation.ca&gt;</p><p><strong>Channel:</strong> CA (hunterirrigation.ca)</p>,Charset=utf-8}}" \
  --region us-west-2

if [ $? -eq 0 ]; then
    echo "✅ CA channel email sent successfully!"
else
    echo "❌ Failed to send CA channel email"
fi

echo ""
echo "📋 Summary:"
echo "   US From: Hunter Irrigation Supply <orders@hunterirrigationsupply.com>"
echo "   CA From: Hunter Irrigation Supply <orders@hunterirrigation.ca>"
echo "   To: darikchandler@gmail.com"
echo ""
echo "💡 Check darikchandler@gmail.com for both test emails."

