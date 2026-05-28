import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export const sendResetEmail = async (toEmail: string, resetToken: string) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

  await transporter.sendMail({
    from: `"UniStay+" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset Your Password — UniStay+',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">UniStay+ Password Reset</h2>
        <p>You requested to reset your password. Click the button below:</p>
        <a href="${resetLink}" 
           style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
        <p style="margin-top: 16px; color: #666;">
          This link expires in <strong>1 hour</strong>.
        </p>
        <p style="color: #666;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  })
}

export const sendEmail = async (to: string, subject: string, content: { subject?: string; html?: string } | string) => {
  const html = typeof content === 'string' ? content : content.html || ''
  const mailSubject = typeof content === 'string' ? subject : content.subject || subject

  await transporter.sendMail({
    from: `"UniStay+" <${process.env.GMAIL_USER}>`,
    to,
    subject: mailSubject,
    html,
  })
}