#!/usr/bin/env python3
import boto3
from datetime import datetime

# Create SES client
ses = boto3.client('ses', region_name='us-west-2')

test_email = 'darikchandler@gmail.com'
from_name = 'Hunter Irrigation Supply'
timestamp = datetime.utcnow().isoformat() + 'Z'

# Send US channel email
print('📨 Sending US channel test email...')
print(f'   From: {from_name} <orders@hunterirrigationsupply.com>')
print(f'   To: {test_email}')

try:
    response = ses.send_email(
        Source=f'{from_name} <orders@hunterirrigationsupply.com>',
        Destination={'ToAddresses': [test_email]},
        Message={
            'Subject': {
                'Data': 'Test Email from US Channel - Hunter Irrigation Supply',
                'Charset': 'UTF-8'
            },
            'Body': {
                'Text': {
                    'Data': f'''This is a test email from the US channel (hunterirrigationsupply.com) to verify channel-specific email addresses.

From: {from_name} <orders@hunterirrigationsupply.com>
Channel: US
Timestamp: {timestamp}''',
                    'Charset': 'UTF-8'
                },
                'Html': {
                    'Data': f'''<h2>Test Email from US Channel</h2>
<p>This is a test email from the US channel to verify channel-specific email addresses.</p>
<p><strong>From:</strong> {from_name} &lt;orders@hunterirrigationsupply.com&gt;</p>
<p><strong>Channel:</strong> US (hunterirrigationsupply.com)</p>
<p><strong>Timestamp:</strong> {timestamp}</p>''',
                    'Charset': 'UTF-8'
                }
            }
        }
    )
    print(f'✅ US channel email sent successfully!')
    print(f'   Message ID: {response["MessageId"]}')
except Exception as e:
    print(f'❌ Failed to send US channel email: {e}')

print('')

# Send CA channel email
print('📨 Sending CA channel test email...')
print(f'   From: {from_name} <orders@hunterirrigation.ca>')
print(f'   To: {test_email}')

try:
    response = ses.send_email(
        Source=f'{from_name} <orders@hunterirrigation.ca>',
        Destination={'ToAddresses': [test_email]},
        Message={
            'Subject': {
                'Data': 'Test Email from CA Channel - Hunter Irrigation Supply',
                'Charset': 'UTF-8'
            },
            'Body': {
                'Text': {
                    'Data': f'''This is a test email from the CA channel (hunterirrigation.ca) to verify channel-specific email addresses.

From: {from_name} <orders@hunterirrigation.ca>
Channel: CA
Timestamp: {timestamp}''',
                    'Charset': 'UTF-8'
                },
                'Html': {
                    'Data': f'''<h2>Test Email from CA Channel</h2>
<p>This is a test email from the CA channel to verify channel-specific email addresses.</p>
<p><strong>From:</strong> {from_name} &lt;orders@hunterirrigation.ca&gt;</p>
<p><strong>Channel:</strong> CA (hunterirrigation.ca)</p>
<p><strong>Timestamp:</strong> {timestamp}</p>''',
                    'Charset': 'UTF-8'
                }
            }
        }
    )
    print(f'✅ CA channel email sent successfully!')
    print(f'   Message ID: {response["MessageId"]}')
except Exception as e:
    print(f'❌ Failed to send CA channel email: {e}')

print('')
print('📋 Summary:')
print(f'   US From: {from_name} <orders@hunterirrigationsupply.com>')
print(f'   CA From: {from_name} <orders@hunterirrigation.ca>')
print(f'   To: {test_email}')
print('')
print('💡 Check darikchandler@gmail.com for both test emails.')

