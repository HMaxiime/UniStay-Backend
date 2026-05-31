// ─────────────────────────────────────────────────────────────────────────────
// UniStay+ — Email Templates
// All templates return { subject, html } and use a shared branded base layout.
// ─────────────────────────────────────────────────────────────────────────────

const APP_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000'
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'support@unistay.com'
const YEAR = new Date().getFullYear()

// ── Shared helpers ────────────────────────────────────────────────────────────

const baseLayout = (content: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>UniStay+</title>
</head>
<body style="margin:0;padding:0;background-color:#f0effa;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0effa;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(79,70,229,0.13);">

          <!-- ── Header ───────────────────────────────────────────────────── -->
          <tr>
            <td style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:30px;font-weight:800;letter-spacing:-0.5px;">
                UniStay<span style="color:#c4b5fd;">+</span>
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">
                Your Campus Living &amp; Career Hub
              </p>
            </td>
          </tr>

          <!-- ── Body ────────────────────────────────────────────────────── -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- ── Footer ──────────────────────────────────────────────────── -->
          <tr>
            <td style="background:#f8f7ff;padding:24px 40px;border-top:1px solid #e8e6ff;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.8;">
                &copy; ${YEAR} UniStay+. All rights reserved.<br/>
                Questions? Contact us at
                <a href="mailto:${SUPPORT_EMAIL}" style="color:#4F46E5;text-decoration:none;">${SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

const divider = `<hr style="border:none;border-top:1px solid #e8e6ff;margin:28px 0;"/>`

const btn = (href: string, label: string): string =>
  `<a href="${href}"
     style="display:inline-block;background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);
            color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;
            font-size:15px;font-weight:700;letter-spacing:0.3px;margin:20px 0;">
     ${label}
   </a>`

const badge = (text: string, color: string, bg: string): string =>
  `<span style="display:inline-block;background:${bg};color:${color};padding:5px 14px;
               border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.8px;
               text-transform:uppercase;">
     ${text}
   </span>`

// ── 1. Welcome / Registration ─────────────────────────────────────────────────

export const welcomeEmail = (fullName: string, role: string) => ({
  subject: '🎉 Welcome to UniStay+ — Your Account is Ready!',
  html: baseLayout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:52px;line-height:1;">🎉</div>
      <h2 style="margin:14px 0 8px;color:#1e1b4b;font-size:26px;font-weight:800;">
        Welcome aboard, ${fullName}!
      </h2>
      <p style="margin:0;color:#6b7280;font-size:15px;">
        Your UniStay+ account has been created successfully.
      </p>
    </div>
    ${divider}
    <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 18px;">
      You've joined as a
      <strong style="color:#4F46E5;">${role.charAt(0) + role.slice(1).toLowerCase()}</strong>.
      Here's what you can do:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f8f7ff;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      ${role === 'STUDENT' ? `
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid #e8e6ff;">
          <span style="font-size:18px;">🏠</span>
          <span style="color:#374151;font-size:14px;margin-left:10px;font-weight:500;">Browse &amp; book student housing near your university</span>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid #e8e6ff;">
          <span style="font-size:18px;">💼</span>
          <span style="color:#374151;font-size:14px;margin-left:10px;font-weight:500;">Apply for part-time &amp; full-time job opportunities</span>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;">
          <span style="font-size:18px;">📚</span>
          <span style="color:#374151;font-size:14px;margin-left:10px;font-weight:500;">Access learning materials, courses &amp; assignments</span>
        </td>
      </tr>
      ` : role === 'HOST' ? `
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid #e8e6ff;">
          <span style="font-size:18px;">🏠</span>
          <span style="color:#374151;font-size:14px;margin-left:10px;font-weight:500;">List your properties for students to discover</span>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;">
          <span style="font-size:18px;">📊</span>
          <span style="color:#374151;font-size:14px;margin-left:10px;font-weight:500;">Manage bookings, availability &amp; payments effortlessly</span>
        </td>
      </tr>
      ` : `
      <tr>
        <td style="padding:14px 20px;border-bottom:1px solid #e8e6ff;">
          <span style="font-size:18px;">💼</span>
          <span style="color:#374151;font-size:14px;margin-left:10px;font-weight:500;">Post job listings and reach talented students</span>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;">
          <span style="font-size:18px;">👥</span>
          <span style="color:#374151;font-size:14px;margin-left:10px;font-weight:500;">Review applications and hire the best candidates</span>
        </td>
      </tr>
      `}
    </table>

    <div style="text-align:center;">
      ${btn(`${APP_URL}/login`, 'Get Started →')}
    </div>
    ${divider}
    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
      If you didn't create this account, please contact us at
      <a href="mailto:${SUPPORT_EMAIL}" style="color:#4F46E5;">${SUPPORT_EMAIL}</a> immediately.
    </p>
  `),
})

// ── 2. Forgot Password (reset request) ───────────────────────────────────────

export const forgotPasswordEmail = (fullName: string, resetLink: string) => ({
  subject: '🔑 Reset Your UniStay+ Password',
  html: baseLayout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:52px;line-height:1;">🔑</div>
      <h2 style="margin:14px 0 8px;color:#1e1b4b;font-size:24px;font-weight:800;">
        Password Reset Request
      </h2>
      <p style="margin:0;color:#6b7280;font-size:15px;">
        Hi <strong>${fullName}</strong>, we received a request to reset your password.
      </p>
    </div>
    ${divider}
    <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 8px;">
      Click the button below to create a new password.
      This link is valid for <strong>1 hour</strong>.
    </p>
    <div style="text-align:center;">
      ${btn(resetLink, 'Reset My Password')}
    </div>
    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;
                padding:14px 18px;margin:20px 0;">
      <p style="margin:0;color:#92400e;font-size:13px;line-height:1.7;">
        ⚠️ <strong>Didn't request this?</strong>
        If you didn't ask to reset your password, you can safely ignore this email.
        Your current password will remain unchanged.
      </p>
    </div>
    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:8px 0 0;">
      Or copy this link: <span style="color:#4F46E5;word-break:break-all;">${resetLink}</span>
    </p>
  `),
})

// ── 3. Password Reset Success ────────────────────────────────────────────────

export const passwordResetSuccessEmail = (fullName: string) => ({
  subject: '✅ Your UniStay+ Password Has Been Reset',
  html: baseLayout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:52px;line-height:1;">✅</div>
      <h2 style="margin:14px 0 8px;color:#1e1b4b;font-size:24px;font-weight:800;">
        Password Reset Successful
      </h2>
      <p style="margin:0;color:#6b7280;font-size:15px;">
        Hi <strong>${fullName}</strong>, your password has been updated successfully.
      </p>
    </div>
    ${divider}
    <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 20px;">
      You can now log in to UniStay+ using your new password. If you did not make this change,
      please contact our support team immediately.
    </p>
    <div style="text-align:center;">
      ${btn(`${APP_URL}/login`, 'Log In to UniStay+')}
    </div>
    <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:10px;
                padding:14px 18px;margin:20px 0;">
      <p style="margin:0;color:#991b1b;font-size:13px;line-height:1.7;">
        🚨 <strong>Wasn't you?</strong>
        If you didn't reset your password, your account may be compromised.
        Contact us immediately at
        <a href="mailto:${SUPPORT_EMAIL}" style="color:#991b1b;font-weight:600;">${SUPPORT_EMAIL}</a>.
      </p>
    </div>
  `),
})

