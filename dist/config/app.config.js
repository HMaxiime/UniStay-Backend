export const config = {
    port: process.env['PORT'] ?? '3000',
    jwtSecret: process.env['JWT_SECRET'] ?? 'mysecretkey123',
    jwtExpiresIn: '7d',
    bcryptRounds: 10,
};
//# sourceMappingURL=app.config.js.map