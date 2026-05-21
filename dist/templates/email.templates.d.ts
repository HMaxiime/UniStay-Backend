export declare const welcomeEmail: (fullName: string) => {
    subject: string;
    html: string;
};
export declare const passwordResetEmail: (fullName: string, resetLink: string) => {
    subject: string;
    html: string;
};
export declare const bookingConfirmationEmail: (fullName: string, housingTitle: string, checkIn: string, checkOut: string) => {
    subject: string;
    html: string;
};
//# sourceMappingURL=email.templates.d.ts.map