// ── 4. Job Application Submitted (confirmation to student) ───────────────────

export const jobApplicationSubmittedEmail = (
  studentName: string,
  jobTitle: string,
  companyName: string,
) => ({
  subject: `📋 Application Submitted — ${jobTitle} at ${companyName}`,
  html: baseLayout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:52px;line-height:1;">📋</div>
      <h2 style="margin:14px 0 8px;color:#1e1b4b;font-size:24px;font-weight:800;">
        Application Received!
      </h2>
      <p style="margin:0;color:#6b7280;font-size:15px;">
        Hi <strong>${studentName}</strong>, your application has been submitted successfully.
      </p>
    </div>
    ${divider}

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#f8f7ff;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="padding:18px 22px;border-bottom:1px solid #e8e6ff;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:11px;text-transform:uppercase;
                    letter-spacing:0.8px;font-weight:700;">Position</p>
          <p style="margin:0;color:#1e1b4b;font-size:18px;font-weight:800;">${jobTitle}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 22px;border-bottom:1px solid #e8e6ff;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:11px;text-transform:uppercase;
                    letter-spacing:0.8px;font-weight:700;">Company</p>
          <p style="margin:0;color:#374151;font-size:15px;font-weight:600;">${companyName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 22px;">
          <p style="margin:0 0 8px;color:#6b7280;font-size:11px;text-transform:uppercase;
                    letter-spacing:0.8px;font-weight:700;">Status</p>
          ${badge('Pending Review', '#92400e', '#fef3c7')}
        </td>
      </tr>
    </table>

    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 20px;">
      The employer will review your application and you'll receive an email as soon as there's an update.
      In the meantime, feel free to browse more opportunities!
    </p>
    <div style="text-align:center;">
      ${btn(`${APP_URL}/my-applications`, 'View My Applications')}
    </div>
  `),
})

// ── 5. Job Application Accepted / Qualified ──────────────────────────────────

export const jobApplicationAcceptedEmail = (
  studentName: string,
  jobTitle: string,
  companyName: string,
  message?: string,
) => ({
  subject: `🎊 Congratulations! You've Been Accepted — ${jobTitle}`,
  html: baseLayout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:52px;line-height:1;">🎊</div>
      <h2 style="margin:14px 0 8px;color:#1e1b4b;font-size:24px;font-weight:800;">
        You're Qualified!
      </h2>
      <p style="margin:0;color:#6b7280;font-size:15px;">
        Congratulations <strong>${studentName}</strong> — great news about your application!
      </p>
    </div>
    ${divider}

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);
                  border:1px solid #6ee7b7;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="padding:18px 22px;border-bottom:1px solid #a7f3d0;">
          <p style="margin:0 0 4px;color:#065f46;font-size:11px;text-transform:uppercase;
                    letter-spacing:0.8px;font-weight:700;">Position</p>
          <p style="margin:0;color:#064e3b;font-size:18px;font-weight:800;">${jobTitle}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 22px;border-bottom:1px solid #a7f3d0;">
          <p style="margin:0 0 4px;color:#065f46;font-size:11px;text-transform:uppercase;
                    letter-spacing:0.8px;font-weight:700;">Company</p>
          <p style="margin:0;color:#064e3b;font-size:15px;font-weight:600;">${companyName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 22px;">
          <p style="margin:0 0 8px;color:#065f46;font-size:11px;text-transform:uppercase;
                    letter-spacing:0.8px;font-weight:700;">Status</p>
          ${badge('Accepted ✓', '#065f46', '#d1fae5')}
        </td>
      </tr>
    </table>

    ${message ? `
    <div style="background:#f8f7ff;border-left:4px solid #4F46E5;border-radius:0 10px 10px 0;
                padding:14px 18px;margin-bottom:20px;">
      <p style="margin:0 0 6px;color:#6b7280;font-size:11px;text-transform:uppercase;
                letter-spacing:0.8px;font-weight:700;">Message from Employer</p>
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.7;">${message}</p>
    </div>
    ` : ''}

    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 20px;">
      The employer will be in touch with next steps. Keep an eye on your email and be ready
      to respond promptly. Well done — your hard work paid off!
    </p>
    <div style="text-align:center;">
      ${btn(`${APP_URL}/my-applications`, 'View My Applications')}
    </div>
  `),
})

// ── 6. Job Application Rejected ──────────────────────────────────────────────

export const jobApplicationRejectedEmail = (
  studentName: string,
  jobTitle: string,
  companyName: string,
) => ({
  subject: `📩 Update on Your Application for ${jobTitle}`,
  html: baseLayout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:52px;line-height:1;">📩</div>
      <h2 style="margin:14px 0 8px;color:#1e1b4b;font-size:24px;font-weight:800;">
        Application Update
      </h2>
      <p style="margin:0;color:#6b7280;font-size:15px;">
        Hi <strong>${studentName}</strong>, here is an update on your job application.
      </p>
    </div>
    ${divider}

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#fef2f2;border:1px solid #fca5a5;border-radius:12px;
                  overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="padding:18px 22px;border-bottom:1px solid #fca5a5;">
          <p style="margin:0 0 4px;color:#991b1b;font-size:11px;text-transform:uppercase;
                    letter-spacing:0.8px;font-weight:700;">Position</p>
          <p style="margin:0;color:#7f1d1d;font-size:18px;font-weight:800;">${jobTitle}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 22px;border-bottom:1px solid #fca5a5;">
          <p style="margin:0 0 4px;color:#991b1b;font-size:11px;text-transform:uppercase;
                    letter-spacing:0.8px;font-weight:700;">Company</p>
          <p style="margin:0;color:#7f1d1d;font-size:15px;font-weight:600;">${companyName}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 22px;">
          <p style="margin:0 0 8px;color:#991b1b;font-size:11px;text-transform:uppercase;
                    letter-spacing:0.8px;font-weight:700;">Status</p>
          ${badge('Not Selected', '#991b1b', '#fee2e2')}
        </td>
      </tr>
    </table>

    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 16px;">
      After careful review, the employer has decided not to move forward with your application
      at this time. Don't be discouraged — every application is a learning experience.
      Keep building your skills and explore the many other opportunities waiting for you!
    </p>
    <div style="text-align:center;">
      ${btn(`${APP_URL}/jobs`, 'Browse More Jobs →')}
    </div>
  `),
})

