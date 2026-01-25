/**
 * Base email template with consistent styling
 */

const BRAND_COLOR = '#4F46E5'

export function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BundleNudge</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding: 0 0 20px;
      border-bottom: 1px solid #eee;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: ${BRAND_COLOR};
    }
    .content {
      padding: 0;
    }
    .content h1 {
      margin: 0 0 16px;
      font-size: 24px;
      color: #111;
    }
    .content p {
      margin: 0 0 16px;
      color: #555;
    }
    .button {
      display: inline-block;
      background-color: ${BRAND_COLOR};
      color: white !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
    }
    .otp-code {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 4px;
      color: ${BRAND_COLOR};
      text-align: center;
      padding: 20px;
      background: #F3F4F6;
      border-radius: 8px;
      margin: 20px 0;
    }
    .warning {
      color: #EF4444;
      font-weight: 500;
    }
    .footer {
      text-align: center;
      padding: 20px 0 0;
      border-top: 1px solid #eee;
      margin-top: 30px;
      color: #888;
      font-size: 14px;
    }
    .footer p {
      margin: 8px 0;
      color: #888;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">BundleNudge</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>BundleNudge - OTA Updates for React Native</p>
      <p>If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>
`.trim()
}
