import { env } from '../config/env';

const BREVO_API_KEY = env.BREVO_API_KEY || '';

export const sendSecurityAlertEmail = async (ownerEmail: string, staffName: string, actionAttempted: string, url: string) => {
  if (!BREVO_API_KEY) {
    console.error('Email API key not found. Skipping security alert email.');
    return;
  }

  try {
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'DavaSetu Security', email: 'davasetu.security@gmail.com' },
        to: [{ email: ownerEmail }],
        subject: 'DavaSetu Security Alert - Unauthorized Access Attempt',
        htmlContent: `<div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #ef4444;">DavaSetu Security Alert</h2>
          <p>A staff member attempted to access a restricted feature.</p>
          <table style="border-collapse: collapse; width: 100%; max-width: 500px; margin-top: 20px;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Staff Name</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${staffName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Action Required</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${actionAttempted}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">URL</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${url}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Status</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #ef4444; font-weight: bold;">Blocked</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Date/Time</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
          <p style="margin-top: 20px; color: #64748b; font-size: 14px;">If you authorized this action, please go to Settings > Team & Permissions to update their access.</p>
        </div>`
      })
    });

    if (!brevoResponse.ok) {
      console.error('Failed to send security alert email:', await brevoResponse.text());
    } else {
      console.log('Security alert email sent to', ownerEmail);
    }
  } catch (err) {
    console.error('Error sending security alert email:', err);
  }
};
