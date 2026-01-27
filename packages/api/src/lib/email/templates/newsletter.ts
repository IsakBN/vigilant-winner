/**
 * Dynamic newsletter email template
 */

export interface NewsletterData {
  content: string
  previewText?: string
  unsubscribeUrl: string
}

/**
 * Create a custom base template for newsletters with unsubscribe
 */
function newsletterBaseTemplate(content: string, unsubscribeUrl: string): string {
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
      color: #FF6B35;
    }
    .content {
      padding: 0;
    }
    .content h1 {
      margin: 0 0 16px;
      font-size: 24px;
      color: #111;
    }
    .content h2 {
      margin: 24px 0 12px;
      font-size: 20px;
      color: #111;
    }
    .content p {
      margin: 0 0 16px;
      color: #555;
    }
    .content ul, .content ol {
      padding-left: 20px;
      color: #555;
    }
    .content li {
      margin-bottom: 8px;
    }
    .content a {
      color: #FF6B35;
    }
    .button {
      display: inline-block;
      background-color: #FF6B35;
      color: white !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
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
    .unsubscribe {
      margin-top: 16px;
    }
    .unsubscribe a {
      color: #888;
      text-decoration: underline;
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
      <div class="unsubscribe">
        <a href="${unsubscribeUrl}">Unsubscribe from these emails</a>
      </div>
    </div>
  </div>
</body>
</html>
`.trim()
}

export function newsletterEmail(data: NewsletterData): { html: string; text: string } {
  const html = newsletterBaseTemplate(data.content, data.unsubscribeUrl)

  // Convert HTML content to plain text (basic conversion)
  const textContent = data.content
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n$1\n' + '='.repeat(40) + '\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n$1\n' + '-'.repeat(30) + '\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<ul[^>]*>|<\/ul>|<ol[^>]*>|<\/ol>/gi, '\n')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const text = `
${textContent}

---
BundleNudge - OTA Updates for React Native

Unsubscribe: ${data.unsubscribeUrl}
`.trim()

  return { html, text }
}