// ── 7. Booking Confirmation ──────────────────────────────────────────────────

export const bookingConfirmationEmail = (
  fullName: string,
  housingTitle: string,
  checkIn: string,
  checkOut: string,
) => ({
  subject: '🏠 Booking Confirmed — UniStay+',
  html: baseLayout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:52px;line-height:1;">🏠</div>
      <h2 style="margin:14px 0 8px;color:#1e1b4b;font-size:24px;font-weight:800;">
        Booking Confirmed!
      </h2>
      <p style="margin:0;color:#6b7280;font-size:15px;">
        Hi <strong>${fullName}</strong>, your accommodation is all set.
      </p>
    </div>
    ${divider}

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%);
                  border:1px solid #6ee7b7;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;border-bottom:1px solid #a7f3d0;">
          <p style="margin:0 0 4px;color:#065f46;font-size:11px;text-transform:uppercase;
                    letter-spacing:0.8px;font-weight:700;">Property</p>
          <p style="margin:0;color:#064e3b;font-size:20px;font-weight:800;">${housingTitle}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding:18px 24px;">
                <p style="margin:0 0 4px;color:#065f46;font-size:11px;text-transform:uppercase;
                          letter-spacing:0.8px;font-weight:700;">Check-in</p>
                <p style="margin:0;color:#064e3b;font-size:15px;font-weight:700;">📅 ${checkIn}</p>
              </td>
              <td width="50%" style="padding:18px 24px;border-left:1px solid #a7f3d0;">
                <p style="margin:0 0 4px;color:#065f46;font-size:11px;text-transform:uppercase;
                          letter-spacing:0.8px;font-weight:700;">Check-out</p>
                <p style="margin:0;color:#064e3b;font-size:15px;font-weight:700;">📅 ${checkOut}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 20px;">
      Your booking is confirmed and the host has been notified. Please ensure you arrive within
      the agreed time. If you need to make any changes, contact your host in advance.
    </p>
    <div style="text-align:center;">
      ${btn(`${APP_URL}/my-bookings`, 'View My Bookings')}
    </div>
  `),
})

// ── 8. Booking Cancellation ──────────────────────────────────────────────────

export const bookingCancellationEmail = (
  fullName: string,
  housingTitle: string,
  checkIn: string,
  checkOut: string,
  listingUrl: string,
) => ({
  subject: '❌ Booking Cancelled — UniStay+',
  html: baseLayout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:52px;line-height:1;">❌</div>
      <h2 style="margin:14px 0 8px;color:#1e1b4b;font-size:24px;font-weight:800;">
        Booking Cancelled
      </h2>
      <p style="margin:0;color:#6b7280;font-size:15px;">
        Hi <strong>${fullName}</strong>, your booking has been cancelled.
      </p>
    </div>
    ${divider}

    <table width="100%" cellpadding="0" cellspacing="0"
           style="background:#fef2f2;border:1px solid #fca5a5;border-radius:12px;
                  overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;border-bottom:1px solid #fca5a5;">
          <p style="margin:0 0 4px;color:#991b1b;font-size:11px;text-transform:uppercase;
                    letter-spacing:0.8px;font-weight:700;">Property</p>
          <p style="margin:0;color:#7f1d1d;font-size:20px;font-weight:800;">${housingTitle}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding:18px 24px;">
                <p style="margin:0 0 4px;color:#991b1b;font-size:11px;text-transform:uppercase;
                          letter-spacing:0.8px;font-weight:700;">Was Check-in</p>
                <p style="margin:0;color:#7f1d1d;font-size:15px;font-weight:700;
                          text-decoration:line-through;">📅 ${checkIn}</p>
              </td>
              <td width="50%" style="padding:18px 24px;border-left:1px solid #fca5a5;">
                <p style="margin:0 0 4px;color:#991b1b;font-size:11px;text-transform:uppercase;
                          letter-spacing:0.8px;font-weight:700;">Was Check-out</p>
                <p style="margin:0;color:#7f1d1d;font-size:15px;font-weight:700;
                          text-decoration:line-through;">📅 ${checkOut}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="color:#374151;font-size:14px;line-height:1.8;margin:0 0 20px;">
      We're sorry your booking was cancelled. Don't worry — there are plenty of great housing
      options available on UniStay+. Start browsing to find your perfect place!
    </p>
    <div style="text-align:center;">
      ${btn(listingUrl, 'Browse Available Housing →')}
    </div>
  `),
})
