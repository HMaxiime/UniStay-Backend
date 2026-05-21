export const welcomeEmail = (fullName) => ({
    subject: 'Welcome to UniStay+',
    html: `
    <h1>Welcome, ${fullName}!</h1>
    <p>Your account has been created successfully.</p>
    <p>You can now log in and start exploring housing and job opportunities.</p>
  `,
});
export const passwordResetEmail = (fullName, resetLink) => ({
    subject: 'Reset your UniStay+ password',
    html: `
    <h1>Hi ${fullName},</h1>
    <p>You requested a password reset. Click the link below to set a new password:</p>
    <a href="${resetLink}">Reset Password</a>
    <p>This link expires in 1 hour. If you did not request this, ignore this email.</p>
  `,
});
export const bookingConfirmationEmail = (fullName, housingTitle, checkIn, checkOut) => ({
    subject: 'Booking Confirmed – UniStay+',
    html: `
    <h1>Booking Confirmed!</h1>
    <p>Hi ${fullName}, your booking for <strong>${housingTitle}</strong> is confirmed.</p>
    <p>Check-in: ${checkIn}</p>
    <p>Check-out: ${checkOut}</p>
  `,
});
//# sourceMappingURL=email.templates.js.map