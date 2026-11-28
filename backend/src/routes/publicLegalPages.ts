import { Router, Request, Response } from 'express';

const router = Router();

const SHARED_STYLE = `
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; background: #f8fafc; color: #0f172a; line-height: 1.6; }
  .wrap { max-width: 780px; margin: 36px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 6px 24px rgba(15, 23, 42, 0.05); }
  h1 { margin-top: 0; color: #0f766e; font-size: 26px; }
  h2 { margin-top: 24px; color: #0f172a; font-size: 17px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
  .badge { display: inline-block; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
  ul { padding-left: 20px; }
  li { margin-bottom: 6px; }
  .box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 10px; padding: 14px 16px; margin-top: 16px; }
  a { color: #0f766e; }
  @media (max-width: 600px) { .wrap { margin: 12px; padding: 20px; } }
`;

function renderPage(title: string, badge: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — DavaSetu</title>
  <style>${SHARED_STYLE}</style>
</head>
<body>
  <main class="wrap">
    <div class="badge">${badge}</div>
    <h1>${title}</h1>
    ${bodyHtml}
  </main>
</body>
</html>`;
}

router.get('/privacy-policy', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(
    renderPage(
      'Privacy Policy',
      'DavaSetu • com.davasetu.pharmacy_mobile',
      `
      <p><strong>Effective Date:</strong> January 1, 2026<br/>
      <strong>Developer / Contact:</strong> DavaSetu Team (<a href="mailto:davasetu.otp@gmail.com">davasetu.otp@gmail.com</a>)</p>

      <p>DavaSetu ("we", "our", "us") provides pharmacy inventory management, GST billing, and store operations software. This Privacy Policy explains how information is collected, used, and protected when you use the DavaSetu mobile and desktop applications.</p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>Account &amp; Store Details:</strong> Pharmacy name, owner/staff phone number, email address (for OTP verification), GSTIN, and store address entered during onboarding.</li>
        <li><strong>Business Inventory &amp; Billing Records:</strong> Medicine catalog entries, batch numbers, expiry dates, purchase/sales invoices, and customer billing details entered by your pharmacy.</li>
      </ul>

      <h2>2. App Permissions &amp; Why We Need Them</h2>
      <ul>
        <li><strong>Camera (CAMERA):</strong> Used strictly to scan medicine barcodes, QR codes, and medicine box text (batch number, manufacturing date, expiry date, MRP). Camera frames are used only for live scanning and are never stored or shared for advertising or tracking.</li>
        <li><strong>Bluetooth (BLUETOOTH_SCAN, BLUETOOTH_CONNECT):</strong> Used strictly to discover and connect to nearby ESC/POS Bluetooth thermal printers for printing pharmacy receipts.</li>
        <li><strong>Internet:</strong> Used to sync pharmacy inventory, bills, and authentication securely over HTTPS with DavaSetu servers.</li>
      </ul>

      <h2>3. Data Security &amp; Third-Party Sharing</h2>
      <p>We do <strong>not</strong> sell, rent, or trade your pharmacy or customer data to third parties or advertisers. Automated medicine text recognition uses secure server-side OCR processing solely to return extracted fields to your inventory form.</p>

      <h2>4. Account &amp; Data Deletion</h2>
      <p>You can permanently delete your DavaSetu account and pharmacy data directly inside the app under <strong>Profile &rarr; Delete Account</strong>, or view instructions on our <a href="/account-deletion">Account Deletion Page</a>.</p>
      `
    )
  );
});

router.get('/account-deletion', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(
    renderPage(
      'Account & Data Deletion',
      'DavaSetu • com.davasetu.pharmacy_mobile',
      `
      <p>DavaSetu users can permanently delete their pharmacy owner account and associated business data at any time using either method below:</p>

      <h2>Option 1: Delete Directly Inside the DavaSetu Mobile App (Instant)</h2>
      <ol>
        <li>Open the <strong>DavaSetu</strong> app and sign in with your pharmacy owner phone number.</li>
        <li>Go to the <strong>Profile / Settings</strong> tab.</li>
        <li>Tap <strong>Delete Account</strong> and confirm deletion.</li>
      </ol>

      <h2>Option 2: Request Deletion via Email</h2>
      <div class="box">
        Send an email to <a href="mailto:davasetu.otp@gmail.com">davasetu.otp@gmail.com</a> from your registered email address with subject <strong>"Delete My DavaSetu Account"</strong> and include your registered phone number and pharmacy name. Requests are processed within <strong>7 business days</strong>.
      </div>

      <h2>Data Deleted vs. Retained</h2>
      <ul>
        <li><strong>Permanently Deleted:</strong> Owner account profile, staff login PINs, pharmacy settings, medicine inventory, batches, and customer/order records linked to your store.</li>
        <li><strong>Exceptions:</strong> Minimum anonymized audit logs or records required for statutory tax compliance, if applicable under law, are retained only for the legally mandated period.</li>
      </ul>
      `
    )
  );
});

export default router;
