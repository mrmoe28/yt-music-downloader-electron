import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailData): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    })

    console.log(`Email sent successfully to ${to}`)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export function generatePurchaseConfirmationEmail(
  customerEmail: string,
  productName: string,
  productVersion: string,
  amount: number,
  currency: string
): EmailData {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)

  return {
    to: customerEmail,
    subject: `Purchase Confirmation - ${productName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thank you for your purchase!</h2>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Details</h3>
          <p><strong>Product:</strong> ${productName} v${productVersion}</p>
          <p><strong>Amount:</strong> ${formattedAmount}</p>
          <p><strong>License:</strong> Lifetime license with unlimited downloads</p>
        </div>

        <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0066cc;">Download Instructions</h3>
          <p>Your download is now available in your customer dashboard:</p>
          <p><a href="${process.env.NEXTAUTH_URL}/dashboard" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Access Dashboard</a></p>
        </div>

        <div style="margin: 30px 0;">
          <h3>Installation Notes</h3>
          <ul>
            <li>This DMG works on both Intel and Apple Silicon Macs</li>
            <li>You may see a security warning on first launch - this is normal for unsigned apps</li>
            <li>You can download the file up to 5 times from your dashboard</li>
          </ul>
        </div>

        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666;">
          <p>If you have any issues, please reply to this email for support.</p>
          <p>Thank you for choosing YouTube Music Downloader Pro!</p>
        </div>
      </div>
    `,
  }
}