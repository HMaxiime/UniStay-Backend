export const welcomeEmail = (fullName: string) => ({
  subject: 'Welcome to UniStay+',
  html: `
    <h1>Welcome, ${fullName}!</h1>
    <p>Your account has been created successfully.</p>
    <p>You can now log in and start exploring housing and job opportunities.</p>
  `,
})

export const passwordResetEmail = (fullName: string, resetLink: string) => ({
  subject: 'Reset your UniStay+ password',
  html: `
    <h1>Hi ${fullName},</h1>
    <p>You requested a password reset. Click the link below to set a new password:</p>
    <a href="${resetLink}">Reset Password</a>
    <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
  `,
})

export const bookingConfirmationEmail = (fullName: string, housingTitle: string, checkIn: string, checkOut: string) => ({
  subject: 'Booking Confirmed – UniStay+',
  html: `
    <h1>Booking Confirmed!</h1>
    <p>Hi ${fullName}, your booking for <strong>${housingTitle}</strong> is confirmed.</p>
    <p>Check-in: ${checkIn}</p>
    <p>Check-out: ${checkOut}</p>
  `,
})

export const bookingCancellationEmail = (fullName: string, housingTitle: string, checkIn: string, checkOut: string, listingUrl: string) => ({
  subject: 'Booking Cancelled – UniStay+',
  html: `
    <h1>Booking Cancelled</h1>
    <p>Hi ${fullName}, your booking for <strong>${housingTitle}</strong> has been cancelled.</p>
    <p>Check-in: ${checkIn}</p>
    <p>Check-out: ${checkOut}</p>
    <p>You can browse other listings here: <a href="${listingUrl}">${listingUrl}</a></p>
  `,
})
