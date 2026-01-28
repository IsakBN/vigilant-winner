import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

interface ContactFormData {
  name: string
  email: string
  company: string
  appName?: string
  monthlyUsers?: string
  message: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    const body = (await request.json()) as ContactFormData

    const { name, email, company, appName, monthlyUsers, message } = body

    // Validate required fields
    if (!name || !email || !company || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Send email via Resend
    const { error } = await resend.emails.send({
      from: 'BundleNudge <noreply@mail.bundlenudge.com>',
      to: 'isak@bundlenudge.com',
      reply_to: email,
      subject: `Enterprise Inquiry from ${company}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
            New Enterprise Inquiry
          </h2>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; width: 140px;">Name</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #1a1a1a; font-weight: 500;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Email</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
                <a href="mailto:${email}" style="color: #6366f1;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Company</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #1a1a1a; font-weight: 500;">${company}</td>
            </tr>
            ${appName ? `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">App Name</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #1a1a1a;">${appName}</td>
            </tr>
            ` : ''}
            ${monthlyUsers ? `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666;">Monthly Users</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #1a1a1a;">${monthlyUsers}</td>
            </tr>
            ` : ''}
          </table>

          <div style="margin-top: 20px;">
            <h3 style="color: #1a1a1a; margin-bottom: 10px;">Message</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; color: #374151; line-height: 1.6;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            This email was sent from the BundleNudge enterprise contact form.
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact form error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
